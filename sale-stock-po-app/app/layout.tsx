import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Sale-Stock-PO | ICT-PO",
  description: "Operational dashboard for pharmaceutical sales, stock, and purchase orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full text-foreground">
        <a
          href="#main-content"
          className="sr-only absolute left-4 top-4 z-[100] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg focus:not-sr-only"
        >
          Skip to main content
        </a>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
