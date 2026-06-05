"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Kopier lenke",
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Kopiert ✓" : label}
    </Button>
  );
}
