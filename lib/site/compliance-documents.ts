// Официальные документы антикоррупционной комплаенс-службы архива (PDF, предоставлены архивом).
// Файлы лежат в public/documents/compliance/ и отдаются как статические.
// Каждый документ есть на казахском и русском языках; английской версии нет.
import type { Locale } from "@/i18n/routing";

type Localized = { kz: string; ru: string; en: string };

type ComplianceDocument = {
  key: string;
  title: Localized;
  files: { lang: "kz" | "ru"; href: string; sizeBytes: number }[];
};

export const COMPLIANCE_OFFICER = "Ешенгельдиев Тырек Молболович";

const DIR = "/documents/compliance";

export const complianceDocuments: ComplianceDocument[] = [
  {
    key: "regulation",
    title: {
      kz: "Сыбайлас жемқорлыққа қарсы комплаенс қызметі туралы ереже",
      ru: "Положение об антикоррупционной комплаенс-службе",
      en: "Regulation on the anti-corruption compliance service",
    },
    files: [
      { lang: "kz", href: `${DIR}/polozhenie-kz.pdf`, sizeBytes: 1_597_580 },
      { lang: "ru", href: `${DIR}/polozhenie-ru.pdf`, sizeBytes: 5_536_588 },
    ],
  },
  {
    key: "analysis",
    title: {
      kz: "Сыбайлас жемқорлық тәуекелдеріне ішкі талдау бойынша талдау анықтамасы (2026)",
      ru: "Аналитическая справка по итогам внутреннего анализа коррупционных рисков (2026)",
      en: "Analytical report on the internal analysis of corruption risks (2026)",
    },
    files: [
      { lang: "kz", href: `${DIR}/analiticheskaya-spravka-2026-kz.pdf`, sizeBytes: 13_888_667 },
      { lang: "ru", href: `${DIR}/analiticheskaya-spravka-2026-ru.pdf`, sizeBytes: 10_695_055 },
    ],
  },
  {
    key: "positions",
    title: {
      kz: "Сыбайлас жемқорлық тәуекелдеріне бейім лауазымдардың тізбесі",
      ru: "Перечень должностей, подверженных коррупционным рискам",
      en: "List of positions exposed to corruption risks",
    },
    files: [
      { lang: "kz", href: `${DIR}/perechen-dolzhnostey-kz.pdf`, sizeBytes: 247_132 },
      { lang: "ru", href: `${DIR}/perechen-dolzhnostey-ru.pdf`, sizeBytes: 243_773 },
    ],
  },
  {
    key: "plan",
    title: {
      kz: "Сыбайлас жемқорлық құқық бұзушылықтарға ықпал ететін себептер мен жағдайларды жою жөніндегі іс-шаралар жоспары",
      ru: "План мероприятий по устранению причин и условий, способствующих совершению коррупционных правонарушений",
      en: "Action plan to eliminate the causes and conditions of corruption offences",
    },
    files: [
      { lang: "kz", href: `${DIR}/plan-meropriyatiy-kz.pdf`, sizeBytes: 1_985_135 },
      { lang: "ru", href: `${DIR}/plan-meropriyatiy-ru.pdf`, sizeBytes: 1_920_838 },
    ],
  },
];

export function listComplianceDocuments(locale: Locale) {
  return complianceDocuments.map((doc) => ({
    key: doc.key,
    title: doc.title[locale],
    // Сначала — файл на языке интерфейса (для EN — русский)
    files: [...doc.files].sort((a, b) => Number(b.lang === (locale === "kz" ? "kz" : "ru")) - Number(a.lang === (locale === "kz" ? "kz" : "ru"))),
  }));
}
