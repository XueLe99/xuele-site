import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { SHOW_BLOG } from "@/config";
import { publishedPosts } from "@/content/blog";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  if (!SHOW_BLOG) return { robots: { index: false } };
  const t = await getTranslations({ locale, namespace: "meta" });
  return pageMetadata({
    locale,
    path: "/blog",
    title: t("blogTitle"),
    description: t("blogDescription"),
  });
}

export default async function BlogPage({ params }: PageProps<"/[locale]/blog">) {
  const locale = await resolveLocale(params);
  if (!SHOW_BLOG) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const posts = publishedPosts();

  return (
    <PageShell title={t("title")}>
      {posts.length === 0 ? (
        <p className="text-muted">{t("empty")}</p>
      ) : (
        <ul className="flex max-w-3xl flex-col gap-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="surface flex flex-col gap-2 p-6 hover:border-primary"
              >
                <time dateTime={post.date} className="font-mono text-sm text-primary">
                  {post.date}
                </time>
                <h2 className="t-h3">{post.title[locale]}</h2>
                <p className="t-small text-muted">{post.summary[locale]}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}
