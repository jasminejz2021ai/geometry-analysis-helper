// A student's own Gemini API key, kept only in this browser's localStorage and
// sent with AI requests so they use the student's quota instead of the site's.

const STORAGE_KEY = "gah-gemini-api-key";
const CHANGE_EVENT = "gah-gemini-key-changed";

export const KEY_HEADER = "X-Gemini-Api-Key";

export function getUserKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY) || null;
  } catch {
    return null;
  }
}

export function setUserKey(key: string | null): void {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked (e.g. private mode); the key just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onUserKeyChange(fn: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, fn);
  // Also react when the key is changed in another tab.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) fn();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, fn);
    window.removeEventListener("storage", onStorage);
  };
}

export function userKeyHeaders(): Record<string, string> {
  const key = getUserKey();
  return key ? { [KEY_HEADER]: key } : {};
}
