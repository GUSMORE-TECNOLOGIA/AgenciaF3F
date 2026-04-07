import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { buildCorsHeaders, jsonResponse } from "../_shared/http.ts";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const appId = Deno.env.get("META_APP_ID");
  const redirectUri =
    Deno.env.get("META_OAUTH_REDIRECT_URI") ?? "https://agenciaf3f.app/ads/auth/meta/callback";
  const scopes =
    "ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,instagram_basic";
  const state = crypto.randomUUID();

  if (!appId) {
    return jsonResponse(
      { code: "META_CONFIG_MISSING", error: "META_APP_ID not configured" },
      { status: 500, headers: corsHeaders },
    );
  }

  const url = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;

  return new Response(null, {
    status: 302,
    headers: { Location: url, ...corsHeaders },
  });
});
