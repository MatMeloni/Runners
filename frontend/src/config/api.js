/**
 * Base URL da API em produção (ex.: https://api.seudominio.com).
 * Em dev, deixe vazio para o proxy do Vite encaminhar /api e /health para a porta da API.
 */
export const API_BASE = import.meta.env.VITE_API_URL || ''

/** Porta padrão do Vite (vite.config.js) — útil para documentação local. */
export const VITE_DEV_PORT = 5173
