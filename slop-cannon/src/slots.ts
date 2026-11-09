import type { Channel } from "./buffer";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// The wall-clock parts of an instant in a timezone.
function partsIn(tz: string, at: number) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", weekday: "short",
  });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date(at))) p[x.type] = x.value;
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, mi: +p.minute, wd: p.weekday.toLowerCase().slice(0, 3) };
}

// The UTC instant for a wall-clock time in a timezone (two passes settle DST).
function instant(tz: string, y: number, m: number, d: number, h: number, mi: number): number {
  const wanted = Date.UTC(y, m - 1, d, h, mi);
  let guess = wanted;
  for (let i = 0; i < 2; i++) {
    const p = partsIn(tz, guess);
    guess += wanted - Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi);
  }
  return guess;
}

export interface Slot {
  channelId: string;
  at: number; // epoch ms
}

// Every open posting-schedule slot in the next `days` days, skipping slots that
// already have a post within two minutes and anything in the next ten minutes.
export function openSlots(ch: Channel, taken: number[], now: number, days: number, max: number): Slot[] {
  if (ch.queuePaused) return [];
  let tz = ch.timezone;
  try { partsIn(tz, now); } catch { tz = "UTC"; }
  const out: Slot[] = [];
  const today = partsIn(tz, now);
  for (let i = 0; i <= days && out.length < max; i++) {
    // Noon on day i keeps the date arithmetic clear of DST edges.
    const noon = instant(tz, today.y, today.m, today.d, 12, 0) + i * 86_400_000;
    const p = partsIn(tz, noon);
    const day = ch.schedule.find((s) => s.day.toLowerCase().slice(0, 3) === p.wd);
    if (!day || day.paused) continue;
    for (const t of [...day.times].sort()) {
      const [h, mi] = t.split(":").map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(mi)) continue;
      const at = instant(tz, p.y, p.m, p.d, h, mi);
      if (at < now + 10 * 60_000 || at > now + (days + 1) * 86_400_000) continue;
      if (taken.some((x) => Math.abs(x - at) < 120_000)) continue;
      out.push({ channelId: ch.id, at });
      if (out.length >= max) break;
    }
  }
  void DAYS;
  return out;
}
