export interface VTTCue {
  id: string;
  start: string;
  startSeconds: number;
  end: string;
  text: string;
}

function parseTimestamp(ts: string): number {
  const [time, ms] = ts.split(".");
  const parts = time.split(":").map(Number);
  const [h, m, s] = parts.length === 3 ? parts : [0, parts[0], parts[1]];
  return h * 3600 + m * 60 + s + Number(ms ?? 0) / 1000;
}

function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseVTT(vtt: string): VTTCue[] {
  const lines = vtt.replace(/\r\n/g, "\n").split("\n");
  const cues: VTTCue[] = [];

  let i = 0;
  // Skip WEBVTT header
  if (lines[i]?.startsWith("WEBVTT")) i++;

  while (i < lines.length) {
    // Skip blank lines
    if (!lines[i]?.trim()) { i++; continue; }

    // Try to detect a cue ID line (non-timestamp, non-empty)
    let cueId = "";
    const maybeTsLine = lines[i + 1]?.includes("-->");
    if (lines[i].trim() && !lines[i].includes("-->") && maybeTsLine) {
      cueId = lines[i].trim();
      i++;
    }

    // Timestamp line
    if (!lines[i]?.includes("-->")) { i++; continue; }
    const timeParts = lines[i].trim().split(/\s+-->\s+/);
    if (timeParts.length !== 2) { i++; continue; }
    const startSeconds = parseTimestamp(timeParts[0].trim());
    const end = timeParts[1].trim();
    i++;

    // Text lines (until blank line or end)
    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim()) {
      textLines.push(lines[i].trim());
      i++;
    }

    const text = textLines.join(" ").trim();
    if (!text) continue;

    cues.push({
      id: cueId,
      start: formatTime(startSeconds),
      startSeconds,
      end,
      text,
    });
  }

  return cues;
}

export function vttToPlainText(vtt: string): string {
  const lines = vtt.replace(/\r\n/g, "\n").split("\n");
  const texts: string[] = [];

  let i = 0;
  if (lines[i]?.startsWith("WEBVTT")) i++;

  while (i < lines.length) {
    if (!lines[i]?.trim()) { i++; continue; }

    // Skip cue ID line
    if (!lines[i].includes("-->") && lines[i + 1]?.includes("-->")) { i++; continue; }

    // Skip timestamp line
    if (lines[i].includes("-->")) { i++; continue; }

    // Collect text
    while (i < lines.length && lines[i].trim()) {
      texts.push(lines[i].trim());
      i++;
    }
  }

  return texts.join(" ").replace(/\s+/g, " ").trim();
}
