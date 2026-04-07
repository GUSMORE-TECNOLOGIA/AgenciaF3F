import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const appId = Deno.env.get("META_APP_ID");
  const redirectUri =
    Deno.env.get("META_OAUTH_REDIRECT_URI") ?? "https://agenciaf3f.app/ads/auth/meta/callback";
  const scopes =
    "ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,instagram_basic";
  const state = crypto.randomUUID();

  if (!appId) {
    return new Response(JSON.stringify({ error: "META_APP_ID not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code&state=${state}`;

  return new Response(null, {
    status: 302,
    headers: { Location: url, ...corsHeaders },
  });
});
