"use client";

// Последний рубеж: ошибка в корневом шаблоне. Рисуется без шаблона сайта, поэтому — простая страница.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F3F5F8", color: "#172033", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1>Сайт временно недоступен · Сайт уақытша қолжетімсіз · Site temporarily unavailable</h1>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: "10px 18px", background: "#1F3A68", color: "#FFFFFF", border: 0, borderRadius: 10, fontWeight: 700 }}>
            Обновить · Жаңарту · Reload
          </button>
        </main>
      </body>
    </html>
  );
}
