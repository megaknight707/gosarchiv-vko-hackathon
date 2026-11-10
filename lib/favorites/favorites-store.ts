"use client";

// «Избранное» без регистрации: список id документов в localStorage этого браузера.
// useFavorites() подписывается на изменения — кнопка в карточке и страница /favorites
// обновляются сразу, в том числе в соседних вкладках (событие storage).
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "gosarchiv-favorites";
const CHANGE_EVENT = "favorites-change";
const MAX_ITEMS = 200;
const EMPTY: string[] = [];

let cache: { raw: string | null; ids: string[] } = { raw: null, ids: EMPTY };

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === cache.raw) return cache.ids;
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    const ids = Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string" && /^[a-z0-9]{10,40}$/.test(v)) : [];
    cache = { raw, ids };
    return ids;
  } catch {
    return EMPTY;
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_ITEMS)));
  } catch {
    // Хранилище недоступно (приватный режим) — избранное не сохранится, но сайт работает
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function useFavorites() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ids,
    has: (id: string) => ids.includes(id),
    toggle: (id: string) => write(ids.includes(id) ? ids.filter((v) => v !== id) : [id, ...ids]),
    clear: () => write([]),
  };
}
