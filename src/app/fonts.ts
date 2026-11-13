import { Geist, Geist_Mono, Noto_Sans_SC, Syne } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Chinese headings + body. Google serves it as unicode-range slices, so the
// browser only downloads the slices a page actually uses; no preload.
export const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sc",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// English display headings / English name only.
export const syne = Syne({
  variable: "--font-syne",
  weight: ["600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const fontVariables = [
  geistSans.variable,
  geistMono.variable,
  notoSansSC.variable,
  syne.variable,
].join(" ");
