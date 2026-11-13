import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/layout/PageShell";
import { SHOW_BLOG } from "@/config";
import { getPost, postSlugs } from "@/content/blog";
import { Link } from "@/i18n/navigation";
import { resolveLocale } from "@/lib/locale";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return postSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const post = SHOW_BLOG ? getPost(slug) : undefined;
  if (!post) return { robots: { index: false } };
  return pageMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: post.title[locale],
    description: post.summary[locale],
  });
}

export default async function BlogPostPage({
  params,
}: PageProps<"/[locale]/blog/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const post = SHOW_BLOG ? getPost(slug) : undefined;
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });

  return (
    <PageShell title={post.title[locale]} intro={post.summary[locale]}>
      <article className="prose-measure flex flex-col gap-6">
        <time dateTime={post.date} className="font-mono text-sm text-primary">
          {post.date}
        </time>
        {post.body[locale].map((paragraph, i) => (
          <p key={i} className="t-body">
            {paragraph}
          </p>
        ))}
        <Link href="/blog" className="link mt-4 inline-flex h-11 items-center">
          {t("back")}
        </Link>
      </article>
    </PageShell>
  );
}
