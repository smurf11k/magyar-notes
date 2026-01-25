import type { CollectionEntry } from "astro:content";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export function levelFromFolder(folder: string): Level | null {
  const v = folder.toLowerCase();
  if (v.startsWith("a1")) return "A1";
  if (v.startsWith("a2")) return "A2";
  if (v.startsWith("b1")) return "B1";
  if (v.startsWith("b2")) return "B2";
  if (v.startsWith("c1")) return "C1";
  if (v.startsWith("c2")) return "C2";
  return null;
}

export function stripMd(id: string): string {
  return id.replace(/\.(md|mdx)$/, "");
}

export function moduleKeyFromId(id: string): string {
  const clean = stripMd(id);
  const parts = clean.split("/");
  return parts.slice(0, 2).join("/");
}

export function titleFromPart(part: string): string {
  const cleaned = part
    .replace(/^\d+\./, "")
    .replace(/[-_]/g, " ")
    .replace(/&/g, " & ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

export function orderFromPart(part: string): number {
  const m = part.match(/^(\d+)\./);
  return m ? Number(m[1]) : 999;
}

export function moduleMeta(moduleKey: string) {
  const [levelFolder, moduleFolder] = moduleKey.split("/");
  const level = levelFromFolder(levelFolder) ?? "A1";
  const moduleTitle = titleFromPart(moduleFolder);
  return { level, moduleTitle, levelFolder, moduleFolder };
}

export type ModulePage = {
  id: string;
  href: string;
  title: string;
  rel: string;
};

export function getModulePages(
  entries: CollectionEntry<"lessons">[],
  moduleKey: string,
): ModulePage[] {
  const pages = entries
    .filter((e) => stripMd(e.id).startsWith(moduleKey + "/"))
    .map((e) => {
      const clean = stripMd(e.id);
      const parts = clean.split("/");
      const filePart = parts[parts.length - 1];

      const title = e.data.title ?? titleFromPart(filePart);
      const rel = clean.replace(moduleKey + "/", "");

      return {
        id: e.id,
        href: "/lessons/" + clean,
        title,
        rel,
      };
    });

  pages.sort((a, b) => {
    const aParts = a.href.split("/").slice(2);
    const bParts = b.href.split("/").slice(2);
    const max = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < max; i++) {
      const ap = aParts[i] ?? "";
      const bp = bParts[i] ?? "";
      const ao = orderFromPart(ap);
      const bo = orderFromPart(bp);
      if (ao !== bo) return ao - bo;

      const cmp = ap.localeCompare(bp);
      if (cmp !== 0) return cmp;
    }
    return a.title.localeCompare(b.title);
  });

  return pages;
}
