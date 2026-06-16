import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Contract Manager",
  description: "PDPA-safe HR document generation — all personal data stays in your browser.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-zinc-900">{children}</body>
    </html>
  );
}
