/**
 * 开发/测试种子数据
 * 运行：pnpm db:seed
 */
import { PrismaClient, Plan, ReminderRuleType } from "@prisma/client";
import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@freelancer-billing.test";
  const demoPassword = await hashPassword("Demo1234!");

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: demoPassword,
    },
    create: {
      email,
      name: "Demo Freelancer",
      passwordHash: demoPassword,
      companyName: "Demo Studio LLC",
      website: "https://demo.studio",
      phone: "+1-555-0100",
      taxId: "US-DEMO-001",
      country: "US",
      locale: "en",
      subscription: {
        create: { plan: Plan.PRO, status: "ACTIVE" },
      },
      reminderRules: {
        create: Object.values(ReminderRuleType).map((type) => ({
          type,
          enabled: true,
        })),
      },
      userPaymentMethods: {
        create: [
          {
            type: "WISE",
            label: "Wise USD",
            isDefault: true,
            wiseTag: "@demostudio",
            accountName: "Demo Studio LLC",
          },
          {
            type: "BANK_TRANSFER",
            label: "Chase Bank",
            bankName: "Chase",
            accountNumber: "****1234",
            routingNumber: "021000021",
            swiftCode: "CHASUS33",
          },
        ],
      },
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-google" },
    update: {},
    create: {
      id: "seed-client-google",
      userId: user.id,
      companyName: "Google LLC",
      contactName: "Jane Client",
      email: "billing@google.example",
      country: "US",
      address: "1600 Amphitheatre Parkway",
      city: "Mountain View",
      state: "CA",
      postalCode: "94043",
    },
  });

  await prisma.invoiceSequence.upsert({
    where: { userId_year: { userId: user.id, year: 2026 } },
    update: { lastNumber: 1 },
    create: { userId: user.id, year: 2026, lastNumber: 1 },
  });

  const existingInvoice = await prisma.invoice.findFirst({
    where: { userId: user.id, invoiceNumber: "INV-2026-0001" },
  });

  if (!existingInvoice) {
    await prisma.invoice.create({
      data: {
        userId: user.id,
        clientId: client.id,
        invoiceNumber: "INV-2026-0001",
        status: "SENT",
        currency: "USD",
        subtotal: 3000,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: 3000,
        dueDate: new Date("2026-06-20"),
        paymentTerms: "Net 30",
        notes: "Thank you for your business.",
        items: {
          create: [
            {
              description: "Custom Website Development Service",
              quantity: 1,
              unitPrice: 3000,
              lineTotal: 3000,
              sortOrder: 0,
            },
          ],
        },
        activities: {
          create: [
            { userId: user.id, type: "CREATED", message: "Invoice created" },
            { userId: user.id, type: "SENT", message: "Invoice sent to client" },
          ],
        },
      },
    });
  }

  console.log("Seed completed.");
  console.log(`  Demo user: ${email}`);
  console.log("  Password:  Demo1234!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
