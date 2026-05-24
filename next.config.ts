import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PDFKit 依赖运行时读取 .afm 字体文件，不能被 Next.js 打包
  serverExternalPackages: ["pdfkit", "docx"],
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
