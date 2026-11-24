import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// My dream vacation, in one picture: a desert island.
// No beach umbrella, no plane, no suitcase — just the island itself.
// Palm, sand, and nowhere to be. That is the whole trip.
const EMOJI = "🏝️";

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function assertSingleEmoji(value: string): void {
  if (value.length === 0) throw new Error("entry is empty");
  if (/\s/.test(value)) throw new Error("entry must not contain whitespace");
  if (value.includes("\n") || value.includes("\r")) {
    throw new Error("entry must not contain a newline");
  }
  const segments = [...new Intl.Segmenter("en", { granularity: "grapheme" }).segment(value)];
  if (segments.length !== 1) {
    throw new Error(`entry must be exactly one emoji, got ${segments.length} graphemes`);
  }
  if (!/\p{Extended_Pictographic}/u.test(segments[0].segment)) {
    throw new Error("entry must be an emoji");
  }
  // The emoji is several UTF-8 bytes, not one byte — keep that straight
  // when checking the file later, so a byte count is never confused
  // with a character count.
  if (Buffer.byteLength(value, "utf8") < 1) throw new Error("entry has no bytes");
}

assertSingleEmoji(EMOJI);

// Only ever write under MAKEFUN_OUTPUT_DIR. The repo is mounted
// read-only by the grader, so nothing here touches the source tree.
if (!outDir || outDir.trim().length === 0) throw new Error("output dir is empty");
mkdirSync(outDir, { recursive: true });
const entryPath = join(outDir, "entry.txt");
writeFileSync(entryPath, EMOJI, "utf8");

// Read it back and prove the file is exactly the emoji, byte for byte,
// with no trailing newline smuggled in at the end.
const expected = Buffer.from(EMOJI, "utf8");
const written = readFileSync(entryPath);
if (written.length !== expected.length) {
  throw new Error(`entry.txt is ${written.length} bytes, expected ${expected.length}`);
}
if (written[written.length - 1] === 0x0a) {
  throw new Error("entry.txt ends with a newline");
}
if (!written.equals(expected)) {
  throw new Error("entry.txt does not match the emoji byte-for-byte");
}
console.log(`Wrote one emoji (${written.length} bytes) to ${entryPath}`);
