import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import WalletConnect from "@/components/WalletConnect";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workplace Zakat",
  description: "Secure, verified workplace Zakat deductions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <header className="border-b border-minimal bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
            <div className="flex items-center gap-8">
              <Link href="/" className="font-medium tracking-tight text-[#111111]">
                Workplace Zakat
              </Link>
              <nav className="flex gap-6 text-[13px] font-medium text-[#787774]">
                <Link className="hover:text-[#111111] transition-colors" href="/hr">
                  HR Console
                </Link>
                <Link className="hover:text-[#111111] transition-colors" href="/employee">
                  Employee Receipt
                </Link>
              </nav>
            </div>
            <WalletConnect />
          </div>
        </header>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
