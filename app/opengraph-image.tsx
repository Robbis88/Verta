import { ImageResponse } from "next/og";

export const alt = "Verta — Full kontroll over dine utleieeiendommer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #081b33 0%, #04111f 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 800,
            letterSpacing: -3,
            color: "#d8a66a",
          }}
        >
          Verta
        </div>
        <div
          style={{
            fontSize: 42,
            marginTop: 16,
            color: "#ffffff",
            maxWidth: 880,
            textAlign: "center",
            lineHeight: 1.2,
          }}
        >
          Full kontroll over dine utleieeiendommer
        </div>
        <div
          style={{
            fontSize: 26,
            marginTop: 28,
            color: "#f2c38b",
          }}
        >
          Kalender · Bookinger · Smartlås · Skatt på autopilot
        </div>
      </div>
    ),
    size,
  );
}
