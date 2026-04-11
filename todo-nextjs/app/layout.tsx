import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘 할 일",
  description: "Todo App",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
