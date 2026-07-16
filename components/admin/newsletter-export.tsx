"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/**
 * Kopier alle e-poster til utklippstavlen eller last ned som CSV — for utsending
 * via ditt e-postverktøy. Kun aktive (ikke avmeldte) e-poster sendes inn.
 */
export function NewsletterExport({
  rows,
}: {
  rows: { email: string; name: string | null }[];
}) {
  const [copied, setCopied] = useState(false);

  const emails = rows.map((r) => r.email).join(", ");

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignorer
    }
  }

  function downloadCsv() {
    const header = "email,name\n";
    const body = rows
      .map((r) => `${r.email},${(r.name ?? "").replace(/[",\n]/g, " ")}`)
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nyhetsbrev-abonnenter.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" size="sm" onClick={copyEmails} disabled={!rows.length}>
        {copied ? "Kopiert ✓" : "Kopier alle e-poster"}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={downloadCsv}
        disabled={!rows.length}
      >
        Last ned CSV
      </Button>
    </div>
  );
}
