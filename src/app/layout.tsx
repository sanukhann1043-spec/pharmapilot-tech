import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PharmaPilot AI",
  description:
    "AI Copilot for Pharma & Healthcare — research, medicine intelligence, medical writing, regulatory, pharmacovigilance, data analysis, and PDF intelligence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
