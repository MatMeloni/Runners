// runners-web/next.config.mjs
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** `@next/env` é CJS; `createRequire` evita falhas de interop ESM↔CJS (ex.: Node 24). */
const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");

/**
 * Parser mínimo de `.env` (fallback se loadEnvConfig não preencher o que o cliente precisa).
 * Uma linha = KEY=valor; suporta # comentário; não expande variáveis.
 */
function applyDotenvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

const quietLog = { info: () => {}, error: console.error };
const hasSiblingApi = fs.existsSync(path.join(repoRoot, "api", "main.py"));
if (hasSiblingApi) {
  loadEnvConfig(repoRoot, quietLog);
  applyDotenvFile(path.join(repoRoot, ".env"));
  applyDotenvFile(path.join(repoRoot, ".env.local"));
}
loadEnvConfig(__dirname, quietLog);
applyDotenvFile(path.join(__dirname, ".env"));
applyDotenvFile(path.join(__dirname, ".env.local"));

/** O objeto `env` do Next injeta estas chaves no bundle (cliente + servidor). */
function publicEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "",
  };
}

/**
 * Em `next dev`, evitar `output: "standalone"`: no Windows o servidor de desenvolvimento
 * pode referenciar `/_next/static/css/app/layout.css` e responder 404 (JS chunks ok).
 * Em build/start de produção, mantém-se standalone para Docker.
 *
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default function createNextConfig(phase) {
  const isDevServer = phase === PHASE_DEVELOPMENT_SERVER;
  return {
    reactStrictMode: true,
    env: publicEnv(),
    ...(isDevServer || process.env.VERCEL ? {} : { output: "standalone" }),
  };
}
