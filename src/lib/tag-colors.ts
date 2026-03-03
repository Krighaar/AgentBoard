// Preset palette of tag colors (bg + text classes)
const TAG_PALETTE = [
  "bg-blue-500/15 text-blue-400",
  "bg-green-500/15 text-green-400",
  "bg-purple-500/15 text-purple-400",
  "bg-pink-500/15 text-pink-400",
  "bg-yellow-500/15 text-yellow-400",
  "bg-cyan-500/15 text-cyan-400",
  "bg-orange-500/15 text-orange-400",
  "bg-red-500/15 text-red-400",
  "bg-indigo-500/15 text-indigo-400",
  "bg-teal-500/15 text-teal-400",
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function tagColor(tag: string): string {
  return TAG_PALETTE[hashString(tag.toLowerCase()) % TAG_PALETTE.length];
}
