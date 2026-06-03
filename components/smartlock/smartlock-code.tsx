"use client";

import { useActionState } from "react";

import {
  generateTestCode,
  type CodeState,
} from "@/app/dashboard/properties/smartlock-actions";
import { Button } from "@/components/ui/button";

const initialState: CodeState = {};

export function SmartLockCode() {
  const [state, action, pending] = useActionState(generateTestCode, initialState);

  return (
    <form action={action} className="flex items-center gap-3">
      <Button type="submit" variant="outline" disabled={pending}>
        Generer testkode
      </Button>
      {state.code && (
        <span className="font-mono text-lg tracking-widest">{state.code}</span>
      )}
    </form>
  );
}
