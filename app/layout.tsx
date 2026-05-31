import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "俺也一样",
  description: "把你的真实情绪丢进来，历史人物进群接话。"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="grain">{children}</body>
    </html>
  );
}
