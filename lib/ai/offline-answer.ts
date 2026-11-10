// Запасной режим помощника — без Claude API. Включается при AI_MODE=offline, без ключа,
// при ошибке API или исчерпанном лимите. Тот же разбор запроса, что и в каталоге
// (parseQuery), тот же поиск (searchCatalog) и шаблонный ответ на языке посетителя.
import "server-only";
import type { Locale } from "@/i18n/routing";
import { parseQuery } from "@/lib/search/query-parser";
import { getPlaceAliases } from "@/lib/search/search-catalog";
import { serializeCatalogFilters } from "@/lib/search/catalog-filters";
import { getBranches } from "@/lib/site/branches";
import { matchBranches, runCatalogSearch, type AssistantDocument, type CatalogToolArgs } from "./archive-tools";

export type AssistantAnswer = { text: string; documents: AssistantDocument[]; suggestions: string[] };

/** Просьба подать заявление / заказать справку — помощник это не принимает */
const REQUEST_INTENT =
  /(заказ\p{L}*|заявлен\p{L}*|заявк\p{L}*|справк\p{L}*|копи[юия]\p{L}*|запрос\p{L}*\s+(в\s+)?архив|оплат\p{L}*|записат\p{L}*|подать|отправить\s+запрос|өтініш\p{L}*|анықтама\p{L}*|тапсырыс\p{L}*|сұраныс\p{L}*|\border\p{L}*|\bcertificate\p{L}*|\bapply\b|\bapplication\p{L}*|\brequest\s+a\b|\bpay\p{L}*)/iu;
const BRANCH_INTENT = /(филиал\p{L}*|адрес\p{L}*|режим\p{L}*|час(ы|ов)\s+работ\p{L}*|телефон\p{L}*|как\s+(доехать|проехать|добраться)|мекенжай\p{L}*|жұмыс\s+уақыт\p{L}*|\bbranch\p{L}*|\baddress\p{L}*|opening\s+hours|\bphone\b)/iu;

const T = {
  ru: {
    refusal:
      "Этот сайт информационный: здесь нельзя подать заявление, архивный запрос или заказать справку и копии. Архивные справки, копии и выписки — бесплатная государственная услуга: подаётся через https://egov.kz, портал e-vko или ЦОН; подробнее — [«Государственная услуга»](/ru/services/state), цены на платные работы — [«Платные услуги»](/ru/services/paid). Контакты архива: Усть-Каменогорск, ул. Бейбітшілік, 26/1, тел. 8 (7232) 25-59-76, arhiv-ukg@yandex.kz. Филиалы — [на странице «Филиалы»](/ru/branches).",
    found: (n: number) => `Нашёл ${n} ${plural(n, ["запись", "записи", "записей"])} в каталоге. Первые результаты:`,
    none: "По этому запросу в каталоге ничего не нашлось. Попробуйте другое написание населённого пункта, более широкий период или другой тип документов.",
    all: "Все результаты с фильтрами",
    branches: "Адреса и контакты филиалов:",
    allBranches: "Все филиалы на карте",
    suggestions: ["Фотографии Усть-Каменогорска 1960-х", "Документы об освоении целины", "Где находится Риддерский филиал?"],
  },
  kz: {
    refusal:
      "Бұл сайт ақпараттық: мұнда өтініш, архивтік сұрау беру немесе анықтама мен көшірме тапсырыс беру мүмкін емес. Архивтік анықтамалар, көшірмелер мен үзінділер — тегін мемлекеттік қызмет: https://egov.kz, e-vko порталы немесе ХҚКО арқылы беріледі; толығырақ — [«Мемлекеттік көрсетілетін қызмет»](/kz/services/state), ақылы жұмыстардың бағасы — [«Ақылы қызметтер»](/kz/services/paid). Архив байланыстары: Өскемен, Бейбітшілік к-сі, 26/1, тел. 8 (7232) 25-59-76, arhiv-ukg@yandex.kz. Филиалдар — [«Филиалдар» бетінде](/kz/branches).",
    found: (n: number) => `Каталогтан ${n} жазба табылды. Алғашқы нәтижелер:`,
    none: "Бұл сұрау бойынша каталогта ештеңе табылмады. Елді мекен атауын басқаша жазып, кезеңді кеңейтіп немесе басқа құжат түрін таңдап көріңіз.",
    all: "Сүзгілері бар барлық нәтижелер",
    branches: "Филиалдардың мекенжайлары мен байланыстары:",
    allBranches: "Картадағы барлық филиалдар",
    suggestions: ["1960-жылдардағы Өскеменнің фотосуреттері", "Тың игеру туралы құжаттар", "Риддер филиалы қайда орналасқан?"],
  },
  en: {
    refusal:
      "This website is information-only: it cannot accept applications, archival requests or orders for certificates and copies. Archival certificates, copies and extracts are a free state service applied for via https://egov.kz, the e-vko portal or a public service centre; see [State service](/en/services/state) and the price list in [Paid services](/en/services/paid). Archive contacts: Ust-Kamenogorsk, Beibitshilik St. 26/1, phone 8 (7232) 25-59-76, arhiv-ukg@yandex.kz. Branches — [see the Branches page](/en/branches).",
    found: (n: number) => `I found ${n} ${n === 1 ? "record" : "records"} in the catalogue. Top results:`,
    none: "Nothing was found for this query. Try another spelling of the town, a wider period or another document type.",
    all: "All results with filters",
    branches: "Branch addresses and contacts:",
    allBranches: "All branches on the map",
    suggestions: ["Photos of Ust-Kamenogorsk in the 1960s", "Documents about the Virgin Lands campaign", "Where is the Ridder branch?"],
  },
} satisfies Record<Locale, unknown>;

function plural(n: number, forms: [string, string, string]) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function defaultSuggestions(locale: Locale) {
  return T[locale].suggestions;
}

export function isRequestIntent(question: string) {
  return REQUEST_INTENT.test(question);
}

export async function offlineAnswer(question: string, locale: Locale): Promise<AssistantAnswer> {
  const t = T[locale];
  if (isRequestIntent(question)) return { text: t.refusal, documents: [], suggestions: t.suggestions };

  if (BRANCH_INTENT.test(question)) {
    const branches = await getBranches(locale);
    const matched = matchBranches(branches, question);
    const list = (matched.length ? matched : branches.filter((b) => b.isMain)).slice(0, 3);
    const lines = list.map((b) =>
      [`- **[${b.name}](/${locale}/branches?b=${b.slug})**`, b.address, b.phone, b.workHours].filter(Boolean).join(" · "),
    );
    return { text: [t.branches, ...lines, `[${t.allBranches}](/${locale}/branches)`].join("\n"), documents: [], suggestions: t.suggestions };
  }

  const parsed = parseQuery(question, await getPlaceAliases());
  const search = await runCatalogSearch(
    {
      query: parsed.freeText || undefined,
      docType: parsed.filters.type[0],
      yearFrom: parsed.filters.from,
      yearTo: parsed.filters.to,
      topic: parsed.filters.topic[0] as CatalogToolArgs["topic"],
      limit: 5,
    },
    locale,
    parsed.filters.place,
  );

  if (search.total === 0) return { text: t.none, documents: [], suggestions: t.suggestions };

  const catalogHref = `/${locale}/catalog${serializeCatalogFilters({
    q: question.slice(0, 200),
  })}`;
  const lines = search.documents.map((d) => `- [${d.title}](${d.url}) — \`${d.cipher}\`${d.yearFrom ? `, ${d.yearFrom}` : ""}`);
  return {
    text: [t.found(search.total), ...lines, `[${t.all} →](${catalogHref})`].join("\n"),
    documents: search.documents,
    suggestions: t.suggestions,
  };
}
