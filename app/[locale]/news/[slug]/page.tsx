// Страница новости: дата, категория, текст, видео (если есть), источник, «Поделиться», другие новости.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { htmlLang, type Locale } from "@/i18n/routing";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { siteUrl } from "@/lib/site/config";
import { getNewsItem, getRelatedNews } from "@/lib/site/news";
import { languageAlternates } from "@/lib/site/page-metadata";
import { Breadcrumbs } from "@/components/archive/breadcrumbs";
import { ContentBody } from "@/components/content/content-body";
import { ShareLinks } from "@/components/content/share-links";

export async function generateMetadata({ params }: PageProps<"/[locale]/news/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const item = await getNewsItem(slug);
  if (!item) return {};
  const l = locale as Locale;
  return {
    title: pickLocale(item, "title", l),
    description: pickLocale(item, "excerpt", l),
    alternates: { canonical: `/${locale}/news/${slug}`, languages: languageAlternates(`/news/${slug}`) },
    openGraph: { type: "article", title: pickLocale(item, "title", l), publishedTime: item.publishedAt?.toISOString() },
  };
}

/** Видео: YouTube → встраиваемый плеер, иначе — ссылка */
function videoEmbed(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
}

export default async function NewsItemPage({ params }: PageProps<"/[locale]/news/[slug]">) {
  const { locale: rawLocale, slug } = await params;
  const locale = rawLocale as Locale;
  const item = await getNewsItem(slug);
  if (!item) notFound();

  const [t, tNav, related] = await Promise.all([
    getTranslations({ locale, namespace: "News" }),
    getTranslations({ locale, namespace: "Nav" }),
    getRelatedNews(item.id, item.category),
  ]);
  const date = new Intl.DateTimeFormat(htmlLang[locale], { day: "numeric", month: "long", year: "numeric" });
  const title = pickLocale(item, "title", locale);
  const embed = item.videoUrl ? videoEmbed(item.videoUrl) : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-10">
      <Breadcrumbs className="mb-6" items={[{ label: tNav("home"), href: "/" }, { label: tNav("news"), href: "/news" }, { label: title }]} />
      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        <article className="max-w-3xl">
          <p className="flex flex-wrap gap-x-2 text-sm text-muted-ink">
            {item.publishedAt && <time dateTime={item.publishedAt.toISOString()}>{date.format(item.publishedAt)}</time>}
            <span aria-hidden>·</span>
            <Link href={`/news?category=${item.category}`} className="hover:text-primary hover:underline">
              {t(`categories.${item.category}`)}
            </Link>
            {item.branch && (
              <>
                <span aria-hidden>·</span>
                <Link href={`/branches?b=${item.branch.slug}`} className="hover:text-primary hover:underline">
                  {pickLocale(item.branch, "name", locale)}
                </Link>
              </>
            )}
          </p>
          <h1 className="mt-3 font-serif text-3xl leading-tight font-bold sm:text-4xl">{title}</h1>
          <ContentBody body={pickLocale(item, "body", locale) || pickLocale(item, "excerpt", locale)} className="mt-6 text-lg" />
          {item.videoUrl &&
            (embed ? (
              <iframe src={embed} title={title} className="mt-6 aspect-video w-full rounded-[14px]" allowFullScreen loading="lazy" />
            ) : (
              <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block font-bold text-primary hover:underline">
                ▶ {item.videoUrl}
              </a>
            ))}
          {item.sourceUrl && (
            <p className="mt-6 text-sm">
              <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-muted-ink hover:text-primary hover:underline">
                {t("source")} <ExternalLink aria-hidden className="size-3.5" />
              </a>
            </p>
          )}
          <div className="mt-8 border-t border-border pt-6">
            <ShareLinks title={title} url={`${siteUrl}/${locale}/news/${item.slug}`} />
          </div>
        </article>

        {related.length > 0 && (
          <aside aria-labelledby="more-news">
            <h2 id="more-news" className="mb-3 font-serif text-xl font-bold">
              {t("more")}
            </h2>
            <ul className="space-y-3">
              {related.map((n) => (
                <li key={n.id} className="rounded-[12px] border border-border bg-surface p-4">
                  {n.publishedAt && <p className="text-xs text-muted-ink">{date.format(n.publishedAt)}</p>}
                  <Link href={`/news/${n.slug}`} className="mt-1 block font-serif font-bold hover:text-primary hover:underline">
                    {pickLocale(n, "title", locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
}
