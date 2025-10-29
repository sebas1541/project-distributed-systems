import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/features/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Smart Planner AI - Gestión Inteligente de Tareas",
  description: "Aplicación web distribuida e inteligente para gestionar tareas, recordatorios y eventos mediante lenguaje natural.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
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
