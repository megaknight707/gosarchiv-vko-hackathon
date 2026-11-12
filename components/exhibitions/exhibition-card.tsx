// Карточка выставки: обложка, период, название, число экспонатов.
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ExhibitionCard } from "@/lib/memory/exhibitions";
import { cn } from "@/lib/utils";

export function ExhibitionCardLink({ exhibition, large = false, priority = false }: { exhibition: ExhibitionCard; large?: boolean; priority?: boolean }) {
  const t = useTranslations("Exhibitions");
  return (
    <Link
      href={`/exhibitions/${exhibition.slug}`}
      className={cn(
        "group relative flex h-full items-end overflow-hidden rounded-[16px] bg-[#1B2B47] p-5 text-[#FFFFFF]",
        large ? "min-h-[360px] sm:min-h-[440px]" : "min-h-[220px]",
      )}
    >
      {exhibition.coverUrl && (
        <Image
          src={exhibition.coverUrl}
          alt=""
          fill
          priority={priority}
          sizes={large ? "(max-width: 1024px) 100vw, 60vw" : "(max-width: 640px) 100vw, 33vw"}
          className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
      )}
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,16,30,0)_20%,rgba(10,16,30,.85)_90%)]" />
      <span className="relative">
        <span className="block text-xs tracking-[.12em] uppercase opacity-85">
          {exhibition.period} · {t("exhibitsCount", { count: exhibition.exhibitsCount })}
        </span>
        <span className={cn("mt-1 block font-serif font-bold group-hover:underline", large ? "text-2xl sm:text-3xl" : "text-xl")}>{exhibition.title}</span>
        {large && <span className="mt-2 line-clamp-2 block max-w-xl text-[#E3E9F2]">{exhibition.description}</span>}
      </span>
    </Link>
  );
}
