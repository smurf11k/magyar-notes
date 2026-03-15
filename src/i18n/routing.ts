import { DEFAULT_LANG, SUPPORTED_LANGS, normalizeLang, type Lang } from "./ui";

const CONTENT_FOLDER_PREFIX = "lang-";

function hasLangPrefix(pathname: string): boolean {
  const first = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  return !!first && (SUPPORTED_LANGS as readonly string[]).includes(first);
}

export function routeLangFromPathname(pathname: string): Lang {
  const first = pathname.split("/").filter(Boolean)[0];
  return normalizeLang(first);
}

export function stripRouteLangPrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if ((SUPPORTED_LANGS as readonly string[]).includes(parts[0].toLowerCase())) {
    return "/" + parts.slice(1).join("/");
  }
  return pathname;
}

export function localizedPath(pathname: string, targetLang: Lang): string {
  const base = stripRouteLangPrefix(pathname);
  const cleanBase = base.startsWith("/") ? base : `/${base}`;

  if (targetLang === DEFAULT_LANG) {
    return cleanBase === "" ? "/" : cleanBase;
  }

  if (cleanBase === "/") {
    return `/${targetLang}`;
  }

  return `/${targetLang}${cleanBase}`;
}

export function makeLocalizedLessonHref(
  cleanLessonPath: string,
  lang: Lang,
): string {
  const clean = cleanLessonPath.replace(/^\/+/, "");
  const base = `/lessons/${clean}`;
  return lang === DEFAULT_LANG ? base : `/${lang}${base}`;
}

export function contentFolderForLang(lang: Lang): string {
  return `${CONTENT_FOLDER_PREFIX}${lang}`;
}

export function stripContentLangPrefix(id: string): string {
  return id.replace(/^lang-[^/]+\//, "");
}

export function contentLangFromId(id: string): Lang {
  const first = id.split("/")[0] ?? "";
  if (!first.startsWith(CONTENT_FOLDER_PREFIX)) return DEFAULT_LANG;
  const maybeLang = first.slice(CONTENT_FOLDER_PREFIX.length);
  return normalizeLang(maybeLang);
}

export function belongsToLang(id: string, lang: Lang): boolean {
  const hasPrefix = id.startsWith(`${CONTENT_FOLDER_PREFIX}`);
  if (!hasPrefix) {
    return lang === DEFAULT_LANG;
  }
  return id.startsWith(`${contentFolderForLang(lang)}/`);
}

export function withContentLangPrefix(cleanPath: string, lang: Lang): string {
  const clean = cleanPath.replace(/^\/+/, "");
  return `${contentFolderForLang(lang)}/${clean}`;
}

export function isValidNonDefaultLangRoute(
  value: string | undefined,
): value is Lang {
  if (!value) return false;
  const lang = normalizeLang(value);
  return (
    lang !== DEFAULT_LANG &&
    (SUPPORTED_LANGS as readonly string[]).includes(lang)
  );
}

export { DEFAULT_LANG, SUPPORTED_LANGS, normalizeLang, type Lang };
