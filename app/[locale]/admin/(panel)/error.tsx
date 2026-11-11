"use client";

// Ошибка при загрузке страницы (например, база временно недоступна) — экран в стиле сайта
import { ErrorView } from "@/components/layout/error-view";

export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView reset={reset} digest={error.digest} />;
}
