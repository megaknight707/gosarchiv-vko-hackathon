// E2E-проверка сценариев защиты (CLAUDE.md §11) в настоящем браузере.
//   npm run test:e2e                                   — против локального dev-сервера (запустится сам)
//   E2E_BASE_URL=https://… npm run test:e2e             — против рабочей ссылки Vercel
// Сценарий сотрудника архива требует учётных записей: E2E_ARCHIVIST_* и E2E_MODERATOR_* (только локально).
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.e2e.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 1,
  reporter: [["list"]],
  use: { baseURL, trace: "retain-on-failure", locale: "ru-RU" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Мобильная версия — не уменьшенная десктопная: проверяем нижнее меню и основные сценарии
    { name: "mobile", use: { ...devices["Pixel 7"] }, grep: /@mobile/ },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: "npm run dev", url: baseURL, reuseExistingServer: true, timeout: 180_000 },
});
