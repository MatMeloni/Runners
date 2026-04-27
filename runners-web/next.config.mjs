// runners-web/next.config.mjs
import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/**
 * Em `next dev`, evitar `output: "standalone"`: no Windows o servidor de desenvolvimento
 * pode referenciar `/_next/static/css/app/layout.css` e responder 404 (JS chunks ok).
 * Em build/start de produção, mantém-se standalone para Docker.
 *
 * @param {string} phase
 * @returns {import('next').NextConfig}
 */
export default function createNextConfig(phase) {
  return {
    reactStrictMode: true,
    ...(phase === PHASE_DEVELOPMENT_SERVER ? {} : { output: "standalone" }),
  };
}
