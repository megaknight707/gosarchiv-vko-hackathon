// Миниатюры сканов из /api/files/ уже сжаты (WebP 320 px) и проходят проверку доступа — их не оптимизируем повторно.
// Карточка документа для списков (главная, каталог, связанные материалы):
// превью, штамп доступа, название, шифр, тип / год / место.
import Image from "next/image";
import { FileImage } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { AccessStamp, type AccessStatus } from "./access-stamp";

export type DocumentCardData = {
  id: string;
  title: string;
  cipher: string;
  docType: "PHOTO" | "TEXT" | "MAP_DRAWING" | "AUDIO_VIDEO" | "PERSONAL" | "ORGANIZATION" | "HISTORICAL";
  yearLabel?: string | null;
  placeName?: string | null;
  /** Дополнительная метка, например «12 л.» */
  extraLabel?: string | null;
  accessStatus: AccessStatus;
  previewUrl?: string | null;
  isDemo?: boolean;
};

export function DocumentCard({ doc, showDemo = false, className }: { doc: DocumentCardData; showDemo?: boolean; className?: string }) {
  const t = useTranslations("Archive");
  const tDemo = useTranslations("Demo");

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-[14px] border border-border bg-card shadow-[0_1px_2px_rgba(60,40,20,.06),0_8px_24px_rgba(60,40,20,.06)] transition-shadow hover:shadow-[0_2px_4px_rgba(60,40,20,.08),0_14px_32px_rgba(60,40,20,.12)]",
        className,
      )}
    >
      <div className="relative h-[120px] bg-chip sm:h-[170px]">
        {doc.previewUrl ? (
          <Image src={doc.previewUrl} alt="" fill unoptimized={doc.previewUrl.startsWith("/api/files/")} sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-muted-ink">
            <FileImage aria-hidden className="size-6" />
            {t("noPreview")}
          </div>
        )}
        <AccessStamp status={doc.accessStatus} className="absolute top-3 left-3" />
      </div>
      <div className="flex flex-1 flex-col gap-2 px-4 pt-3.5 pb-4">
        <h3 className="font-serif text-[14.5px] leading-snug font-bold sm:text-[17px]">
          {/* Растянутая ссылка: кликабельна вся карточка, а в дереве доступности — одна ссылка */}
          <Link href={`/catalog/${doc.id}`} className="after:absolute after:inset-0 group-hover:text-primary">
            {doc.title}
          </Link>
        </h3>
        <code className="font-mono text-[12.5px] text-muted-ink">{doc.cipher}</code>
        <ul className="mt-auto hidden flex-wrap gap-1.5 text-xs sm:flex">
          <li className="rounded-md bg-chip px-2 py-0.5 text-muted-ink">{t(`docType.${doc.docType}`)}</li>
          {doc.yearLabel && <li className="rounded-md bg-chip px-2 py-0.5 text-muted-ink">{doc.yearLabel}</li>}
          {doc.placeName && <li className="rounded-md bg-chip px-2 py-0.5 text-muted-ink">{doc.placeName}</li>}
          {doc.extraLabel && <li className="rounded-md bg-chip px-2 py-0.5 text-muted-ink">{doc.extraLabel}</li>}
        </ul>
        {showDemo && doc.isDemo && <p className="text-[11px] text-muted-ink italic">{tDemo("record")}</p>}
      </div>
    </article>
  );
}
