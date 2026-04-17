import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Personal Spending Tracker",
  description: "Track and visualize your spending across connected accounts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function getEffectiveTheme(theme) {
                  if (theme === 'auto') {
                    const hour = new Date().getHours();
                    return (hour >= 20 || hour < 6) ? 'dark' : 'light';
                  }
                  return theme;
                }

                const savedTheme = localStorage.getItem('theme') || 'auto';
                const effectiveTheme = getEffectiveTheme(savedTheme);

                if (effectiveTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#E8E6E1] dark:bg-[#0a0a0a] transition-colors duration-200`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
