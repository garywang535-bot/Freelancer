/** OAuth 是否已配置（服务端读取） */
export function getOAuthConfig() {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
    github: Boolean(
      process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
    ),
  };
}

export type OAuthConfig = ReturnType<typeof getOAuthConfig>;
