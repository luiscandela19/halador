import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "sonner";
import PageTransition from "@/components/page-transition";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HALADOR | Viajes Compartidos",
  description: "Transporte inteligente y seguro.",
};

import { BottomNav } from "@/components/bottom-nav";
import { RealtimeManager } from '@/components/realtime-manager'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AuthProvider>
          <RealtimeManager />
          <main className="mx-auto max-w-md min-h-screen border-x bg-background relative shadow-xl pb-20">
            <PageTransition>
              {children}
            </PageTransition>
          </main>
          <BottomNav />
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
