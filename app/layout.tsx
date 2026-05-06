import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cloning_CLI",
  description: "Website cloning agent with visual reasoning, tool calls, and live preview."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-[#050608] font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
