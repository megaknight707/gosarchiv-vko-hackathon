// Информационные страницы и FAQ. Редактируются в админке (таблицы Page и FaqItem).
//
// Формат текста (body): абзацы через пустую строку; строки «- …» — список;
// «## …» — подзаголовок; «[[review]]» в начале — формулировка требует проверки
// сотрудником архива; «TODO…» — данных нет, на сайте показывается «Раздел наполняется».
//
// Факты — только из docs/real-archive-data.md (сайт e-arhiv.vko.gov.kz).

import { leadershipBody, structureBody } from "./structure";

type Localized = { kz: string; ru: string; en: string };
export type DemoPage = { slug: string; section: string; sortOrder: number; title: Localized; body: Localized };

const TODO = { kz: "TODO: уточнить на e-arhiv.vko.gov.kz", ru: "TODO: уточнить на e-arhiv.vko.gov.kz", en: "TODO: уточнить на e-arhiv.vko.gov.kz" };

export const pages: DemoPage[] = [
  {
    slug: "about-history",
    section: "about",
    sortOrder: 1,
    title: { kz: "Архив тарихы", ru: "История архива", en: "History" },
    body: {
      ru: `Государственный архив Восточно-Казахстанской области образован в 1940 году — в подчинении архивного отделения УНКВД Казахской ССР по Восточно-Казахстанской области.

## Ключевые даты
- 1940 — образован Государственный архив Восточно-Казахстанской области.
- 1960 — архивный отдел стал функционировать при облисполкоме.
- 1963 — образованы Зайсанский (май) и Зыряновский (июль) филиалы.
- 1966 — создан Лениногорский филиал.
- 1967 — сеть архивных учреждений области полностью сформирована.
- 1992 — архивный отдел реорганизован в управление архивами и документацией областной администрации.
- 2009 — госархив и филиалы выделены в самостоятельные юридические лица.
- 2012 — реорганизация в КГУ «Государственный архив».
- 2013 — вновь созданы филиалы, в том числе Зайсанский, Зыряновский, Риддерский и Усть-Каменогорский по личному составу.
- 2019 — Зыряновский филиал переименован в филиал Алтай.
- 2020 — архив перешёл в подчинение Управления цифровизации и архивов ВКО.
- 2022 — образована область Абай; Аягозский и Жарминский филиалы переданы в её ведение.

Сегодня в архиве хранится 1 005 фондов — 610 492 единицы хранения (на 01.01.2020), в том числе 76 фондов личного происхождения и 7 839 единиц хранения аудиовизуальных документов. Документы охватывают период от установления Советской власти до современности.`,
      kz: `Шығыс Қазақстан облысының мемлекеттік архиві 1940 жылы Қазақ КСР ІІХК Шығыс Қазақстан облысы бойынша басқармасының архив бөлімшесіне бағынышты ретінде құрылды.

## Негізгі даталар
- 1940 — Шығыс Қазақстан облысының мемлекеттік архиві құрылды.
- 1960 — архив бөлімі облатком жанында жұмыс істей бастады.
- 1963 — Зайсан (мамыр) және Зыряновск (шілде) филиалдары құрылды.
- 1966 — Лениногорск филиалы құрылды.
- 1967 — облыстың архив мекемелерінің желісі толық қалыптасты.
- 1992 — архив бөлімі облыс әкімшілігінің архивтер және құжаттама басқармасы болып қайта ұйымдастырылды.
- 2009 — мемлекеттік архив пен филиалдар дербес заңды тұлғаларға бөлінді.
- 2012 — «Мемлекеттік архив» КММ болып қайта ұйымдастырылды.
- 2013 — филиалдар қайта құрылды, оның ішінде Зайсан, Зыряновск, Риддер және жеке құрам бойынша Өскемен филиалдары.
- 2019 — Зыряновск филиалы Алтай филиалы болып қайта аталды.
- 2020 — архив ШҚО цифрландыру және архивтер басқармасына бағынысына өтті.
- 2022 — Абай облысы құрылды; Аягөз және Жарма филиалдары соның қарамағына берілді.

Бүгінде архивте 1 005 қор — 610 492 сақтау бірлігі сақталады (01.01.2020 жағдай бойынша), оның ішінде 76 жеке текті қор және аудиовизуалды құжаттардың 7 839 сақтау бірлігі. Құжаттар Кеңес өкіметі орнаған кезеңнен бүгінгі күнге дейінгі уақытты қамтиды.`,
      en: `The State Archive of East Kazakhstan Region was established in 1940 under the archival department of the NKVD Directorate of the Kazakh SSR for East Kazakhstan Region.

## Key dates
- 1940 — the State Archive of East Kazakhstan Region was founded.
- 1960 — the archival department began operating under the regional executive committee.
- 1963 — the Zaisan (May) and Zyryanovsk (July) branches were established.
- 1966 — the Leninogorsk branch was created.
- 1967 — the region's network of archival institutions was fully formed.
- 1992 — the archival department was reorganised into the regional administration's department of archives and records.
- 2009 — the archive and its branches became separate legal entities.
- 2012 — reorganised as the State Archive public institution.
- 2013 — branches were re-established, including Zaisan, Zyryanovsk, Ridder and the Ust-Kamenogorsk branch for personnel records.
- 2019 — the Zyryanovsk branch was renamed the Altai branch.
- 2020 — the archive came under the Department of Digitalization and Archives of East Kazakhstan Region.
- 2022 — Abai Region was formed; the Ayagoz and Zharma branches were transferred to it.

Today the archive holds 1,005 fonds — 610,492 storage units (as of 01.01.2020), including 76 personal fonds and 7,839 storage units of audiovisual records. The records cover the period from the establishment of Soviet power to the present day.`,
    },
  },
  {
    slug: "about-activities",
    section: "about",
    sortOrder: 2,
    title: { kz: "Қызмет бағыттары", ru: "Направления деятельности", en: "Activities" },
    body: {
      ru: `[[review]]Основные направления работы государственного архива:
- комплектование — приём на хранение документов организаций и граждан;
- обеспечение сохранности и государственный учёт документов Национального архивного фонда;
- создание научно-справочного аппарата: описей, каталогов, баз данных;
- использование документов: читальный зал, выставки, публикации, информационные материалы;
- методическая помощь организациям — источникам комплектования.`,
      kz: `[[review]]Мемлекеттік архив жұмысының негізгі бағыттары:
- толықтыру — ұйымдар мен азаматтардың құжаттарын сақтауға қабылдау;
- Ұлттық архив қоры құжаттарының сақталуын қамтамасыз ету және мемлекеттік есепке алу;
- ғылыми-анықтамалық аппарат жасау: тізімдемелер, каталогтар, дерекқорлар;
- құжаттарды пайдалану: оқу залы, көрмелер, жарияланымдар, ақпараттық материалдар;
- толықтыру көзі болып табылатын ұйымдарға әдістемелік көмек.`,
      en: `[[review]]The main areas of the State Archive's work:
- acquisition — accepting records of organisations and individuals for permanent storage;
- preservation and state registration of records of the National Archival Fund;
- creating finding aids: inventories, catalogues and databases;
- use of records: reading room, exhibitions, publications and information materials;
- methodological support for organisations that transfer records to the archive.`,
    },
  },
  {
    slug: "about-mission",
    section: "about",
    sortOrder: 3,
    title: { kz: "Миссия және міндеттер", ru: "Миссия и задачи", en: "Mission and objectives" },
    body: {
      ru: `[[review]]Сохранять документальное наследие Восточного Казахстана и делать открытые архивные материалы доступными для каждого — исследователя, школьника, организации.

Задачи: обеспечить сохранность документов, развивать электронный каталог и цифровые коллекции, популяризировать историю региона через выставки и публикации.`,
      kz: `[[review]]Шығыс Қазақстанның құжаттық мұрасын сақтау және ашық архив материалдарын әркімге — зерттеушіге, оқушыға, ұйымға қолжетімді ету.

Міндеттері: құжаттардың сақталуын қамтамасыз ету, электрондық каталог пен цифрлық топтамаларды дамыту, өңір тарихын көрмелер мен жарияланымдар арқылы насихаттау.`,
      en: `[[review]]To preserve the documentary heritage of East Kazakhstan and make open archival materials accessible to everyone — researchers, students and organisations.

Objectives: ensure the preservation of records, develop the online catalogue and digital collections, and promote the region's history through exhibitions and publications.`,
    },
  },
  {
    slug: "about-leadership",
    section: "about",
    sortOrder: 4,
    title: { kz: "Басшылық және байланыс", ru: "Руководство и контакты", en: "Management and contacts" },
    body: leadershipBody,
  },
  { slug: "about-structure", section: "about", sortOrder: 5, title: { kz: "Құрылымы", ru: "Структура", en: "Structure" }, body: structureBody },
  {
    slug: "about-legal",
    section: "about",
    sortOrder: 6,
    title: { kz: "Нормативтік-құқықтық база", ru: "Нормативно-правовая база", en: "Legal framework" },
    body: {
      ru: `Нормативные правовые акты Республики Казахстан в сфере архивного дела публикуются в Эталонном контрольном банке НПА — на портале adilet.zan.kz.

- Закон Республики Казахстан «О Национальном архивном фонде и архивах»

Перечень подзаконных актов — TODO: уточнить на e-arhiv.vko.gov.kz.`,
      kz: `Қазақстан Республикасының архив ісі саласындағы нормативтік құқықтық актілері НҚА Эталондық бақылау банкінде — adilet.zan.kz порталында жарияланады.

- «Ұлттық архив қоры және архивтер туралы» Қазақстан Республикасының Заңы

Заңға тәуелді актілер тізбесі — TODO: уточнить на e-arhiv.vko.gov.kz.`,
      en: `Legal acts of the Republic of Kazakhstan on archival matters are published in the Reference Control Bank of Legal Acts at adilet.zan.kz.

- Law of the Republic of Kazakhstan "On the National Archival Fund and Archives"

List of secondary legislation — TODO: уточнить на e-arhiv.vko.gov.kz.`,
    },
  },
  { slug: "about-reports", section: "about", sortOrder: 7, title: { kz: "Қызмет туралы есептер", ru: "Отчёты о деятельности", en: "Activity reports" }, body: TODO },
  { slug: "about-gallery", section: "about", sortOrder: 8, title: { kz: "Фотогалерея", ru: "Фотогалерея", en: "Photo gallery" }, body: TODO },
  {
    slug: "privacy",
    section: "privacy",
    sortOrder: 1,
    title: { kz: "Құпиялылық саясаты", ru: "Политика конфиденциальности", en: "Privacy policy" },
    body: {
      ru: `Сайт носит информационный характер. Мы собираем минимум данных и не передаём их третьим лицам.

## Форма «Отзывы и предложения»
Сохраняются текст сообщения, тип (отзыв, предложение, пожелание), язык сайта и дата. Имя и e-mail указывать необязательно — они нужны только если вы хотите получить ответ. Отзывы читают сотрудники архива в административной панели.

## Поиск и ИИ-помощник
Запросы сохраняются без IP-адреса и других персональных данных — только текст запроса, язык и число найденных результатов. Это помогает понять, каких материалов не хватает на сайте.

## Защита от злоупотреблений
Для ограничения частоты отправки форм используется обезличенный хэш IP-адреса, который хранится не дольше суток.

## Cookie и хранилище браузера
- cookie NEXT_LOCALE — выбранный язык;
- localStorage — тема оформления, версия для слабовидящих и список «Избранное».
Эти данные хранятся только в вашем браузере, на сервер не отправляются.`,
      kz: `Сайт ақпараттық сипатта. Біз ең аз деректер жинаймыз және оларды үшінші тұлғаларға бермейміз.

## «Пікірлер мен ұсыныстар» нысаны
Хабарлама мәтіні, түрі (пікір, ұсыныс, тілек), сайт тілі және күні сақталады. Аты мен e-mail міндетті емес — олар жауап алғыңыз келсе ғана қажет. Пікірлерді архив қызметкерлері әкімшілік панельде оқиды.

## Іздеу және ЖИ-көмекші
Сұраныстар IP-мекенжайсыз және басқа дербес деректерсіз сақталады — тек сұраныс мәтіні, тілі және табылған нәтижелер саны. Бұл сайтта қандай материалдар жетіспейтінін түсінуге көмектеседі.

## Теріс пайдаланудан қорғау
Нысандарды жіберу жиілігін шектеу үшін IP-мекенжайдың иесіздендірілген хэші қолданылады, ол бір тәуліктен артық сақталмайды.

## Cookie және браузер қоймасы
- NEXT_LOCALE cookie — таңдалған тіл;
- localStorage — безендіру тақырыбы, нашар көретіндерге арналған нұсқа және «Таңдаулылар» тізімі.
Бұл деректер тек сіздің браузеріңізде сақталады, серверге жіберілмейді.`,
      en: `This website is for information only. We collect as little data as possible and do not share it with third parties.

## Feedback form
We store the message text, its type (review, suggestion, wish), the site language and the date. Your name and email are optional and only needed if you would like a reply. Feedback is read by archive staff in the admin panel.

## Search and AI assistant
Queries are stored without IP addresses or other personal data — only the query text, language and number of results. This helps us understand which materials are missing from the website.

## Abuse protection
To limit how often forms can be submitted, we use an anonymised hash of the IP address, kept for no longer than one day.

## Cookies and browser storage
- NEXT_LOCALE cookie — the selected language;
- localStorage — colour theme, low vision mode and your Favourites list.
This data stays in your browser and is not sent to the server.`,
    },
  },
];

export const faq: { question: Localized; answer: Localized }[] = [
  {
    question: { ru: "Можно ли через сайт заказать архивную справку или копию документа?", kz: "Сайт арқылы архив анықтамасына немесе құжат көшірмесіне тапсырыс беруге бола ма?", en: "Can I order an archival certificate or a copy of a document through the website?" },
    answer: { ru: "Нет. Сайт носит информационный характер: здесь можно найти сведения о фондах и открытых материалах. Официальные запросы подаются через портал электронного правительства egov.kz или в архив в установленном порядке.", kz: "Жоқ. Сайт ақпараттық сипатта: мұнда қорлар мен ашық материалдар туралы мәліметтерді табуға болады. Ресми сұраулар egov.kz электрондық үкімет порталы арқылы немесе архивке белгіленген тәртіппен беріледі.", en: "No. The website is for information only: here you can find details about fonds and open materials. Official requests are submitted via the egov.kz portal or to the archive under the established procedure." },
  },
  {
    question: { ru: "Как найти документ, если я не знаю шифр?", kz: "Шифрді білмесем, құжатты қалай табамын?", en: "How can I find a document if I don't know its reference code?" },
    answer: { ru: "Напишите в строке поиска каталога своими словами, например «фотографии Усть-Каменогорска 1960-х». Сайт сам распознает тип, место и период и применит фильтры. Затем уточните результаты фильтрами слева.", kz: "Каталогтың іздеу жолына өз сөзіңізбен жазыңыз, мысалы «1960-жылдардағы Өскемен фотосуреттері». Сайт түрін, орнын және кезеңін өзі анықтап, сүзгілерді қолданады. Содан кейін нәтижелерді сол жақтағы сүзгілермен нақтылаңыз.", en: "Type what you are looking for in your own words, for example “photos of Ust-Kamenogorsk in the 1960s”. The site recognises the type, place and period and applies filters. Then refine the results with the filters on the left." },
  },
  {
    question: { ru: "Что означает архивный шифр «Ф. 1520 · Оп. 2 · Д. 14»?", kz: "«Ф. 1520 · Оп. 2 · Д. 14» архив шифры нені білдіреді?", en: "What does the reference code “Ф. 1520 · Оп. 2 · Д. 14” mean?" },
    answer: { ru: "Это «адрес» документа в архиве: фонд № 1520, опись № 2, дело № 14. По шифру документ можно точно найти в каталоге — просто вставьте его в строку поиска.", kz: "Бұл құжаттың архивтегі «мекенжайы»: № 1520 қор, № 2 тізімдеме, № 14 іс. Шифр бойынша құжатты каталогтан дәл табуға болады — оны іздеу жолына қойыңыз.", en: "It is the document's “address” in the archive: fonds no. 1520, inventory no. 2, file no. 14. You can find the exact document by pasting the code into the catalogue search." },
  },
  {
    question: { ru: "Почему у некоторых документов нет цифровой копии?", kz: "Неліктен кейбір құжаттардың цифрлық көшірмесі жоқ?", en: "Why do some documents have no digital copy?" },
    answer: { ru: "Оцифровка идёт постепенно. Кроме того, некоторые документы имеют ограниченный доступ по закону (например, содержат персональные данные). Для них на сайте показано описание и условия доступа.", kz: "Цифрландыру біртіндеп жүргізіледі. Сонымен қатар кейбір құжаттарға заң бойынша қолжетімділік шектелген (мысалы, дербес деректер бар). Олар үшін сайтта сипаттамасы мен қолжетімділік шарттары көрсетілген.", en: "Digitisation is gradual. In addition, access to some documents is restricted by law (for example, they contain personal data). For these, the website shows the description and access conditions." },
  },
  {
    question: { ru: "Чем отличаются статусы «Открытый доступ», «Только описание» и «Ограниченный доступ»?", kz: "«Ашық қолжетімділік», «Тек сипаттама» және «Шектеулі қолжетімділік» мәртебелерінің айырмашылығы неде?", en: "What is the difference between “Open access”, “Description only” and “Restricted access”?" },
    answer: { ru: "Открытый доступ — описание и цифровая копия (если она есть) доступны на сайте. Только описание — на сайте опубликованы сведения о документе, сам документ можно изучить в читальном зале. Ограниченный доступ — доступ ограничен законодательством, на сайте только описание.", kz: "Ашық қолжетімділік — сипаттама және цифрлық көшірме (бар болса) сайтта қолжетімді. Тек сипаттама — сайтта құжат туралы мәліметтер жарияланған, құжаттың өзімен оқу залында танысуға болады. Шектеулі қолжетімділік — қолжетімділік заңнамамен шектелген, сайтта тек сипаттама.", en: "Open access — the description and the digital copy (if any) are available online. Description only — information about the document is published, and the document itself can be consulted in the reading room. Restricted access — access is limited by law; only the description is online." },
  },
  {
    question: { ru: "Как поделиться найденным документом?", kz: "Табылған құжатпен қалай бөлісуге болады?", en: "How do I share a document I found?" },
    answer: { ru: "В карточке документа нажмите «Поделиться ссылкой» или выберите Telegram, WhatsApp, Facebook. Ссылки на результаты поиска тоже можно отправлять — фильтры сохраняются в адресе страницы.", kz: "Құжат карточкасында «Сілтемемен бөлісу» батырмасын басыңыз немесе Telegram, WhatsApp, Facebook таңдаңыз. Іздеу нәтижелерінің сілтемелерін де жіберуге болады — сүзгілер бет мекенжайында сақталады.", en: "On the document page, click “Share link” or choose Telegram, WhatsApp or Facebook. You can also share search results — the filters are saved in the page address." },
  },
  {
    question: { ru: "Где хранится моё «Избранное»?", kz: "Менің «Таңдаулыларым» қайда сақталады?", en: "Where are my Favourites stored?" },
    answer: { ru: "Только в вашем браузере — регистрация не нужна. Если очистить данные браузера или открыть сайт на другом устройстве, список будет пустым.", kz: "Тек сіздің браузеріңізде — тіркелу қажет емес. Браузер деректерін тазаласаңыз немесе сайтты басқа құрылғыда ашсаңыз, тізім бос болады.", en: "Only in your browser — no registration is needed. If you clear browser data or open the site on another device, the list will be empty." },
  },
  {
    question: { ru: "Как найти ближайший филиал архива и построить маршрут?", kz: "Архивтің ең жақын филиалын қалай табуға және бағыт құруға болады?", en: "How do I find the nearest branch and get directions?" },
    answer: { ru: "Откройте раздел «Филиалы»: выберите филиал на карте или в списке и нажмите «Открыть в 2GIS» или «Открыть в Google Maps». Можно указать свой адрес или разрешить определение местоположения.", kz: "«Филиалдар» бөлімін ашыңыз: картадан немесе тізімнен филиалды таңдап, «2GIS-те ашу» немесе «Google Maps-те ашу» батырмасын басыңыз. Өз мекенжайыңызды көрсетуге немесе орналасқан жеріңізді анықтауға рұқсат беруге болады.", en: "Open the Branches section, choose a branch on the map or in the list and click “Open in 2GIS” or “Open in Google Maps”. You can enter your address or allow location detection." },
  },
  {
    question: { ru: "Как переключить язык и тёмную тему?", kz: "Тілді және қараңғы тақырыпты қалай ауыстыруға болады?", en: "How do I switch the language and the dark theme?" },
    answer: { ru: "Переключатель KZ / RU / EN и кнопка темы находятся в шапке сайта. Выбор запоминается: при следующем визите сайт откроется так же.", kz: "KZ / RU / EN ауыстырғышы мен тақырып батырмасы сайттың жоғарғы жағында орналасқан. Таңдау есте сақталады: келесі жолы сайт дәл солай ашылады.", en: "The KZ / RU / EN switcher and the theme button are in the site header. Your choice is remembered for your next visit." },
  },
  {
    question: { ru: "Есть ли версия для слабовидящих?", kz: "Нашар көретіндерге арналған нұсқа бар ма?", en: "Is there a low vision version?" },
    answer: { ru: "Да. Нажмите «Версия для слабовидящих» в верхней строке сайта (на телефоне — в меню): шрифт станет крупнее, контраст — выше.", kz: "Иә. Сайттың жоғарғы жолындағы (телефонда — мәзірде) «Нашар көретіндерге арналған нұсқа» батырмасын басыңыз: қаріп ірілейді, контраст жоғарылайды.", en: "Yes. Click “Low vision mode” in the top bar (in the menu on phones): the text becomes larger and the contrast higher." },
  },
  {
    question: { ru: "Как оставить отзыв или предложение о работе сайта?", kz: "Сайттың жұмысы туралы пікір немесе ұсынысты қалай қалдыруға болады?", en: "How can I leave feedback or a suggestion about the website?" },
    answer: { ru: "Через форму «Отзывы и предложения». Это не официальное обращение — для обращений используйте egov.kz. Имя и e-mail указывать необязательно.", kz: "«Пікірлер мен ұсыныстар» нысаны арқылы. Бұл ресми өтініш емес — өтініштер үшін egov.kz пайдаланыңыз. Аты мен e-mail міндетті емес.", en: "Use the Feedback form. It is not an official request — for those, please use egov.kz. Your name and email are optional." },
  },
  {
    question: { ru: "Что такое «Архив памяти» и онлайн-выставки?", kz: "«Жад архиві» және онлайн көрмелер дегеніміз не?", en: "What are the Memory Archive and online exhibitions?" },
    answer: { ru: "Это тематические подборки архивных документов и фотографий об истории Восточного Казахстана: коллекции, хронология, истории людей. Каждый материал ведёт к карточке в каталоге с указанием источника.", kz: "Бұл Шығыс Қазақстан тарихы туралы архив құжаттары мен фотосуреттерінің тақырыптық іріктемелері: топтамалар, хронология, адамдар тағдыры. Әр материал дереккөзі көрсетілген каталог карточкасына апарады.", en: "They are thematic selections of archival documents and photographs on the history of East Kazakhstan: collections, a timeline and personal stories. Each item links to a catalogue record with its source." },
  },
];
