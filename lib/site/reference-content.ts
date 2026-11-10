// Содержимое справочных разделов по «Дополнениям к ТЗ» (docs/tz-additions.md):
// государственная услуга, платные услуги, законодательство, читальный зал, госсимволы, полезные ссылки.
// Источники — действующий сайт архива (e-arhiv.vko.gov.kz), ИПС «Әділет» (adilet.zan.kz),
// постановление акимата № 142 от заказчика. Проверено 10.11.2026 (см. docs/real-archive-data.md).
// Официальные тексты актов не переводим на английский: в EN — описательный перевод названия.
import type { Locale } from "@/i18n/routing";

export type L = Record<Locale, string>;
export type ExternalLink = { title: L; href: string; note?: L };

export const pick = (value: L, locale: Locale) => value[locale] || value.ru;

/** Дата сверки сведений с официальными источниками */
export const VERIFIED_AT = "2026-11-10";

// ───────────── Государственная услуга ─────────────

export const STATE_SERVICE = {
  name: {
    kz: "Архивтік анықтамалар, архивтік құжаттардың көшірмелерін немесе архивтік үзінділер беру",
    ru: "Выдача архивных справок, копий архивных документов или архивных выписок",
    en: "Issuing archival certificates, copies of archival documents or archival extracts",
  } satisfies L,
  free: {
    kz: "Мемлекеттік көрсетілетін қызмет тегін көрсетіледі.",
    ru: "Государственная услуга оказывается бесплатно.",
    en: "The state service is free of charge.",
  } satisfies L,
  /** Каналы подачи — по отчёту архива за 2025 год */
  channels: [
    {
      title: { kz: "«Электрондық үкімет» порталы (eGov)", ru: "Портал «электронного правительства» (eGov)", en: "eGov e-government portal" },
      text: {
        kz: "ЭЦҚ арқылы немесе мобильді үкімет арқылы онлайн. 2025 жылы қызметтердің басым бөлігі электрондық түрде көрсетілді.",
        ru: "Онлайн с ЭЦП или через мобильное правительство. В 2025 году большинство услуг оказано в электронном виде.",
        en: "Online with a digital signature or via mobile government. Most services in 2025 were provided electronically.",
      },
      href: "https://egov.kz",
    },
    {
      title: { kz: "ШҚО Электрондық қызметтер орталығы (e-vko)", ru: "Центр электронных услуг ВКО (e-vko)", en: "EKR e-services centre (e-vko)" },
      text: {
        kz: "Архивтік анықтамаға өтінімді облыстық портал арқылы беруге болады.",
        ru: "Запрос архивной справки можно подать через областной портал.",
        en: "A request for an archival certificate can be filed through the regional portal.",
      },
      href: "https://e-vko.gov.kz/ru/services/index?id=38",
    },
    {
      title: { kz: "Халыққа қызмет көрсету орталықтары (ХҚКО)", ru: "Центры обслуживания населения (ЦОН)", en: "Public service centres (PSC)" },
      text: {
        kz: "«Азаматтарға арналған үкімет» мемлекеттік корпорациясының бөлімдері.",
        ru: "Отделы Госкорпорации «Правительство для граждан».",
        en: "Offices of the “Government for Citizens” state corporation.",
      },
      href: "https://egov.kz",
    },
    {
      title: { kz: "Архив кеңсесі", ru: "Канцелярия архива", en: "Archive office" },
      text: {
        kz: "Өскемен қ., Бейбітшілік к-сі, 26/1 · 8 (7232) 25-59-76 · arhiv-ukg@yandex.kz",
        ru: "г. Усть-Каменогорск, ул. Бейбітшілік, 26/1 · 8 (7232) 25-59-76 · arhiv-ukg@yandex.kz",
        en: "26/1 Beibitshilik St, Ust-Kamenogorsk · 8 (7232) 25-59-76 · arhiv-ukg@yandex.kz",
      },
      href: null,
    },
  ],
  /** Отчёт архива за 2025 год (официальный документ с сайта архива) */
  stats2025: { total: 30704, individuals: 29027, legalEntities: 1677, electronic: 25396, automated: 5297, stateCorporation: 11 },
  documents: [
    {
      title: {
        kz: "Қазақстан Республикасының «Мемлекеттік және әлеуметтік жауапты қызметтер туралы» Заңы (бұрынғы «Мемлекеттік көрсетілетін қызметтер туралы»)",
        ru: "Закон Республики Казахстан «О государственных и социально ответственных услугах» (ранее — «О государственных услугах»)",
        en: "Law of the Republic of Kazakhstan on State and Socially Responsible Services (formerly “On State Services”)",
      },
      href: "https://adilet.zan.kz/rus/docs/Z1300000088",
      source: "adilet",
    },
    {
      title: {
        kz: "Архив ісі саласындағы мемлекеттік көрсетілетін қызметтерді көрсету қағидалары (ҚР Мәдениет және спорт министрінің 29.05.2020 № 159 бұйрығы)",
        ru: "Правила оказания государственных услуг в области архивного дела (приказ Министра культуры и спорта РК от 29.05.2020 № 159)",
        en: "Rules for state services in archival affairs (Order of the Minister of Culture and Sports No. 159 of 29.05.2020)",
      },
      href: "https://adilet.zan.kz/rus/docs/V2000020790",
      source: "adilet",
    },
    {
      title: {
        kz: "Мемлекеттік қызмет көрсету мәселелері бойынша 2025 жылғы есеп",
        ru: "Отчёт архива об оказании государственной услуги за 2025 год",
        en: "Archive report on the state service for 2025 (in Russian)",
      },
      href: "/documents/services/otchet-gosusluga-2025-ru.docx",
      source: "archive",
    },
    {
      title: {
        kz: "Есептер 2017–2024 жж. және ХҚКО мекенжайлары — архивтің қазіргі сайтында",
        ru: "Отчёты за 2017–2024 годы, памятки и инструкции eGov — на действующем сайте архива",
        en: "Reports for 2017–2024, eGov guides — on the archive's current website",
      },
      href: "http://e-arhiv.vko.gov.kz/ru/Page/Index/22187",
      source: "archive",
    },
  ],
  complaints: {
    kz: "Мемлекеттік қызмет сапасына шағым немесе ұсыныс — Telegram-дағы EgovKzBot2.0 чат-боты және e-Otinish порталы.",
    ru: "Жалоба или предложение по качеству госуслуги — чат-бот EgovKzBot2.0 в Telegram и портал e-Otinish.",
    en: "Complaints or suggestions about service quality — the EgovKzBot2.0 Telegram bot and the e-Otinish portal.",
  } satisfies L,
  otinish: "https://eotinish.kz",
  apostille: "https://egov.kz/cms/ru/services/apostil/e_059",
};

// ───────────── Платные услуги ─────────────

export const PAID_SERVICES = {
  act: {
    kz: "Шығыс Қазақстан облысы әкімдігінің 2023 жылғы 15 желтоқсандағы № 289 қаулысы «Шығыс Қазақстан облысының цифрландыру және архивтер басқармасының мемлекеттік архивтері өткізетін тауарларға (жұмыстарға, көрсетілетін қызметтерге) бағалар прейскурантын бекіту туралы»",
    ru: "Постановление Восточно-Казахстанского областного акимата от 15 декабря 2023 года № 289 «Об утверждении прейскуранта цен на товары (работы, услуги), реализуемые государственными архивами управления цифровизации и архивов Восточно-Казахстанской области»",
    en: "Resolution of the East Kazakhstan Regional Akimat No. 289 of 15 December 2023 approving the price list for goods (works, services) of the state archives of the East Kazakhstan Region",
  } satisfies L,
  adilet: { kz: "https://adilet.zan.kz/kaz/docs/G23V000289A", ru: "https://adilet.zan.kz/rus/docs/G23V000289A", en: "https://adilet.zan.kz/rus/docs/G23V000289A" } satisfies L,
  scan: "/documents/services/preyskurant-289-ru.pdf",
  basis: {
    kz: "Мемлекеттік архивтердің ақылы қызмет түрлерін жүзеге асыру қағидалары — ҚР Мәдениет және ақпарат министрінің 10.07.2025 № 313-н/қ бұйрығы (қолданыстағы редакция).",
    ru: "Правила осуществления платных видов деятельности государственными архивами — приказ Министра культуры и информации РК от 10.07.2025 № 313-н/қ (действующая редакция).",
    en: "Rules for paid activities of state archives — Order of the Minister of Culture and Information No. 313-n/k of 10.07.2025 (current version).",
  } satisfies L,
  basisHref: "https://adilet.zan.kz/rus/docs/V2500036438",
};

// ───────────── Законодательные и нормативные акты ─────────────

export type LegalAct = { title: L; details: L; href: string; topic: "archive" | "services" | "data" | "region" };

export const LEGAL_ACTS: LegalAct[] = [
  {
    topic: "archive",
    title: { kz: "«Ұлттық архив қоры және архивтер туралы» ҚР Заңы", ru: "Закон РК «О Национальном архивном фонде и архивах»", en: "Law on the National Archival Fund and Archives" },
    details: { kz: "1998 жылғы 22 желтоқсан № 326-I", ru: "от 22 декабря 1998 года № 326-I", en: "No. 326-I of 22 December 1998" },
    href: "https://adilet.zan.kz/rus/docs/Z980000326_",
  },
  {
    topic: "archive",
    title: {
      kz: "Ұлттық архив қорының құжаттарын толықтыру, сақтау, есепке алу және пайдалану қағидалары",
      ru: "Правила комплектования, хранения, учёта и использования документов Национального архивного фонда",
      en: "Rules for acquisition, storage, accounting and use of National Archival Fund documents",
    },
    details: { kz: "ҚР МСМ 2023 жылғы 9 тамыздағы № 215 бұйрығы", ru: "приказ Министра культуры и спорта РК от 9 августа 2023 года № 215", en: "Order No. 215 of 9 August 2023" },
    href: "https://adilet.zan.kz/rus/docs/V2300033290",
  },
  {
    topic: "services",
    title: STATE_SERVICE.documents[0].title,
    details: { kz: "2013 жылғы 15 сәуір № 88-V", ru: "от 15 апреля 2013 года № 88-V", en: "No. 88-V of 15 April 2013" },
    href: "https://adilet.zan.kz/rus/docs/Z1300000088",
  },
  {
    topic: "services",
    title: { kz: "Архив ісі саласындағы мемлекеттік көрсетілетін қызметтерді көрсету қағидалары", ru: "Правила оказания государственных услуг в области архивного дела", en: "Rules for state services in archival affairs" },
    details: { kz: "ҚР МСМ 2020 жылғы 29 мамырдағы № 159 бұйрығы", ru: "приказ Министра культуры и спорта РК от 29 мая 2020 года № 159", en: "Order No. 159 of 29 May 2020" },
    href: "https://adilet.zan.kz/rus/docs/V2000020790",
  },
  {
    topic: "services",
    title: { kz: "Мемлекеттік архивтердің ақылы қызмет түрлерін жүзеге асыру қағидалары", ru: "Правила осуществления платных видов деятельности государственными архивами", en: "Rules for paid activities of state archives" },
    details: { kz: "ҚР МАМ 2025 жылғы 10 шілдедегі № 313-н/қ бұйрығы", ru: "приказ Министра культуры и информации РК от 10 июля 2025 года № 313-н/қ", en: "Order No. 313-n/k of 10 July 2025" },
    href: "https://adilet.zan.kz/rus/docs/V2500036438",
  },
  {
    topic: "region",
    title: PAID_SERVICES.act,
    details: { kz: "Прейскурант — «Ақылы қызметтер» бөлімінде", ru: "Прейскурант — в разделе «Платные услуги»", en: "Price list — see “Paid services”" },
    href: "https://adilet.zan.kz/rus/docs/G23V000289A",
  },
  {
    topic: "region",
    title: {
      kz: "Шығыс Қазақстан облысы әкімдігінің «Шығыс Қазақстан облысының архив мекемелерінің кейбір мәселелері туралы» қаулысы",
      ru: "Постановление Восточно-Казахстанского областного акимата «О некоторых вопросах архивных учреждений Восточно-Казахстанской области»",
      en: "Resolution of the East Kazakhstan Regional Akimat on archival institutions of the region",
    },
    details: {
      kz: "2026 жылғы 2 маусым № 142 — 9 аудандық филиал құрылды, 4 филиал қайта аталды",
      ru: "от 2 июня 2026 года № 142 — созданы 9 районных филиалов, переименованы 4 филиала",
      en: "No. 142 of 2 June 2026 — 9 district branches created, 4 branches renamed",
    },
    href: "/documents/services/postanovlenie-142-kz-ru.pdf",
  },
  {
    topic: "data",
    title: { kz: "«Дербес деректер және оларды қорғау туралы» ҚР Заңы", ru: "Закон РК «О персональных данных и их защите»", en: "Law on Personal Data and Their Protection" },
    details: { kz: "2013 жылғы 21 мамыр № 94-V", ru: "от 21 мая 2013 года № 94-V", en: "No. 94-V of 21 May 2013" },
    href: "https://adilet.zan.kz/rus/docs/Z1300000094",
  },
  {
    topic: "data",
    title: {
      kz: "Ақпараттық-коммуникациялық технологиялар және ақпараттық қауіпсіздікті қамтамасыз ету саласындағы бірыңғай талаптар",
      ru: "Единые требования в области информационно-коммуникационных технологий и обеспечения информационной безопасности",
      en: "Unified requirements for ICT and information security",
    },
    details: { kz: "ҚР Үкіметінің 2016 жылғы 20 желтоқсандағы № 832 қаулысы", ru: "постановление Правительства РК от 20 декабря 2016 года № 832", en: "Government Resolution No. 832 of 20 December 2016" },
    href: "https://adilet.zan.kz/rus/docs/P1600000832",
  },
];

export const LEGAL_ACTS_ARCHIVE_PAGE = "http://e-arhiv.vko.gov.kz/ru/NamedContent?type=Law";

// ───────────── Читальный зал ─────────────

export const READING_ROOM = {
  rules: {
    kz: "Қазақстан Республикасы мемлекеттік архивтерінің оқу залдарында зерттеушілердің жұмыс істеу қағидалары (ҚР МАҚКМ Архивтер және құжаттаманы басқару жөніндегі комитеті төрағасының 2000 жылғы 2 қазандағы № 58 бұйрығы)",
    ru: "Правила работы исследователей в читальных залах государственных архивов Республики Казахстан (приказ Председателя Комитета по управлению архивами и документацией от 2 октября 2000 г. № 58)",
    en: "Rules for researchers in reading rooms of state archives of Kazakhstan (Order No. 58 of 2 October 2000)",
  } satisfies L,
  rulesHref:
    "http://e-arhiv.vko.gov.kz/akimsemey/upload/%D0%9F%D1%80%D0%B0%D0%B2%D0%B8%D0%BB%D0%B0%20%20%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%8B%20%D0%B2%20%D1%87%D0%B8%D1%82%20%D0%B7%D0%B0%D0%BB.doc",
  equipment: [
    { kz: "Оқу залындағы істердің қозғалысын бақылау жүйесі — құжаттардың сақталуы үшін", ru: "Система слежения за перемещением дел — для сохранности документов", en: "A tracking system for files in the reading room — for document safety" },
    { kz: "Микрофильмдерді оқуға арналған аппарат", ru: "Аппарат для чтения микрофильмов", en: "A microfilm reader" },
    { kz: "«Электрондық қор каталогы» мен «Архив тіркеушісін» қарауға арналған компьютер", ru: "Компьютер для просмотра «Электронного фондового каталога» и «Регистратора архива»", en: "A computer with the electronic fund catalogue and the archive register" },
    { kz: "Планшетті сканерде өз бетінше сканерлеу мүмкіндігі", ru: "Самостоятельное сканирование на планшетном сканере", en: "Self-service scanning on a flatbed scanner" },
    { kz: "Презентацияларға арналған мультимедиялық проектор мен экран", ru: "Мультимедийный проектор и экран для презентаций", en: "A projector and screen for presentations" },
  ] satisfies L[],
};

// ───────────── Государственные символы и полезные ссылки ─────────────

export const STATE_SYMBOLS: ExternalLink[] = [
  {
    title: { kz: "Қазақстан Республикасының мемлекеттік рәміздері — Ақорда", ru: "Государственные символы Республики Казахстан — Ақорда", en: "State symbols of Kazakhstan — Akorda" },
    href: "https://www.akorda.kz/ru/state_symbols/about_state_symbols",
    note: { kz: "Ту, Елтаңба, Әнұран: ресми сипаттама", ru: "Флаг, Герб, Гимн: официальное описание", en: "Flag, emblem and anthem: official description" },
  },
  {
    title: { kz: "«Қазақстан Республикасының мемлекеттік рәміздері туралы» Конституциялық заң", ru: "Конституционный закон «О государственных символах Республики Казахстан»", en: "Constitutional Law on the State Symbols of Kazakhstan" },
    href: "https://adilet.zan.kz/rus/docs/Z070000258_",
    note: { kz: "2007 жылғы 4 маусым № 258-III", ru: "от 4 июня 2007 года № 258-III", en: "No. 258-III of 4 June 2007" },
  },
];

export const USEFUL_LINKS: ExternalLink[] = [
  { title: { kz: "Ақорда — ҚР Президентінің ресми сайты", ru: "Ақорда — официальный сайт Президента РК", en: "Akorda — official website of the President" }, href: "http://www.akorda.kz/" },
  { title: { kz: "ШҚО цифрландыру және архивтер басқармасы", ru: "Управление цифровизации и архивов ВКО", en: "EKR Department of Digitalisation and Archives" }, href: "https://www.gov.kz/memleket/entities/vko-uca/activities/11180?lang=ru" },
  { title: { kz: "ШҚО ҰОС ардагерлері", ru: "Ветераны Великой Отечественной войны ВКО", en: "WWII veterans of the East Kazakhstan Region" }, href: "http://veteran-vko.kz/ru/" },
  { title: { kz: "eGov — электрондық үкімет порталы", ru: "eGov — портал электронного правительства", en: "eGov — e-government portal" }, href: "https://egov.kz" },
  { title: { kz: "Архивтік анықтамаларға апостиль қою — eGov", ru: "Апостиль на архивных справках — eGov", en: "Apostille on archival certificates — eGov" }, href: "https://egov.kz/cms/ru/services/apostil/e_059" },
  { title: { kz: "«Әділет» — нормативтік құқықтық актілер", ru: "«Әділет» — нормативные правовые акты", en: "Adilet — legal acts database" }, href: "https://adilet.zan.kz" },
  {
    title: { kz: "Латын әліпбиіне көшіру конвертері (qazlatyn.kz)", ru: "Конвертер текста на латиницу (qazlatyn.kz)", en: "Kazakh Latin script converter (qazlatyn.kz)" },
    href: "https://www.qazlatyn.kz/converter/text",
    note: { kz: "Сыртқы құрал, архив сайтының бөлігі емес", ru: "Внешний инструмент, не часть сайта архива", en: "External tool, not part of the archive website" },
  },
  { title: { kz: "Өскемендегі ауа райы (Gismeteo)", ru: "Погода в Усть-Каменогорске (Gismeteo)", en: "Weather in Ust-Kamenogorsk (Gismeteo)" }, href: "https://www.gismeteo.ru/weather-ust-kamenogorsk-5201/" },
];
