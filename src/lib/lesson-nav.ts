import type { CollectionEntry } from "astro:content";
import fs from "node:fs";
import path from "node:path";

export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

const CONTENT_DIR = path.resolve("src/content/lessons");

/**
 * Read _meta.json from a folder path (relative to content/lessons).
 * Returns the custom label if set, otherwise null.
 */
export function getFolderLabel(folderPath: string): string | null {
  const metaPath = path.join(CONTENT_DIR, folderPath, "_meta.json");
  try {
    if (fs.existsSync(metaPath)) {
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
      return meta.label || null;
    }
  } catch {
    // ignore
  }
  return null;
}

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

export type TreeNode = {
  name: string;
  label: string;
  path: string;
  isFile: boolean;
  isEmpty?: boolean;
  children?: TreeNode[];
};

export function buildTree(lessons: CollectionEntry<"lessons">[]): TreeNode[] {
  const root: TreeNode[] = [];
  const folderMap = new Map<string, TreeNode>();

  function getOrCreateFolder(folderParts: string[]): TreeNode {
    const key = folderParts.join("/");
    if (folderMap.has(key)) return folderMap.get(key)!;

    const folderName = folderParts[folderParts.length - 1];
    const node: TreeNode = {
      name: folderName,
      label: getFolderLabel(key) ?? titleFromPart(folderName),
      path: key,
      isFile: false,
      children: [],
    };

    folderMap.set(key, node);

    if (folderParts.length === 1) {
      root.push(node);
    } else {
      const parent = getOrCreateFolder(folderParts.slice(0, -1));
      parent.children!.push(node);
    }

    return node;
  }

  for (const entry of lessons) {
    const clean = stripMd(entry.id);
    const parts = clean.split("/");
    const fileName = parts[parts.length - 1];
    const folderParts = parts.slice(0, -1);

    // Ensure all ancestor folders exist
    const parent = getOrCreateFolder(folderParts);

    const fileNode: TreeNode = {
      name: fileName,
      label: entry.data.title ?? titleFromPart(fileName),
      path: clean,
      isFile: true,
      isEmpty: !entry.body || entry.body.trim().length === 0,
    };

    parent.children!.push(fileNode);
  }

  // Sort children at every level by order prefix
  function sortChildren(nodes: TreeNode[]) {
    nodes.sort((a, b) => {
      const ao = orderFromPart(a.name);
      const bo = orderFromPart(b.name);
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    }
  }

  sortChildren(root);

  return root;
}
