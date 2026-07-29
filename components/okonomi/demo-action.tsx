"use client";

import { useState } from "react";

import { Handling } from "@/components/hus";

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
      <Handling
        vekt={variant === "outline" ? "stille" : "gull"}
        onClick={() => setClicked(true)}
      >
        {label}
      </Handling>
      {clicked && <p className="text-sm text-hus-god">{done}</p>}
    </div>
  );
}
