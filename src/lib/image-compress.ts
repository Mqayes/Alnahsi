/**
 * يجهّز صورة الجوال قبل رفعها: يفكّها، يصغّرها، ويعيد ترميزها.
 *
 * ثلاث مشاكل يعالجها هذا الملف، وكلها خاصة بالجوال:
 *
 * ١. HEIC — آيفون يصوّر بهذه الصيغة افتراضياً، ولا متصفح على الحاسب يفكّها.
 *    لو رفعناها كما هي لنجح الرفع ثم ظهرت صورة مكسورة لكل قارئ. سفاري على
 *    الآيفون نفسه يفكّها، فنحوّلها هناك إلى JPEG قبل الرفع. وإن تعذّر الفكّ
 *    نُخبر الكاتب بالسبب وبالحل بدل رفع ملف لن يُعرض.
 *
 * ٢. الصور الضخمة — كاميرات ٤٨ ميجابكسل تنتج ٨٠٠٠×٦٠٠٠. سفاري على iOS يرفض
 *    رسم أي لوحة تتجاوز ~١٦٫٧ مليون بكسل، فنقيّد المساحة قبل الرسم لا بعده.
 *
 * ٣. حجم الناتج — نخفّض الجودة تدريجياً حتى ينزل تحت الحد، فلا يُرفض شيء
 *    بسبب حجمه ما دام فكّه ممكناً.
 */

const MAX_EDGE = 1600;
/** سقف مساحة اللوحة — أقل من حد سفاري على iOS بهامش أمان */
const MAX_PIXELS = 12_000_000;
const QUALITY_STEPS = [0.82, 0.72, 0.62, 0.5];

export type CompressResult = {
  file: File;
  originalBytes: number;
  finalBytes: number;
  /** سبب واضح للفشل، يُعرض للكاتب كما هو */
  error?: string;
};

function isHeic(file: File): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name);
}

/** يفكّ الصورة بأفضل وسيلة متاحة في المتصفح */
async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      // يحترم دوران الصورة المسجَّل في EXIF، وأخفّ على ذاكرة الجوال
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* نجرّب الطريقة التقليدية */
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("decode-failed"));
    };
    img.src = url;
  });
}

function dimensionsOf(src: ImageBitmap | HTMLImageElement): { w: number; h: number } {
  return src instanceof HTMLImageElement
    ? { w: src.naturalWidth, h: src.naturalHeight }
    : { w: src.width, h: src.height };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function supportsWebp(): boolean {
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    return c.toDataURL("image/webp").startsWith("data:image/webp");
  } catch {
    return false;
  }
}

const HEIC_HELP =
  "هذه صورة بصيغة HEIC ومتصفحك لا يفكّها — لو رفعناها لن تظهر لأحد. " +
  "من الآيفون: الإعدادات ← الكاميرا ← الصيغ ← اختر «الأعلى توافقاً». " +
  "أو افتح الصورة في تطبيق الصور ← مشاركة ← نسخة، ثم ارفع النسخة.";

export async function compressImage(file: File, targetBytes: number): Promise<CompressResult> {
  const originalBytes = file.size;
  const keepAsIs = (): CompressResult => ({ file, originalBytes, finalBytes: originalBytes });

  // الصور المتجهة والمتحركة تفقد معناها بإعادة الترميز
  if (file.type === "image/svg+xml" || file.type === "image/gif") return keepAsIs();

  let source: ImageBitmap | HTMLImageElement;
  try {
    source = await decode(file);
  } catch {
    if (isHeic(file)) return { ...keepAsIs(), error: HEIC_HELP };
    return { ...keepAsIs(), error: "تعذّر فتح هذه الصورة. جرّب صورة أخرى." };
  }

  try {
    const { w, h } = dimensionsOf(source);
    if (!w || !h) return keepAsIs();

    // نقيّد الطول الأكبر والمساحة الكلية معاً
    let scale = Math.min(1, MAX_EDGE / Math.max(w, h));
    if (w * h * scale * scale > MAX_PIXELS) {
      scale = Math.sqrt(MAX_PIXELS / (w * h));
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));

    const ctx = canvas.getContext("2d");
    if (!ctx) return keepAsIs();

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    if (!(source instanceof HTMLImageElement)) source.close();

    const type = supportsWebp() ? "image/webp" : "image/jpeg";
    const ext = type === "image/webp" ? "webp" : "jpg";
    const base = file.name.replace(/\.[^.]+$/, "") || "image";

    // ننزل بالجودة تدريجياً حتى ندخل تحت الحد
    let blob: Blob | null = null;
    for (const q of QUALITY_STEPS) {
      blob = await toBlob(canvas, type, q);
      if (blob && blob.size <= targetBytes) break;
    }

    if (!blob) return keepAsIs();

    // HEIC يجب أن يُحوَّل دائماً، حتى لو خرج الناتج أكبر
    if (blob.size >= originalBytes && !isHeic(file)) return keepAsIs();

    const out = new File([blob], `${base}.${ext}`, { type, lastModified: Date.now() });

    if (out.size > targetBytes) {
      return {
        file: out,
        originalBytes,
        finalBytes: out.size,
        error: "الصورة كبيرة جداً حتى بعد الضغط. جرّب لقطة أصغر.",
      };
    }

    return { file: out, originalBytes, finalBytes: out.size };
  } catch {
    // فشل الضغط لا يمنع الرفع — إلا في HEIC حيث الرفع بلا فائدة
    if (isHeic(file)) return { ...keepAsIs(), error: HEIC_HELP };
    return keepAsIs();
  }
}
