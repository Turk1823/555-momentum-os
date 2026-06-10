import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MomentumOS Diagnostic App",
  description: "An executive ecosystem revenue diagnostic powered by the 5/5/5 Ecosystem Revenue Engine"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
