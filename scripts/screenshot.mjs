/**
 * Снимает скриншот интерфейса анализатора для README/презентации.
 *
 * Запускает локальный статический сервер, открывает страницу в headless-Chromium
 * (Playwright), дожидается загрузки удалённого шрифта РЖЯ и сохраняет
 * docs/screenshot.png. Это вспомогательный инструмент разработки: на работу
 * самого статического сайта Playwright не влияет и в рантайме не нужен.
 *
 * Запуск: npm run screenshot
 */
import { chromium } from "playwright";

const PORT = process.env.PORT ?? "8137";
process.env.PORT = PORT;

// server.mjs начинает слушать порт сразу при импорте.
await import("../server.mjs");
const url = `http://localhost:${PORT}/`;

// Демонстрационная запись: несколько кадров и таймлайнов наглядно показывают
// иерархию разбора. Запись валидна (ошибок быть не должно).
const demo = process.env.DEMO_INPUT ?? '."Ч_Ё=7_Ё=Ч';

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1280, height: 1640 },
  deviceScaleFactor: 2
});

await page.goto(url, { waitUntil: "networkidle" });
await page.fill("#input", demo);

// Дожидаемся загрузки шрифта и проверяем, что удалённый шрифт РЖЯ действительно
// загрузился, а не остался на системном fallback.
const fontReport = await page.evaluate(async () => {
  await document.fonts.ready;
  const faces = [...document.fonts].map((f) => ({ family: f.family, status: f.status }));
  const rslLoaded = document.fonts.check('24px "RSLFontRemote"');
  return { faces, rslLoaded };
});
console.log("Загруженные @font-face:", JSON.stringify(fontReport.faces));
console.log("Шрифт РЖЯ (RSLFontRemote) загружен:", fontReport.rslLoaded);

// Выбираем токен, чтобы на скриншоте была видна карточка «Выбранный элемент»
// с объяснением — это одна из ключевых возможностей анализатора.
const firstChip = page.locator(".token-chip").first();
if (await firstChip.count()) {
  await firstChip.click();
}

await page.waitForTimeout(600);
await page.screenshot({ path: "docs/screenshot.png", fullPage: true });
console.log("Скриншот сохранён в docs/screenshot.png");

await browser.close();
process.exit(0);
