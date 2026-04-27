import "./globals.css";

import { Inter } from "next/font/google";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { Providers } from "@/components/layout/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Runners",
  description: "Análise biomecânica de corrida sem marcadores",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
