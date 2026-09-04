/**
 * منقّي HTML للمحتوى الذي يكتبه أفراد العائلة.
 *
 * المبدأ: لا نحاول "حذف الخطر" من النص — فالمهاجم دائماً أذكى من قائمة الحظر.
 * بدل ذلك نُفكّك المحتوى، ثم **نعيد بناءه من الصفر** باستخدام الوسوم والخصائص
 * المسموحة فقط، والنص الصِرف مهروب. أي شيء لم يرد في القائمة لا يصل للمخرجات
 * أصلاً، لأننا لا ننسخه — نتجاهله.
 *
 * يعمل في Node والمتصفح معاً (لا يعتمد على DOM)، لأن صفحات التدوينات
 * تُصيَّر على الخادم أيضاً.
 */

/** وسوم مسموحة، وقائمة خصائصها المسموحة */
const ALLOWED: Record<string, string[]> = {
  p: [],
  br: [],
  hr: [],
  h2: [],
  h3: [],
  h4: [],
  strong: [],
  b: [],
  em: [],
  i: [],
  u: [],
  s: [],
  mark: [],
  small: [],
  sub: [],
  sup: [],
  ul: [],
  ol: [],
  li: [],
  blockquote: [],
  pre: [],
  code: [],
  figure: [],
  figcaption: [],
  div: [],
  span: [],
  a: ["href"],
  img: ["src", "alt"],
  table: [],
  thead: [],
  tbody: [],
  tr: [],
  th: [],
  td: [],
};

const VOID_TAGS = new Set(["br", "hr", "img"]);

/** وسوم يُرمى محتواها النصي كاملاً، لا الوسم وحده */
const DROP_WITH_CONTENT = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "template",
  "noscript",
  "svg",
  "math",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "link",
  "meta",
  "base",
]);

function escapeText(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** يقبل http/https والمسارات الداخلية فقط — يمنع javascript: و data: */
function safeUrl(raw: string): string | null {
  // محارف التحكم مقصودة هنا: المهاجم يحقنها داخل الرابط لتفكيك الفحص
  // (مثل "java\u0000script:")، فلا بد من تجريدها قبل المطابقة.
  // eslint-disable-next-line no-control-regex
  const url = raw.trim().replace(/[\u0000-\u001f\u007f]/g, "");
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/") && !url.startsWith("//")) return url;
  return null;
}

type Attr = { name: string; value: string };

function parseAttrs(raw: string): Attr[] {
  const out: Attr[] = [];
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw))) {
    out.push({ name: m[1].toLowerCase(), value: m[2] ?? m[3] ?? m[4] ?? "" });
  }
  return out;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";

  let out = "";
  const stack: string[] = [];
  let i = 0;

  while (i < input.length) {
    const lt = input.indexOf("<", i);

    if (lt === -1) {
      out += escapeText(input.slice(i));
      break;
    }

    if (lt > i) out += escapeText(input.slice(i, lt));

    // تعليقات وتعليمات المعالجة تُحذف كلياً
    if (input.startsWith("<!--", lt)) {
      const end = input.indexOf("-->", lt + 4);
      i = end === -1 ? input.length : end + 3;
      continue;
    }
    if (input.startsWith("<!", lt) || input.startsWith("<?", lt)) {
      const end = input.indexOf(">", lt);
      i = end === -1 ? input.length : end + 1;
      continue;
    }

    const gt = input.indexOf(">", lt);
    if (gt === -1) {
      out += escapeText(input.slice(lt));
      break;
    }

    const rawTag = input.slice(lt + 1, gt);
    const isClose = rawTag.startsWith("/");
    const nameMatch = (isClose ? rawTag.slice(1) : rawTag).match(/^\s*([a-zA-Z][a-zA-Z0-9-]*)/);

    if (!nameMatch) {
      i = gt + 1;
      continue;
    }
    const name = nameMatch[1].toLowerCase();

    // وسم خطر: نقفز فوقه وفوق كل محتواه حتى الإغلاق
    if (DROP_WITH_CONTENT.has(name)) {
      if (isClose) {
        i = gt + 1;
        continue;
      }
      const closeRe = new RegExp(`</\\s*${name}\\s*>`, "i");
      const rest = input.slice(gt + 1);
      const found = rest.search(closeRe);
      i = found === -1 ? input.length : gt + 1 + found + rest.match(closeRe)![0].length;
      continue;
    }

    if (!(name in ALLOWED)) {
      // وسم غير معروف: نُسقط الوسم ونُبقي ما بداخله من نص
      i = gt + 1;
      continue;
    }

    if (isClose) {
      const idx = stack.lastIndexOf(name);
      if (idx !== -1) {
        // نُغلق كل ما فُتح بعده أيضاً حتى لا تختل البنية
        for (let k = stack.length - 1; k >= idx; k--) out += `</${stack[k]}>`;
        stack.length = idx;
      }
      i = gt + 1;
      continue;
    }

    // وسم مفتوح مسموح
    const allowedAttrs = ALLOWED[name];
    let attrHtml = "";

    for (const attr of parseAttrs(rawTag.slice(nameMatch[0].length))) {
      if (!allowedAttrs.includes(attr.name)) continue;
      if (attr.name === "href" || attr.name === "src") {
        const url = safeUrl(attr.value);
        if (!url) continue;
        attrHtml += ` ${attr.name}="${escapeText(url)}"`;
      } else {
        attrHtml += ` ${attr.name}="${escapeText(attr.value)}"`;
      }
    }

    if (name === "a") {
      if (!attrHtml.includes("href=")) {
        i = gt + 1;
        continue;
      }
      attrHtml += ' target="_blank" rel="noopener noreferrer nofollow"';
    }
    if (name === "img") {
      if (!attrHtml.includes("src=")) {
        i = gt + 1;
        continue;
      }
      if (!attrHtml.includes("alt=")) attrHtml += ' alt=""';
      attrHtml += ' loading="lazy"';
    }

    if (VOID_TAGS.has(name)) {
      out += `<${name}${attrHtml} />`;
    } else {
      out += `<${name}${attrHtml}>`;
      stack.push(name);
    }

    i = gt + 1;
  }

  for (let k = stack.length - 1; k >= 0; k--) out += `</${stack[k]}>`;
  return out;
}

/**
 * التدوينات القديمة كانت نصاً صِرفاً بصور بنمط ![](رابط).
 * نحوّلها إلى HTML مرة واحدة عند العرض حتى لا يفقد أحد ما كتبه.
 */
export function looksLikeHtml(body: string): boolean {
  return /<(p|div|h[2-4]|ul|ol|li|img|a|blockquote|br|strong|em)\b/i.test(body);
}

export function legacyTextToHtml(body: string): string {
  return body
    .split(/\n{2,}/)
    .filter((block) => block.trim())
    .map((block) => {
      const img = block.trim().match(/^!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)$/);
      if (img) return `<img src="${escapeText(img[1])}" alt="" />`;
      return `<p>${escapeText(block).replace(/\n/g, "<br />")}</p>`;
    })
    .join("");
}

/** المدخل الوحيد المستخدم عند العرض */
export function renderBody(body: string): string {
  if (!body) return "";
  return sanitizeHtml(looksLikeHtml(body) ? body : legacyTextToHtml(body));
}
