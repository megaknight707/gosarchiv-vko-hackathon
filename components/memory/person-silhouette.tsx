// Нейтральная заглушка вместо портрета (настоящие фото — только из фондов архива, ИИ-«фото» не генерируем).
export function PersonSilhouette({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 120 140" className={className}>
      <rect width="120" height="140" fill="var(--chip)" />
      <circle cx="60" cy="52" r="24" fill="var(--border)" />
      <path d="M18 140c4-34 22-50 42-50s38 16 42 50z" fill="var(--border)" />
    </svg>
  );
}
