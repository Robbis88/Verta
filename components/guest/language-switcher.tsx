import {
  GUEST_LANGS,
  GUEST_LANG_LABELS,
  type GuestLang,
} from "@/lib/guest-i18n";

/**
 * Språkvelger på gjestesiden. Rene lenker som setter ?lang= — ingen innlogging,
 * ingen state. Valgt språk uthevet. Full navigasjon re-rendrer siden server-side
 * (og AI-oversetter eierens tekst til valgt språk).
 */
export function LanguageSwitcher({ current }: { current: GuestLang }) {
  return (
    <div className="mt-4 flex items-center justify-center gap-1">
      {GUEST_LANGS.map((lang) => {
        const active = lang === current;
        return (
          <a
            key={lang}
            href={`?lang=${lang}`}
            aria-current={active ? "true" : undefined}
            className={
              active
                ? "rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white"
                : "rounded-full px-3 py-1 text-xs text-white/60 hover:text-white"
            }
          >
            {GUEST_LANG_LABELS[lang]}
          </a>
        );
      })}
    </div>
  );
}
