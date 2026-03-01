import type { Locale } from "./config";

export type Messages = Record<string, string>;

const messageCache = new Map<Locale, Messages>();

export async function getMessages(locale: Locale): Promise<Messages> {
  if (messageCache.has(locale)) {
    return messageCache.get(locale)!;
  }
  const messages = (await import(`./messages/${locale}.json`)).default as Messages;
  messageCache.set(locale, messages);
  return messages;
}
