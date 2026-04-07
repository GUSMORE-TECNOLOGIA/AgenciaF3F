import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.log("[meta-status] No auth header");
      return jsonResponse(
        { connected: false, reason: "no_auth", code: "UNAUTHORIZED", message: "Authorization header ausente." },
        { status: 401, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log("[meta-status] No user from auth header");
      return jsonResponse(
        { connected: false, reason: "no_user", code: "UNAUTHORIZED", message: "Usuário não encontrado na sessão." },
        { status: 401, headers: corsHeaders },
      );
    }

    const { data: conn } = await supabase
      .from("meta_connections")
      .select("access_token, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!conn) {
      console.log("[meta-status] No meta_connection found for user:", user.id);
      return jsonResponse(
        { connected: false, reason: "no_connection", code: "META_NOT_CONNECTED", message: "Usuário sem conexão Meta ativa." },
        { headers: corsHeaders },
      );
    }

    // Check if expired
    const now = new Date();
    const expiresAt = conn.expires_at ? new Date(conn.expires_at) : null;
    const isExpired = expiresAt && expiresAt < now;

    if (isExpired) {
      console.log("[meta-status] Token expired at:", conn.expires_at);
      return jsonResponse(
        { connected: false, reason: "expired", code: "META_TOKEN_EXPIRED", message: "Token Meta expirado." },
        { headers: corsHeaders },
      );
    }

    // Check if token expires within 7 days (warn but still connected)
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const expiresSoon = expiresAt && (expiresAt.getTime() - now.getTime()) < sevenDaysMs;

    // Parse request body to check if caller wants full verification
    let forceVerify = false;
    try {
      const body = await req.json();
      forceVerify = body?.force_verify === true;
    } catch {
      // No body or invalid JSON — that's fine
    }

    // Only verify with Meta API if forced or token expires within 7 days
    // This avoids hitting Meta API on every single page load
    let metaName: string | null = null;
    if (forceVerify || expiresSoon) {
      console.log("[meta-status] Verifying token with Meta API (force:", forceVerify, ", expiresSoon:", expiresSoon, ")");
      const meRes = await fetch(`https://graph.facebook.com/v22.0/me?fields=name&access_token=${conn.access_token}`);
      const meData = await meRes.json();

      if (meData.error) {
        console.log("[meta-status] Meta API error:", meData.error);
        return jsonResponse(
          {
            connected: false,
            reason: "invalid_token",
            code: "META_TOKEN_INVALID",
            message: meData.error.message,
            error: meData.error.message,
          },
          { headers: corsHeaders },
        );
      }
      metaName = meData.name;
    }

    console.log("[meta-status] Token valid. Expires:", conn.expires_at, "expiresSoon:", expiresSoon);

    return jsonResponse(
      {
        connected: true,
        access_token: conn.access_token,
        meta_name: metaName,
        expires_at: conn.expires_at,
        expires_soon: expiresSoon || false,
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno";
    console.error("[meta-status] Error:", message);
    return jsonResponse(
      { connected: false, code: "META_STATUS_INTERNAL_ERROR", message, error: message },
      { status: 500, headers: corsHeaders },
    );
  }
});
