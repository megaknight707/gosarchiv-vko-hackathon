// Демо-фонды. Названия — реальные фондообразователи из «Характеристики фондов»
// (docs/real-archive-data.md). НОМЕРА фондов, даты и состав — демонстрационные (isDemo = true).
import type { BranchSlug, CategorySlug } from "./reference";

export type DemoFund = {
  key: string;
  number: string;
  titleKz: string;
  titleRu: string;
  titleEn: string;
  category: CategorySlug;
  branch: BranchSlug;
  dateFrom: number;
  dateTo: number;
  isPersonal?: boolean;
  /** Для личных фондов — сведения о фондообразователе (только из источника) */
  aboutKz?: string;
  aboutRu?: string;
  aboutEn?: string;
};

export const funds: DemoFund[] = [
  { key: "revkom", number: "1", titleKz: "Өскемен уездік революциялық комитеті", titleRu: "Усть-Каменогорский уездный революционный комитет", titleEn: "Ust-Kamenogorsk Uyezd Revolutionary Committee", category: "government", branch: "central", dateFrom: 1919, dateTo: 1922 },
  { key: "oblispolkom", number: "Р-12", titleKz: "Шығыс Қазақстан облыстық Кеңесінің атқару комитеті", titleRu: "Исполнительный комитет Восточно-Казахстанского областного Совета", titleEn: "Executive Committee of the East Kazakhstan Regional Council", category: "government", branch: "central", dateFrom: 1932, dateTo: 2001 },
  { key: "ust-titan", number: "1520", titleKz: "Өскемен титан-магний комбинаты", titleRu: "Усть-Каменогорский титано-магниевый комбинат", titleEn: "Ust-Kamenogorsk Titanium and Magnesium Plant", category: "industry", branch: "central", dateFrom: 1960, dateTo: 1995 },
  { key: "lead-zinc", number: "1188", titleKz: "Өскемен қорғасын-мырыш комбинаты", titleRu: "Усть-Каменогорский свинцово-цинковый комбинат", titleEn: "Ust-Kamenogorsk Lead and Zinc Plant", category: "industry", branch: "central", dateFrom: 1947, dateTo: 1997 },
  { key: "irtysh-polymetal", number: "1043", titleKz: "Ертіс полиметалл комбинаты", titleRu: "Иртышский полиметаллический комбинат", titleEn: "Irtysh Polymetallic Plant", category: "industry", branch: "central", dateFrom: 1950, dateTo: 1996 },
  { key: "machine", number: "1612", titleKz: "Өскемен машина жасау зауыты", titleRu: "Усть-Каменогорский машиностроительный завод", titleEn: "Ust-Kamenogorsk Machine-Building Plant", category: "industry", branch: "central", dateFrom: 1958, dateTo: 1998 },
  { key: "silk", number: "1705", titleKz: "Өскемен жібек маталар комбинаты", titleRu: "Усть-Каменогорский комбинат шёлковых тканей", titleEn: "Ust-Kamenogorsk Silk Fabrics Mill", category: "light-food-industry", branch: "central", dateFrom: 1963, dateTo: 1999 },
  { key: "rassvet", number: "1733", titleKz: "«Рассвет» фабрикасы", titleRu: "Фабрика «Рассвет»", titleEn: "Rassvet Factory", category: "light-food-industry", branch: "central", dateFrom: 1960, dateTo: 1998 },
  { key: "ukges", number: "1350", titleKz: "Өскемен су электр станциясы", titleRu: "Усть-Каменогорская ГЭС", titleEn: "Ust-Kamenogorsk Hydroelectric Power Station", category: "energy", branch: "central", dateFrom: 1948, dateTo: 2000 },
  { key: "irtyshgesstroy", number: "1302", titleKz: "«Иртышгэсстрой» тресі", titleRu: "Трест «Иртышгэсстрой»", titleEn: "Irtyshgesstroy Construction Trust", category: "energy", branch: "central", dateFrom: 1949, dateTo: 1985 },
  { key: "altaisvinetsstroy", number: "1260", titleKz: "«Алтайсвинецстрой» тресі", titleRu: "Трест «Алтайсвинецстрой»", titleEn: "Altaisvinetsstroy Construction Trust", category: "construction", branch: "central", dateFrom: 1946, dateTo: 1990 },
  { key: "geology", number: "1415", titleKz: "Шығыс Қазақстан геология басқармасы", titleRu: "Восточно-Казахстанское геологическое управление", titleEn: "East Kazakhstan Geological Administration", category: "geology", branch: "central", dateFrom: 1950, dateTo: 1996 },
  { key: "education", number: "Р-310", titleKz: "Облыстық халыққа білім беру бөлімі", titleRu: "Областной отдел народного образования", titleEn: "Regional Department of Public Education", category: "social", branch: "central", dateFrom: 1932, dateTo: 2010 },
  { key: "culture", number: "Р-415", titleKz: "Облыстық мәдениет басқармасы", titleRu: "Областное управление культуры", titleEn: "Regional Department of Culture", category: "social", branch: "central", dateFrom: 1953, dateTo: 2010 },
  {
    key: "volkov", number: "2001", titleKz: "А. М. Волковтың жеке қоры", titleRu: "Личный фонд А. М. Волкова", titleEn: "Personal fonds of A. M. Volkov", category: "personal", branch: "central", dateFrom: 1920, dateTo: 1977, isPersonal: true,
    aboutKz: "А. М. Волков — жазушы, ғалым, педагог.", aboutRu: "А. М. Волков — писатель, учёный, педагог.", aboutEn: "A. M. Volkov was a writer, scholar and teacher.",
  },
  {
    key: "amanzholov", number: "2014", titleKz: "С. А. Аманжоловтың жеке қоры", titleRu: "Личный фонд С. А. Аманжолова", titleEn: "Personal fonds of S. A. Amanzholov", category: "personal", branch: "central", dateFrom: 1930, dateTo: 1958, isPersonal: true,
    aboutKz: "С. А. Аманжолов — филология ғылымдарының докторы, түрколог-тілші, ҚР ҒА корреспондент-мүшесі.", aboutRu: "С. А. Аманжолов — доктор филологических наук, языковед-тюрколог, член-корреспондент АН РК.", aboutEn: "S. A. Amanzholov was a Doctor of Philology, a Turkologist linguist and a corresponding member of the Academy of Sciences of Kazakhstan.",
  },
  {
    key: "bokeev", number: "2027", titleKz: "О. Бөкейдің жеке қоры", titleRu: "Личный фонд О. Бокеева", titleEn: "Personal fonds of O. Bokeyev", category: "personal", branch: "central", dateFrom: 1960, dateTo: 1993, isPersonal: true,
    aboutKz: "О. Бөкей — жазушы-драматург, ҚР Мемлекеттік сыйлығының лауреаты.", aboutRu: "О. Бокеев — писатель-драматург, лауреат Государственной премии РК.", aboutEn: "O. Bokeyev was a writer and playwright, laureate of the State Prize of Kazakhstan.",
  },
  {
    key: "chernykh", number: "2033", titleKz: "С. Е. Черныхтың жеке қоры", titleRu: "Личный фонд С. Е. Черных", titleEn: "Personal fonds of S. E. Chernykh", category: "personal", branch: "central", dateFrom: 1940, dateTo: 1985, isPersonal: true,
    aboutKz: "С. Е. Черных — жазушы, өлкетанушы, КСРО архив ісінің үздігі.", aboutRu: "С. Е. Черных — писатель, краевед, отличник архивного дела СССР.", aboutEn: "S. E. Chernykh was a writer, local historian and an honoured archivist of the USSR.",
  },
  {
    key: "petrovsky", number: "2041", titleKz: "Н. А. Петровскийдің жеке қоры", titleRu: "Личный фонд Н. А. Петровского", titleEn: "Personal fonds of N. A. Petrovsky", category: "personal", branch: "central", dateFrom: 1945, dateTo: 1980, isPersonal: true,
    aboutKz: "Н. А. Петровский — ономаст-ғалым, «Орыс жеке есімдерінің сөздігі» еңбегінің авторы.", aboutRu: "Н. А. Петровский — учёный-ономаст, автор «Словаря русских личных имён».", aboutEn: "N. A. Petrovsky was an onomastics scholar, author of the Dictionary of Russian Personal Names.",
  },
];

export type FundKey = (typeof funds)[number]["key"];
