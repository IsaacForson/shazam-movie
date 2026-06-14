/**
 * Builds data/subtitles.db from OpenSubtitles + TMDB, or seeds from quotes-db.
 *
 * Usage:
 *   npx tsx scripts/build-subtitle-index.ts --seed          # quotes-db only (no API keys)
 *   npx tsx scripts/build-subtitle-index.ts                 # full build (needs env keys)
 *   npx tsx scripts/build-subtitle-index.ts --limit 500     # cap movie count
 */

import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config();

import Database from "better-sqlite3";
import { parseSrt } from "../src/lib/srt-parser";
import { movieQuotes } from "../src/lib/quotes-db";

const DB_PATH = path.join(process.cwd(), "data", "subtitles.db");
const OPENSUBTITLES_BASE = "https://api.opensubtitles.com/api/v1";
const TMDB_BASE = "https://api.themoviedb.org/3";
const APP_UA = "SceneSnap v1.0";

interface TmdbMovie {
  id: number;
  title: string;
  release_date: string;
  imdb_id?: string | null;
}

function createSchema(db: Database.Database) {
  db.exec(`
    DROP TABLE IF EXISTS subtitle_lines;
    CREATE VIRTUAL TABLE subtitle_lines USING fts5(
      line_text,
      title,
      tmdb_id UNINDEXED,
      imdb_id UNINDEXED,
      start_ms UNINDEXED,
      end_ms UNINDEXED,
      tokenize='porter unicode61'
    );
  `);
}

function insertLines(
  db: Database.Database,
  rows: {
    line_text: string;
    title: string;
    tmdb_id: number;
    imdb_id: string;
    start_ms: number;
    end_ms: number;
  }[]
) {
  const insert = db.prepare(`
    INSERT INTO subtitle_lines (line_text, title, tmdb_id, imdb_id, start_ms, end_ms)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction((items: typeof rows) => {
    for (const row of items) insert.run(
      row.line_text,
      row.title,
      row.tmdb_id,
      row.imdb_id,
      row.start_ms,
      row.end_ms
    );
  });
  tx(rows);
}

function seedFromQuotes(db: Database.Database) {
  const rows = movieQuotes.map((q, i) => ({
    line_text: q.quote.toLowerCase(),
    title: q.title,
    tmdb_id: q.movieId,
    imdb_id: "",
    start_ms: (i + 1) * 60000,
    end_ms: (i + 1) * 60000 + 5000,
  }));
  insertLines(db, rows);
  console.log(`Seeded ${rows.length} lines from quotes-db`);
}

async function opensubtitlesLogin(): Promise<string> {
  const apiKey = process.env.OPENSUBTITLES_API_KEY;
  const username = process.env.OPENSUBTITLES_USERNAME;
  const password = process.env.OPENSUBTITLES_PASSWORD;

  if (!apiKey || !username || !password) {
    throw new Error("Missing OPENSUBTITLES_API_KEY, OPENSUBTITLES_USERNAME, or OPENSUBTITLES_PASSWORD");
  }

  const res = await fetch(`${OPENSUBTITLES_BASE}/login`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      "Content-Type": "application/json",
      "User-Agent": APP_UA,
    },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) throw new Error(`OpenSubtitles login failed: ${res.status}`);
  const data = await res.json();
  return data.token as string;
}

async function fetchTmdbPopular(limit: number): Promise<TmdbMovie[]> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) throw new Error("Missing TMDB_API_KEY");

  const movies: TmdbMovie[] = [];
  let page = 1;

  while (movies.length < limit) {
    const res = await fetch(
      `${TMDB_BASE}/movie/popular?api_key=${apiKey}&language=en-US&page=${page}`
    );
    if (!res.ok) break;
    const data = await res.json();
    for (const m of data.results || []) {
      if (movies.length >= limit) break;
      movies.push(m);
    }
    if (page >= (data.total_pages || 1)) break;
    page++;
    await sleep(250);
  }

  return movies.slice(0, limit);
}

async function fetchTmdbDetails(id: number, apiKey: string): Promise<TmdbMovie | null> {
  const res = await fetch(`${TMDB_BASE}/movie/${id}?api_key=${apiKey}&language=en-US`);
  if (!res.ok) return null;
  return res.json();
}

async function searchSubtitles(
  token: string,
  apiKey: string,
  tmdbId: number
): Promise<{ fileId: number } | null> {
  const res = await fetch(
    `${OPENSUBTITLES_BASE}/subtitles?tmdb_id=${tmdbId}&languages=en&order_by=download_count&order_direction=desc`,
    {
      headers: {
        "Api-Key": apiKey,
        Authorization: `Bearer ${token}`,
        "User-Agent": APP_UA,
      },
    }
  );

  if (!res.ok) return null;
  const data = await res.json();
  const item = data.data?.[0];
  if (!item) return null;

  const fileId = item.attributes?.files?.[0]?.file_id;
  return fileId ? { fileId } : null;
}

async function downloadSubtitle(
  token: string,
  apiKey: string,
  fileId: number
): Promise<string | null> {
  const res = await fetch(`${OPENSUBTITLES_BASE}/download`, {
    method: "POST",
    headers: {
      "Api-Key": apiKey,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": APP_UA,
    },
    body: JSON.stringify({ file_id: fileId }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const link = data.link as string | undefined;
  if (!link) return null;

  const srtRes = await fetch(link);
  if (!srtRes.ok) return null;
  return srtRes.text();
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function buildFull(limit: number) {
  const apiKey = process.env.OPENSUBTITLES_API_KEY!;
  const tmdbKey = process.env.TMDB_API_KEY!;

  console.log("Logging in to OpenSubtitles...");
  const token = await opensubtitlesLogin();

  console.log(`Fetching top ${limit} popular TMDB movies...`);
  const popular = await fetchTmdbPopular(limit);

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  createSchema(db);

  let processed = 0;
  let linesTotal = 0;

  for (const movie of popular) {
    const details = await fetchTmdbDetails(movie.id, tmdbKey);
    const imdbId = details?.imdb_id?.replace("tt", "") || "";
    const year = movie.release_date?.split("-")[0] || "";

    process.stdout.write(`[${processed + 1}/${popular.length}] ${movie.title} (${year})... `);

    const sub = await searchSubtitles(token, apiKey, movie.id);
    if (!sub) {
      console.log("no subtitles");
      processed++;
      await sleep(500);
      continue;
    }

    const srtContent = await downloadSubtitle(token, apiKey, sub.fileId);
    if (!srtContent) {
      console.log("download failed");
      processed++;
      await sleep(500);
      continue;
    }

    const parsed = parseSrt(srtContent);
    const rows = parsed.map((line) => ({
      line_text: line.text,
      title: movie.title,
      tmdb_id: movie.id,
      imdb_id: imdbId,
      start_ms: line.startMs,
      end_ms: line.endMs,
    }));

    if (rows.length > 0) {
      insertLines(db, rows);
      linesTotal += rows.length;
      console.log(`${rows.length} lines`);
    } else {
      console.log("empty");
    }

    processed++;
    await sleep(500);
  }

  db.close();
  console.log(`Done. ${linesTotal} subtitle lines from ${processed} movies → ${DB_PATH}`);
}

function buildSeed() {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  createSchema(db);
  seedFromQuotes(db);
  db.close();
  console.log(`Database written to ${DB_PATH}`);
}

async function main() {
  const args = process.argv.slice(2);
  const seedOnly = args.includes("--seed");
  const limitArg = args.find((a) => a.startsWith("--limit"));
  const limit = limitArg ? parseInt(limitArg.split("=")[1] || args[args.indexOf("--limit") + 1], 10) : 2000;

  if (seedOnly) {
    buildSeed();
    return;
  }

  const hasKeys =
    process.env.OPENSUBTITLES_API_KEY &&
    process.env.OPENSUBTITLES_USERNAME &&
    process.env.OPENSUBTITLES_PASSWORD &&
    process.env.TMDB_API_KEY;

  if (!hasKeys) {
    console.log("API keys not configured — falling back to quotes-db seed.");
    buildSeed();
    return;
  }

  await buildFull(limit);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
