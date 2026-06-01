import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { PostHogProvider } from "@/components/PostHogProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Writing Twin AI — Write Like Yourself. Not Like AI.",
  description:
    "AI writing assistant that learns your voice and rewrites text to sound exactly like you. Works in Gmail, LinkedIn, Slack, and Outlook.",
  openGraph: {
    title: "Writing Twin AI",
    description: "Write Like Yourself. Not Like AI.",
    url: "https://writingtwinai.com",
    siteName: "Writing Twin AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing Twin AI",
    description: "Write Like Yourself. Not Like AI.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
