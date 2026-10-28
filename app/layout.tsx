import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { ProgressProvider } from "@/components/progress/progress-provider";
import "./globals.css";

// Cặp font "Developer Mono" (ui-ux-pro-max): Plex cho UI, JetBrains cho code/label
const plexSans = IBM_Plex_Sans({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AI Automation Senior Hub",
    template: "%s · AI Automation Senior Hub",
  },
  description:
    "Lộ trình, tài liệu thực chiến và luyện phỏng vấn cho vị trí Senior Automation Test AI.",
};

export const viewport: Viewport = {
  themeColor: "#f6f8fb",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${plexSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-dvh">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
        >
          Bỏ qua tới nội dung
        </a>
        <ProgressProvider>
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
        </ProgressProvider>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 font-mono text-xs text-ink-faint sm:flex-row sm:justify-between sm:px-6 lg:px-8">
            <span>ai-automation-senior-hub · v1.0.0</span>
            <span>Tiến độ được tính từ dữ liệu học thật của bạn</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
