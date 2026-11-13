import { EMAIL, SITE_URL } from "@/config";
import type { Locale } from "@/i18n/routing";

/** JSON-LD Person. Facts come from site-copy only. */
export function PersonJsonLd({ locale }: { locale: Locale }) {
  const zh = locale === "zh";
  const data = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: zh ? "陈学礼" : "Westly Tan Xue Le",
    alternateName: zh ? "Westly Tan Xue Le" : "陈学礼",
    url: `${SITE_URL}/${locale}`,
    email: `mailto:${EMAIL}`,
    jobTitle: zh ? "IT 经理" : "IT Manager",
    worksFor: { "@type": "Organization", name: "Stayrene" },
    address: {
      "@type": "PostalAddress",
      addressLocality: zh ? "新山" : "Johor Bahru",
      addressRegion: zh ? "柔佛州" : "Johor",
      addressCountry: "MY",
    },
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: zh ? "台湾圣约翰大学" : "St. John's University, Taiwan",
      },
      {
        "@type": "CollegeOrUniversity",
        name: zh ? "郑州大学" : "Zhengzhou University",
      },
    ],
    knowsLanguage: ["zh", "en"],
    knowsAbout: zh
      ? ["计算机视觉", "图像增强", "IT 管理", "考古学", "数字博物馆", "文化遗产数字化"]
      : [
          "Computer vision",
          "Image enhancement",
          "IT management",
          "Archaeology",
          "Digital museums",
          "Cultural heritage digitization",
        ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
