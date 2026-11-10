// Официальные соцсети архива (источник: файл архива «Контакты.docx», 10.11.2026; ТЗ §5.12).
export const socials = [
  { key: "instagram", label: "Instagram", handle: "@arhiv_vko", href: "https://www.instagram.com/arhiv_vko/" },
  { key: "facebook", label: "Facebook", handle: "vkoarhiv", href: "https://www.facebook.com/vkoarhiv" },
] as const;

export type SocialKey = (typeof socials)[number]["key"];
