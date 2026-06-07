import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getStoreConfig } from "@/lib/db";
import StoreTheme from "@/components/StoreTheme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const config = await getStoreConfig().catch(() => null)
  const name = config?.store_name ?? "Fast App"
  return {
    title: `${name} — Loja de Celulares & Assistência Técnica`,
    description: config?.about ?? "iPhones lacrados e seminovos, Android, acessórios e assistência técnica especializada.",
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const config = await getStoreConfig().catch(() => null)
  const accentColor = config?.accent_color ?? "#22c55e"

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} style={{ backgroundColor: '#0a0a0a' }}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-inter)]">
        <StoreTheme accentColor={accentColor} />
        {children}
      </body>
    </html>
  );
}
