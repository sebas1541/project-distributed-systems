import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Quickie Tasks",
  description: "Agenda tus tareas con IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  // Suppress hydration warnings at the root to avoid noisy warnings when
  // browser extensions (e.g. LanguageTool / Grammarly) inject attributes
  // into the DOM before React hydrates. Prefer disabling extensions in
  // development if you want the strict warning to appear.
  <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
