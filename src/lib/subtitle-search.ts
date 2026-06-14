import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface SubtitleMatch {
  tmdbId: number;
  title: string;
  imdbId: string;
  matchedLine: string;
  startMs: number;
  endMs: number;
  confidence: number;
}

let db: Database.Database | null = null;

function getDbPath(): string {
  if (process.env.SUBTITLE_DB_PATH) return process.env.SUBTITLE_DB_PATH;
  return path.join(/* turbopackIgnore: true */ process.cwd(), "data", "subtitles.db");
}

function getDb(): Database.Database | null {
  if (db) return db;

  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) return null;

  db = new Database(dbPath, { readonly: true });
  return db;
}

function escapeFtsQuery(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  if (words.length === 0) return "";
  return words.map((w) => `"${w.replace(/"/g, "")}"`).join(" ");
}

export function searchSubtitles(text: string): SubtitleMatch[] {
  const database = getDb();
  if (!database || !text || text.trim().length < 3) return [];

  const ftsQuery = escapeFtsQuery(text.trim());
  if (!ftsQuery) return [];

  try {
    const rows = database
      .prepare(
        `
        SELECT line_text, title, tmdb_id, imdb_id, start_ms, end_ms, bm25(subtitle_lines) AS rank
        FROM subtitle_lines
        WHERE subtitle_lines MATCH ?
        ORDER BY rank
        LIMIT 50
      `
      )
      .all(ftsQuery) as {
      line_text: string;
      title: string;
      tmdb_id: number;
      imdb_id: string;
      start_ms: number;
      end_ms: number;
      rank: number;
    }[];

    const seen = new Set<number>();
    const matches: SubtitleMatch[] = [];
    const queryLower = text.toLowerCase();

    for (const row of rows) {
      if (seen.has(row.tmdb_id)) continue;
      seen.add(row.tmdb_id);

      const lineMatch = row.line_text.includes(queryLower.slice(0, 20))
        ? 0.9
        : Math.max(0.3, Math.min(0.85, 1 / (1 + Math.abs(row.rank) * 0.1)));

      matches.push({
        tmdbId: row.tmdb_id,
        title: row.title,
        imdbId: row.imdb_id,
        matchedLine: row.line_text,
        startMs: row.start_ms,
        endMs: row.end_ms,
        confidence: lineMatch,
      });
    }

    return matches.slice(0, 10);
  } catch {
    return [];
  }
}

export function isSubtitleDbAvailable(): boolean {
  return fs.existsSync(getDbPath());
}
