import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { NavAuth } from "./components/nav-auth";
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
    default: "MCP Marketplace",
    template: "%s — MCP Marketplace",
  },
  description: "Registry for Model Context Protocol tools. Discover, install, and publish MCP servers.",
  keywords: ["MCP", "Model Context Protocol", "AI tools", "CLI", "registry"],
  icons: {
    icon: "/mcpFavicon.png",
  },
};

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[#262626] bg-[#0a0a0a]/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-5 h-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-white">mcp-get</span>
          <span className="text-[10px] font-mono text-[#525252] border border-[#262626] px-1.5 py-0.5 rounded">registry</span>
        </Link>
        <nav className="flex items-center gap-0.5 text-[13px]">
          {[
            { href: "/", label: "explore" },
            { href: "/discover", label: "discover" },
            { href: "/publish", label: "publish" },
            { href: "/docs", label: "docs" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-2.5 py-1 rounded text-[#a3a3a3] hover:text-white font-mono transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <NavAuth />
          <a
            href="https://github.com/17arhaan/mcpMarketplace"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-[#525252] hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[#262626] mt-auto">
      <div className="max-w-5xl mx-auto px-5 py-6 flex items-center justify-between text-[11px] font-mono text-[#525252]">
        <div className="flex items-center gap-4">
          <span>mcp-get v0.1.0</span>
          <span>AGPL-3.0</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="https://github.com/17arhaan/mcpMarketplace" target="_blank" rel="noopener noreferrer" className="hover:text-[#a3a3a3] transition-colors">github</a>
          <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer" className="hover:text-[#a3a3a3] transition-colors">mcp spec</a>
          <a href="https://www.arhaanportfolio.in" target="_blank" rel="noopener noreferrer" className="hover:text-[#a3a3a3] transition-colors">by arhaan</a>
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
      <head>
        <link rel="icon" href="/mcpFavicon.png" />
        <link rel="shortcut icon" href="/mcpFavicon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/mcpFavicon.png" />
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0a]">
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
