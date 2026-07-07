"use client";

import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

type Suggestion = { text: string; lat: number; lng: number };

/**
 * Adressefelt med autofullføring fra Kartverket. Skriv, få forslag, velg ett —
 * da fylles adressen inn og eksakt posisjon (lat/lng) sendes med skjemaet, så
 * serveren slipper å gjette. Redigerer du teksten selv, geokoder serveren.
 */
export function AddressAutocomplete({
  name = "address",
  defaultValue = "",
}: {
  name?: string;
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function onChange(v: string) {
    setValue(v);
    setCoords(null); // manuell redigering → la serveren geokode
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const id = ++seq.current;
      try {
        const res = await fetch(`/api/adresse?q=${encodeURIComponent(v)}`);
        const data = (await res.json()) as { suggestions?: Suggestion[] };
        if (id === seq.current) {
          setSuggestions(data.suggestions ?? []);
          setOpen(true);
        }
      } catch {
        /* stille */
      }
    }, 250);
  }

  function pick(s: Suggestion) {
    setValue(s.text);
    setCoords({ lat: s.lat, lng: s.lng });
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      {coords && (
        <>
          <input type="hidden" name="lat" value={coords.lat} />
          <input type="hidden" name="lng" value={coords.lng} />
        </>
      )}
      <Input
        name={name}
        value={value}
        autoComplete="off"
        placeholder="F.eks. Kvernhusveien 39, 5164 Laksevåg"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-hairline bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={`${s.text}-${i}`}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="block w-full px-3 py-2 text-left text-sm text-navy hover:bg-cloud"
              >
                {s.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
