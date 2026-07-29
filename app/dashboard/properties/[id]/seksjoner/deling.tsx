import { ImageManager } from "@/components/properties/image-manager";
import { Kopier } from "@/components/hus/kopier";
import { Flate, Handling, Kort } from "@/components/hus";
import { uploadPropertyImage, deletePropertyImage } from "../../actions";

/**
 * Deling og bilder — modul 9. Seksjon av eiendomssiden, kun presentasjon.
 * Lenkene og actionene er nøyaktig som før.
 */

function Lenke({ merke, url }: { merke: string; url: string }) {
  return (
    <Kort>
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-hus-svak">
          {merke}
        </span>
        <div className="flex items-center justify-between gap-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="min-w-0 truncate text-sm text-hus-gull-lys underline"
          >
            {url}
          </a>
          <Kopier tekst={url} />
        </div>
      </div>
    </Kort>
  );
}

export function Deling({
  propertyId,
  images,
  bookingUrl,
  guideUrl,
}: {
  propertyId: string;
  images: string[];
  bookingUrl: string;
  guideUrl: string;
}) {
  return (
    <>
      <Flate
        tittel="Del bookingsiden"
        hva="Den offentlige siden gjestene bruker for å booke og betale."
      >
        <div className="flex flex-col gap-4">
          <Lenke merke="Bookinglenke" url={bookingUrl} />

          <div className="flex flex-wrap items-center gap-2">
            <Handling href={bookingUrl} vekt="gull" nyFane>
              Forhåndsvis siden
            </Handling>
            <Kopier
              tekst={`${bookingUrl}?kilde=instagram`}
              merke="Kopier Instagram-lenke"
            />
            <Kopier
              tekst={`${bookingUrl}?kilde=facebook`}
              merke="Kopier Facebook-lenke"
            />
          </div>
          <p className="text-xs leading-relaxed text-hus-svak">
            Bruk Instagram-/Facebook-lenkene når du deler på de kanalene, så ser
            du hvor bookingene kommer fra (og riktig provisjon beregnes).
          </p>
        </div>
      </Flate>

      <Flate
        tittel="Bilder"
        hva="Første bilde brukes som hovedbilde på den offentlige siden."
      >
        <ImageManager
          propertyId={propertyId}
          images={images}
          uploadAction={uploadPropertyImage}
          deleteAction={deletePropertyImage}
        />
      </Flate>

      <Flate
        tittel="Gjesteguide"
        hva="Del denne med gjestene dine — også Airbnb-gjester."
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-hus-dempet">
            De får WiFi, «slik funker det», lokale tips og en AI-assistent som
            svarer på deres eget språk.
          </p>
          <Lenke merke="Guide-lenke" url={guideUrl} />
          <p className="text-xs text-hus-svak">
            Fyll inn «Slik funker det» under «Rediger», så svarer AI-en enda
            bedre.
          </p>
        </div>
      </Flate>
    </>
  );
}
