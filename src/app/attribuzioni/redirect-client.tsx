"use client";

import { useEffect } from "react";

export default function AttribuzioniRedirect() {
  useEffect(() => {
    window.location.replace("/#attribuzioni");
  }, []);

  return (
    <main className="flex min-h-[40vh] items-center justify-center p-6 text-sm text-[var(--pa-muted)]">
      Reindirizzamento…
    </main>
  );
}
