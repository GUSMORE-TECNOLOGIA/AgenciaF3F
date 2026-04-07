const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://localhost:4173",
  "https://www.agenciaf3f.app",
  "https://agenciaf3f.app",
  "https://ads.agenciaf3f.com.br",
];

export function buildCorsHeaders(origin: string | null) {
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const allowedOrigins = configured.length > 0 ? configured : defaultAllowedOrigins;
  const allowOrigin = origin && allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Vary": "Origin",
  };
}

export function jsonResponse(
  payload: Record<string, unknown>,
  options?: {
    status?: number;
    headers?: Record<string, string>;
  },
) {
  return new Response(JSON.stringify(payload), {
    status: options?.status ?? 200,
    headers: {
      ...(options?.headers ?? {}),
      "Content-Type": "application/json",
    },
  });
}
