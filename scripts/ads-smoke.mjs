const SUPABASE_FUNCTIONS_BASE =
  process.env.SUPABASE_FUNCTIONS_BASE ?? "https://rhnkffeyspymjpellmnd.supabase.co/functions/v1";

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJobmtmZmV5c3B5bWpwZWxsbW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NjA0MDAsImV4cCI6MjA1MjUzNjQwMH0.5OiPMqz8dPoC9O-qJMx_DkSxS21bZJZI9mEINJlgYFQ";

async function run() {
  const checks = [];

  const metaLoginResponse = await fetch(`${SUPABASE_FUNCTIONS_BASE}/meta-login`, {
    method: "GET",
    redirect: "manual",
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  checks.push({
    name: "meta-login responds with redirect",
    ok: metaLoginResponse.status === 302,
    detail: `status=${metaLoginResponse.status}`,
  });

  const hardenedResponse = await fetch(`${SUPABASE_FUNCTIONS_BASE}/meta-ad-accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({}),
  });
  checks.push({
    name: "hardened function blocks unauthenticated call",
    ok: hardenedResponse.status === 401,
    detail: `status=${hardenedResponse.status}`,
  });

  const statusResponse = await fetch(`${SUPABASE_FUNCTIONS_BASE}/meta-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ force_verify: true }),
  });

  let statusPayload = {};
  try {
    statusPayload = await statusResponse.json();
  } catch {
    statusPayload = {};
  }

  checks.push({
    name: "meta-status returns setup-oriented unauthorized contract",
    ok:
      statusResponse.status === 401 &&
      typeof statusPayload === "object" &&
      statusPayload !== null &&
      (statusPayload.code === "UNAUTHORIZED" || statusPayload.code === 401) &&
      (statusPayload.step === "setup" || statusPayload.step === undefined),
    detail: `status=${statusResponse.status} code=${statusPayload.code ?? "n/a"} step=${statusPayload.step ?? "n/a"}`,
  });

  const failed = checks.filter((c) => !c.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} - ${check.name} (${check.detail})`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
    throw new Error(`Smoke failed with ${failed.length} check(s).`);
  }
}

run().catch((err) => {
  console.error(`[ads-smoke] ${err.message}`);
  process.exitCode = 1;
});
