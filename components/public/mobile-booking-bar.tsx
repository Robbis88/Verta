/** Fast bunnlinje på mobil med pris + booking-CTA som scroller til #book. */
export function MobileBookingBar({
  priceLabel,
  ctaLabel,
}: {
  priceLabel: string | null;
  ctaLabel: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-hairline bg-white/95 px-4 py-3 shadow-[0_-4px_20px_rgba(8,27,51,0.08)] backdrop-blur lg:hidden">
      <div className="min-w-0 text-sm">
        {priceLabel ? (
          <p className="truncate font-semibold text-navy">{priceLabel}</p>
        ) : (
          <p className="truncate text-ink">Sjekk ledige datoer</p>
        )}
      </div>
      <a
        href="#book"
        className="shrink-0 rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
      >
        {ctaLabel}
      </a>
    </div>
  );
}
