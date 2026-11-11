// Монтажная сцена видеопрезентации.
// Главное правило: кадр — чистая функция времени. window.renderFrame(t) расставляет всё на экране
// для секунды t, рендер (scripts/render-video.mjs) вызывает её покадрово и делает снимки.
// Тайминг берётся из timeline.json (озвучка), запись экрана — из recordings/<сцена>/frames.json.

const FPS = 30;
const VIEW = { w: 1536, h: 864 };
const FADE = 0.22; // перекрытие сцен, секунд

// ───────────── Математика анимации ─────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ramp = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (x) => 1 - Math.pow(1 - x, 3);
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const backOut = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
/** 0→1 при появлении и 1→0 перед исчезновением */
const inOut = (t, from, to = 1e9, d = 0.4) => Math.min(ramp(t, from, from + d), 1 - ramp(t, to - d * 0.7, to));

function h(tag, cls, html = "", parent) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  el.innerHTML = html;
  parent?.appendChild(el);
  return el;
}
function show(el, opacity, { dx = 0, dy = 0, scale = 1, rot = 0 } = {}) {
  el.style.opacity = opacity;
  el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`;
}
/** Плавно выезжает снизу, потом растворяется */
function enter(el, t, from, to = 1e9, dy = 26) {
  const k = easeOut(inOut(t, from, to));
  show(el, k, { dy: (1 - k) * dy });
}
/** Удар штампа: крупно → на место, лёгкая отдача */
function stampIn(el, t, from, to = 1e9, rot = -3) {
  const a = ramp(t, from, from + 0.26);
  const after = t - from - 0.26;
  const scale = a < 1 ? lerp(2.4, 1, easeOut(a)) : 1 + 0.05 * Math.exp(-after * 9) * Math.cos(after * 30);
  show(el, Math.min(clamp(a * 2.5), 1 - ramp(t, to - 0.3, to)), { rot, scale });
}
const countUp = (n, k) => Math.round(n * easeOut(k)).toLocaleString("ru-RU");

/** Перенос субтитра на две строки (то же правило, что в build-timeline.mjs) */
function wrapCue(text, max = 42) {
  if (text.length <= max) return text;
  const middle = text.length / 2;
  const spaces = [...text].map((ch, i) => (ch === " " ? i : -1)).filter((i) => i > 0);
  const split = spaces.reduce((best, i) => (Math.abs(i - middle) < Math.abs(best - middle) ? i : best), spaces[0]);
  const cut = text.slice(split + 1, split + 3) === "— " ? split + 2 : split; // тире не переносим в начало второй строки
  return `${text.slice(0, cut)}\n${text.slice(cut + 1)}`;
}

/** Наезды камеры: ключи [время, масштаб, центр X, центр Y, длительность перехода] в координатах страницы */
function zoomAt(keys, t) {
  let cur = [1, VIEW.w / 2, VIEW.h / 2];
  for (const [at, s, cx, cy, d = 0.8] of keys) {
    if (t < at) break;
    const k = easeInOut(ramp(t, at, at + d));
    cur = [lerp(cur[0], s, k), lerp(cur[1], cx, k), lerp(cur[2], cy, k)];
  }
  return cur;
}

const ICON = {
  lock: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6b6257" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`,
  cursor: `<svg class="cursor" viewBox="0 0 26 26"><path d="M3 2l0 19 5.2-4.6 3.4 7.4 3.3-1.5-3.4-7.3 7-.4z" fill="#1e1a15" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  search: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#8e2a1f" stroke-width="1.6" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>`,
  doc: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#8e2a1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>`,
  pin: `<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#8e2a1f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.800 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`,
};

// ───────────── Окно браузера с записью экрана ─────────────
class Shot {
  constructor(parent, { dir, frames, urls, nameOf, cursor = true }) {
    Object.assign(this, { dir, frames, urls, nameOf });
    this.el = h("div", "browser", `<div class="bar"><div class="dots"><i></i><i></i><i></i></div><div class="address">${ICON.lock}<span></span></div></div>
      <div class="view"><div class="page"><img class="shot" alt=""><div class="over abs" style="inset:0"></div><div class="ripple"></div>${cursor ? ICON.cursor : ""}</div></div>`, parent);
    this.page = this.el.querySelector(".page");
    this.img = this.el.querySelector("img.shot");
    this.over = this.el.querySelector(".over");
    this.address = this.el.querySelector(".address span");
    this.ripple = this.el.querySelector(".ripple");
    this.cursor = this.el.querySelector(".cursor");
    this.clicks = frames.map((f, i) => (f[3] ? i : -1)).filter((i) => i >= 0);
    this.scale = 1;
  }

  prettyUrl(url) {
    let text = url.replace(/^https?:\/\//, "");
    try { text = decodeURIComponent(text); } catch {}
    text = text.replace(/[?&]created=1/, "").replace(/&p=1$/, "");
    if (text.length > 104) text = `${text.slice(0, 103)}…`;
    const slash = text.indexOf("/");
    return slash < 0 ? `<b>${text}</b>` : `<b>${text.slice(0, slash)}</b>${text.slice(slash)}`;
  }

  async frame(index) {
    const i = clamp(Math.floor(index), 0, this.frames.length - 1);
    const [image, x, y] = this.frames[i];
    const src = `/recordings/${this.dir}/${this.nameOf(image)}`;
    if (this.src !== src) {
      this.src = src;
      this.img.src = src;
      await this.img.decode().catch(() => {});
      this.address.innerHTML = this.prettyUrl(this.urls[image] ?? "");
    }
    if (this.cursor) this.cursor.style.transform = `translate(${x}px, ${y}px) scale(${1 / this.scale})`;
    // Подсветка клика: расходящийся круг в точке нажатия
    let click = -1;
    for (const c of this.clicks) if (c <= i && i - c < 14) click = c;
    if (click >= 0) {
      const k = (i - click) / 14;
      const [, cx, cy] = this.frames[click];
      this.ripple.style.opacity = 1 - k;
      this.ripple.style.transform = `translate(${cx}px, ${cy}px) scale(${lerp(0.25, 1.15, easeOut(k)) / this.scale})`;
    } else this.ripple.style.opacity = 0;
  }

  zoom(s, cx, cy) {
    this.scale = s;
    const tx = clamp(VIEW.w / 2 - cx * s, VIEW.w - VIEW.w * s, 0);
    const ty = clamp(VIEW.h / 2 - cy * s, VIEW.h - VIEW.h * s, 0);
    this.page.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  }

  /** Рамка-подсветка вокруг элемента страницы */
  hl([x, y, w, hgt], cls = "", pad = 6) {
    const el = h("div", `hl ${cls}`, "", this.over);
    Object.assign(el.style, { left: `${x - pad}px`, top: `${y - pad}px`, width: `${w + pad * 2}px`, height: `${hgt + pad * 2}px` });
    return el;
  }
}

/** Сцена «запись экрана + наезды + подсветки + свои надписи» */
function shotScene(root, rec, dir, cfg) {
  const shot = new Shot(root, { dir, frames: rec.frames, urls: rec.urls, nameOf: cfg.nameOf ?? ((n) => `i${String(n).padStart(5, "0")}.jpg`), cursor: cfg.cursor ?? true });
  const hls = (cfg.hls ?? []).map((item) => ({ ...item, el: shot.hl(item.box, item.cls) }));
  const extra = cfg.build?.(root, shot);
  return async (t) => {
    const [s, cx, cy] = zoomAt(cfg.zoom ?? [], t);
    shot.zoom(s, cx, cy);
    await shot.frame(Math.max(0, t) * FPS);
    for (const item of hls) {
      const k = inOut(t, item.from, item.to, 0.3);
      item.el.style.opacity = k;
      item.el.style.transform = `scale(${1 + (1 - k) * 0.06})`;
    }
    await extra?.(t);
  };
}

/** Время фраз сцены от её начала */
const clock = (sc) => ({
  p: (i) => sc.phrases[i].start - sc.start,
  c: (i, j) => sc.phrases[i].cues[j].start - sc.start,
  cEnd: (i, j) => sc.phrases[i].cues[j].end - sc.start,
});

// ───────────── Сцены ─────────────
const SCENES = {
  // 01. Титул: печать «ГА», название, слоган
  "01-title"(root, sc) {
    const t0 = clock(sc);
    const seal = h("div", "seal", "ГА", root);
    Object.assign(seal.style, { left: "880px", top: "112px", width: "160px", height: "160px", fontSize: "62px" });
    const title = h("div", "abs h1", "", root);
    Object.assign(title.style, { left: "160px", width: "1600px", top: "322px", textAlign: "center" });
    const words = "Государственный архив|Восточно-Казахстанской области".split("|").map((line) => {
      const row = h("div", "", "", title);
      return line.split(" ").map((w) => { const span = h("span", "", `${w} `, row); span.style.display = "inline-block"; span.style.whiteSpace = "pre"; return span; });
    }).flat();
    const kz = h("div", "abs", "Шығыс Қазақстан облысының мемлекеттік архиві", root);
    Object.assign(kz.style, { left: "160px", width: "1600px", top: "540px", textAlign: "center", font: "400 36px/1 var(--sans)", color: "var(--muted)" });
    const dots = h("div", "dots-line", "", root);
    Object.assign(dots.style, { left: "885px", top: "612px" });
    const tag = h("div", "abs serif", "Архив, который понимает ваш вопрос", root);
    Object.assign(tag.style, { left: "160px", width: "1600px", top: "668px", textAlign: "center", font: "italic 400 60px/1.2 var(--serif)", color: "var(--accent)" });
    const line = h("div", "abs", "", root);
    Object.assign(line.style, { left: "510px", top: "756px", height: "4px", background: "var(--accent)", borderRadius: "2px" });
    const kicker = h("div", "abs kicker", "Переосмысление сайта · Code Masters Hackathon 9.0", root);
    Object.assign(kicker.style, { left: "160px", width: "1600px", top: "846px", textAlign: "center" });
    return (t) => {
      stampIn(seal, t, 0.25, 1e9, -6);
      words.forEach((w, i) => enter(w, t, t0.p(0) + i * 0.24, 1e9, 30));
      enter(kz, t, t0.p(0) + 1.5);
      enter(dots, t, t0.p(0) + 1.9, 1e9, 0);
      enter(tag, t, t0.p(1) - 0.1);
      line.style.width = `${900 * easeInOut(ramp(t, t0.p(1) + 0.5, t0.p(1) + 1.7))}px`;
      enter(kicker, t, t0.p(1) + 1.2, 1e9, 0);
    };
  },

  // 02. Действующий сайт: «как сейчас»
  "02-old-site"(root, sc, data) {
    const t0 = clock(sc);
    const cut = [t0.p(1) - 0.1, t0.p(2) - 0.1, t0.c(3, 1) - 0.1]; // главная → фонды → главная → платные услуги
    const duration = sc.end - sc.start + 1;
    const frames = Array.from({ length: Math.ceil(duration * FPS) }, (_, i) => {
      const t = i / FPS;
      return [t < cut[0] ? 1 : t < cut[1] ? 2 : t < cut[2] ? 1 : 3, 0, 0, 0];
    });
    const urls = ["", ...["home", "funds", "paid"].map((n) => data.stills.stills.find((s) => s.name === n).url)];
    const lang = [1176, 168, 74, 28], branches = [700, 222, 150, 36], files = [288, 86, 658, 142], price = [288, 86, 658, 40];
    return shotScene(root, { frames, urls }, "02-old-site", {
      cursor: false,
      nameOf: (n) => ["", "home.jpg", "funds.jpg", "paid.jpg"][n],
      zoom: [
        [0.2, 1.1, 768, 400, 2.6],
        [cut[0], 1, 768, 432, 0.01], [cut[0] + 0.3, 1.4, 640, 230],
        [cut[1], 1, 768, 432, 0.01], [cut[1] + 0.2, 1.55, 790, 250],
        [t0.c(3, 0) - 0.1, 1.55, 1150, 190, 0.7],
        [cut[2], 1, 768, 432, 0.01], [cut[2] + 0.2, 1.4, 640, 230],
      ],
      hls: [
        { box: files, from: cut[0] + 0.7, to: cut[1], cls: "" },
        { box: branches, from: cut[1] + 0.6, to: t0.c(3, 0) - 0.1 },
        { box: lang, from: t0.c(3, 0) + 0.4, to: cut[2] },
        { box: price, from: cut[2] + 0.6, to: 99 },
      ],
      build(scene) {
        const was = h("div", "stamp lock", "Как сейчас", scene);
        Object.assign(was.style, { right: "236px", top: "104px", fontSize: "34px" });
        const notes = [
          ["Фонды — файлы Excel", "чтобы посмотреть, нужно скачать", cut[0] + 0.6, cut[1]],
          ["Филиалы — отдельные сайты", "ссылка переключает сайт целиком", cut[1] + 0.5, t0.c(3, 0) - 0.1],
          ["Только «Қаз» и «Рус»", "английской версии нет", t0.c(3, 0) + 0.3, cut[2]],
          ["Прейскурант — скан", "15 страниц без поиска", cut[2] + 0.5, 99],
        ].map(([title, sub, from, to]) => {
          const el = h("div", "note lock", `${title}<small>${sub}</small>`, scene);
          Object.assign(el.style, { left: "1090px", top: "610px" });
          return { el, from, to };
        });
        return (t) => {
          stampIn(was, t, 0.5, 99, 4);
          for (const n of notes) enter(n.el, t, n.from, n.to);
        };
      },
    });
  },

  // 03. Идея: три простые задачи
  "03-idea"(root, sc) {
    const t0 = clock(sc);
    const kicker = h("div", "abs kicker", "Идея нового сайта", root);
    Object.assign(kicker.style, { left: "160px", top: "150px" });
    const title = h("div", "abs h2", "Три простые задачи", root);
    Object.assign(title.style, { left: "160px", top: "196px", fontSize: "76px" });
    const dots = h("div", "dots-line", "", root);
    Object.assign(dots.style, { left: "162px", top: "312px" });
    const from = t0.c(0, 1), span = t0.cEnd(0, 1) - from;
    const cards = [
      ["01", ICON.search, "Найти документ", "Запрос обычными словами, по шифру или через фильтры"],
      ["02", ICON.doc, "Понять, что в нём", "Карточка, скан и понятный статус доступа"],
      ["03", ICON.pin, "Дойти до архива", "13 филиалов на одной карте и маршрут"],
    ].map(([num, icon, name, text], i) => {
      const el = h("div", "card", `<div style="display:flex;justify-content:space-between;align-items:flex-start"><span class="num">${num}</span>${icon}</div><h3 style="margin-top:56px;font-size:41px;white-space:nowrap">${name}</h3><p style="margin-top:18px">${text}</p>`, root);
      Object.assign(el.style, { left: `${160 + i * 548}px`, top: "390px", width: "504px", height: "400px", padding: "40px 44px" });
      return { el, at: from + [0, 0.3, 0.63][i] * span - 0.15 };
    });
    return (t) => {
      enter(kicker, t, 0.2, 1e9, 0);
      enter(title, t, 0.35);
      enter(dots, t, 0.7, 1e9, 0);
      for (const c of cards) { const k = ramp(t, c.at, c.at + 0.55); show(c.el, clamp(k * 2), { dy: (1 - backOut(k)) * 70 }); }
    };
  },

  // 04. Школьник: запрос своими словами → чипы «Поняли запрос так» → карточка и скан
  "04-search"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["04-search"], m = rec.marks;
    const chips = m.chips.chips, bar = m.chips.bar[0], box = m.chips.box[0];
    const land = [t0.p(1) + 1.25, t0.p(1) + 2.1, t0.p(1) + 2.75]; // «тип документа, место и годы»
    return shotScene(root, rec, "04-search", {
      zoom: [
        [0.15, 1.45, 544, 640],
        [m.submit.time - 0.1, 1, 768, 432, 0.5],
        [t0.p(1) - 0.2, 1.5, 900, 400],
        [t0.p(2) - 0.4, 1, 768, 432],
        [m.card.time + 0.5, 1.28, 540, 470],
        [t0.p(4) - 0.2, 1.2, 768, 150],
      ],
      hls: [
        { box, from: t0.c(1, 1), to: t0.p(2) - 0.4, cls: "teal" },
        { box: [160, 88, 1216, 46], from: t0.p(4) + 0.3, to: 99, cls: "teal" },
      ],
      build(scene, shot) {
        const labels = ["Фото", "Усть-Каменогорск", "1960–1969"];
        const starts = [bar[0] + 60, bar[0] + 160, bar[0] + 275];
        // Настоящие чипы на снимке прикрыты, пока к ним «летит» распознанное слово из строки поиска
        const fly = chips.map((c, i) => {
          const cover = h("div", "cover", "", shot.over);
          Object.assign(cover.style, { left: `${c[0] - 3}px`, top: `${c[1] - 3}px`, width: `${c[2] + 6}px`, height: `${c[3] + 6}px` });
          return { cover, chip: h("div", "chipfly", labels[i], shot.over), from: [starts[i], bar[1] + 6], to: [c[0], c[1]] };
        });
        const names = h("div", "note teal", `Одно место — разные названия<small>Өскемен · Усть-Каменогорск · Ust-Kamenogorsk</small><small>Лениногорск → Риддер &nbsp;·&nbsp; Зыряновск → Алтай</small>`, scene);
        Object.assign(names.style, { left: "1040px", top: "300px" });
        const langs = h("div", "row", `<span class="pill on">ҚАЗ</span><span class="pill on">РУС</span><span class="pill on">ENG</span>`, scene);
        Object.assign(langs.style, { left: "1040px", top: "236px" });
        const demo = h("div", "stamp teal", "Демо-запись", scene);
        Object.assign(demo.style, { left: "1260px", top: "330px", fontSize: "38px" });
        const submit = m.chips.frame / FPS;
        return (t) => {
          fly.forEach((f, i) => {
            const k = ramp(t, land[i] - 0.6, land[i]);
            f.cover.style.opacity = t >= submit && t < land[i] ? 1 : 0;
            const e = easeInOut(k);
            f.chip.style.opacity = t >= land[i] - 0.6 && t < land[i] + 0.12 ? 1 : 0;
            f.chip.style.transform = `translate(${lerp(f.from[0], f.to[0], e)}px, ${lerp(f.from[1], f.to[1], e) - Math.sin(k * Math.PI) * 26}px) scale(${1 + Math.sin(k * Math.PI) * 0.25})`;
          });
          enter(langs, t, t0.p(2) + 0.1, t0.p(3) - 0.5);
          enter(names, t, t0.p(2) + 0.9, t0.p(3) - 0.5);
          stampIn(demo, t, t0.c(4, 1) - 0.1, 99, -5);
        };
      },
    });
  },

  // 05. Историк: шифр, копирование, ссылка с фильтрами, перечень фондов
  "05-catalog"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["05-catalog"], m = rec.marks;
    const cipher = m.card.cipher[0];
    return shotScene(root, rec, "05-catalog", {
      zoom: [
        [1.2, 1.25, 781, 340],
        [m.card.time - 0.1, 1, 768, 432, 0.4],
        [m.card.time + 0.5, 1.5, 1010, 440],
        [m.copied.time + 0.6, 1, 768, 432, 0.5],
        [m.registryAll.time + 0.3, 1.35, 640, 470],
        [m.registry.time - 1.2, 1.15, 768, 420],
      ],
      hls: [
        { box: [cipher[0] - 8, cipher[1] - 6, cipher[2] + 190, cipher[3] + 12], from: m.card.time + 1.2, to: m.copied.time + 0.7 },
        { box: [282, 520, 250, 30], from: m.registryAll.time + 0.9, to: m.registry.time - 1.3, cls: "teal" },
      ],
      build(scene) {
        const text = "Ф. 1520 · Оп. 1 · Д. 3";
        const tw = h("div", "tw", `<div class="line"><span></span><i class="caret"></i></div><div class="legend">фонд &nbsp;·&nbsp; опись &nbsp;·&nbsp; дело</div>`, scene);
        Object.assign(tw.style, { left: "430px", width: "1060px", top: "560px" });
        const typed = tw.querySelector("span"), caret = tw.querySelector(".caret");
        const link = h("div", "note teal", `Ссылка помнит фильтры<small class="mono" style="font-family:var(--mono);font-size:24px;color:var(--accent-2)">…/ru/catalog?type=PHOTO&amp;digital=1</small>`, scene);
        Object.assign(link.style, { left: "330px", top: "92px" });
        const total = h("div", "card", `<div class="n serif" style="font:700 110px/1 var(--serif);color:var(--accent-2)"></div><div style="margin-top:10px;font:400 30px/1.25 var(--sans);color:var(--muted)">фондов в перечне архива</div>`, scene);
        Object.assign(total.style, { left: "1190px", top: "330px", width: "470px", padding: "34px 40px" });
        const totalN = total.querySelector(".n");
        return (t) => {
          enter(tw, t, 0.35, m.card.time - 0.1);
          const n = Math.floor(clamp((t - 0.6) / 0.075, 0, text.length));
          typed.textContent = text.slice(0, n);
          caret.style.opacity = n < text.length || Math.floor(t * 2.5) % 2 === 0 ? 1 : 0;
          enter(link, t, m.url.time - 0.5, m.registryAll.time - 0.1, -20);
          enter(total, t, t0.p(2) + 0.7, m.registry.time - 1.1);
          totalN.textContent = countUp(1667, ramp(t, t0.p(2) + 0.8, t0.p(2) + 1.9));
        };
      },
    });
  },

  // 06. Пенсионер: карта филиалов, карточка, маршрут
  "06-branches"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["06-branches"], m = rec.marks;
    return shotScene(root, rec, "06-branches", {
      zoom: [
        [0.05, 1.32, 958, 640, 0.9],
        [t0.p(1) - 1.0, 1, 768, 432, 0.6],
        [m.branchCard.time - 0.2, 1.45, 480, 600],
        [t0.p(2) - 0.1, 1.45, 1060, 600],
      ],
      hls: [
        { box: m.route.gis[0], from: m.route.time + 0.3, to: 99 },
        { box: m.route.google[0], from: m.route.time + 1.1, to: 99, cls: "teal" },
      ],
      build(scene, shot) {
        const pins = m.markers.markers.map(([x, y], i) => ({ el: h("div", "pin", "ГА", shot.over), x, y, at: 0.55 + i * 0.085 }));
        const count = h("div", "stamp teal", "13 филиалов", scene);
        Object.assign(count.style, { left: "1330px", top: "112px", fontSize: "38px" });
        const route = h("div", "card", `<svg width="560" height="120" viewBox="0 0 560 120">
            <circle cx="40" cy="60" r="11" fill="#2b6fd6" stroke="#fff" stroke-width="4"/>
            <clipPath id="reveal"><rect id="revealRect" x="0" y="0" width="0" height="120"/></clipPath>
            <path d="M58 60 C 170 -10, 370 130, 500 52" fill="none" stroke="#8e2a1f" stroke-width="5" stroke-linecap="round" stroke-dasharray="14 12" clip-path="url(#reveal)"/>
            <g id="dest"><path d="M512 62s20-17 20-31a20 20 0 0 0-40 0c0 14 20 31 20 31z" fill="#1f5e6b" stroke="#fff" stroke-width="3"/><circle cx="512" cy="30" r="7" fill="#fff"/></g>
          </svg>
          <div style="display:flex;justify-content:space-between;font:700 24px/1.2 var(--sans)"><span>Усть-Каменогорск</span><span>Риддерский филиал</span></div>
          <div style="margin-top:8px;font:400 22px/1.2 var(--sans);color:var(--muted);text-align:center">≈ 78 км по прямой · адрес введён вручную</div>`, scene);
        Object.assign(route.style, { left: "236px", top: "104px", padding: "22px 30px 24px" });
        const reveal = route.querySelector("#revealRect"), dest = route.querySelector("#dest");
        const shown = m.markersShown.frame / FPS;
        return (t) => {
          for (const p of pins) {
            const k = ramp(t, p.at, p.at + 0.42);
            p.el.style.opacity = t < shown ? clamp(k * 3) : 0;
            p.el.style.transform = `translate(${p.x}px, ${p.y - (1 - backOut(k)) * 240}px) rotate(-45deg)`;
          }
          stampIn(count, t, 2.0, t0.p(1) - 0.9, -4);
          enter(route, t, m.route.time + 0.2, 99, -20);
          const k = easeInOut(ramp(t, m.route.time + 0.5, m.route.time + 1.9));
          reveal.setAttribute("width", 560 * k); // пунктир маршрута «прорисовывается» слева направо
          dest.style.opacity = ramp(t, m.route.time + 1.7, m.route.time + 2.0);
          dest.style.transform = `translateY(${(1 - backOut(ramp(t, m.route.time + 1.7, m.route.time + 2.1))) * -40}px)`;
        };
      },
    });
  },

  // 07. Выставка и «Архив памяти»
  "07-exhibitions"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["07-exhibitions"], m = rec.marks;
    const mem = m["memory:memory"].time, tl = m["memory:timeline"].time, cal = m["memory:calendar"].time;
    return shotScene(root, rec, "07-exhibitions", {
      zoom: [
        [0, 1.08, 620, 420, 0.01], [0.3, 1, 768, 432, 1.6],
        [m.lightbox.time + 0.4, 1.15, 768, 520],
        [mem - 0.5, 1, 768, 432, 0.4],
        [cal + 0.5, 1.22, 620, 430],
      ],
      build(scene) {
        const tabs = h("div", "row", `<span class="pill">Коллекции</span><span class="arrow">·</span><span class="pill">Хронология</span><span class="arrow">·</span><span class="pill">Календарь памятных дат</span>`, scene);
        Object.assign(tabs.style, { left: "250px", top: "800px" });
        const pills = [...tabs.querySelectorAll(".pill")];
        const source = h("div", "stamp teal", "Источник подписан", scene);
        Object.assign(source.style, { left: "1330px", top: "610px", fontSize: "28px" });
        const dates = h("div", "stamp", "196 памятных дат", scene);
        Object.assign(dates.style, { left: "1240px", top: "560px", fontSize: "36px" });
        void t0;
        return (t) => {
          enter(tabs, t, mem - 0.1, 99, -16);
          const active = t < tl ? 0 : t < cal ? 1 : 2;
          pills.forEach((p, i) => (p.className = `pill ${i === active ? "on" : ""}`));
          stampIn(source, t, m.lightbox.time + 1.3, mem - 0.4, -4);
          stampIn(dates, t, cal + 1.0, 99, -4);
        };
      },
    });
  },

  // 08. Языки, тёмная тема, версия для слабовидящих, телефон
  "08-for-everyone"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["08-for-everyone"], m = rec.marks;
    const mobile = data.recs["08-mobile"];
    const phoneAt = m.lowVision.time + 0.9;
    return shotScene(root, rec, "08-for-everyone", {
      zoom: [[0.1, 1.2, 900, 300], [t0.p(1) - 0.3, 1, 768, 432, 0.6]],
      build(scene, shot) {
        const langs = h("div", "row", `<span class="pill">Қазақша</span><span class="pill">Русский</span><span class="pill">English</span>`, scene);
        Object.assign(langs.style, { left: "250px", top: "760px" });
        const pills = [...langs.querySelectorAll(".pill")];
        pills.forEach((p) => Object.assign(p.style, { fontSize: "34px", padding: "14px 30px" }));
        const modes = h("div", "row", `<span class="pill">Тёмная тема</span><span class="pill">Версия для слабовидящих</span><span class="pill">Мобильная версия</span>`, scene);
        Object.assign(modes.style, { left: "250px", top: "780px" });
        const modePills = [...modes.querySelectorAll(".pill")];
        modePills.forEach((p) => Object.assign(p.style, { fontSize: "28px", padding: "12px 24px" }));
        const phone = h("div", "phone", `<div class="screen"><img alt=""><div class="island"></div></div>`, scene);
        phone.style.top = "96px";
        const phoneImg = phone.querySelector("img");
        let src = "";
        const modeAt = [m.dark.time - 0.3, m.lowVision.time - 0.3, phoneAt];
        return async (t) => {
          enter(langs, t, 0.3, t0.p(1) - 0.3);
          const active = t < m.kz.time - 0.25 ? 1 : t < m.en.time - 0.25 ? 0 : 2;
          pills.forEach((p, i) => (p.className = `pill ${i === active ? "on" : ""}`));
          enter(modes, t, t0.p(1) + 0.1, 99);
          modePills.forEach((p, i) => (p.className = `pill ${t >= modeAt[i] ? "on" : ""}`));
          const k = easeOut(ramp(t, phoneAt, phoneAt + 0.7));
          phone.style.opacity = clamp(k * 3);
          phone.style.left = `${lerp(1960, 1300, k)}px`;
          phone.style.transform = `rotate(${lerp(8, 2, k)}deg)`;
          shot.el.style.filter = `brightness(${1 - 0.18 * k})`;
          const [image] = mobile.frames[clamp(Math.floor((t - phoneAt - 0.3) * FPS), 0, mobile.frames.length - 1)];
          const next = `/recordings/08-mobile/i${String(image).padStart(5, "0")}.jpg`;
          if (next !== src) { src = next; phoneImg.src = next; await phoneImg.decode().catch(() => {}); }
        };
      },
    });
  },

  // 09. Услуги (справочно) и ИИ-помощник
  "09-services-assistant"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["09-services-assistant"], m = rec.marks;
    return shotScene(root, rec, "09-services-assistant", {
      zoom: [
        [0.1, 1.2, 768, 400],
        [m.notice.time - 0.6, 1, 768, 432, 0.5],
        [m.notice.time + 1.2, 1.3, 768, 340],
        [m.noticeTop.time - 0.5, 1.3, 768, 360, 0.6],
        [t0.p(3) - 0.5, 1, 768, 432, 0.5],
        [t0.p(3) + 0.6, 1.75, 1344, 300],
        [m.answer.time - 1.0, 1.75, 1344, 520, 1.1],
      ],
      hls: [
        { box: m.block.block[0], from: 0.5, to: m.notice.time - 0.6 },
        { box: m.noticeTop.notice[0], from: m.noticeTop.time + 0.1, to: t0.p(3) - 0.5, cls: "teal" },
      ],
      build(scene) {
        const info = h("div", "stamp teal", "Только справка", scene);
        Object.assign(info.style, { left: "1290px", top: "262px", fontSize: "34px" });
        const links = h("div", "note teal", `Оформление — на официальных сервисах<small>eGov · e-Otinish — внешние ссылки</small>`, scene);
        Object.assign(links.style, { left: "250px", top: "560px" });
        const ai = h("div", "note", `Отвечает по данным архива<small>со ссылками на карточки и шифрами</small>`, scene);
        Object.assign(ai.style, { left: "250px", top: "640px" });
        const price = h("div", "stamp", "218 позиций прейскуранта", scene);
        Object.assign(price.style, { left: "1120px", top: "690px", fontSize: "28px" });
        return (t) => {
          stampIn(price, t, m.price.time - 0.6, m.noticeTop.time - 0.5, -3);
          stampIn(info, t, t0.p(2) + 1.0, t0.p(3) - 0.5, -4);
          enter(links, t, t0.p(2) + 2.0, t0.p(3) - 0.5);
          enter(ai, t, m.asked.time + 0.9, 99);
        };
      },
    });
  },

  // 10. Панель сотрудника: документ → проверка → публикация → журнал → аналитика
  "10-admin"(root, sc, data) {
    const t0 = clock(sc);
    const rec = data.recs["10-admin"], m = rec.marks;
    const zero = m.zero.zero[0];
    return shotScene(root, rec, "10-admin", {
      zoom: [
        [0.2, 1.12, 720, 340, 1.4],
        [m.draft.time - 0.5, 1, 768, 432, 0.4],
        [m.uploaded.time - 0.5, 1.25, 700, 640, 0.6],
        [m.uploaded.time + 0.9, 1, 768, 432, 0.5],
        [m.review.time - 0.1, 1.3, 1150, 330, 0.6],
        [m.audit.time - 0.15, 1, 768, 432, 0.15],
        [m.audit.time + 0.3, 1.18, 900, 330],
        [m.analytics.time - 0.15, 1, 768, 432, 0.15],
        [m.zero.time - 0.2, 1.3, zero[0] + zero[2] / 2, zero[1] + zero[3] / 2],
      ],
      hls: [{ box: zero, from: m.zero.time + 0.5, to: 99 }],
      build(scene) {
        const steps = ["Черновик", "На проверке", "Одобрено", "Опубликовано"];
        const flow = h("div", "row", steps.map((s) => `<span class="pill">${s}</span>`).join(`<span class="arrow">→</span>`), scene);
        Object.assign(flow.style, { left: "250px", top: "800px" });
        const pills = [...flow.querySelectorAll(".pill")];
        pills.forEach((p) => Object.assign(p.style, { fontSize: "27px", padding: "12px 22px" }));
        const at = [m.draft.time + 0.5, m.review.time - 0.1, m.approved.time - 0.1, m.published.time - 0.1];
        const local = h("div", "stamp lock", "Локальный стенд · демо-сотрудники", scene);
        Object.assign(local.style, { right: "236px", top: "100px", fontSize: "20px", borderWidth: "3px" });
        const audit = h("div", "note", `Журнал действий<small>кто, что и когда изменил</small>`, scene);
        Object.assign(audit.style, { left: "1160px", top: "770px" });
        const stats = h("div", "note teal", `Ищут, но не находят<small>демо-статистика локального стенда</small>`, scene);
        Object.assign(stats.style, { left: "250px", top: "800px" });
        void t0;
        return (t) => {
          enter(flow, t, m.draft.time - 0.3, m.audit.time - 0.1);
          const step = at.filter((x) => t >= x).length - 1;
          pills.forEach((p, i) => (p.className = `pill ${i === step ? "on" : i < step ? "done" : ""}`));
          stampIn(local, t, 0.6, 99, 3);
          enter(audit, t, m.audit.time + 0.2, m.analytics.time - 0.1);
          enter(stats, t, m.zero.time - 0.2, 99);
        };
      },
    });
  },

  // 11. Архитектура: схема с бегущими точками
  "11-architecture"(root, sc) {
    const t0 = clock(sc);
    const kicker = h("div", "abs kicker", "Как это устроено", root);
    Object.assign(kicker.style, { left: "140px", top: "96px" });
    const title = h("div", "abs h2", "Один проект — без лишней инфраструктуры", root);
    Object.assign(title.style, { left: "140px", top: "136px" });
    const svg = h("div", "abs", `<svg width="1920" height="1080" viewBox="0 0 1920 1080"><defs>
        <marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6b6257"/></marker>
        <marker id="arrA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8e2a1f"/></marker></defs>
      <g id="edges" fill="none" stroke="#6b6257" stroke-width="3"></g><g id="dots"></g></svg>`, root);
    Object.assign(svg.style, { left: "0", top: "0" });
    const edgesG = svg.querySelector("#edges"), dotsG = svg.querySelector("#dots");
    const NS = "http://www.w3.org/2000/svg";
    const node = (x, y, w, hgt, name, sub, extra = "") => {
      const el = h("div", "card", `<div style="font:700 38px/1.1 var(--serif)">${name}</div><div style="margin-top:8px;font:400 23px/1.3 var(--sans);color:var(--muted)">${sub}</div>`, root);
      Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${hgt}px`, padding: "24px 30px" });
      if (extra) el.style.cssText += extra;
      return el;
    };
    const browser = node(140, 350, 320, 140, "Браузер", "посетитель и сотрудник");
    const next = node(610, 320, 420, 200, "Next.js", "сайт и панель сотрудника —<br>один проект", "border-top:6px solid var(--accent);");
    const db = node(1220, 250, 520, 130, "PostgreSQL", "каталог, полнотекстовый поиск");
    const storage = node(1220, 420, 520, 130, "Хранилище файлов", "сканы: открытые и закрытые");
    const claude = node(610, 660, 420, 150, "Claude API", `<span class="mono" style="font-family:var(--mono);font-size:19px">search_catalog · get_document</span>`, "border-top:6px solid var(--accent-2);");
    const fallback = node(1220, 660, 520, 150, "Разбор запроса без ИИ", "годы, места, типы документов — словари", "border:3px dashed var(--accent);background:var(--lock-soft);");
    const off = h("div", "stamp lock", "Недоступен", root);
    Object.assign(off.style, { left: "700px", top: "704px", fontSize: "30px", background: "rgba(255,253,248,.95)" });
    const mkEdge = (x1, y1, x2, y2, { dashed = false, both = false, accent = false } = {}) => {
      const line = document.createElementNS(NS, "line");
      Object.entries({ x1, y1, x2, y2 }).forEach(([k, v]) => line.setAttribute(k, v));
      line.setAttribute("marker-end", `url(#${accent ? "arrA" : "arr"})`);
      if (both) line.setAttribute("marker-start", `url(#${accent ? "arrA" : "arr"})`);
      if (dashed) line.setAttribute("stroke-dasharray", "12 10");
      if (accent) line.setAttribute("stroke", "#8e2a1f");
      edgesG.appendChild(line);
      const dots = [0, 1, 2].map(() => { const c = document.createElementNS(NS, "circle"); c.setAttribute("r", 8); c.setAttribute("fill", accent ? "#8e2a1f" : "#1f5e6b"); dotsG.appendChild(c); return c; });
      return { line, dots, x1, y1, x2, y2 };
    };
    const eBrowser = mkEdge(470, 420, 600, 420, { both: true });
    const eDb = mkEdge(1040, 390, 1210, 325, { both: true });
    const eStorage = mkEdge(1040, 450, 1210, 480, { both: true });
    const eClaude = mkEdge(820, 530, 820, 650, { both: true });
    const eFallback = mkEdge(1040, 500, 1250, 650, { dashed: true, both: true, accent: true });
    const run = (e, t, on, speed = 0.55, reverse = false) => {
      e.line.style.opacity = on;
      e.dots.forEach((c, i) => {
        let u = (t * speed + i / 3) % 1;
        if (reverse) u = 1 - u;
        c.setAttribute("cx", lerp(e.x1, e.x2, u));
        c.setAttribute("cy", lerp(e.y1, e.y2, u));
        c.style.opacity = on * Math.sin(u * Math.PI);
      });
    };
    const toolNote = h("div", "abs", "вызывает поиск ↑<br>отвечает найденным ↓", root);
    Object.assign(toolNote.style, { left: "846px", top: "556px", font: "400 22px/1.3 var(--sans)", color: "var(--accent-2)" });
    const badges = ["Права — на сервере", "Пароли — bcrypt", "Заголовки CSP", "Закрытый скан → 403"].map((text, i) => {
      const el = h("div", `stamp ${i === 3 ? "" : "ok"}`, text, root);
      Object.assign(el.style, { left: `${140 + i * 410}px`, top: "858px", fontSize: "25px", width: "380px", textAlign: "center" });
      return el;
    });
    return (t) => {
      enter(kicker, t, 0.15, 1e9, 0);
      enter(title, t, 0.3);
      enter(browser, t, 0.5); enter(next, t, 0.8); enter(db, t, 1.3); enter(storage, t, 1.6);
      const aiOff = ramp(t, t0.p(2) + 0.2, t0.p(2) + 0.7);
      const k = easeOut(ramp(t, t0.p(1) - 0.1, t0.p(1) + 0.4));
      show(claude, k * (1 - 0.6 * aiOff), { dy: (1 - k) * 26 });
      enter(toolNote, t, t0.c(1, 1) - 0.1, t0.p(2) + 0.2, 0);
      stampIn(off, t, t0.p(2) + 0.3, 99, -5);
      enter(fallback, t, t0.p(2) + 0.9);
      run(eBrowser, t, ramp(t, 1.0, 1.4));
      run(eDb, t, ramp(t, 1.5, 1.9));
      run(eStorage, t, ramp(t, 1.8, 2.2), 0.4);
      run(eClaude, t, ramp(t, t0.p(1) + 0.3, t0.p(1) + 0.7) * (1 - aiOff), 0.7, Math.floor(t * 0.7) % 2 === 1);
      run(eFallback, t, ramp(t, t0.p(2) + 1.2, t0.p(2) + 1.6), 0.6);
      badges.forEach((b, i) => stampIn(b, t, t0.p(3) + [0.2, 0.9, 1.5, 2.6][i], 99, i % 2 ? 2 : -2));
    };
  },

  // 12. Результат в цифрах
  "12-numbers"(root, sc) {
    const t0 = clock(sc);
    const kicker = h("div", "abs kicker", "Результат", root);
    Object.assign(kicker.style, { left: "160px", top: "130px" });
    const big = h("div", "abs big", "0", root);
    Object.assign(big.style, { left: "150px", top: "190px" });
    const of = h("div", "abs", `<div style="font:700 54px/1.15 var(--serif)">из 120 пунктов</div><div style="margin-top:10px;font:400 32px/1.3 var(--sans);color:var(--muted)">технического задания<br>и дополнений выполнено</div>`, root);
    Object.assign(of.style, { left: "760px", top: "250px" });
    const track = h("div", "bar-track", `<div class="bar-fill"></div>`, root);
    Object.assign(track.style, { left: "160px", top: "510px", width: "1600px" });
    const fill = track.querySelector(".bar-fill");
    const sub = h("div", "abs kicker", "Реальные данные архива на сайте", root);
    Object.assign(sub.style, { left: "160px", top: "600px" });
    const from = t0.c(1, 1), span = t0.cEnd(1, 1) - from;
    const tiles = [[13, "филиалов архива"], [1667, "фондов в перечне"], [196, "памятных дат в календаре"], [218, "позиций прейскуранта"]].map(([n, label], i) => {
      const el = h("div", "card tile", `<div class="n">0</div><div class="l">${label}</div>`, root);
      Object.assign(el.style, { left: `${160 + i * 403}px`, top: "650px", width: "383px" });
      return { el, n, num: el.querySelector(".n"), at: from + [0, 0.16, 0.4, 0.6][i] * span - 0.15 };
    });
    return (t) => {
      enter(kicker, t, 0.2, 1e9, 0);
      const k = ramp(t, 0.5, 2.3);
      show(big, clamp(k * 4));
      big.textContent = countUp(106, k);
      enter(of, t, 1.2);
      enter(track, t, 0.9, 1e9, 0);
      fill.style.width = `${(106 / 120) * 100 * easeInOut(ramp(t, 1.0, 2.6))}%`;
      enter(sub, t, t0.p(1) - 0.1, 1e9, 0);
      for (const tile of tiles) {
        const a = ramp(t, tile.at, tile.at + 0.5);
        show(tile.el, clamp(a * 2), { dy: (1 - backOut(a)) * 60 });
        tile.num.textContent = countUp(tile.n, ramp(t, tile.at + 0.1, tile.at + 0.7));
      }
    };
  },

  // 13. Что дальше, ссылка и QR, благодарность
  "13-final"(root, sc) {
    const t0 = clock(sc);
    const kicker = h("div", "abs kicker", "Что дальше", root);
    Object.assign(kicker.style, { left: "160px", top: "170px" });
    const plans = [["Распознавание сканов", "текст на изображениях станет доступен поиску"], ["Перенос настоящих описей", "реальные фонды и дела вместо демо-записей"]].map(([name, text], i) => {
      const el = h("div", "card", `<div class="num">${i ? "→ 02" : "→ 01"}</div><h3 style="margin-top:34px;font-size:45px;white-space:nowrap">${name}</h3><p style="margin-top:18px;font-size:29px">${text}</p>`, root);
      Object.assign(el.style, { left: `${160 + i * 820}px`, top: "270px", width: "780px", height: "360px", padding: "48px 52px" });
      return el;
    });
    const qr = h("div", "card", `<img src="qr.svg" width="340" height="340" alt="">`, root);
    Object.assign(qr.style, { left: "200px", top: "210px", padding: "30px", width: "400px", height: "400px" });
    const tryIt = h("div", "abs", `<div class="kicker">Попробуйте сами</div><div class="h2" style="margin-top:22px;font-size:72px">Откройте сайт</div>
      <div style="margin-top:28px;display:inline-block;padding:16px 26px;border-radius:14px;background:var(--surface);border:1px solid var(--border);font:700 40px/1 var(--mono);color:var(--accent-2)">gosarchiv-vko-hackathon.vercel.app</div>`, root);
    Object.assign(tryIt.style, { left: "700px", top: "236px" });
    const thanks = h("div", "abs", `<div class="h1" style="font-size:92px">Спасибо за внимание!</div>`, root);
    Object.assign(thanks.style, { left: "700px", top: "560px" });
    const seal = h("div", "seal", "ГА", root);
    Object.assign(seal.style, { left: "700px", top: "720px", width: "84px", height: "84px", fontSize: "32px", borderWidth: "4px" });
    const author = h("div", "abs", `<div style="font:700 30px/1.2 var(--sans)">Госархив ВКО — переосмысление сайта</div><div style="margin-top:6px;font:400 26px/1.2 var(--sans);color:var(--muted)">Автор проекта: single koder</div>`, root);
    Object.assign(author.style, { left: "806px", top: "726px" });
    const legal = h("div", "abs", "Проект Code Masters Hackathon 9.0. Не официальный сайт Госархива ВКО", root);
    Object.assign(legal.style, { left: "160px", width: "1600px", top: "868px", textAlign: "center", font: "400 22px/1 var(--sans)", color: "var(--muted)" });
    return (t) => {
      const out = t0.p(1) - 0.3;
      enter(kicker, t, 0.2, out, 0);
      plans.forEach((el, i) => enter(el, t, t0.p(0) + (i ? t0.c(0, 1) - t0.p(0) : 0.1), out, 40));
      const k = ramp(t, t0.p(1) - 0.1, t0.p(1) + 0.5);
      show(qr, clamp(k * 2), { scale: lerp(0.8, 1, backOut(k)) });
      enter(tryIt, t, t0.p(1) + 0.2);
      enter(thanks, t, t0.p(2) - 0.1);
      stampIn(seal, t, t0.p(2) + 0.6, 1e9, -6);
      enter(author, t, t0.p(2) + 0.8);
      enter(legal, t, t0.p(1) + 0.6, 1e9, 0);
    };
  },
};

// ───────────── Сборка и покадровый рендер ─────────────
const stage = document.getElementById("stage");
const json = (url) => fetch(url).then((r) => r.json());
const timeline = await json("/timeline.json");
const recNames = ["04-search", "05-catalog", "06-branches", "07-exhibitions", "08-for-everyone", "08-mobile", "09-services-assistant", "10-admin"];
const data = { recs: Object.fromEntries(await Promise.all(recNames.map(async (n) => [n, await json(`/recordings/${n}/frames.json`)]))), stills: await json("/recordings/02-old-site/stills.json") };

const scenes = timeline.scenes.map((sc, index) => {
  const el = h("div", "scene", "", stage);
  el.style.zIndex = index + 1;
  return { ...sc, el, update: SCENES[sc.id](el, sc, data) };
});
const label = h("div", "", "", stage); label.id = "label";
const subs = h("div", "", "<div></div>", stage); subs.id = "subs";
const subText = subs.firstChild;
const progress = h("div", "", "", stage); progress.id = "progress";
const cues = timeline.scenes.flatMap((s) => s.phrases.flatMap((p) => p.cues));

// Прогрев шрифтов: казахские буквы лежат в отдельном наборе (cyrillic-ext) и подгружаются по требованию
const warm = h("div", "", "", stage); warm.id = "fontwarm";
const sample = "Aa Бб Ғғ Ққ Ңң Өө Ұұ Үү Һһ Іі Әә 0123 → · ≈ …";
warm.innerHTML = ["400 20px 'PT Serif'", "700 20px 'PT Serif'", "italic 400 20px 'PT Serif'", "400 20px 'PT Sans'", "700 20px 'PT Sans'", "400 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"].map((f) => `<span style="font:${f}">${sample}</span>`).join("");
await Promise.all(["400 20px 'PT Serif'", "700 20px 'PT Serif'", "italic 400 20px 'PT Serif'", "400 20px 'PT Sans'", "700 20px 'PT Sans'", "400 20px 'JetBrains Mono'", "700 20px 'JetBrains Mono'"].map((f) => document.fonts.load(f, sample)));
await document.fonts.ready;

window.videoDuration = timeline.duration;
window.renderFrame = async (t) => {
  for (const [i, s] of scenes.entries()) {
    const visible = t >= s.start - FADE && t < s.end + FADE;
    s.el.style.visibility = visible ? "visible" : "hidden";
    if (!visible) continue;
    const fadeIn = i === 0 ? ramp(t, 0, 0.5) : ramp(t, s.start - FADE, s.start + FADE);
    const fadeOut = i === scenes.length - 1 ? 1 : 1 - ramp(t, s.end - FADE, s.end + FADE);
    s.el.style.opacity = Math.min(fadeIn, fadeOut);
    await s.update(t - s.start);
  }
  const current = scenes.findLast((s) => t >= s.start) ?? scenes[0];
  label.textContent = current.label;
  const cue = cues.findLast((c) => t >= c.start - 0.05 && t < c.end + 0.15);
  subs.style.opacity = cue ? Math.min(ramp(t, cue.start - 0.05, cue.start + 0.07), 1 - ramp(t, cue.end + 0.05, cue.end + 0.15)) : 0;
  if (cue) subText.textContent = wrapCue(cue.text);
  progress.style.width = `${(t / timeline.duration) * 100}%`;
  await document.fonts.ready;
};
window.stageReady = true;
