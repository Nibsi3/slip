import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import CapacitorInit from "@/components/CapacitorInit";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  display: "swap",
  variable: "--font-cormorant",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#080808",
};

export const metadata: Metadata = {
  title: "Slip a Tip - Digital Tipping for South Africa",
  description:
    "Send tips instantly to service workers across South Africa. Scan, tap, tip.",
  icons: {
    icon: "/logo/11.png",
    apple: "/logo/11.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${cormorant.variable}`}>
      <body className={inter.className}>
        <CapacitorInit />
        {children}
      </body>
    </html>
  );
}
