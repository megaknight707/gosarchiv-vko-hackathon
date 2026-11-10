// Любой несуществующий адрес внутри языка (/ru/abc) → наша страница 404 с шапкой и подвалом.
import { notFound } from "next/navigation";

export default function CatchAllPage() {
  notFound();
}
