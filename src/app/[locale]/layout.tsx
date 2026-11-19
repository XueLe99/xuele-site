import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { Background } from "@/components/background/Background";
import { FxProvider } from "@/components/fx/FxProvider";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MotionLayer } from "@/components/motion/MotionLayer";
import { PersonJsonLd } from "@/components/seo/PersonJsonLd";
import { SITE_URL, THEME_COLOR } from "@/config";
import { HTML_LANG, routing } from "@/i18n/routing";
import { resolveLocale } from "@/lib/locale";
import { noFlashScript } from "@/lib/no-flash";
import { pageMetadata } from "@/lib/seo";
import { fontVariables } from "../fonts";
import "../globals.css";
import "../motion.css";

// Only /zh and /en exist; any other first segment is a 404 (global-not-found).
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[locale]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    metadataBase: new URL(SITE_URL),
    ...pageMetadata({
      locale,
      title: t("homeTitle"),
      description: t("description"),
    }),
    title: { default: t("homeTitle"), template: `%s · ${t("siteName")}` },
    applicationName: t("siteName"),
    authors: [{ name: "Westly Tan Xue Le", url: SITE_URL }],
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "nav" });

  // Only the namespaces client components read are sent to the browser.
  const clientMessages = { nav: messages.nav, notFound: messages.notFound };

  return (
    <html
      lang={HTML_LANG[locale]}
      // Dark is the default; the inline script swaps to "light" before paint.
      className={`dark ${fontVariables} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta
          name="theme-color"
          content={THEME_COLOR.dark}
          suppressHydrationWarning
        />
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <NextIntlClientProvider locale={locale} messages={clientMessages}>
          <FxProvider>
            <Background />
            <a
              href="#main"
              className="btn btn-primary sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
            >
              {t("skip")}
            </a>
            <Header />
            <main id="main" tabIndex={-1} className="flex-1 outline-none">
              {children}
            </main>
            <Footer />
            <MotionLayer />
          </FxProvider>
        </NextIntlClientProvider>
        <PersonJsonLd locale={locale} />
      </body>
    </html>
  );
}
