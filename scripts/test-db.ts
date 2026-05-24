/**
 * 数据库连通性与阶段 2 验收脚本
 * 运行：npm run test:db
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("1/4 检查 DATABASE_URL …");
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("USER:PASSWORD")) {
    throw new Error(
      "请在 .env.local 中配置有效的 DATABASE_URL（可从 .env.example 复制）"
    );
  }
  console.log("   ✓ 已配置");

  console.log("2/4 连接数据库 …");
  await prisma.$queryRaw`SELECT 1 as ok`;
  console.log("   ✓ 连接成功");

  console.log("3/4 检查核心表 …");
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  const names = tables.map((t) => t.tablename);
  const required = ["users", "clients", "invoices", "invoice_items", "subscriptions"];
  const missing = required.filter((t) => !names.includes(t));
  if (missing.length > 0) {
    throw new Error(
      `缺少表: ${missing.join(", ")}。请先执行: npx prisma migrate deploy`
    );
  }
  console.log(`   ✓ 共 ${names.length} 张表`);

  console.log("4/4 统计数据 …");
  const [users, clients, invoices] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.invoice.count(),
  ]);
  console.log(`   users=${users}, clients=${clients}, invoices=${invoices}`);

  if (users === 0) {
    console.log("\n提示: 尚无数据，可运行 npm run db:seed 插入演示数据");
  } else {
    console.log("\n✅ 阶段 2 数据库测试通过");
  }
}

main()
  .catch((e: Error) => {
    console.error("\n❌ 测试失败:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
