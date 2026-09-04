import { useCallback, useEffect, useRef } from "react";

/**
 * محرّر مرئي خفيف — بلا أي مكتبة خارجية (صفر كيلوبايت إضافية على الحزمة).
 * يعتمد contentEditable وأوامر التحرير المدمجة في المتصفح.
 *
 * ما يخرج منه يمرّ على منقّي HTML قبل الحفظ وقبل العرض، فلا يصل للقارئ
 * إلا وسوم مسموحة.
 */

type Cmd = { icon: string; label: string; run: () => void };

export function RichEditor({
  value,
  onChange,
  onRequestImage,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  onRequestImage: () => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const composing = useRef(false);

  // نكتب المحتوى في العنصر فقط حين يختلف فعلاً، حتى لا يقفز المؤشر أثناء الكتابة
  useEffect(() => {
    const el = ref.current;
    if (el && !composing.current && el.innerHTML !== value) {
      el.innerHTML = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      emit();
    },
    [emit],
  );

  const addLink = useCallback(() => {
    const url = window.prompt("رابط الصفحة (يبدأ بـ https://)");
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      window.alert("الرابط يجب أن يبدأ بـ http:// أو https://");
      return;
    }
    exec("createLink", url);
  }, [exec]);

  const commands: Cmd[] = [
    { icon: "𝐁", label: "عريض", run: () => exec("bold") },
    { icon: "𝐼", label: "مائل", run: () => exec("italic") },
    { icon: "U̲", label: "تحته خط", run: () => exec("underline") },
    { icon: "H2", label: "عنوان كبير", run: () => exec("formatBlock", "<h2>") },
    { icon: "H3", label: "عنوان فرعي", run: () => exec("formatBlock", "<h3>") },
    { icon: "¶", label: "فقرة", run: () => exec("formatBlock", "<p>") },
    { icon: "•", label: "قائمة نقطية", run: () => exec("insertUnorderedList") },
    { icon: "1.", label: "قائمة مرقّمة", run: () => exec("insertOrderedList") },
    { icon: "❝", label: "اقتباس", run: () => exec("formatBlock", "<blockquote>") },
    { icon: "🔗", label: "رابط", run: addLink },
    { icon: "🖼", label: "صورة", run: onRequestImage },
    { icon: "⌫", label: "إزالة التنسيق", run: () => exec("removeFormat") },
  ];

  return (
    <div className="rounded-lg border border-input bg-background">
      <div className="flex flex-wrap gap-1 border-b border-input p-2">
        {commands.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.label}
            aria-label={c.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={c.run}
            className="min-w-9 rounded px-2 py-1.5 text-sm text-navy transition-colors hover:bg-gold/20"
          >
            {c.icon}
          </button>
        ))}
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        aria-label="نص التدوينة"
        data-placeholder={placeholder}
        onInput={emit}
        onBlur={emit}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={() => {
          composing.current = false;
          emit();
        }}
        onPaste={(e) => {
          // اللصق كنص صِرف: يمنع استيراد تنسيقات وأنماط من مواقع أخرى
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
        className="rich-editor min-h-64 px-4 py-3 leading-loose outline-none"
      />
    </div>
  );
}
