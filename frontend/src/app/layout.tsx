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

const BASE = "https://writingtwinai.com";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Writing Twin AI",
  url: BASE,
  logo: `${BASE}/icons/icon-black-512.png`,
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@writingtwinai.com",
    contactType: "customer support",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Writing Twin AI",
  operatingSystem: "Chrome",
  applicationCategory: "BusinessApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Chrome extension that learns your writing voice and rewrites AI-sounding text to sound exactly like you — in Gmail, Outlook, LinkedIn, and Slack.",
  url: BASE,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: "Writing Twin AI — AI Email & Message Writer in Your Own Voice",
  description:
    "Writing Twin learns how you write and rewrites stiff, AI-sounding drafts to sound exactly like you — inside Gmail, Outlook, LinkedIn, and Slack. Free Chrome extension.",
  keywords: [
    "AI writing assistant",
    "writing voice",
    "Chrome extension",
    "Gmail AI",
    "non-native English professional",
    "email rewriter",
    "personal writing style",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Writing Twin AI — AI Email & Message Writer in Your Own Voice",
    description:
      "Chrome extension that rewrites AI text to sound exactly like you. Works in Gmail, Outlook, LinkedIn, Slack.",
    url: BASE,
    siteName: "Writing Twin AI",
    images: [{ url: "/icons/icon-black-512.png", width: 512, height: 512 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing Twin AI — AI Email & Message Writer in Your Own Voice",
    description:
      "Chrome extension that rewrites AI text to sound exactly like you.",
    images: ["/icons/icon-black-512.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        />
      </head>
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
