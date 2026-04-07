import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const { code, redirect_uri } = await req.json();
    const appId = Deno.env.get("META_APP_ID");
    const appSecret = Deno.env.get("META_APP_SECRET");
    const finalRedirectUri =
      redirect_uri ||
      Deno.env.get("META_OAUTH_REDIRECT_URI") ||
      "https://agenciaf3f.app/ads/auth/meta/callback";

    if (!appId || !appSecret) {
      return jsonResponse(
        { step: "setup", code: "META_CONFIG_MISSING", error: "META_APP_ID or META_APP_SECRET not configured" },
        {
          status: 500,
          headers: corsHeaders,
        },
      );
    }

    // 1. Exchange code for short-lived token
    console.log("[meta-oauth-callback] Exchanging code for token...");
    const tokenUrl = `https://graph.facebook.com/v22.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(finalRedirectUri)}&client_secret=${appSecret}&code=${code}`;
    const res = await fetch(tokenUrl);
    const data = await res.json();

    if (data.error) {
      return jsonResponse(
        { step: "setup", code: "META_OAUTH_CODE_INVALID", error: data.error.message },
        { status: 400, headers: corsHeaders },
      );
    }

    // 2. Exchange for long-lived token
    console.log("[meta-oauth-callback] Exchanging for long-lived token...");
    const llUrl = `https://graph.facebook.com/v22.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${data.access_token}`;
    const llRes = await fetch(llUrl);
    const llData = await llRes.json();

    const finalToken = llData.access_token || data.access_token;
    const expiresIn = llData.expires_in || data.expires_in || 3600;
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();
    const isLongLived = !!llData.access_token;

    console.log("[meta-oauth-callback] Token obtained:", {
      isLongLived,
      expiresIn,
      expiresAt,
    });

    // 3. Save to DB for authenticated user (best effort).
    let savedToDb = false;
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log("[meta-oauth-callback] Saving token for user:", user.id);
        // Upsert meta connection
        const { data: existing } = await supabase
          .from("meta_connections")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (existing) {
          const { error: updateErr } = await supabase
            .from("meta_connections")
            .update({ access_token: finalToken, expires_at: expiresAt })
            .eq("id", existing.id);
          savedToDb = !updateErr;
          if (updateErr) console.error("[meta-oauth-callback] Update error:", updateErr);
        } else {
          const { error: insertErr } = await supabase
            .from("meta_connections")
            .insert({ user_id: user.id, access_token: finalToken, expires_at: expiresAt });
          savedToDb = !insertErr;
          if (insertErr) console.error("[meta-oauth-callback] Insert error:", insertErr);
        }
      } else {
        console.warn("[meta-oauth-callback] Auth header present but no user resolved; token not persisted.");
      }
    } else {
      console.warn("[meta-oauth-callback] No auth header; token exchanged but not persisted.");
    }
    console.log("[meta-oauth-callback] Token saved to DB:", savedToDb);

    return jsonResponse(
      {
        access_token: finalToken,
        expires_in: expiresIn,
        is_long_lived: isLongLived,
        saved_to_db: savedToDb,
        step: "setup",
      },
      { headers: corsHeaders },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro interno";
    return jsonResponse(
      { step: "setup", code: "META_OAUTH_INTERNAL_ERROR", error: message },
      { status: 500, headers: corsHeaders },
    );
  }
});
