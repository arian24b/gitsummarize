import "~/styles/globals.css";

import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { Header } from "~/components/header";
import { Footer } from "~/components/footer";
import { CSPostHogProvider } from "./providers";

export const metadata: Metadata = {
  title: "GitSummarize",
  description:
    "Turn any GitHub repository into comprehensive documentation in seconds.",
  metadataBase: new URL("https://gitsummarize.com"),
  keywords: [
    "github",
    "git summarize",
    "git documentation",
    "git documentation generator",
    "git documentation tool",
    "git documentation maker",
    "git documentation creator",
    "git summarize",
    "documentation",
    "repository",
    "visualization",
    "code structure",
    "system design",
    "software architecture",
    "software design",
    "software engineering",
    "software development",
    "software architecture",
    "software design",
    "software engineering",
    "software development",
    "open source",
    "open source software",
    "gitsummarize",
    "gitsummarize.com",
  ],
  authors: [
    { name: "Antarixx", url: "https://github.com/antarixx" },
  ],
  creator: "Antarixx",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://gitsummarize.com",
    title: "GitSummarize - Repository to Documentation in Seconds",
    description:
      "Turn any GitHub repository into comprehensive documentation in seconds.",
    siteName: "GitSummarize",
    images: [
      {
        url: "/og-image.png", // You'll need to create this image
        width: 1200,
        height: 630,
        alt: "GitSummarize - Repository Documentation Tool",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <CSPostHogProvider>
        <body className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-grow">{children}</main>
          <Footer />
        </body>
      </CSPostHogProvider>
    </html>
  );
}
