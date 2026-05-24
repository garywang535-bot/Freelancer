"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthCard,
  AuthDivider,
  AuthFooterLink,
  Button,
  Input,
} from "./auth-ui";
import { OAuthButtons } from "./oauth-buttons";
import type { OAuthConfig } from "@/lib/auth/providers";

type LoginFormProps = {
  oauth: OAuthConfig;
};

export function LoginForm({ oauth }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const registered = searchParams.get("registered") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasOAuth = oauth.google || oauth.github;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoading(false);

    if (result?.error) {
      setError("邮箱或密码错误");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthCard
      title="Freelancer Billing Assistant"
      subtitle="登录以管理发票与客户"
    >
      {registered ? (
        <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-success">
          注册成功，请登录。
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-error">
            {error}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "登录中..." : "Login"}
        </Button>
      </form>

      {hasOAuth ? (
        <>
          <AuthDivider />
          <OAuthButtons oauth={oauth} callbackUrl={callbackUrl} />
        </>
      ) : null}

      <AuthFooterLink
        text="Don't have account?"
        linkText="Register"
        href="/register"
      />
    </AuthCard>
  );
}
