/**
 * Ranking for the project index. Pure: a query and the searchable fields in,
 * the matching entries out, best first.
 *
 * Tiers, best first: the title starts with the query; a word in the title
 * starts with it; the title contains it; the heading contains it; the number,
 * index line or a tag contains it. Ties keep the input order, so the rack's
 * own order breaks them.
 */
export type Searchable = { title: string; heading: string; number: string; index: string; tags: readonly string[] };

const tier = (item: Searchable, q: string): number | null => {
  const title = item.title.toLowerCase();
  if (title.startsWith(q)) return 0;
  if (title.split(/[\s\-_/.]+/).some((w) => w.startsWith(q))) return 1;
  if (title.includes(q)) return 2;
  if (item.heading.toLowerCase().includes(q)) return 3;
  if ([item.number, item.index, ...item.tags].join(" ").toLowerCase().includes(q)) return 4;
  return null;
};

export function rank<T extends Searchable>(items: readonly T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...items];
  return items
    .map((item, i) => ({ item, i, t: tier(item, q) }))
    .filter((r): r is { item: T; i: number; t: number } => r.t !== null)
    .sort((a, b) => a.t - b.t || a.i - b.i)
    .map((r) => r.item);
}
