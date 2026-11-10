"use client";

// «Версия для слабовидящих»: класс low-vision на <html> → крупный шрифт и высокий
// контраст (стили — в app/globals.css). Выбор хранится в localStorage этого браузера.
import { Eye, EyeOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "low-vision";
const CLASS_NAME = "low-vision";
const CHANGE_EVENT = "low-vision-change";

/** Встраивается в <head>: включает режим до отрисовки страницы */
export const LOW_VISION_INIT_SCRIPT = `try{if(localStorage.getItem("${STORAGE_KEY}")==="1")document.documentElement.classList.add("${CLASS_NAME}")}catch(e){}`;

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}
const getSnapshot = () => document.documentElement.classList.contains(CLASS_NAME);
const getServerSnapshot = () => false;

export function LowVisionToggle({ className, compact = false }: { className?: string; compact?: boolean }) {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const t = useTranslations("A11y");

  function toggle() {
    const next = !enabled;
    document.documentElement.classList.toggle(CLASS_NAME, next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      // localStorage недоступен (приватный режим) — режим работает до перезагрузки
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  const Icon = enabled ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? t("lowVisionOff") : t("lowVisionOn")}
      className={cn("inline-flex items-center gap-1.5 hover:text-ink", className)}
    >
      <Icon aria-hidden className="size-4" />
      <span className={cn(compact && "sr-only")}>{enabled ? t("lowVisionOff") : t("lowVision")}</span>
    </button>
  );
}
