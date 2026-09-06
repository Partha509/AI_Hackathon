import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/Navbar";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FacultyOS | AI-Powered Academic Co-Pilot",
  description:
    "Decision-support co-pilot for university faculty. Exam quality evaluation, multi-grader consistency checking, and student grade dispute advisory.",
  other: {
    "darkreader-lock": "true",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="darkreader-lock" content="true" />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased min-h-screen bg-background text-foreground flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <main className="flex-1 flex flex-col">{children}</main>
          <footer className="border-t border-border/60 py-4 px-6 text-center text-xs text-muted-foreground">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>FacultyOS &copy; 2025 AUST CSE Carnival 8.0 — AI for Academic Life</span>
              <span className="text-muted-foreground/80">
                AI Advisory: Final evaluation decision remains with Faculty
              </span>
            </div>
          </footer>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
