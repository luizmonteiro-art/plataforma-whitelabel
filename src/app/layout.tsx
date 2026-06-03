import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MM CELL — Loja de Celulares & Assistência Técnica",
  description: "iPhones lacrados e seminovos, Android, acessórios e assistência técnica especializada. Agende seu serviço online.",
  keywords: ["iphone", "celular", "assistência técnica", "troca de tela", "bateria", "seminovo"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-inter)]">
        {children}
      </body>
    </html>
  );
}
