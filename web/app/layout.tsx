import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: {
    default: "MCP Marketplace — Registry for AI Agent Tools",
    template: "%s | MCP Marketplace",
  },
  description:
    "Discover, install, and publish Model Context Protocol tools. The npm for AI agent capabilities.",
  keywords: ["MCP", "Model Context Protocol", "AI tools", "AI agents", "tool registry"],
  openGraph: {
    title: "MCP Marketplace",
    description: "The npm for AI agent tools. Discover, install, and publish MCP servers.",
    type: "website",
  },
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">MCP Marketplace</span>
        </Link>
        <nav className="flex items-center gap-1">
          {[
            { href: "/", label: "Browse" },
            { href: "/discover", label: "AI Discover" },
            { href: "/publish", label: "Publish" },
            { href: "/docs", label: "Docs" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">M</span>
              </div>
              <span className="font-semibold text-white text-sm">MCP Marketplace</span>
            </div>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">
              The open registry for Model Context Protocol tools. Discover, install, and publish MCP servers that give AI agents real-world capabilities.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Product</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-gray-500 hover:text-white transition-colors">Browse Tools</Link>
              <Link href="/discover" className="text-sm text-gray-500 hover:text-white transition-colors">AI Discovery</Link>
              <Link href="/publish" className="text-sm text-gray-500 hover:text-white transition-colors">Publish</Link>
              <Link href="/docs" className="text-sm text-gray-500 hover:text-white transition-colors">Documentation</Link>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Resources</h4>
            <div className="flex flex-col gap-2">
              <a href="https://github.com/17arhaan/mcpMarketplace" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">GitHub</a>
              <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-500 hover:text-white transition-colors">MCP Specification</a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-[var(--border)] flex items-center justify-between">
          <p className="text-xs text-gray-600">AGPL-3.0 License</p>
          <p className="text-xs text-gray-600">Built by Arhaan Girdhar</p>
        </div>
      </div>
    </footer>
  );
}

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
      <body className="min-h-full flex flex-col">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
