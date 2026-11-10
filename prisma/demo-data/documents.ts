// Демонстрационные документы каталога (isDemo = true).
// Названия фондов реальные, а сами записи, шифры и описания — демо.
// Главный сценарий защиты: «фотографии Усть-Каменогорска в 1960-х» → первые 34 записи.

export type DemoDocType = "PHOTO" | "TEXT" | "MAP_DRAWING" | "AUDIO_VIDEO" | "PERSONAL" | "ORGANIZATION" | "HISTORICAL";
export type DemoAccess = "OPEN" | "DESCRIPTION_ONLY" | "RESTRICTED";

export type DemoDocument = {
  /** Ключ документа: doc-001 … — им же названы папки демо-сканов */
  key: string;
  fund: string;
  type: DemoDocType;
  place: string;
  year: number;
  access: DemoAccess;
  titleRu: string;
  titleKz: string;
  titleEn: string;
  tags: string[];
  author?: string;
  language?: string;
  featured?: boolean;
};

type Row = [
  fund: string,
  type: DemoDocType,
  place: string,
  year: number,
  access: DemoAccess,
  titleRu: string,
  titleKz: string,
  titleEn: string,
  tags: string[],
  extra?: Partial<Pick<DemoDocument, "author" | "language" | "featured">>,
];

const UKG = "ust-kamenogorsk";

const rows: Row[] = [
  // ─── Фотографии Усть-Каменогорска 1960-х (34) ───
  ["ukges", "PHOTO", UKG, 1961, "OPEN", "Вид на набережную Иртыша", "Ертіс жағалауының көрінісі", "View of the Irtysh embankment", ["city"]],
  ["oblispolkom", "PHOTO", UKG, 1962, "OPEN", "Праздничная демонстрация на центральной улице города", "Қаланың орталық көшесіндегі мерекелік шеру", "Festive parade on the city's main street", ["city"]],
  ["ust-titan", "PHOTO", UKG, 1965, "OPEN", "Плавильный цех титано-магниевого комбината", "Титан-магний комбинатының балқыту цехы", "Smelting shop of the titanium and magnesium plant", ["industry"], { featured: true }],
  ["lead-zinc", "PHOTO", UKG, 1963, "OPEN", "Рабочие свинцово-цинкового комбината у проходной", "Қорғасын-мырыш комбинатының жұмысшылары өткізу пунктінің жанында", "Lead and zinc plant workers at the entrance gate", ["industry"]],
  ["ukges", "PHOTO", UKG, 1964, "OPEN", "Плотина Усть-Каменогорской ГЭС", "Өскемен СЭС бөгеті", "Dam of the Ust-Kamenogorsk hydroelectric station", ["energy"], { featured: true }],
  ["altaisvinetsstroy", "PHOTO", UKG, 1966, "OPEN", "Строительство жилых домов в новом микрорайоне", "Жаңа шағын аудандағы тұрғын үйлердің құрылысы", "Construction of apartment blocks in a new residential district", ["construction", "city"]],
  ["oblispolkom", "PHOTO", UKG, 1967, "OPEN", "Первомайская демонстрация", "Бірінші мамыр шеруі", "May Day demonstration", ["city"]],
  ["education", "PHOTO", UKG, 1968, "OPEN", "Выпускники средней школы", "Орта мектеп түлектері", "Secondary school graduates", ["education"]],
  ["education", "PHOTO", UKG, 1964, "OPEN", "Студенты педагогического института на субботнике", "Педагогикалық институт студенттері сенбілікте", "Teacher training institute students at a volunteer clean-up", ["education"]],
  ["oblispolkom", "PHOTO", UKG, 1962, "OPEN", "Городской рынок", "Қалалық базар", "City market", ["city"]],
  ["irtyshgesstroy", "PHOTO", UKG, 1961, "OPEN", "Речная пристань на Иртыше", "Ертістегі өзен айлағы", "River pier on the Irtysh", ["city"]],
  ["irtyshgesstroy", "PHOTO", UKG, 1965, "OPEN", "Мост через Ульбу", "Үлбі өзені арқылы өтетін көпір", "Bridge over the Ulba River", ["construction", "city"]],
  ["silk", "PHOTO", UKG, 1966, "OPEN", "Ткацкий цех комбината шёлковых тканей", "Жібек маталар комбинатының тоқыма цехы", "Weaving shop of the silk fabrics mill", ["industry"]],
  ["rassvet", "PHOTO", UKG, 1967, "OPEN", "Швейный цех фабрики «Рассвет»", "«Рассвет» фабрикасының тігін цехы", "Sewing shop of the Rassvet factory", ["industry"]],
  ["machine", "PHOTO", UKG, 1968, "OPEN", "Сборочный цех машиностроительного завода", "Машина жасау зауытының құрастыру цехы", "Assembly shop of the machine-building plant", ["industry"]],
  ["culture", "PHOTO", UKG, 1963, "OPEN", "Городской парк культуры и отдыха", "Қалалық мәдениет және демалыс саябағы", "City park of culture and recreation", ["culture", "city"]],
  ["culture", "PHOTO", UKG, 1964, "OPEN", "Афиша спектакля драматического театра", "Драма театры спектаклінің афишасы", "Drama theatre performance poster", ["culture"]],
  ["education", "PHOTO", UKG, 1965, "OPEN", "Воспитанники детского сада на прогулке", "Балабақша тәрбиеленушілері серуенде", "Kindergarten children on a walk", ["education"]],
  ["oblispolkom", "PHOTO", UKG, 1966, "DESCRIPTION_ONLY", "Здание городской больницы", "Қалалық аурухана ғимараты", "City hospital building", ["city"]],
  ["oblispolkom", "PHOTO", UKG, 1962, "OPEN", "Трамвай на городской улице", "Қала көшесіндегі трамвай", "Tram on a city street", ["city"]],
  ["oblispolkom", "PHOTO", UKG, 1965, "OPEN", "Встреча ветеранов Великой Отечественной войны", "Ұлы Отан соғысы ардагерлерінің кездесуі", "Meeting of Great Patriotic War veterans", ["war"]],
  ["culture", "PHOTO", UKG, 1967, "OPEN", "Спортивный праздник на городском стадионе", "Қалалық стадиондағы спорт мерекесі", "Sports festival at the city stadium", ["sport"]],
  ["culture", "PHOTO", UKG, 1968, "OPEN", "Лыжные соревнования", "Шаңғы жарысы", "Ski competition", ["sport"]],
  ["machine", "PHOTO", UKG, 1963, "OPEN", "Новый корпус конденсаторного производства", "Конденсатор өндірісінің жаңа корпусы", "New building of the capacitor production", ["industry"]],
  ["oblispolkom", "PHOTO", UKG, 1964, "DESCRIPTION_ONLY", "Заседание городского исполнительного комитета", "Қалалық атқару комитетінің отырысы", "Session of the city executive committee", ["governance"]],
  ["lead-zinc", "PHOTO", UKG, 1969, "OPEN", "Бригада передовиков производства", "Өндіріс озаттарының бригадасы", "Team of leading production workers", ["industry"]],
  ["ust-titan", "PHOTO", UKG, 1967, "OPEN", "Лаборатория комбината", "Комбинат зертханасы", "Plant laboratory", ["industry", "science"]],
  ["altaisvinetsstroy", "PHOTO", UKG, 1961, "OPEN", "Строители треста «Алтайсвинецстрой»", "«Алтайсвинецстрой» тресінің құрылысшылары", "Builders of the Altaisvinetsstroy trust", ["construction"]],
  ["ukges", "PHOTO", UKG, 1969, "OPEN", "Панорама города с левого берега Иртыша", "Ертістің сол жағалауынан қала панорамасы", "City panorama from the left bank of the Irtysh", ["city"]],
  ["culture", "PHOTO", UKG, 1968, "OPEN", "Новогодняя ёлка на центральной площади", "Орталық алаңдағы жаңажылдық шырша", "New Year tree on the central square", ["city", "culture"]],
  ["geology", "PHOTO", UKG, 1962, "OPEN", "Геологическая партия перед выездом в экспедицию", "Экспедицияға аттанар алдындағы геологиялық партия", "Geological party before leaving on an expedition", ["geology"]],
  ["culture", "PHOTO", UKG, 1967, "OPEN", "Читальный зал областной библиотеки", "Облыстық кітапхананың оқу залы", "Reading room of the regional library", ["culture"]],
  ["irtyshgesstroy", "PHOTO", UKG, 1966, "OPEN", "Монтаж оборудования на строительной площадке", "Құрылыс алаңында жабдықтарды монтаждау", "Equipment installation on a construction site", ["construction", "energy"]],
  ["education", "PHOTO", UKG, 1969, "OPEN", "Первое сентября: школьная линейка", "Бірінші қыркүйек: мектептегі салтанатты жиын", "First of September: school assembly", ["education"]],

  // ─── 1920-е — 1940-е ───
  ["revkom", "HISTORICAL", UKG, 1920, "OPEN", "Протокол заседания Усть-Каменогорского уездного ревкома", "Өскемен уездік ревкомы отырысының хаттамасы", "Minutes of the Ust-Kamenogorsk Uyezd Revolutionary Committee meeting", ["governance"]],
  ["revkom", "HISTORICAL", UKG, 1921, "OPEN", "Приказы уездного ревкома по хозяйственным вопросам", "Уездік ревкомның шаруашылық мәселелері жөніндегі бұйрықтары", "Uyezd revolutionary committee orders on economic matters", ["governance"]],
  ["revkom", "TEXT", UKG, 1922, "OPEN", "Переписка уездного исполкома с волостными комитетами", "Уездік атқару комитетінің болыстық комитеттермен хат алмасуы", "Correspondence of the uyezd executive committee with volost committees", ["governance"]],
  ["oblispolkom", "MAP_DRAWING", UKG, 1938, "OPEN", "План города Усть-Каменогорска", "Өскемен қаласының жоспары", "Plan of the city of Ust-Kamenogorsk", ["city"], { featured: true }],
  ["oblispolkom", "TEXT", UKG, 1941, "DESCRIPTION_ONLY", "Решения облисполкома о перестройке работы предприятий", "Кәсіпорындардың жұмысын қайта құру туралы облатком шешімдері", "Regional executive committee decisions on reorganising the work of enterprises", ["war"]],
  ["oblispolkom", "HISTORICAL", UKG, 1942, "OPEN", "Документы о размещении эвакуированных предприятий", "Эвакуацияланған кәсіпорындарды орналастыру туралы құжаттар", "Documents on accommodating evacuated enterprises", ["war", "industry"]],
  ["oblispolkom", "PHOTO", UKG, 1943, "OPEN", "Женщины у станков в годы войны", "Соғыс жылдарындағы станок басындағы әйелдер", "Women at machine tools during the war", ["war", "industry"]],
  ["oblispolkom", "TEXT", "zaisan", 1944, "OPEN", "Сведения о сборе средств в фонд обороны", "Қорғаныс қорына қаражат жинау туралы мәліметтер", "Records of fundraising for the defence fund", ["war"]],
  ["oblispolkom", "HISTORICAL", UKG, 1945, "OPEN", "Телеграмма о праздновании Победы", "Жеңісті тойлау туралы жеделхат", "Telegram on the Victory celebration", ["war"]],
  ["volkov", "PERSONAL", UKG, 1946, "OPEN", "Рукопись статьи по педагогике", "Педагогика бойынша мақаланың қолжазбасы", "Manuscript of an article on pedagogy", ["education", "culture"], { author: "А. М. Волков" }],

  // ─── 1950-е ───
  ["volkov", "PERSONAL", UKG, 1950, "DESCRIPTION_ONLY", "Письма коллегам", "Әріптестерге жазылған хаттар", "Letters to colleagues", ["culture"], { author: "А. М. Волков" }],
  ["ukges", "MAP_DRAWING", UKG, 1950, "RESTRICTED", "Чертёж водосливной плотины", "Су ағызатын бөгеттің сызбасы", "Drawing of the spillway dam", ["energy"]],
  ["irtysh-polymetal", "PHOTO", "glubokoe", 1952, "OPEN", "Рудник Иртышского полиметаллического комбината", "Ертіс полиметалл комбинатының кеніші", "Mine of the Irtysh Polymetallic Plant", ["industry"]],
  ["amanzholov", "PERSONAL", UKG, 1953, "OPEN", "Материалы по тюркскому языкознанию", "Түркі тіл білімі бойынша материалдар", "Materials on Turkic linguistics", ["science"], { author: "С. А. Аманжолов", language: "kk,ru" }],
  ["amanzholov", "PERSONAL", UKG, 1955, "OPEN", "Конспекты лекций", "Дәріс конспектілері", "Lecture notes", ["education", "science"], { author: "С. А. Аманжолов", language: "kk,ru" }],
  ["oblispolkom", "PHOTO", "shemonaikha", 1955, "OPEN", "Первая борозда на целинных землях", "Тың жердегі алғашқы атыз", "First furrow on the virgin lands", ["virgin-lands", "agriculture"], { featured: true }],
  ["oblispolkom", "TEXT", "shemonaikha", 1955, "OPEN", "Отчёт об освоении целинных и залежных земель", "Тың және тыңайған жерлерді игеру туралы есеп", "Report on the development of virgin and fallow lands", ["virgin-lands", "agriculture"]],
  ["oblispolkom", "PHOTO", "shemonaikha", 1956, "OPEN", "Полевой стан целинников", "Тыңгерлердің дала қосы", "Virgin lands workers' field camp", ["virgin-lands"]],
  ["oblispolkom", "MAP_DRAWING", "glubokoe", 1957, "OPEN", "Карта землеустройства колхоза", "Ұжымшардың жерге орналастыру картасы", "Land management map of a collective farm", ["agriculture"]],
  ["oblispolkom", "HISTORICAL", "kurchum", 1957, "OPEN", "Воспоминания участников партизанского движения", "Партизандық қозғалысқа қатысушылардың естеліктері", "Memoirs of partisan movement participants", ["partisans"]],
  ["irtysh-polymetal", "ORGANIZATION", "glubokoe", 1958, "OPEN", "Годовой отчёт комбината о производственной деятельности", "Комбинаттың өндірістік қызметі туралы жылдық есебі", "Annual report on the plant's production activities", ["industry"]],
  ["oblispolkom", "PHOTO", "ridder", 1958, "OPEN", "Горняки Лениногорска после смены", "Лениногорск кеншілері ауысымнан кейін", "Leninogorsk miners after a shift", ["industry"]],
  ["geology", "MAP_DRAWING", "altai", 1959, "OPEN", "Геологическая карта рудного района", "Кенді ауданның геологиялық картасы", "Geological map of an ore district", ["geology"]],

  // ─── 1960-е (тексты и др.) ───
  ["irtyshgesstroy", "ORGANIZATION", UKG, 1960, "OPEN", "Приказы по тресту «Иртышгэсстрой»", "«Иртышгэсстрой» тресі бойынша бұйрықтар", "Orders of the Irtyshgesstroy trust", ["construction"]],
  ["geology", "TEXT", "altai", 1961, "DESCRIPTION_ONLY", "Отчёт геологоразведочной экспедиции", "Геологиялық барлау экспедициясының есебі", "Report of a geological exploration expedition", ["geology"]],
  ["oblispolkom", "TEXT", "altai", 1963, "OPEN", "Документы об организации Зыряновского филиала архива", "Зыряновск архив филиалын ұйымдастыру туралы құжаттар", "Documents on establishing the Zyryanovsk archive branch", ["governance"]],
  ["oblispolkom", "TEXT", "zaisan", 1963, "OPEN", "Документы об организации Зайсанского филиала архива", "Зайсан архив филиалын ұйымдастыру туралы құжаттар", "Documents on establishing the Zaisan archive branch", ["governance"]],
  ["culture", "ORGANIZATION", UKG, 1965, "OPEN", "Отчёт о работе клубов и домов культуры", "Клубтар мен мәдениет үйлерінің жұмысы туралы есеп", "Report on the work of clubs and houses of culture", ["culture"]],
  ["oblispolkom", "TEXT", "ridder", 1966, "OPEN", "Решение об организации архивного филиала в Лениногорске", "Лениногорскіде архив филиалын ұйымдастыру туралы шешім", "Decision on establishing an archive branch in Leninogorsk", ["governance"]],
  ["petrovsky", "PERSONAL", UKG, 1966, "OPEN", "Картотека к «Словарю русских личных имён»", "«Орыс жеке есімдерінің сөздігіне» арналған картотека", "Card index for the Dictionary of Russian Personal Names", ["science"], { author: "Н. А. Петровский" }],
  ["ukges", "TEXT", UKG, 1968, "OPEN", "Технический отчёт о работе гидроагрегатов", "Гидроагрегаттардың жұмысы туралы техникалық есеп", "Technical report on the operation of hydro units", ["energy"]],
  ["chernykh", "PERSONAL", UKG, 1968, "OPEN", "Краеведческие очерки о Восточном Казахстане", "Шығыс Қазақстан туралы өлкетану очерктері", "Local history essays on East Kazakhstan", ["culture"], { author: "С. Е. Черных" }],

  // ─── 1970-е ───
  ["education", "TEXT", "ridder", 1970, "OPEN", "Отчёт о работе школ города", "Қала мектептерінің жұмысы туралы есеп", "Report on the work of the city's schools", ["education"]],
  ["petrovsky", "PERSONAL", UKG, 1970, "RESTRICTED", "Переписка с издательством", "Баспамен хат алмасу", "Correspondence with the publisher", ["science"], { author: "Н. А. Петровский" }],
  ["chernykh", "PERSONAL", UKG, 1972, "OPEN", "Записки о работе в архиве", "Архивтегі жұмыс туралы жазбалар", "Notes on work in the archive", ["culture"], { author: "С. Е. Черных" }],
  ["machine", "MAP_DRAWING", UKG, 1972, "RESTRICTED", "Генеральный план территории завода", "Зауыт аумағының бас жоспары", "General plan of the plant site", ["industry"]],
  ["irtyshgesstroy", "PHOTO", UKG, 1972, "OPEN", "Ветераны треста на юбилейном собрании", "Трест ардагерлері мерейтойлық жиналыста", "Trust veterans at an anniversary meeting", ["construction"]],
  ["ust-titan", "PHOTO", UKG, 1974, "OPEN", "Награждение передовиков производства", "Өндіріс озаттарын марапаттау", "Awarding leading production workers", ["industry"]],
  ["lead-zinc", "ORGANIZATION", UKG, 1975, "RESTRICTED", "Штатное расписание комбината", "Комбинаттың штаттық кестесі", "Staff schedule of the plant", ["industry"]],
  ["culture", "AUDIO_VIDEO", UKG, 1975, "OPEN", "Кинохроника: город на Иртыше", "Кинохроника: Ертіс жағасындағы қала", "Newsreel: the city on the Irtysh", ["city", "culture"]],
  ["oblispolkom", "PHOTO", "ridder", 1975, "OPEN", "Вид на город Лениногорск", "Лениногорск қаласының көрінісі", "View of the town of Leninogorsk", ["city"]],
  ["oblispolkom", "PHOTO", "altai", 1977, "OPEN", "Улица Зыряновска", "Зыряновск көшесі", "A street in Zyryanovsk", ["city"]],
  ["bokeev", "PERSONAL", "katon-karagai", 1978, "OPEN", "Рукопись пьесы", "Пьесаның қолжазбасы", "Manuscript of a play", ["culture"], { author: "О. Бокеев", language: "kk" }],
  ["ust-titan", "TEXT", UKG, 1978, "OPEN", "Рационализаторские предложения работников комбината", "Комбинат қызметкерлерінің рационализаторлық ұсыныстары", "Workers' innovation proposals at the plant", ["industry", "science"]],
  ["oblispolkom", "PHOTO", "zaisan", 1979, "OPEN", "Чабаны на летнем пастбище", "Жайлаудағы шопандар", "Shepherds on a summer pasture", ["agriculture"]],

  // ─── 1980-е — 2010 ───
  ["silk", "ORGANIZATION", UKG, 1980, "OPEN", "Отчёт о выпуске продукции комбината", "Комбинаттың өнім шығаруы туралы есеп", "Report on the mill's production output", ["industry"]],
  ["rassvet", "PHOTO", UKG, 1982, "OPEN", "Показ моделей одежды фабрики", "Фабриканың киім үлгілерін көрсету", "Fashion show of the factory's clothing models", ["industry", "culture"]],
  ["oblispolkom", "PHOTO", "katon-karagai", 1984, "OPEN", "Пасека в Катон-Карагайском районе", "Катонқарағай ауданындағы омарта", "Apiary in Katon-Karagai district", ["agriculture"]],
  ["culture", "AUDIO_VIDEO", UKG, 1985, "DESCRIPTION_ONLY", "Фонограмма: воспоминания ветерана войны", "Фонограмма: соғыс ардагерінің естеліктері", "Sound recording: a war veteran's memories", ["war"]],
  ["bokeev", "PERSONAL", "katon-karagai", 1985, "DESCRIPTION_ONLY", "Фотографии писателя со встреч с читателями", "Жазушының оқырмандармен кездесулеріндегі фотосуреттер", "Photographs of the writer at meetings with readers", ["culture"], { author: "О. Бокеев" }],
  ["geology", "ORGANIZATION", UKG, 1985, "RESTRICTED", "Годовой отчёт геологического управления", "Геология басқармасының жылдық есебі", "Annual report of the geological administration", ["geology"]],
  ["oblispolkom", "PHOTO", "kurchum", 1988, "OPEN", "Сельская школа в Курчумском районе", "Күршім ауданындағы ауыл мектебі", "Rural school in Kurchum district", ["education"]],
  ["culture", "AUDIO_VIDEO", "ridder", 1990, "OPEN", "Видеозапись праздничного концерта", "Мерекелік концерттің бейнежазбасы", "Video recording of a festive concert", ["culture"]],
  ["oblispolkom", "ORGANIZATION", UKG, 1991, "OPEN", "Протоколы сессий областного Совета", "Облыстық Кеңес сессияларының хаттамалары", "Minutes of regional council sessions", ["governance"]],
  ["oblispolkom", "TEXT", UKG, 1995, "DESCRIPTION_ONLY", "Распоряжения областной администрации", "Облыс әкімшілігінің өкімдері", "Orders of the regional administration", ["governance"]],
  ["oblispolkom", "PHOTO", UKG, 2001, "OPEN", "Новый мост через Иртыш", "Ертіс арқылы өтетін жаңа көпір", "New bridge across the Irtysh", ["city", "construction"]],
  ["culture", "PHOTO", UKG, 2005, "OPEN", "Фестиваль национальных культур", "Ұлттық мәдениеттер фестивалі", "Festival of national cultures", ["culture"]],
  ["education", "PHOTO", UKG, 2010, "OPEN", "Студенты университета на научной конференции", "Университет студенттері ғылыми конференцияда", "University students at a research conference", ["education", "science"]],
];

export const documents: DemoDocument[] = rows.map(
  ([fund, type, place, year, access, titleRu, titleKz, titleEn, tags, extra], index) => ({
    key: `doc-${String(index + 1).padStart(3, "0")}`,
    fund,
    type,
    place,
    year,
    access,
    titleRu,
    titleKz,
    titleEn,
    tags,
    ...extra,
  }),
);

/** Есть ли у документа цифровая копия (сканы генерирует scripts/generate-demo-scans.ts) */
export function hasDemoScans(doc: DemoDocument): boolean {
  return doc.access === "OPEN" && doc.type !== "AUDIO_VIDEO";
}

/** Размеры демо-скана в пикселях по типу документа */
export function scanSize(type: DemoDocType): { width: number; height: number } {
  if (type === "PHOTO") return { width: 1600, height: 1100 };
  if (type === "MAP_DRAWING") return { width: 1754, height: 1240 };
  return { width: 1240, height: 1754 };
}

/** Детерминированное «случайное» число страниц — одинаковое при каждом запуске */
export function demoPageCount(doc: DemoDocument, index: number): number {
  const ranges: Record<DemoDocType, [number, number]> = {
    PHOTO: [1, 2],
    MAP_DRAWING: [1, 3],
    TEXT: [2, 8],
    HISTORICAL: [2, 6],
    ORGANIZATION: [3, 8],
    PERSONAL: [3, 12],
    AUDIO_VIDEO: [0, 0],
  };
  const [min, max] = ranges[doc.type];
  const seed = (index * 7919 + doc.year * 31) % 1000;
  return min + (seed % (max - min + 1));
}
