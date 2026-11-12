// Покадровая запись сайта для видео: вместо «живого» видео (оно получается мутным и дёрганым)
// делаем чёткие скриншоты нужных состояний и записываем, сколько кадров каждый держится на экране.
// Курсор в скриншот не попадает — сохраняем его координаты, монтаж рисует курсор и клики сам.
// Результат сцены: recordings/<сцена>/i00001.jpg … и frames.json (кадр → картинка, курсор, клик, адрес).
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const FPS = 30;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

export class Recorder {
  constructor(page, dir) {
    this.page = page;
    this.dir = dir;
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    this.frames = []; // [номер картинки, x курсора, y курсора, клик 0/1]
    this.urls = []; // адрес страницы для каждой картинки
    this.marks = {};
    this.images = 0;
    this.cursor = { x: 900, y: 500 };
  }

  /** Время сцены в секундах (по числу записанных кадров) */
  get time() {
    return this.frames.length / FPS;
  }

  async shot() {
    this.images += 1;
    const name = `i${String(this.images).padStart(5, "0")}.jpg`;
    await this.page.screenshot({ path: join(this.dir, name), type: "jpeg", quality: 88 });
    this.urls[this.images] = this.page.url();
    return this.images;
  }

  push(image, count, click = 0) {
    for (let i = 0; i < count; i++) this.frames.push([image, Math.round(this.cursor.x), Math.round(this.cursor.y), i === 0 ? click : 0]);
  }

  /** Показать текущее состояние страницы заданное время */
  async hold(seconds) {
    const image = await this.shot();
    this.push(image, Math.max(1, Math.round(seconds * FPS)));
  }

  /** Держать кадр, пока время сцены не дойдёт до t (синхронизация с фразой озвучки) */
  async until(t) {
    const left = t - this.time;
    if (left > 1 / FPS) await this.hold(left);
  }

  async center(target) {
    if (typeof target === "object" && "x" in target) return target;
    const locator = typeof target === "string" ? this.page.locator(target).first() : target;
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    const box = await locator.boundingBox();
    if (!box) throw new Error(`Элемент не найден или скрыт: ${target}`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  /** Плавно провести курсор к элементу (страница при этом не меняется — один скриншот на всё движение) */
  async move(target, seconds = 0.6) {
    const to = await this.center(target);
    const from = { ...this.cursor };
    const image = await this.shot();
    const count = Math.max(2, Math.round(seconds * FPS));
    for (let i = 1; i <= count; i++) {
      const k = ease(i / count);
      this.cursor = { x: from.x + (to.x - from.x) * k, y: from.y + (to.y - from.y) * k };
      this.push(image, 1);
    }
    await this.page.mouse.move(to.x, to.y);
    await this.page.waitForTimeout(120);
    this.push(await this.shot(), 3); // состояние «наведено»
  }

  /** Подвести курсор, кликнуть (монтаж подсветит клик кругом) и дождаться результата */
  async click(target, { move = 0.6, settle = 600, wait } = {}) {
    await this.move(target, move);
    this.push(this.images, 4, 1);
    await this.page.mouse.click(this.cursor.x, this.cursor.y);
    if (wait) await wait();
    else await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    await this.page.waitForTimeout(settle);
    this.push(await this.shot(), 2);
  }

  /** Медленный ввод текста: по скриншоту на символ */
  async type(text, { perChar = 0.075 } = {}) {
    for (const char of text) {
      await this.page.keyboard.type(char);
      const frames = Math.max(1, Math.round((char === " " ? perChar * 1.6 : perChar) * FPS));
      this.push(await this.shot(), frames);
    }
  }

  async press(key, { settle = 700, wait } = {}) {
    await this.page.keyboard.press(key);
    await this.page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    if (wait) await wait();
    await this.page.waitForTimeout(settle);
    this.push(await this.shot(), 2);
  }

  /** Плавная прокрутка страницы (или элемента) с замедлением — по скриншоту на кадр */
  async scrollTo(y, seconds = 1.5, selector) {
    const from = await this.page.evaluate((s) => (s ? document.querySelector(s).scrollTop : window.scrollY), selector);
    const count = Math.max(2, Math.round(seconds * FPS));
    for (let i = 1; i <= count; i++) {
      const value = from + (y - from) * ease(i / count);
      await this.page.evaluate(([s, v]) => (s ? (document.querySelector(s).scrollTop = v) : window.scrollTo(0, v)), [selector, value]);
      this.push(await this.shot(), 1);
    }
  }

  /** Запись в реальном времени (ответ помощника печатается потоком) */
  async live(seconds) {
    const started = Date.now();
    let last = started;
    while (Date.now() - started < seconds * 1000) {
      const image = await this.shot();
      const now = Date.now();
      this.push(image, Math.max(1, Math.round(((now - last) / 1000) * FPS)));
      last = now;
    }
  }

  /** Метка времени и (если нужно) положение элементов — монтаж привязывает к ним анимацию */
  async mark(name, selectors = {}) {
    const boxes = {};
    for (const [key, selector] of Object.entries(selectors)) {
      const locator = typeof selector === "string" ? this.page.locator(selector) : selector;
      boxes[key] = await locator.evaluateAll((els) => els.map((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; }));
    }
    this.marks[name] = { frame: this.frames.length, time: this.time, ...boxes };
  }

  save(extra = {}) {
    const viewport = this.page.viewportSize();
    // В адресной строке видео показываем адрес без параметров отслеживания и длинных хвостов
    writeFileSync(join(this.dir, "frames.json"), JSON.stringify({ fps: FPS, width: viewport.width, height: viewport.height, frames: this.frames, urls: this.urls, marks: this.marks, ...extra }));
    return { frames: this.frames.length, seconds: this.time, images: this.images };
  }
}
