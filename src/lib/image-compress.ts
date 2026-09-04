/**
 * يضغط الصورة داخل متصفح الكاتب قبل رفعها.
 *
 * صور الجوال تصل عادةً إلى ٨ ميجابايت بأبعاد ٤٠٠٠ بكسل، بينما أوسع مساحة
 * عرض في الموقع أقل من ١٦٠٠ بكسل. رفعها كما هي يهدر باقة الرافع، ويبطئ
 * القارئ، ويستهلك مساحة التخزين — دون أي مكسب بصري.
 */

const MAX_EDGE = 1600;
const QUALITY = 0.82;

export type CompressResult = {
  file: File;
  originalBytes: number;
  finalBytes: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("تعذّرت قراءة الصورة."));
    };
    img.src = url;
  });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** يدعم WebP؟ سفاري القديم لا يدعمه في toBlob فنسقط إلى JPEG. */
function supportsWebp(): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

export async function compressImage(file: File): Promise<CompressResult> {
  const originalBytes = file.size;

  // الصور المتجهة والمتحركة تفقد معناها بالتحويل — تُترك كما هي.
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return { file, originalBytes, finalBytes: originalBytes };
  }

  try {
    const img = await loadImage(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);

    const ctx = canvas.getContext("2d");
    if (!ctx) return { file, originalBytes, finalBytes: originalBytes };

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const type = supportsWebp() ? "image/webp" : "image/jpeg";
    const blob = await toBlob(canvas, type, QUALITY);

    // لو خرج الناتج أكبر من الأصل (يحدث مع الصور المضغوطة أصلاً) نُبقي الأصل.
    if (!blob || blob.size >= originalBytes) {
      return { file, originalBytes, finalBytes: originalBytes };
    }

    const ext = type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";
    const out = new File([blob], `${base}.${ext}`, { type, lastModified: Date.now() });

    return { file: out, originalBytes, finalBytes: out.size };
  } catch {
    // فشل الضغط لا يجوز أن يمنع الرفع.
    return { file, originalBytes, finalBytes: originalBytes };
  }
}
