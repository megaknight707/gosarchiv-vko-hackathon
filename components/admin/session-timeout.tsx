"use client";

// Автовыход через 30 минут бездействия (ТЗ §7.3) с предупреждением за минуту.
// Активность (нажатия клавиш, клики, переходы) продлевает сессию на сервере —
// не чаще раза в 5 минут, чтобы не нагружать сервер.
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import { usePathname } from "@/i18n/navigation";
import { keepAliveAction, logoutAction } from "@/lib/auth/login-actions";

const IDLE_MS = 30 * 60_000;
// Запас 30 секунд: сервер продлевает сессию не на каждый запрос
const WARN_AT_MS = IDLE_MS - 90_000;
const LOGOUT_AT_MS = IDLE_MS - 30_000;
const PING_EVERY_MS = 5 * 60_000;

export function SessionTimeout({ locale }: { locale: Locale }) {
  const t = useTranslations("Admin.session");
  const pathname = usePathname();
  const lastServerTouch = useRef(0);
  const lastActivity = useRef(0);
  const [warning, setWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Переход по страницам админки продлевает сессию (это делает proxy.ts)
  useEffect(() => {
    lastServerTouch.current = Date.now();
    lastActivity.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    const onActivity = () => {
      lastActivity.current = Date.now();
    };
    const events = ["keydown", "pointerdown", "scroll"] as const;
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    const timer = window.setInterval(() => {
      const now = Date.now();
      // Было действие после последнего продления — продлеваем (раз в 5 минут)
      if (lastActivity.current > lastServerTouch.current && now - lastServerTouch.current > PING_EVERY_MS) {
        lastServerTouch.current = now;
        void keepAliveAction();
      }
      const idle = now - lastServerTouch.current;
      if (idle >= LOGOUT_AT_MS) {
        window.clearInterval(timer);
        void logoutAction(locale, "idle");
      } else if (idle >= WARN_AT_MS) {
        setWarning(true);
        setSecondsLeft(Math.max(0, Math.round((LOGOUT_AT_MS - idle) / 1000)));
      }
    }, 1000);

    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      window.clearInterval(timer);
    };
  }, [locale]);

  async function stay() {
    const ok = await keepAliveAction();
    if (!ok) return logoutAction(locale, "idle");
    lastServerTouch.current = Date.now();
    lastActivity.current = Date.now();
    setWarning(false);
  }

  if (!warning) return null;
  return (
    <div role="alertdialog" aria-labelledby="session-warning-title" aria-describedby="session-warning-text" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-[14px] border border-border bg-surface p-4 shadow-lg">
      <p id="session-warning-title" className="font-bold">
        {t("title")}
      </p>
      <p id="session-warning-text" className="mt-1 text-sm text-muted-ink" aria-live="polite">
        {t("text", { seconds: secondsLeft })}
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" autoFocus onClick={stay} className="rounded-[10px] bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          {t("stay")}
        </button>
        <button type="button" onClick={() => logoutAction(locale)} className="rounded-[10px] border border-border px-4 py-2 text-sm font-bold">
          {t("logout")}
        </button>
      </div>
    </div>
  );
}
