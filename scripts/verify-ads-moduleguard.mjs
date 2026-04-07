import { readFile } from "node:fs/promises";

async function run() {
  const appContent = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");

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
