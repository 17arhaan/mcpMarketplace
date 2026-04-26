import Link from "next/link";

export default function NotFound() {
  return (
    <main className="max-w-5xl mx-auto px-5 py-20 text-center">
      <p className="font-mono text-[#525252] text-sm mb-2">404</p>
      <h1 className="text-xl font-bold font-mono text-white mb-1">page not found</h1>
      <p className="font-mono text-sm text-[#525252] mb-6">
        the page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/" className="font-mono text-sm text-[#3b82f6] hover:underline">
        ← back to registry
      </Link>
    </main>
  );
}
