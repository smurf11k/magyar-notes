// netlify/functions/pronounce.js

const UA =
  "mangyar-notes/1.0 (pronunciation-audio; contact: munkacsyrenata@gmail.com)";

async function mwQuery(apiBase, params) {
  const url = new URL(`${apiBase}/w/api.php`);
  Object.entries(params).forEach(([k, v]) =>
    url.searchParams.set(k, String(v)),
  );

  const res = await fetch(url.toString(), {
    headers: {
      "User-Agent": UA,
      "Api-User-Agent": UA,
      Accept: "application/json",
    },
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

  // Scoring: higher is better
  function score(title) {
    const t = title.toLowerCase();

    let s = 0;

    // prefer ogg/oga
    if (/\.(ogg|oga)$/.test(t)) s += 20;
    else if (/\.mp3$/.test(t)) s += 10;

    // prefer Hungarian markers
    if (/(^|[-_ ()])hu([-_ ()]|$)/.test(t)) s += 40;
    if (/hungarian/.test(t)) s += 30;
    if (/magyar/.test(t)) s += 20;

    // prefer pronunciation-ish words
    if (/pronun|pronunc|ipa|audio|speech/.test(t)) s += 20;

    // prefer if filename includes the word (rough match)
    if (w && t.includes(w)) s += 25;

    // avoid sentence/example/slow/lesson/random junk
    if (/example|sentence|phrase|dialog|conversation/.test(t)) s -= 40;
    if (/slow|spelling|letters|alphabet/.test(t)) s -= 20;

    return s;
  }

  titles.sort((a, b) => score(b) - score(a));
  return titles[0];
}

async function resolveFileUrl(apiBase, fileTitle) {
  // imageinfo works on the wiki that hosts the file.
  const data = await mwQuery(apiBase, {
    action: "query",
    format: "json",
    origin: "*",
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
  // 1) Get images/files used on the page
  const data = await mwQuery(apiBase, {
    action: "query",
    format: "json",
    origin: "*",
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

  const audioFiles = [bestFile];

  // 2) Try resolving on the same wiki first (sometimes file is local)
  for (const fileTitle of audioFiles) {
    const localUrl = await resolveFileUrl(apiBase, fileTitle);
    if (localUrl) return { fileTitle, url: localUrl, host: apiBase };
  }

  // 3) If not resolvable locally, resolve from Commons (most audio is there)
  for (const fileTitle of audioFiles) {
    const commonsUrl = await resolveFileUrl(
      "https://commons.wikimedia.org",
      fileTitle,
    );
    if (commonsUrl)
      return {
        fileTitle,
        url: commonsUrl,
        host: "https://commons.wikimedia.org",
      };
  }

  return null;
}

export async function handler(event) {
  try {
    const word = (event.queryStringParameters?.word || "").trim();
    if (!word) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ error: "Missing ?word=" }),
      };
    }

    const variants = Array.from(
      new Set([
        word,
        word.toLowerCase(),
        word.charAt(0).toUpperCase() + word.slice(1),
      ]),
    );

    const wikis = [
      { name: "huwiktionary", api: "https://hu.wiktionary.org" },
      { name: "enwiktionary", api: "https://en.wiktionary.org" },
    ];

    const tried = [];

    for (const w of wikis) {
      for (const t of variants) {
        tried.push(`${w.name}:${t}`);
        const hit = await findAudioOnWiki(w.api, t);
        if (hit?.url) {
          return {
            statusCode: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": "public, max-age=86400",
              "Netlify-CDN-Cache-Control": "public, max-age=86400",
            },
            body: JSON.stringify({
              word,
              tried,
              source: w.name,
              file: hit.fileTitle,
              url: hit.url,
              fileHost: hit.host,
            }),
          };
        }
      }
    }

    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
      body: JSON.stringify({
        word,
        tried,
        error: "No audio files found via MediaWiki images/imageinfo.",
      }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: String(err?.message || err) }),
    };
  }
}
