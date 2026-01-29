const WIKIS = [
  { name: "huwiktionary", api: "https://hu.wiktionary.org" },
  { name: "enwiktionary", api: "https://en.wiktionary.org" },
];

async function mwQuery(apiBase, params) {
  const url = new URL(`${apiBase}/w/api.php`);
  for (const [k, v] of Object.entries(params))
    url.searchParams.set(k, String(v));

  // IMPORTANT: origin=* enables CORS for browser requests
  url.searchParams.set("origin", "*");

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function pickBestAudioFromImages(images, word) {
  if (!Array.isArray(images)) return null;
  const w = String(word || "").toLowerCase();

  const titles = images
    .map((x) => x?.title)
    .filter(Boolean)
    .map((t) => (t.startsWith("File:") ? t : `File:${t}`))
    .filter((t) => /\.(ogg|oga|mp3|wav)$/i.test(t));

  if (!titles.length) return null;

  function score(title) {
    const t = title.toLowerCase();
    let s = 0;
    if (/\.(ogg|oga)$/.test(t)) s += 20;
    else if (/\.mp3$/.test(t)) s += 10;

    if (/(^|[-_ ()])hu([-_ ()]|$)/.test(t)) s += 40;
    if (/hungarian/.test(t)) s += 30;
    if (/magyar/.test(t)) s += 20;

    if (/pronun|pronunc|ipa|audio|speech/.test(t)) s += 20;
    if (w && t.includes(w)) s += 25;

    if (/example|sentence|phrase|dialog|conversation/.test(t)) s -= 40;
    if (/slow|spelling|letters|alphabet/.test(t)) s -= 20;

    return s;
  }

  titles.sort((a, b) => score(b) - score(a));
  return titles[0];
}

async function resolveFileUrl(apiBase, fileTitle) {
  const data = await mwQuery(apiBase, {
    action: "query",
    format: "json",
    prop: "imageinfo",
    titles: fileTitle,
    iiprop: "url",
  });

  const pages = data?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  const url = page?.imageinfo?.[0]?.url;
  return typeof url === "string" ? url : null;
}

async function findAudioOnWiki(apiBase, title) {
  const data = await mwQuery(apiBase, {
    action: "query",
    format: "json",
    prop: "images",
    titles: title,
    imlimit: "max",
  });

  const pages = data?.query?.pages;
  if (!pages) return null;

  const page = Object.values(pages)[0];
  const images = page?.images || [];

  const bestFile = pickBestAudioFromImages(images, title);
  if (!bestFile) return null;

  const localUrl = await resolveFileUrl(apiBase, bestFile);
  if (localUrl) return { fileTitle: bestFile, url: localUrl, host: apiBase };

  const commonsUrl = await resolveFileUrl(
    "https://commons.wikimedia.org",
    bestFile,
  );
  if (commonsUrl)
    return {
      fileTitle: bestFile,
      url: commonsUrl,
      host: "https://commons.wikimedia.org",
    };

  return null;
}

export async function pronounce(wordRaw) {
  const word = (wordRaw || "").trim();
  if (!word) throw new Error("Missing word");

  const variants = Array.from(
    new Set([
      word,
      word.toLowerCase(),
      word.charAt(0).toUpperCase() + word.slice(1),
    ]),
  );

  const tried = [];

  for (const w of WIKIS) {
    for (const t of variants) {
      tried.push(`${w.name}:${t}`);
      const hit = await findAudioOnWiki(w.api, t);
      if (hit?.url)
        return {
          word,
          tried,
          source: w.name,
          file: hit.fileTitle,
          url: hit.url,
          fileHost: hit.host,
        };
    }
  }

  return { word, tried, error: "No audio found" };
}
