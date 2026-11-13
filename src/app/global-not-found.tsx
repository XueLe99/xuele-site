/* eslint-disable @next/next/no-html-link-for-pages -- this document has no layout/router: leaving it must be a full page load into the [locale] root layout. */
import type { Metadata } from "next";
import { Background } from "@/components/background/Background";
import { Terminal404, cdHomeClass } from "@/components/ui/Terminal404";
import { THEME_COLOR } from "@/config";
import { noFlashScript } from "@/lib/no-flash";
import en from "../../messages/en.json";
import zh from "../../messages/zh.json";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: `${zh.notFound.title} · ${en.notFound.title}`,
};

/**
 * 404 for URLs that match no route at all (outside `/[locale]`), so it has no
 * layout and no locale: it renders a full document with both languages.
 */
export default function GlobalNotFound() {
  return (
    <html lang="zh-CN" className={`dark ${fontVariables} antialiased`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content={THEME_COLOR.dark} suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <Background live={false} />
        <main className="container-site flex flex-1 flex-col items-center justify-center gap-6 py-16">
          <Terminal404
            lang="zh-CN"
            text={zh.notFound}
            home={
              <a href="/zh" aria-label={`cd ~ (${zh.notFound.homeLabel})`} className={cdHomeClass}>
                cd ~
              </a>
            }
          />
          <Terminal404
            lang="en"
            headingLevel="h2"
            text={en.notFound}
            home={
              <a href="/en" aria-label={`cd ~ (${en.notFound.homeLabel})`} className={cdHomeClass}>
                cd ~
              </a>
            }
          />
        </main>
      </body>
    </html>
  );
}
