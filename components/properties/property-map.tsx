/**
 * Enkelt kart av beliggenheten (OpenStreetMap-innfelt, ingen API-nøkkel).
 * Viser et omtrentlig område rundt lat/lng — ingen eksakt nål, av personvern.
 */
export function PropertyMap({ lat, lng }: { lat: number; lng: number }) {
  const d = 0.012; // ~1,3 km — området, ikke eksakt adresse
  const bbox = `${lng - d},${lat - d},${lng + d},${lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik`;
  return (
    <div className="overflow-hidden rounded-xl border border-hairline">
      <iframe
        src={src}
        title="Kart over området"
        className="h-64 w-full"
        loading="lazy"
      />
      <p className="px-3 py-2 text-xs text-muted-foreground">
        Omtrentlig område. Nøyaktig adresse deles etter bekreftet booking.
      </p>
    </div>
  );
}
