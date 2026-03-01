import type { ExplanationTemplate } from "./types";

type Messages = Record<string, string>;

export function resolveExplanation(
  template: ExplanationTemplate,
  messages: Messages,
): string {
  let msg = messages[template.key] ?? template.key;
  if (template.vars) {
    for (const [k, v] of Object.entries(template.vars)) {
      // Special handling: "heir" vars get looked up as "heir.{value}"
      let resolved: string;
      if (k === "heir") {
        resolved = messages[`heir.${v}`] ?? String(v);
      } else if (typeof v === "string" && messages[v] !== undefined) {
        // Nested translation key (e.g., method.a → "A (1/6 of estate)")
        resolved = messages[v];
      } else {
        resolved = String(v);
      }
      msg = msg.replaceAll(`{${k}}`, resolved);
    }
  }
  if (template.prefix) {
    msg = resolveExplanation(template.prefix, messages) + " " + msg;
  }
  return msg;
}
