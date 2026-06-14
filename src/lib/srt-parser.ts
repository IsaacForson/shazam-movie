export interface SubtitleLine {
  startMs: number;
  endMs: number;
  text: string;
}

function parseTimestamp(ts: string): number {
  const match = ts.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
  if (!match) return 0;
  const [, h, m, s, ms] = match;
  return (
    parseInt(h, 10) * 3600000 +
    parseInt(m, 10) * 60000 +
    parseInt(s, 10) * 1000 +
    parseInt(ms, 10)
  );
}

export function normalizeSubtitleText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/\{[^}]+\}/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function parseSrt(content: string): SubtitleLine[] {
  const lines: SubtitleLine[] = [];
  const blocks = content.replace(/\r\n/g, "\n").split(/\n\n+/);

  for (const block of blocks) {
    const blockLines = block.trim().split("\n");
    if (blockLines.length < 2) continue;

    const timeLine = blockLines.find((l) => l.includes("-->"));
    if (!timeLine) continue;

    const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
    const text = blockLines
      .slice(blockLines.indexOf(timeLine) + 1)
      .join(" ")
      .trim();

    const normalized = normalizeSubtitleText(text);
    if (normalized.length < 3) continue;

    lines.push({
      startMs: parseTimestamp(startStr),
      endMs: parseTimestamp(endStr),
      text: normalized,
    });
  }

  return lines;
}
