import { ImageResponse } from "next/og";

/** Genererer app-ikon (branded «V») i ønsket størrelse for PWA-manifestet. */
export function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("size") ?? 512);
  const size = Math.min(1024, Math.max(48, Number.isFinite(raw) ? raw : 512));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#081b33",
        }}
      >
        <div
          style={{
            fontSize: size * 0.6,
            fontWeight: 800,
            color: "#d8a66a",
            fontFamily: "sans-serif",
          }}
        >
          V
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
