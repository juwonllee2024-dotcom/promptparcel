export function insertIntoActiveComposer(text) {
  const value = String(text ?? "");
  if (!value) return { ok: false, reason: "Nothing to insert." };

  const isEditable = (element) => element && (
    element.tagName === "TEXTAREA" ||
    (element.tagName === "INPUT" && String(element.type || "text") === "text") ||
    element.isContentEditable === true
  );
  const active = document.activeElement;
  const target = isEditable(active) ? active : document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
  if (!target) return { ok: false, reason: "No editable AI composer found on this tab." };

  target.focus?.();
  if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") {
    const existing = String(target.value ?? "");
    const separator = existing && !existing.endsWith("\n") ? "\n\n" : "";
    target.value = `${existing}${separator}${value}`;
    const event = typeof InputEvent === "function"
      ? new InputEvent("input", { bubbles: true, inputType: "insertText", data: value })
      : { type: "input" };
    target.dispatchEvent?.(event);
    return { ok: true, target: target.tagName.toLowerCase(), characters: value.length };
  }

  let inserted = false;
  if (typeof document.execCommand === "function") inserted = document.execCommand("insertText", false, value);
  if (!inserted) {
  const selection = typeof window === "object" && typeof window.getSelection === "function" ? window.getSelection() : null;
    const range = document.createRange();
    range.selectNodeContents(target);
    range.collapse(false);
    range.insertNode(document.createTextNode(value));
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }
  target.dispatchEvent?.(typeof InputEvent === "function" ? new InputEvent("input", { bubbles: true }) : { type: "input" });
  return { ok: true, target: "contenteditable", characters: value.length };
}
