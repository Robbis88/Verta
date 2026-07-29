"use client";

import { useActionState } from "react";

import {
  generateTestCode,
  type CodeState,
} from "@/app/dashboard/properties/smartlock-actions";
import { Handling } from "@/components/hus";

const initialState: CodeState = {};

export function SmartLockCode() {
  const [state, action, pending] = useActionState(generateTestCode, initialState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <Handling type="submit" vekt="stille" disabled={pending}>
        Generer testkode
      </Handling>
      {state.code && (
        <span className="font-mono text-lg tracking-[0.3em] text-hus-gull-lys">
          {state.code}
        </span>
      )}
    </form>
  );
}
