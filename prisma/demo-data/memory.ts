// «Архив памяти» и онлайн-выставки: выставки, тематические коллекции, хронология, личности.
//
// Правила наполнения:
//  • Экспонаты выставок — демо-документы каталога (связь по названию документа);
//    подписи описывают сам документ и его значение как источника, без выдуманных дат и цифр.
//  • Коллекции, личности и даты истории архива — только из docs/real-archive-data.md.
//  • Вехи региона — только общеизвестные (основание крепости, война, целина, независимость).

type L = { ru: string; kz: string; en: string };
const l = (ru: string, kz: string, en: string): L => ({ ru, kz, en });

export type DemoExhibit = { doc?: string; section?: L; title: L; text: L };
export type DemoExhibition = {
  slug: string;
  theme: string;
  period: L;
  title: L;
  description: L;
  sortOrder: number;
  /** Документ для обложки (иначе — первая фотография) */
  cover?: string;
  exhibits: DemoExhibit[];
};

export const exhibitions: DemoExhibition[] = [
  {
    slug: "ust-kamenogorsk-istoriya-goroda",
    theme: "city",
    sortOrder: 1,
    cover: "Панорама города с левого берега Иртыша",
    period: l("1920-е — 2000-е", "1920 — 2000 жылдар", "1920s — 2000s"),
    title: l(
      "Усть-Каменогорск: история города в архивных документах",
      "Өскемен: архив құжаттарындағы қала тарихы",
      "Ust-Kamenogorsk: the city's history in archival records",
    ),
    description: l(
      "Протоколы, планы, фотографии и кинохроника из фондов архива — от первых лет Советской власти до наших дней. Прокручивайте страницу: город меняется от десятилетия к десятилетию.",
      "Архив қорларындағы хаттамалар, жоспарлар, фотосуреттер және кинохроника — Кеңес өкіметінің алғашқы жылдарынан бүгінге дейін. Бетті айналдырыңыз: қала онжылдықтан онжылдыққа өзгереді.",
      "Minutes, plans, photographs and newsreels from the archive's fonds — from the first years of Soviet power to the present day. Scroll down to watch the city change decade by decade.",
    ),
    exhibits: [
      {
        doc: "Протокол заседания Усть-Каменогорского уездного ревкома",
        section: l("1920–1940-е", "1920–1940 жылдар", "1920s–1940s"),
        title: l("Первые протоколы новой власти", "Жаңа биліктің алғашқы хаттамалары", "First minutes of the new authorities"),
        text: l(
          "Документы Усть-Каменогорского уездного ревкома — одни из самых ранних в архиве. По ним изучают, как была устроена жизнь города и уезда в начале 1920-х.",
          "Өскемен уездік ревкомының құжаттары — архивтегі ең ерте құжаттардың бірі. Олар арқылы 1920 жылдардың басындағы қала мен уезд өмірі зерттеледі.",
          "Records of the Ust-Kamenogorsk Uyezd Revolutionary Committee are among the earliest in the archive. They show how the town and uyezd were run in the early 1920s.",
        ),
      },
      {
        doc: "План города Усть-Каменогорска",
        title: l("Город на плане", "Жоспардағы қала", "The city on a plan"),
        text: l(
          "Планы и карты помогают увидеть, как росла застройка вдоль Иртыша и как менялись границы города.",
          "Жоспарлар мен карталар Ертіс бойындағы құрылыстың қалай өскенін және қала шекараларының қалай өзгергенін көруге көмектеседі.",
          "Plans and maps reveal how the city grew along the Irtysh and how its boundaries changed.",
        ),
      },
      {
        doc: "Документы о размещении эвакуированных предприятий",
        title: l("Тыл в годы войны", "Соғыс жылдарындағы тыл", "The home front"),
        text: l(
          "Документы военных лет рассказывают о работе тыла: размещении предприятий, людях и задачах, которые решал город.",
          "Соғыс жылдарының құжаттары тылдың жұмысы туралы баяндайды: кәсіпорындарды орналастыру, адамдар және қала шешкен міндеттер.",
          "Wartime records describe the work of the home front: relocated enterprises, people and the tasks the city faced.",
        ),
      },
      {
        doc: "Женщины у станков в годы войны",
        title: l("Женщины у станков", "Станок басындағы әйелдер", "Women at the machines"),
        text: l(
          "Фотографии военного времени — важная часть фондов: они сохраняют лица людей, о которых не всегда пишут в документах.",
          "Соғыс уақытының фотосуреттері — қорлардың маңызды бөлігі: олар құжаттарда әрдайым жазыла бермейтін адамдардың бейнесін сақтайды.",
          "Wartime photographs are an important part of the fonds: they preserve the faces of people rarely named in documents.",
        ),
      },
      {
        doc: "Телеграмма о праздновании Победы",
        title: l("Весна 1945-го", "1945 жылғы көктем", "Spring 1945"),
        text: l(
          "Телеграммы и распоряжения о праздновании Победы — короткие документы, в которых слышен голос эпохи.",
          "Жеңісті тойлау туралы жеделхаттар мен өкімдер — дәуір үні естілетін қысқа құжаттар.",
          "Telegrams and orders on the Victory celebrations are short documents that carry the voice of their time.",
        ),
      },
      {
        doc: "Вид на набережную Иртыша",
        section: l("1960-е", "1960 жылдар", "1960s"),
        title: l("Набережная Иртыша", "Ертіс жағалауы", "The Irtysh embankment"),
        text: l(
          "Фотографии 1960-х — самая большая подборка этой выставки. По ним можно проследить, как выглядели улицы, набережные и новые районы.",
          "1960 жылдардың фотосуреттері — осы көрменің ең үлкен іріктемесі. Олар бойынша көшелер, жағалаулар мен жаңа аудандардың келбетін бақылауға болады.",
          "Photographs from the 1960s form the largest part of this exhibition, showing the streets, embankments and new districts.",
        ),
      },
      {
        doc: "Речная пристань на Иртыше",
        title: l("Город у реки", "Өзен жағасындағы қала", "A river city"),
        text: l(
          "Иртыш — главная улица города на протяжении всей его истории. Пристани и мосты часто появляются на архивных снимках.",
          "Ертіс — қаланың бүкіл тарихындағы басты «көшесі». Айлақтар мен көпірлер архив суреттерінде жиі кездеседі.",
          "The Irtysh has been the city's main street throughout its history; piers and bridges often appear in archival photos.",
        ),
      },
      {
        doc: "Трамвай на городской улице",
        title: l("Городской транспорт", "Қалалық көлік", "City transport"),
        text: l(
          "Снимки улиц с транспортом помогают датировать фотографии и узнавать знакомые места.",
          "Көлігі бар көше суреттері фотосуреттердің мерзімін анықтауға және таныс жерлерді тануға көмектеседі.",
          "Street scenes with vehicles help date photographs and recognise familiar places.",
        ),
      },
      {
        doc: "Рабочие свинцово-цинкового комбината у проходной",
        title: l("Город заводов", "Зауыттар қаласы", "A city of factories"),
        text: l(
          "Фонды промышленных предприятий — одна из крупнейших групп в архиве: свинцово-цинковый и титано-магниевый комбинаты, машиностроительный и конденсаторный заводы.",
          "Өнеркәсіп кәсіпорындарының қорлары — архивтегі ең ірі топтардың бірі: қорғасын-мырыш және титан-магний комбинаттары, машина жасау және конденсатор зауыттары.",
          "Industrial fonds are among the archive's largest groups: the lead and zinc and titanium and magnesium plants, machine-building and capacitor factories.",
        ),
      },
      {
        doc: "Плотина Усть-Каменогорской ГЭС",
        title: l("Энергия Иртыша", "Ертіс энергиясы", "The power of the Irtysh"),
        text: l(
          "Документы Усть-Каменогорской ГЭС и треста «Иртышгэсстрой» хранятся в архиве в группе фондов «Энергетика».",
          "Өскемен СЭС-і мен «Иртышгэсстрой» тресінің құжаттары архивте «Энергетика» қорлар тобында сақталады.",
          "Records of the Ust-Kamenogorsk hydroelectric station and the Irtyshgesstroy trust are kept in the archive's energy group of fonds.",
        ),
      },
      {
        doc: "Плавильный цех титано-магниевого комбината",
        title: l("В цехах комбината", "Комбинат цехтарында", "Inside the plant"),
        text: l(
          "Производственные фотографии показывают труд людей и технику своего времени.",
          "Өндірістік фотосуреттер адамдардың еңбегі мен өз уақытының техникасын көрсетеді.",
          "Industrial photographs show people at work and the technology of their time.",
        ),
      },
      {
        doc: "Строительство жилых домов в новом микрорайоне",
        title: l("Новые районы", "Жаңа аудандар", "New districts"),
        text: l(
          "Документы строительных трестов рассказывают, как появлялись жилые кварталы, школы и больницы.",
          "Құрылыс трестерінің құжаттары тұрғын кварталдардың, мектептер мен ауруханалардың қалай пайда болғанын баяндайды.",
          "Records of construction trusts tell how residential blocks, schools and hospitals appeared.",
        ),
      },
      {
        doc: "Первомайская демонстрация",
        title: l("Праздники на улицах", "Көшедегі мерекелер", "Celebrations in the streets"),
        text: l(
          "Праздничные демонстрации — частый сюжет фотографий: по ним видно, как выглядели центральные улицы города.",
          "Мерекелік шерулер — фотосуреттердің жиі сюжеті: олардан қаланың орталық көшелерінің келбеті көрінеді.",
          "Festive parades are a common subject, showing what the city's central streets looked like.",
        ),
      },
      {
        doc: "Новогодняя ёлка на центральной площади",
        title: l("Новый год в центре города", "Қала орталығындағы Жаңа жыл", "New Year in the city centre"),
        text: l(
          "Снимки городских праздников хранят атмосферу эпохи — и часто узнаваемы для тех, кто жил в городе.",
          "Қалалық мерекелердің суреттері дәуір атмосферасын сақтайды — қалада тұрғандар оларды жиі таниды.",
          "Photos of city celebrations preserve the atmosphere of the era and are often recognised by long-time residents.",
        ),
      },
      {
        doc: "Панорама города с левого берега Иртыша",
        title: l("Город с другого берега", "Қарсы жағалаудан қала", "The view from across the river"),
        text: l(
          "Панорамные снимки позволяют сравнить облик города в разные годы.",
          "Панорамалық суреттер қаланың әр жылдардағы келбетін салыстыруға мүмкіндік береді.",
          "Panoramic photographs allow the city's appearance to be compared across the years.",
        ),
      },
      {
        doc: "Награждение передовиков производства",
        section: l("1970–2000-е", "1970–2000 жылдар", "1970s–2000s"),
        title: l("Люди труда", "Еңбек адамдары", "People at work"),
        text: l(
          "Фотографии торжественных собраний и награждений — источник по истории трудовых коллективов.",
          "Салтанатты жиналыстар мен марапаттаулардың фотосуреттері — еңбек ұжымдары тарихының дереккөзі.",
          "Photos of ceremonies and awards are a source for the history of workplaces and their people.",
        ),
      },
      {
        doc: "Кинохроника: город на Иртыше",
        title: l("Город в кинохронике", "Кинохроникадағы қала", "The city on film"),
        text: l(
          "Аудиовизуальные документы — фото, видео, фонограммы и кинофильмы — отдельная часть фондов архива.",
          "Аудиовизуалды құжаттар — фото, бейне, фонограммалар мен кинофильмдер — архив қорларының жеке бөлігі.",
          "Audiovisual records — photos, video, sound recordings and films — form a separate part of the archive's holdings.",
        ),
      },
      {
        doc: "Новый мост через Иртыш",
        title: l("Новые мосты", "Жаңа көпірлер", "New bridges"),
        text: l(
          "Документы последних десятилетий тоже поступают в архив — завтра они станут историей.",
          "Соңғы онжылдықтардың құжаттары да архивке түседі — ертең олар тарихқа айналады.",
          "Records of recent decades also come to the archive — tomorrow they will become history.",
        ),
      },
      {
        doc: "Фестиваль национальных культур",
        title: l("Город многих культур", "Көп мәдениетті қала", "A city of many cultures"),
        text: l(
          "Фотографии культурных событий дополняют рассказ о городе — о людях, которые в нём живут.",
          "Мәдени іс-шаралардың фотосуреттері қала туралы әңгімені — онда тұратын адамдар туралы әңгімені толықтырады.",
          "Photos of cultural events complete the story of the city — the story of the people who live in it.",
        ),
      },
    ],
  },
  {
    slug: "vostochnyj-kazahstan-v-gody-vojny",
    theme: "war",
    sortOrder: 2,
    period: l("1941–1945", "1941–1945", "1941–1945"),
    title: l(
      "Восточный Казахстан в годы Великой Отечественной войны",
      "Ұлы Отан соғысы жылдарындағы Шығыс Қазақстан",
      "East Kazakhstan during the Great Patriotic War",
    ),
    description: l(
      "Документы и фотографии о жизни области в военные годы и о памяти о войне.",
      "Соғыс жылдарындағы облыс өмірі және соғыс туралы жады жайлы құжаттар мен фотосуреттер.",
      "Documents and photographs about the region in the war years and the memory of the war.",
    ),
    exhibits: [
      { doc: "Решения облисполкома о перестройке работы предприятий", title: l("Решения военного времени", "Соғыс уақытының шешімдері", "Wartime decisions"), text: l("Решения облисполкома 1941 года — документ с описанием на сайте; оригинал можно изучить в читальном зале.", "1941 жылғы облатком шешімдері — сайтта сипаттамасы бар құжат; түпнұсқамен оқу залында танысуға болады.", "The 1941 regional decisions are described online; the original can be consulted in the reading room.") },
      { doc: "Документы о размещении эвакуированных предприятий", title: l("Эвакуация", "Эвакуация", "Evacuation"), text: l("Документы о размещении предприятий и людей в тылу.", "Тылда кәсіпорындар мен адамдарды орналастыру туралы құжаттар.", "Records on relocating enterprises and people to the home front.") },
      { doc: "Женщины у станков в годы войны", title: l("Труд в тылу", "Тылдағы еңбек", "Work on the home front"), text: l("Фотографии рабочих военного времени.", "Соғыс уақытындағы жұмысшылардың фотосуреттері.", "Photographs of wartime workers.") },
      { doc: "Сведения о сборе средств в фонд обороны", title: l("Фонд обороны", "Қорғаныс қоры", "The defence fund"), text: l("Сведения о сборе средств — документы из Зайсана.", "Қаражат жинау туралы мәліметтер — Зайсаннан келген құжаттар.", "Records of fundraising — documents from Zaisan.") },
      { doc: "Встреча ветеранов Великой Отечественной войны", title: l("Память о войне", "Соғыс туралы жады", "Remembering the war"), text: l("Встречи ветеранов — часть истории памяти о войне.", "Ардагерлер кездесулері — соғыс туралы жады тарихының бөлігі.", "Veterans' meetings are part of how the war is remembered.") },
    ],
  },
  {
    slug: "promyshlennoe-razvitie-vostochnogo-kazahstana",
    theme: "industry",
    sortOrder: 3,
    period: l("1950-е — 1980-е", "1950 — 1980 жылдар", "1950s — 1980s"),
    title: l("Промышленное развитие Восточного Казахстана", "Шығыс Қазақстанның өнеркәсіптік дамуы", "Industrial development of East Kazakhstan"),
    description: l(
      "Рудники, комбинаты и заводы региона в документах промышленных фондов архива.",
      "Өңірдің кеніштері, комбинаттары мен зауыттары архивтің өнеркәсіп қорларының құжаттарында.",
      "Mines, plants and factories of the region in the archive's industrial fonds.",
    ),
    exhibits: [
      { doc: "Рудник Иртышского полиметаллического комбината", title: l("Рудник", "Кеніш", "The mine"), text: l("Иртышский полиметаллический комбинат — один из фондообразователей группы «Промышленность».", "Ертіс полиметалл комбинаты — «Өнеркәсіп» тобының қор құрушыларының бірі.", "The Irtysh Polymetallic Plant is one of the creators of fonds in the industry group.") },
      { doc: "Горняки Лениногорска после смены", title: l("Горняки", "Кеншілер", "Miners"), text: l("Фотографии рабочих коллективов из Риддера (Лениногорска).", "Риддердің (Лениногорскінің) еңбек ұжымдарының фотосуреттері.", "Photographs of workers from Ridder (Leninogorsk).") },
      { doc: "Плавильный цех титано-магниевого комбината", title: l("Металлургия", "Металлургия", "Metallurgy"), text: l("Производственные снимки комбината.", "Комбинаттың өндірістік суреттері.", "Production photographs from the plant.") },
      { doc: "Ткацкий цех комбината шёлковых тканей", title: l("Лёгкая промышленность", "Жеңіл өнеркәсіп", "Light industry"), text: l("Фонды лёгкой и пищевой промышленности — отдельная тематическая группа.", "Жеңіл және тамақ өнеркәсібінің қорлары — жеке тақырыптық топ.", "Light and food industry fonds form a separate thematic group.") },
      { doc: "Сборочный цех машиностроительного завода", title: l("Машиностроение", "Машина жасау", "Machine building"), text: l("Документы и фотографии машиностроительного завода.", "Машина жасау зауытының құжаттары мен фотосуреттері.", "Records and photographs of the machine-building plant.") },
    ],
  },
  {
    slug: "lyudi-izmenivshie-istoriyu-regiona",
    theme: "persons",
    sortOrder: 4,
    period: l("1940-е — 1980-е", "1940 — 1980 жылдар", "1940s — 1980s"),
    title: l("Люди, изменившие историю региона", "Өңір тарихын өзгерткен адамдар", "People who changed the region's history"),
    description: l(
      "Рукописи, письма и материалы из фондов личного происхождения: писатели, учёные, краеведы. Выставка готовится — сейчас показана первая часть.",
      "Жеке текті қорлардағы қолжазбалар, хаттар мен материалдар: жазушылар, ғалымдар, өлкетанушылар. Көрме дайындалуда — қазір бірінші бөлімі көрсетілген.",
      "Manuscripts, letters and papers from personal fonds: writers, scholars, local historians. The exhibition is in progress — the first part is shown now.",
    ),
    exhibits: [
      { doc: "Рукопись статьи по педагогике", title: l("А. М. Волков", "А. М. Волков", "A. M. Volkov"), text: l("Писатель, учёный, педагог. Личный фонд хранится в архиве.", "Жазушы, ғалым, педагог. Жеке қоры архивте сақталады.", "Writer, scholar and teacher. His personal fonds is kept in the archive.") },
      { doc: "Материалы по тюркскому языкознанию", title: l("С. А. Аманжолов", "С. А. Аманжолов", "S. A. Amanzholov"), text: l("Доктор филологических наук, языковед-тюрколог.", "Филология ғылымдарының докторы, түрколог-тілші.", "Doctor of Philology, Turkologist.") },
      { doc: "Картотека к «Словарю русских личных имён»", title: l("Н. А. Петровский", "Н. А. Петровский", "N. A. Petrovsky"), text: l("Учёный-ономаст, автор «Словаря русских личных имён».", "Ономаст-ғалым, «Орыс жеке есімдерінің сөздігінің» авторы.", "Onomastics scholar, author of the Dictionary of Russian Personal Names.") },
      { doc: "Краеведческие очерки о Восточном Казахстане", title: l("С. Е. Черных", "С. Е. Черных", "S. E. Chernykh"), text: l("Писатель, краевед, отличник архивного дела СССР.", "Жазушы, өлкетанушы, КСРО архив ісінің үздігі.", "Writer, local historian, honoured archivist of the USSR.") },
      { doc: "Рукопись пьесы", title: l("О. Бокеев", "О. Бөкей", "O. Bokeyev"), text: l("Писатель-драматург, лауреат Государственной премии РК.", "Жазушы-драматург, ҚР Мемлекеттік сыйлығының лауреаты.", "Writer and playwright, laureate of the State Prize of Kazakhstan.") },
    ],
  },
];

// Тематические коллекции — реальные названия из «Характеристики фондов»
export const collections: {
  slug: string;
  theme: string;
  title: L;
  description: L;
  period?: L;
  /** Документы коллекции: по тегу и/или по названиям */
  tag?: string;
  docs?: string[];
}[] = [
  { slug: "osvoenie-celiny", theme: "region", tag: "virgin-lands", period: l("1950-е", "1950 жылдар", "1950s"), title: l("Освоение целинных и залежных земель в Восточно-Казахстанской области", "Шығыс Қазақстан облысында тың және тыңайған жерлерді игеру", "Development of virgin and fallow lands in East Kazakhstan Region"), description: l("Отчёты, фотографии полевых станов и первых посевов.", "Есептер, дала қостары мен алғашқы егістердің фотосуреттері.", "Reports and photographs of field camps and first sowings.") },
  { slug: "partizanskoe-dvizhenie", theme: "military", tag: "partisans", title: l("Партизанское движение в Восточном Казахстане", "Шығыс Қазақстандағы партизандық қозғалыс", "The partisan movement in East Kazakhstan"), description: l("Воспоминания участников и документы о партизанском движении.", "Қатысушылардың естеліктері және партизандық қозғалыс туралы құжаттар.", "Participants' memoirs and records of the partisan movement.") },
  { slug: "vko-v-gody-vov", theme: "ww2", tag: "war", period: l("1941–1945", "1941–1945", "1941–1945"), title: l("Восточный Казахстан в годы Великой Отечественной войны 1941–1945 гг.", "1941–1945 жж. Ұлы Отан соғысы жылдарындағы Шығыс Қазақстан", "East Kazakhstan during the Great Patriotic War, 1941–1945"), description: l("Документы тыла, фотографии и воспоминания.", "Тыл құжаттары, фотосуреттер және естеліктер.", "Home front records, photographs and memoirs.") },
  { slug: "vospominaniya-veteranov", theme: "family", docs: ["Воспоминания участников партизанского движения", "Фонограмма: воспоминания ветерана войны", "Встреча ветеранов Великой Отечественной войны"], title: l("Воспоминания ветеранов войны и труда", "Соғыс және еңбек ардагерлерінің естеліктері", "Memoirs of war and labour veterans"), description: l("Записанные воспоминания и встречи ветеранов.", "Жазылған естеліктер мен ардагерлер кездесулері.", "Recorded memoirs and veterans' meetings.") },
  { slug: "zemleustrojstvo-hozyajstv", theme: "region", docs: ["Карта землеустройства колхоза"], title: l("Коллекция документов по землеустройству хозяйств ВКО", "ШҚО шаруашылықтарын жерге орналастыру жөніндегі құжаттар топтамасы", "Land management records of East Kazakhstan farms"), description: l("Карты и планы землеустройства.", "Жерге орналастыру карталары мен жоспарлары.", "Land management maps and plans.") },
  { slug: "istoriya-sporta", theme: "culture", tag: "sport", title: l("По истории развития спорта в ВКО", "ШҚО-дағы спорттың даму тарихы бойынша", "History of sport in East Kazakhstan"), description: l("Фотографии соревнований и спортивных праздников.", "Жарыстар мен спорт мерекелерінің фотосуреттері.", "Photographs of competitions and sports festivals.") },
];

// Хронология: история архива (из источника) + общеизвестные вехи региона
export const events: { year: number; theme: string; title: L; description?: L; docs?: string[]; tag?: string }[] = [
  { year: 1720, theme: "region", title: l("Основание Усть-Каменогорской крепости", "Өскемен бекінісінің негізделуі", "Founding of the Ust-Kamenogorsk fortress"), description: l("С крепости на слиянии Иртыша и Ульбы начинается история города.", "Қаланың тарихы Ертіс пен Үлбінің қосылған жеріндегі бекіністен басталады.", "The city's history begins with the fortress at the confluence of the Irtysh and the Ulba.") },
  { year: 1940, theme: "archive", title: l("Образован Государственный архив Восточно-Казахстанской области", "Шығыс Қазақстан облысының мемлекеттік архиві құрылды", "The State Archive of East Kazakhstan Region is founded") },
  { year: 1941, theme: "war", tag: "war", title: l("Великая Отечественная война (1941–1945)", "Ұлы Отан соғысы (1941–1945)", "The Great Patriotic War (1941–1945)"), description: l("Документы о жизни области в годы войны — в коллекции «Восточный Казахстан в годы ВОВ».", "Соғыс жылдарындағы облыс өмірі туралы құжаттар — «ҰОС жылдарындағы Шығыс Қазақстан» топтамасында.", "Records of the region in the war years are in the collection on East Kazakhstan during the war.") },
  { year: 1954, theme: "region", tag: "virgin-lands", title: l("Начало освоения целинных и залежных земель", "Тың және тыңайған жерлерді игерудің басталуы", "The Virgin Lands campaign begins") },
  { year: 1960, theme: "archive", title: l("Архивный отдел начал работать при облисполкоме", "Архив бөлімі облатком жанында жұмыс істей бастады", "The archival department begins operating under the regional executive committee") },
  { year: 1963, theme: "archive", docs: ["Документы об организации Зайсанского филиала архива", "Документы об организации Зыряновского филиала архива"], title: l("Образованы Зайсанский и Зыряновский филиалы", "Зайсан және Зыряновск филиалдары құрылды", "Zaisan and Zyryanovsk branches are established") },
  { year: 1966, theme: "archive", docs: ["Решение об организации архивного филиала в Лениногорске"], title: l("Создан Лениногорский филиал", "Лениногорск филиалы құрылды", "The Leninogorsk branch is created") },
  { year: 1967, theme: "archive", title: l("Сеть архивных учреждений области полностью сформирована", "Облыстың архив мекемелерінің желісі толық қалыптасты", "The region's network of archives is complete") },
  { year: 1991, theme: "region", title: l("Независимость Республики Казахстан", "Қазақстан Республикасының тәуелсіздігі", "Independence of the Republic of Kazakhstan") },
  { year: 1992, theme: "archive", title: l("Создано управление архивами и документацией областной администрации", "Облыс әкімшілігінің архивтер және құжаттама басқармасы құрылды", "The regional department of archives and records is formed") },
  { year: 1997, theme: "region", title: l("После ликвидации Семипалатинской области в состав архива вошли новые филиалы", "Семей облысы таратылғаннан кейін архив құрамына жаңа филиалдар кірді", "New branches join after Semipalatinsk Region is abolished") },
  { year: 2009, theme: "archive", title: l("Госархив и филиалы стали самостоятельными юридическими лицами", "Мемлекеттік архив пен филиалдар дербес заңды тұлғалар болды", "The archive and branches become separate legal entities") },
  { year: 2012, theme: "archive", title: l("Реорганизация в КГУ «Государственный архив»", "«Мемлекеттік архив» КММ болып қайта ұйымдастырылды", "Reorganised as the State Archive public institution") },
  { year: 2013, theme: "archive", title: l("Вновь созданы филиалы, в том числе по личному составу", "Филиалдар қайта құрылды, оның ішінде жеке құрам бойынша", "Branches re-established, including for personnel records") },
  { year: 2019, theme: "archive", title: l("Зыряновский филиал переименован в филиал Алтай", "Зыряновск филиалы Алтай филиалы болып қайта аталды", "The Zyryanovsk branch is renamed Altai") },
  { year: 2020, theme: "archive", title: l("Архив перешёл в подчинение Управления цифровизации и архивов ВКО", "Архив ШҚО цифрландыру және архивтер басқармасына бағынысына өтті", "The archive comes under the Department of Digitalization and Archives") },
  { year: 2022, theme: "archive", title: l("Образована область Абай; Аягозский и Жарминский филиалы переданы в её ведение", "Абай облысы құрылды; Аягөз және Жарма филиалдары соның қарамағына берілді", "Abai Region is formed; the Ayagoz and Zharma branches are transferred to it") },
];

// Личности — фондообразователи фондов личного происхождения (только данные источника)
export const persons: { slug: string; fund?: string; name: L; bio: L }[] = [
  { slug: "volkov", fund: "2001", name: l("А. М. Волков", "А. М. Волков", "A. M. Volkov"), bio: l("Писатель, учёный, педагог.", "Жазушы, ғалым, педагог.", "Writer, scholar and teacher.") },
  { slug: "amanzholov", fund: "2014", name: l("С. А. Аманжолов", "С. А. Аманжолов", "S. A. Amanzholov"), bio: l("Доктор филологических наук, языковед-тюрколог, член-корреспондент АН РК.", "Филология ғылымдарының докторы, түрколог-тілші, ҚР ҒА корреспондент-мүшесі.", "Doctor of Philology, Turkologist linguist, corresponding member of the Academy of Sciences of Kazakhstan.") },
  { slug: "bokeev", fund: "2027", name: l("О. Бокеев", "О. Бөкей", "O. Bokeyev"), bio: l("Писатель-драматург, лауреат Государственной премии РК.", "Жазушы-драматург, ҚР Мемлекеттік сыйлығының лауреаты.", "Writer and playwright, laureate of the State Prize of Kazakhstan.") },
  { slug: "chernykh", fund: "2033", name: l("С. Е. Черных", "С. Е. Черных", "S. E. Chernykh"), bio: l("Писатель, краевед, отличник архивного дела СССР.", "Жазушы, өлкетанушы, КСРО архив ісінің үздігі.", "Writer, local historian, honoured archivist of the USSR.") },
  { slug: "petrovsky", fund: "2041", name: l("Н. А. Петровский", "Н. А. Петровский", "N. A. Petrovsky"), bio: l("Учёный-ономаст, автор «Словаря русских личных имён».", "Ономаст-ғалым, «Орыс жеке есімдерінің сөздігі» еңбегінің авторы.", "Onomastics scholar, author of the Dictionary of Russian Personal Names.") },
  { slug: "gerasimov", name: l("Б. Г. Герасимов", "Б. Г. Герасимов", "B. G. Gerasimov"), bio: l("Краевед, учёный, учредитель Семипалатинского подотдела Русского географического общества.", "Өлкетанушы, ғалым, Орыс географиялық қоғамының Семей бөлімшесінің құрылтайшысы.", "Local historian and scholar, founder of the Semipalatinsk sub-department of the Russian Geographical Society.") },
  { slug: "konshin", name: l("Н. Я. Коншин", "Н. Я. Коншин", "N. Ya. Konshin"), bio: l("Краевед, учредитель Семипалатинского подотдела ЗСО РГО.", "Өлкетанушы, ОГҚ БСБ Семей бөлімшесінің құрылтайшысы.", "Local historian, founder of the Semipalatinsk sub-department of the West Siberian branch of the Russian Geographical Society.") },
  { slug: "kotov", name: l("И. И. Котов", "И. И. Котов", "I. I. Kotov"), bio: l("Лауреат Ленинской премии, механик-изобретатель.", "Ленин сыйлығының лауреаты, механик-өнертапқыш.", "Lenin Prize laureate, mechanical engineer and inventor.") },
  { slug: "egorina", name: l("А. В. Егорина", "А. В. Егорина", "A. V. Yegorina"), bio: l("Доктор географических наук, профессор.", "География ғылымдарының докторы, профессор.", "Doctor of Geography, professor.") },
  { slug: "alekseenko", name: l("Н. В. Алексеенко", "Н. В. Алексеенко", "N. V. Alekseenko"), bio: l("Доктор исторических наук, почётный гражданин Усть-Каменогорска.", "Тарих ғылымдарының докторы, Өскеменнің құрметті азаматы.", "Doctor of History, honorary citizen of Ust-Kamenogorsk.") },
];
