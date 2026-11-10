// Читальный зал: правила работы исследователей, режим, оборудование. Без записи и заказа дел.
import type { Metadata } from "next";
import { Clock, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { knownValue } from "@/lib/archive/todo";
import { pickLocale } from "@/lib/i18n/pick-locale";
import { getMainBranch, phoneHref } from "@/lib/site/main-branch";
import { pageMetadata } from "@/lib/site/page-metadata";
import { pick, READING_ROOM } from "@/lib/site/reference-content";
import { ExternalLink } from "@/components/content/external-link";
import { ReferencePage } from "@/components/content/reference-page";

export async function generateMetadata({ params }: PageProps<"/[locale]/help/reading-room">): Promise<Metadata> {
  return pageMetadata((await params).locale as Locale, "readingRoom", "/help/reading-room");
}

export default async function ReadingRoomPage({ params }: PageProps<"/[locale]/help/reading-room">) {
  const locale = (await params).locale as Locale;
  const [t, tCommon, main] = await Promise.all([
    getTranslations({ locale, namespace: "Services" }),
    getTranslations({ locale, namespace: "Common" }),
    getMainBranch(),
  ]);
  const hours = main ? knownValue(pickLocale(main, "readingRoomHours", locale)) : null;
  const address = main ? knownValue(pickLocale(main, "address", locale)) : null;
  const h2 = "font-serif text-xl font-bold";

  return (
    <ReferencePage locale={locale} pageKey="readingRoom">
      <p className="text-muted-ink">{t("readingIntro")}</p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-[14px] border border-border bg-surface p-4">
          <dt className="flex items-center gap-2 text-sm font-bold"><Clock aria-hidden className="size-4 text-accent-2" />{t("readingHours")}</dt>
          <dd className="mt-1">{hours ?? tCommon("toBeConfirmed")}</dd>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-4">
          <dt className="flex items-center gap-2 text-sm font-bold"><MapPin aria-hidden className="size-4 text-accent-2" />{t("readingAddress")}</dt>
          <dd className="mt-1">{address ?? tCommon("toBeConfirmed")}</dd>
        </div>
        <div className="rounded-[14px] border border-border bg-surface p-4">
          <dt className="flex items-center gap-2 text-sm font-bold"><Phone aria-hidden className="size-4 text-accent-2" />{t("readingContacts")}</dt>
          <dd className="mt-1">
            {main?.phone ? <a href={phoneHref(main.phone)} className="font-bold text-primary hover:underline">{main.phone}</a> : tCommon("toBeConfirmed")}
          </dd>
        </div>
      </dl>

      <section aria-labelledby="rules" className="mt-8">
        <h2 id="rules" className={h2}>{t("readingRules")}</h2>
        <p className="mt-3 rounded-[14px] border border-border bg-surface p-4">
          <ExternalLink href={READING_ROOM.rulesHref}>{pick(READING_ROOM.rules, locale)}</ExternalLink>
          <span className="mt-1 block text-xs text-muted-ink">{t("fromArchive")}</span>
        </p>
      </section>

      <section aria-labelledby="equipment" className="mt-8">
        <h2 id="equipment" className={h2}>{t("readingEquipment")}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 marker:text-primary">
          {READING_ROOM.equipment.map((item, i) => (
            <li key={i}>{pick(item, locale)}</li>
          ))}
        </ul>
      </section>
    </ReferencePage>
  );
}
