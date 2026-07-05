"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

/** Knapp for handlinger som ennå er mockup — viser en bekreftelse ved klikk. */
export function DemoAction({
  label,
  done,
  variant = "default",
}: {
  label: string;
  done: string;
  variant?: "default" | "outline";
}) {
  const [clicked, setClicked] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button type="button" variant={variant} onClick={() => setClicked(true)}>
        {label}
      </Button>
      {clicked && <p className="text-sm text-emerald-600">{done}</p>}
    </div>
  );
}
