// Филиалы и центральное здание архива — РЕАЛЬНЫЕ данные (docs/real-archive-data.md).
// Источник: файлы архива от 10.11.2026 («Контакты.docx», «Адреса и контакты филиалов.xls»).
// Чего нет в источнике (режим работы филиалов) — «TODO…», интерфейс покажет «Уточняется».
// Координаты — по адресам через OpenStreetMap: если найдено не здание, а улица или
// населённый пункт — coordinatesApproximate = true (на карте пометка «приблизительно»).

const TODO = "TODO: уточнить";

type L3 = [kz: string, ru: string, en: string];

type BranchInput = {
  slug: string;
  type: "MAIN" | "BRANCH" | "PERSONNEL";
  name: L3;
  city: L3;
  address: L3;
  phone: string | null;
  email: string | null;
  headName: string | null;
  lat: number;
  lng: number;
  approximate: boolean;
  workHours?: L3;
  readingRoomHours?: L3;
  description?: L3;
  fundsInfo?: L3;
  sortOrder: number;
};

function branch(b: BranchInput) {
  const [hKz, hRu, hEn] = b.workHours ?? [TODO, TODO, TODO];
  return {
    slug: b.slug,
    type: b.type,
    nameKz: b.name[0],
    nameRu: b.name[1],
    nameEn: b.name[2],
    cityKz: b.city[0],
    cityRu: b.city[1],
    cityEn: b.city[2],
    addressKz: b.address[0],
    addressRu: b.address[1],
    addressEn: b.address[2],
    phone: b.phone,
    email: b.email,
    headName: b.headName,
    workHoursKz: hKz,
    workHoursRu: hRu,
    workHoursEn: hEn,
    readingRoomHoursKz: b.readingRoomHours?.[0] ?? null,
    readingRoomHoursRu: b.readingRoomHours?.[1] ?? null,
    readingRoomHoursEn: b.readingRoomHours?.[2] ?? null,
    descriptionKz: b.description?.[0] ?? null,
    descriptionRu: b.description?.[1] ?? null,
    descriptionEn: b.description?.[2] ?? null,
    servedAreaKz: null,
    servedAreaRu: null,
    servedAreaEn: null,
    fundsInfoKz: b.fundsInfo?.[0] ?? null,
    fundsInfoRu: b.fundsInfo?.[1] ?? null,
    fundsInfoEn: b.fundsInfo?.[2] ?? null,
    latitude: b.lat,
    longitude: b.lng,
    coordinatesApproximate: b.approximate,
    isMain: b.type === "MAIN",
    isVisibleOnMap: true,
    sortOrder: b.sortOrder,
  };
}

const UKG: L3 = ["Өскемен", "Усть-Каменогорск", "Ust-Kamenogorsk"];

export const branches = [
  branch({
    slug: "central",
    type: "MAIN",
    sortOrder: 1,
    name: [
      "Шығыс Қазақстан облысының мемлекеттік архиві (орталық ғимарат)",
      "Государственный архив Восточно-Казахстанской области (центральное здание)",
      "State Archive of East Kazakhstan Region (main building)",
    ],
    city: UKG,
    address: [
      "Қазақстан Республикасы, 070000, Өскемен қ., Бейбітшілік к-сі, 26/1 (бұрынғы Головков к-сі)",
      "Республика Казахстан, 070000, г. Усть-Каменогорск, ул. Бейбітшілік, 26/1 (бывш. ул. Головкова)",
      "26/1 Beibitshilik St (formerly Golovkov St), Ust-Kamenogorsk, 070000, Republic of Kazakhstan",
    ],
    phone: "8 (7232) 25-59-76",
    email: "arhiv-ukg@yandex.kz",
    headName: "Жапаров Аскар Кенжебаевич",
    workHours: ["Дүйсенбі–жұма 8:00–17:00", "Понедельник–пятница 8:00–17:00", "Monday–Friday 8:00–17:00"],
    readingRoomHours: ["Дүйсенбі–жұма 9:00–16:00", "Понедельник–пятница 9:00–16:00", "Monday–Friday 9:00–16:00"],
    description: [
      "Мемлекеттік архив 1940 жылы құрылған. 2020 жылдан бастап Шығыс Қазақстан облысының цифрландыру және архивтер басқармасына бағынады.",
      "Государственный архив образован в 1940 году. С 2020 года находится в подчинении Управления цифровизации и архивов Восточно-Казахстанской области.",
      "The State Archive was established in 1940. Since 2020 it has reported to the Department of Digitalization and Archives of East Kazakhstan Region.",
    ],
    fundsInfo: [
      "1 005 қор, 610 492 сақтау бірлігі (01.01.2020 жағдай бойынша), оның ішінде 76 жеке текті қор.",
      "1 005 фондов, 610 492 единицы хранения (на 01.01.2020), в том числе 76 фондов личного происхождения.",
      "1,005 fonds, 610,492 storage units (as of 01.01.2020), including 76 personal fonds.",
    ],
    lat: 49.94546,
    lng: 82.62206,
    approximate: false,
  }),
  branch({
    slug: "ust-kamenogorsk-personnel",
    type: "PERSONNEL",
    sortOrder: 2,
    name: ["Жеке құрам бойынша Өскемен қалалық филиалы", "Усть-Каменогорский городской филиал по личному составу", "Ust-Kamenogorsk City Branch for Personnel Records"],
    city: UKG,
    address: ["Өскемен қ., Потанин к-сі, 12/2", "г. Усть-Каменогорск, ул. Потанина, 12/2", "12/2 Potanin St, Ust-Kamenogorsk"],
    phone: "8 (7232) 76-65-60",
    email: "g.bisenova@akimvko.gov.kz",
    headName: "Бисенова Гулсим Алдабергеновна",
    description: [
      "2013 жылы әлеуметтік-құқықтық сипаттағы сұрау салуларды орындау бөлімі негізінде құрылған.",
      "Образован в 2013 году на базе отдела по исполнению запросов социально-правового характера.",
      "Established in 2013 on the basis of the department handling social and legal inquiries.",
    ],
    lat: 49.9589,
    lng: 82.59822,
    approximate: false,
  }),
  branch({
    slug: "altai",
    type: "BRANCH",
    sortOrder: 3,
    name: ["Алтай ауданының филиалы", "Филиал района Алтай", "Altai District Branch"],
    city: ["Алтай", "Алтай", "Altai"],
    address: ["Алтай ауданы, Алтай қ., М. Горький к-сі, 33", "район Алтай, г. Алтай, ул. М. Горького, 33", "33 M. Gorky St, Altai, Altai District"],
    phone: "8 (72335) 4-16-30",
    email: "sa.seilkhanov@akimvko.gov.kz",
    headName: "Сейлханов Сабырбек Какенович",
    description: [
      "Бұрынғы Зыряновск филиалы (1963 жылы шілдеде құрылған). 2019 жылғы 11 ақпанда Алтай филиалы болып қайта аталды.",
      "Бывший Зыряновский филиал (образован в июле 1963 года). Переименован в филиал Алтай 11.02.2019.",
      "Formerly the Zyryanovsk branch (founded in July 1963). Renamed the Altai branch on 11 February 2019.",
    ],
    lat: 49.72779,
    lng: 84.26197,
    approximate: false,
  }),
  branch({
    slug: "glubokoe",
    type: "BRANCH",
    sortOrder: 4,
    name: ["Глубокое аудандық филиалы", "Глубоковский районный филиал", "Glubokoye District Branch"],
    city: ["Глубокое", "Глубокое", "Glubokoye"],
    address: ["Глубокое ауданы, Глубокое к., Пирогов к-сі, 6", "Глубоковский район, п. Глубокое, ул. Пирогова, 6", "6 Pirogov St, Glubokoye, Glubokoye District"],
    phone: "8 (72331) 2-28-78",
    email: "b.toleu@akimvko.gov.kz",
    headName: "Төлеу Бақдәулет Ибрахымұлы",
    lat: 50.14618,
    lng: 82.31497,
    approximate: true,
  }),
  branch({
    slug: "zaisan",
    type: "BRANCH",
    sortOrder: 5,
    name: ["Зайсан аудандық филиалы", "Зайсанский районный филиал", "Zaisan District Branch"],
    city: ["Зайсан", "Зайсан", "Zaisan"],
    address: ["Зайсан ауданы, Зайсан қ., Д. А. Қонаев к-сі, 52", "Зайсанский район, г. Зайсан, ул. Д. А. Конаева, 52", "52 D. A. Kunayev St, Zaisan, Zaisan District"],
    phone: "8 (72340) 2-14-76",
    email: "v.kozlov@akimvko.gov.kz",
    headName: "Козлов Виктор Николаевич",
    description: [
      "Филиал 1963 жылы (мамырда) құрылған, 2013 жылы қайта құрылған.",
      "Филиал образован в 1963 году (май), вновь создан в 2013 году.",
      "The branch was founded in 1963 (May) and re-established in 2013.",
    ],
    lat: 47.4667,
    lng: 84.8667,
    approximate: true,
  }),
  branch({
    slug: "katon-karagai",
    type: "BRANCH",
    sortOrder: 6,
    name: ["Катонқарағай аудандық филиалы", "Катон-Карагайский районный филиал", "Katon-Karagai District Branch"],
    city: ["Катонқарағай", "Катон-Карагай", "Katon-Karagai"],
    address: [
      "Катонқарағай ауданы, Катонқарағай а., Жампейісов к-сі, 19/1",
      "Катон-Карагайский район, с. Катон-Карагай, ул. Жампеисова, 19/1",
      "19/1 Zhampeisov St, Katon-Karagai, Katon-Karagai District",
    ],
    phone: "8 (72342) 2-90-07",
    email: "a.ziasheva1@akimvko.gov.kz",
    headName: "Зияшева Асель Тлеухановна",
    lat: 49.1776,
    lng: 85.60638,
    approximate: true,
  }),
  branch({
    slug: "kurchum",
    type: "BRANCH",
    sortOrder: 7,
    name: ["Күршім аудандық филиалы", "Курчумский районный филиал", "Kurchum District Branch"],
    city: ["Күршім", "Курчум", "Kurchum"],
    address: ["Күршім ауданы, Күршім а., Барақ батыр к-сі, 25", "Курчумский район, с. Курчум, ул. Барак Батыра, 25", "25 Barak Batyr St, Kurchum, Kurchum District"],
    phone: "8 (72339) 3-31-04",
    email: "kabdualieva.s@akimvko.gov.kz",
    headName: "Кабдуалиева Сандугаш Алтаевна",
    lat: 48.57118,
    lng: 83.66241,
    approximate: true,
  }),
  branch({
    slug: "markakol",
    type: "BRANCH",
    sortOrder: 8,
    name: ["Марқакөл ауданының филиалы", "Филиал района Марқакөл", "Markakol District Branch"],
    city: ["Марқакөл", "Маркаколь", "Markakol"],
    address: ["Марқакөл ауданы, Марқакөл а., Крахмаль к-сі, 67", "район Марқакөл, с. Маркаколь, ул. Крахмаля, 67", "67 Krakhmal St, Markakol, Markakol District"],
    phone: null,
    email: "s.smagulov1@akimvko.gov.kz",
    headName: "Смагулов Самат Нурлыбекович",
    lat: 48.42691,
    lng: 85.73384,
    approximate: true,
  }),
  branch({
    slug: "ridder",
    type: "BRANCH",
    sortOrder: 9,
    name: ["Риддер қалалық филиалы", "Риддерский городской филиал", "Ridder City Branch"],
    city: ["Риддер", "Риддер", "Ridder"],
    address: ["Риддер қ., Ш. Уәлиханов к-сі, 44", "г. Риддер, ул. Ч. Уалиханова, 44", "44 Ch. Ualikhanov St, Ridder"],
    phone: "8 (72336) 4-22-64",
    email: "sh.sarsembinova@akimvko.gov.kz",
    headName: "Сарсембинова Шынар Жасулановна",
    description: [
      "Бұрынғы Лениногорск филиалы. 1966 жылы құрылған, 2013 жылы қайта құрылған.",
      "Бывший Лениногорский филиал. Создан в 1966 году, вновь создан в 2013 году.",
      "Formerly the Leninogorsk branch. Founded in 1966 and re-established in 2013.",
    ],
    lat: 50.35327,
    lng: 83.52073,
    approximate: true,
  }),
  branch({
    slug: "samar",
    type: "BRANCH",
    sortOrder: 10,
    name: ["Самар ауданының филиалы", "Филиал района Самар", "Samar District Branch"],
    city: ["Самар", "Самар", "Samar"],
    address: ["Самар ауданы, Самар а., Горохов к-сі, 58", "район Самар, с. Самар, ул. Горохова, 58", "58 Gorokhov St, Samar, Samar District"],
    phone: "8 (72333) 3-10-32",
    email: "a.babataev@akimvko.gov.kz",
    headName: "Бабатаев Айдар Шамилевич",
    lat: 49.0203,
    lng: 83.35954,
    approximate: false,
  }),
  branch({
    slug: "tarbagatai",
    type: "BRANCH",
    sortOrder: 11,
    name: ["Тарбағатай аудандық филиалы", "Тарбагатайский районный филиал", "Tarbagatai District Branch"],
    city: ["Ақжар", "Акжар", "Akzhar"],
    address: ["Тарбағатай ауданы, Ақжар а., Дәулетбай к-сі, 45", "Тарбагатайский район, с. Акжар, ул. Даулетбая, 45", "45 Dauletbai St, Akzhar, Tarbagatai District"],
    phone: "8 (72344) 2-14-68",
    email: "b.zhurekbaev@akimvko.gov.kz",
    headName: "Журекбаев Бауыржан Сеитказинович",
    lat: 47.57899,
    lng: 83.6755,
    approximate: true,
  }),
  branch({
    slug: "ulan",
    type: "BRANCH",
    sortOrder: 12,
    name: ["Ұлан аудандық филиалы", "Уланский районный филиал", "Ulan District Branch"],
    city: ["Қасым Қайсенов", "Касыма Кайсенова", "Kasym Kaisenov"],
    address: [
      "Ұлан ауданы, Қасым Қайсенов к., З. Ахметов к-сі, 5, 5-үй-жай",
      "Уланский район, пос. Касыма Кайсенова, ул. З. Ахметова, 5, н. п. 5",
      "5 Z. Akhmetov St, premises 5, Kasym Kaisenov, Ulan District",
    ],
    phone: "8 (72338) 2-71-20",
    email: "a.abdrasulin@akimvko.gov.kz",
    headName: "Абдрасулин Аслан Оралович",
    lat: 49.87521,
    lng: 82.48588,
    approximate: false,
  }),
  branch({
    slug: "ulken-naryn",
    type: "BRANCH",
    sortOrder: 13,
    name: ["Үлкен Нарын ауданының филиалы", "Филиал района Үлкен Нарын", "Ulken Naryn District Branch"],
    city: ["Үлкен Нарын", "Улкен Нарын", "Ulken Naryn"],
    address: ["Үлкен Нарын ауданы, Үлкен Нарын а., Огнев к-сі, 40", "район Үлкен Нарын, с. Улкен Нарын, ул. Огнева, 40", "40 Ognev St, Ulken Naryn, Ulken Naryn District"],
    phone: "8 (72341) 2-15-99",
    email: "ba.ozhenov@akimvko.gov.kz",
    headName: "Оженов Бауржан Файзоллинович",
    lat: 49.21794,
    lng: 84.50954,
    approximate: true,
  }),
  branch({
    slug: "shemonaikha",
    type: "BRANCH",
    sortOrder: 14,
    name: ["Шемонаиха аудандық филиалы", "Шемонаихинский районный филиал", "Shemonaikha District Branch"],
    city: ["Шемонаиха", "Шемонаиха", "Shemonaikha"],
    address: [
      "Шемонаиха ауданы, Шемонаиха қ., Жуков к-сі, 2-ғимарат, 4-үй-жай",
      "Шемонаихинский район, г. Шемонаиха, ул. Жукова, здание 2, н. п. 4",
      "Building 2, premises 4, Zhukov St, Shemonaikha, Shemonaikha District",
    ],
    phone: "8 (72332) 6-23-58",
    email: "n.kusataev@akimvko.gov.kz",
    headName: "Кусатаев Нуржан Тельманович",
    lat: 50.62713,
    lng: 81.93678,
    approximate: false,
  }),
];
