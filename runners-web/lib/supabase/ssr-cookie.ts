/** Cookies emitidos pelo `createServerClient` do `@supabase/ssr` para `setAll`. */
export type SsrCookieToSet = {
  name: string;
  value: string;
  options?: Record<string, unknown>;
};
