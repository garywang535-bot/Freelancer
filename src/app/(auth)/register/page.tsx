import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { RegisterForm } from "@/components/auth/register-form";
import { getOAuthConfig } from "@/lib/auth/providers";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  const oauth = getOAuthConfig();

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <RegisterForm oauth={oauth} />
    </main>
  );
}
