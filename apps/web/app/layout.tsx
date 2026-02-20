import type { Metadata, Viewport } from "next"
import { Archivo, IBM_Plex_Mono } from "next/font/google"

import "@workspace/ui/globals.css"
import "@/app/app-theme.css"
import { Providers } from "@/components/providers"
import { PwaRegister } from "@/components/pwa-register"

const fontSans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "₱350",
  description: "Cashflow control first. Allocation second.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "₱350",
  },
}

export const viewport: Viewport = {
  themeColor: "#f0f0ec",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontSans.variable} ${fontMono.variable} antialiased`}>
        <Providers>
          <PwaRegister />
          {children}
        </Providers>
      </body>
    </html>
  )
}
