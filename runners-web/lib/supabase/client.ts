import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Faltam NEXT_PUBLIC_SUPABASE_URL e/ou NEXT_PUBLIC_SUPABASE_ANON_KEY. Coloque-as no .env na raiz do repositório (ou runners-web/.env) e reinicie o servidor (`npm run dev`).",
    );
  }
  return createBrowserClient(url, key, {
    auth: {
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  });
}
