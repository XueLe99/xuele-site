import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

// English-only text on purpose: the default OG font has no CJK glyphs.
export const alt =
  "Westly Tan Xue Le — IT Manager | Computer Science × Archaeology | Technology × Cultural Heritage";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// One static image per locale route (/zh/opengraph-image, /en/opengraph-image).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const STARS = [
  [90, 80, 3], [240, 190, 2], [410, 60, 2], [560, 140, 3], [720, 70, 2],
  [880, 170, 2], [1040, 90, 3], [1130, 240, 2], [980, 330, 2], [1100, 470, 3],
  [860, 560, 2], [640, 590, 2], [300, 570, 3], [130, 470, 2], [60, 300, 2],
] as const;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 96px",
          position: "relative",
          color: "#F3F3F6",
          backgroundColor: "#070A12",
          backgroundImage:
            "radial-gradient(circle at 15% 10%, rgba(27,42,74,0.9), rgba(7,10,18,0) 55%), radial-gradient(circle at 90% 85%, rgba(58,37,96,0.7), rgba(7,10,18,0) 50%)",
        }}
      >
        {STARS.map(([x, y, r], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: r * 2,
              height: r * 2,
              borderRadius: r,
              backgroundColor: i % 5 === 0 ? "#E8C56B" : "#FFFFFF",
              opacity: 0.8,
            }}
          />
        ))}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#6EE7F2",
          }}
        >
          Technology × Cultural Heritage
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 20,
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1.05,
          }}
        >
          Westly Tan Xue Le
        </div>
        <div
          style={{ display: "flex", marginTop: 28, fontSize: 38, color: "#F3F3F6" }}
        >
          IT Manager | Computer Science × Archaeology
        </div>
        <div
          style={{ display: "flex", marginTop: 16, fontSize: 28, color: "#9AA0B4" }}
        >
          Stayrene · Johor Bahru, Malaysia
        </div>
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 96,
            bottom: 64,
            width: 160,
            height: 4,
            backgroundColor: "#E8C56B",
          }}
        />
      </div>
    ),
    size,
  );
}
