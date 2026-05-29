import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Writing Twin AI — Write Emails That Sound Like You, Not Like AI",
  description:
    "AI that learns your writing voice and rewrites text to sound exactly like you. Works in Gmail, LinkedIn, and Slack. Free to try — takes 2 minutes.",
  metadataBase: new URL("https://writingtwinai.com"),
  alternates: {
    canonical: "https://writingtwinai.com",
  },
  openGraph: {
    title: "Writing Twin AI — Write Like Yourself. Everywhere.",
    description:
      "Writing Twin learns your communication style and rewrites anything in your voice. Not like AI. Like you.",
    url: "https://writingtwinai.com",
    siteName: "Writing Twin AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing Twin AI — Your Voice. Everywhere.",
    description:
      "AI email rewriter that sounds like you, not like ChatGPT. Works in Gmail, LinkedIn, Slack.",
  },
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
