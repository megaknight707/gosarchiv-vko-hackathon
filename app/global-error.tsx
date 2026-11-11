"use client";

// Последний рубеж: ошибка в корневом шаблоне. Рисуется без шаблона сайта, поэтому — простая страница.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F7F3EA", color: "#1E1A15", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1>Сайт временно недоступен · Сайт уақытша қолжетімсіз · Site temporarily unavailable</h1>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 18px", background: "#8E2A1F", color: "#FFF8EE", border: 0, borderRadius: 10, fontWeight: 700 }}>
            Обновить · Жаңарту · Reload
          </button>
        </main>
      </body>
    </html>
  );
}
