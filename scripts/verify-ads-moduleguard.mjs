import { readFile } from "node:fs/promises";

async function run() {
  const appContent = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  const callbackContent = await readFile(new URL("../src/pages/ads/AdsMetaCallbackPage.tsx", import.meta.url), "utf8");
  const publishFormContent = await readFile(new URL("../src/modules/ads/components/PublishForm.tsx", import.meta.url), "utf8");

  const checks = [
    {
      name: "ads route is protected by ModuleGuard",
      ok:
        appContent.includes('path="ads"') &&
        appContent.includes('<ModuleGuard modulo="ads" acao="visualizar">'),
    },
    {
      name: "meta callback route stays under /ads",
      ok:
        appContent.includes('path="auth/meta/callback"') &&
        appContent.includes("<AdsMetaCallbackPage />"),
    },
    {
      name: "oauth callback marks success for /ads refresh",
      ok:
        callbackContent.includes("meta_oauth_success") &&
        callbackContent.includes("fetchMetaStatus") &&
        callbackContent.includes("saved_to_db"),
    },
    {
      name: "publish form refreshes status after oauth return",
      ok:
        publishFormContent.includes("useLocation") &&
        publishFormContent.includes("meta_oauth_success") &&
        publishFormContent.includes("checkMetaStatus({ ignoreCache: justConnected"),
    },
  ];

  const failed = checks.filter((c) => !c.ok);
  for (const check of checks) {
    console.log(`${check.ok ? "OK" : "FAIL"} - ${check.name}`);
  }

  if (failed.length > 0) {
    throw new Error(`ModuleGuard verification failed: ${failed.map((f) => f.name).join(", ")}`);
  }
}

run().catch((err) => {
  console.error(`[verify-ads-moduleguard] ${err.message}`);
  process.exitCode = 1;
});
