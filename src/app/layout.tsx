import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono, Hind_Siliguri } from "next/font/google";
import { StoreProvider } from "@/lib/store/StoreProvider";
import { ScrollToTop } from "@/components/ui/ScrollToTop";
import { TopProgressBar } from "@/components/ui/TopProgressBar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const hindSiliguri = Hind_Siliguri({
  variable: "--font-hind-siliguri",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "মিস্টার ডাক্তার — ডাক্তার, হাসপাতাল ও রোগীর মিলনস্থল",
    template: "%s | মিস্টার ডাক্তার",
  },
  description:
    "সারা বাংলাদেশে অনলাইনে ফ্রি ডাক্তারের সিরিয়াল, ডাক্তারদের জন্য ফ্রি চেম্বার সফটওয়্যার ও হাসপাতাল ড্যাশবোর্ড — ৬৪ জেলা, ৪৯৪+ থানা ও উপজেলা।",

  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any", type: "image/x-icon" }],
    shortcut: [{ url: "/favicon.ico", type: "image/x-icon" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="bn"
      className={`${geistSans.variable} ${geistMono.variable} ${hindSiliguri.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <StoreProvider>{children}</StoreProvider>

        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>

        <ScrollToTop />
      </body>
    </html>
  );
}