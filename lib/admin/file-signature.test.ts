import { describe, expect, it } from "vitest";
import { checkUpload, detectFileType, MAX_UPLOAD_BYTES } from "./file-signature";

const bytes = (...values: number[]) => new Uint8Array([...values, ...new Array(16).fill(0)]);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const PDF = new TextEncoder().encode("%PDF-1.7\n...");
const WEBP = new Uint8Array([0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50, 0, 0]);
const TIFF = bytes(0x49, 0x49, 0x2a, 0x00);
const HTML = new TextEncoder().encode("<html><script>alert(1)</script></html>");

describe("detectFileType", () => {
  it("узнаёт разрешённые форматы по первым байтам", () => {
    expect(detectFileType(PNG)).toBe("image/png");
    expect(detectFileType(JPEG)).toBe("image/jpeg");
    expect(detectFileType(PDF)).toBe("application/pdf");
    expect(detectFileType(WEBP)).toBe("image/webp");
    expect(detectFileType(TIFF)).toBe("image/tiff");
  });

  it("не узнаёт HTML и прочее", () => {
    expect(detectFileType(HTML)).toBeNull();
  });
});

describe("checkUpload", () => {
  it("пропускает файл, если тип совпадает с содержимым", () => {
    expect(checkUpload(JPEG, "image/jpeg")).toEqual({ ok: true, type: "image/jpeg" });
    expect(checkUpload(JPEG, "image/jpg")).toEqual({ ok: true, type: "image/jpeg" });
    expect(checkUpload(TIFF, "")).toEqual({ ok: true, type: "image/tiff" });
  });

  it("отклоняет HTML, переименованный в .jpg", () => {
    expect(checkUpload(HTML, "image/jpeg")).toEqual({ ok: false, reason: "unsupported" });
  });

  it("отклоняет несовпадение заявленного типа и содержимого", () => {
    expect(checkUpload(PNG, "application/pdf")).toEqual({ ok: false, reason: "mismatch" });
  });

  it("отклоняет пустые и слишком большие файлы", () => {
    expect(checkUpload(new Uint8Array(), "image/png")).toEqual({ ok: false, reason: "empty" });
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(PNG);
    expect(checkUpload(big, "image/png")).toEqual({ ok: false, reason: "tooLarge" });
  });

  it("для обложек разрешает только изображения", () => {
    expect(checkUpload(PDF, "application/pdf", ["image/png", "image/jpeg"])).toEqual({ ok: false, reason: "unsupported" });
  });
});
