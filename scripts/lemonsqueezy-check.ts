/**
 * 检查 Lemon Squeezy 配置
 * 运行：npm run ls:check
 */
import fs from "node:fs";
import path from "node:path";

const ENV_LOCAL = path.join(path.resolve(import.meta.dirname, ".."), ".env.local");

function loadEnvLocal(): Record<string, string> {
  if (!fs.existsSync(ENV_LOCAL)) return {};
  const env: Record<string, string> = {};
  for (const line of fs.readFileSync(ENV_LOCAL, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const REQUIRED = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_VARIANT_PRO",
  "LEMONSQUEEZY_VARIANT_BUSINESS",
] as const;

const OPTIONAL = ["LEMONSQUEEZY_WEBHOOK_SECRET"] as const;

const env = loadEnvLocal();
let ok = true;

console.log("Lemon Squeezy 配置检查\n");

for (const key of REQUIRED) {
  const value = env[key];
  const valid = value && !value.includes("YOUR_") && value.length > 2;
  console.log(`${valid ? "✓" : "✗"} ${key}${valid ? "" : " （缺失）"}`);
  if (!valid) ok = false;
}

for (const key of OPTIONAL) {
  const value = env[key];
  const valid = value && value.length > 5;
  console.log(`${valid ? "✓" : "○"} ${key}${valid ? "" : " （可选，Webhook 同步用）"}`);
}

console.log(
  ok
    ? "\n✅ 配置就绪。升级按钮将跳转 Lemon Squeezy 托管 Checkout"
    : "\n❌ 请在 Lemon Squeezy Dashboard 创建订阅产品后填入 Variant ID"
);
process.exit(ok ? 0 : 1);
