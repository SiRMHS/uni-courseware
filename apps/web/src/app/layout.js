import localFont from "next/font/local";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/lib/theme-context";
import "./globals.css";

const peydaFont = localFont({
  src: [
    {
      path: "../assets/fonts/PeydaWebFaNum-ExtraLight.woff2",
      weight: "200",
      style: "normal",
    },
    {
      path: "../assets/fonts/PeydaWebFaNum-Light.woff2",
      weight: "300",
      style: "normal",
    },
    {
      path: "../assets/fonts/PeydaWebFaNum-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/fonts/PeydaWebFaNum-ExtraBold.woff2",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "سامانه آموزشی",
  description: "پلتفرم جامع محتوای آموزشی، کتابخانه و مجموعه‌داده",
};

import { Providers } from "./providers";

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl" className={peydaFont.variable}>
      <body className="min-h-screen bg-background text-foreground antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  );
}
