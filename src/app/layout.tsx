import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { getStoreConfig } from "@/lib/db";
import { getStoreIdFromHeaders } from "@/lib/store-headers";
import StoreTheme from "@/components/StoreTheme";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,   // evita zoom acidental (duplo-toque / foco em input no iOS)
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const storeId = await getStoreIdFromHeaders()
    const config = storeId ? await getStoreConfig(storeId) : null
    const name = config?.store_name ?? "Plataforma White-Label"
    return {
      title: `${name} — Loja de Celulares & Assistência Técnica`,
      description: config?.about ?? "Loja de celulares e assistência técnica.",
    }
  } catch {
    return { title: "Plataforma White-Label" }
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  let accentColor = "#22c55e"
  try {
    const storeId = await getStoreIdFromHeaders()
    if (storeId) {
      const config = await getStoreConfig(storeId)
      accentColor = config?.accent_color ?? "#22c55e"
    }
  } catch {}

  return (
    <html lang="pt-BR" className={`${inter.variable} h-full antialiased`} style={{ backgroundColor: '#0a0a0a' }}>
      <body className="min-h-full flex flex-col bg-[#0a0a0a] text-white font-[family-name:var(--font-inter)]">
        <StoreTheme accentColor={accentColor} />
        {children}
      </body>
    </html>
  );
}
