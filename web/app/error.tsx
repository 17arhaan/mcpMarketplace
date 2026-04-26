"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="max-w-5xl mx-auto px-5 py-20 text-center">
      <p className="font-mono text-[#525252] text-sm mb-2">error</p>
      <h1 className="text-xl font-bold font-mono text-white mb-1">something went wrong</h1>
      <p className="font-mono text-sm text-[#525252] mb-6">an unexpected error occurred.</p>
      <button onClick={reset} className="font-mono text-sm text-[#3b82f6] hover:underline">
        try again
      </button>
    </main>
  );
}
