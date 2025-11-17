"use server";

import { getDateRange, validateArticle, formatArticle } from "@/lib/utils";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

const NEXT_PUBLIC_FINNHUB_API_KEY =
  process.env.NEXT_PUBLIC_FINNHUB_API_KEY || "";

if (!NEXT_PUBLIC_FINNHUB_API_KEY) {
  console.error("NEXT_PUBLIC_FINNHUB_API_KEY is not set");
}

const fetchJSON = async (url: string, revalidateSeconds?: number) => {
  try {
    const options: RequestInit & { next?: { revalidate?: number } } =
      revalidateSeconds
        ? { cache: "force-cache", next: { revalidate: revalidateSeconds } }
        : { cache: "no-store" };

    const res = await fetch(url, options);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Fetch failed (${res.status}): ${txt}`);
    }
    return res.json();
  } catch (e) {
    throw e;
  }
};

export const getNews = async (
  symbols?: string[]
): Promise<MarketNewsArticle[]> => {
  try {
    const { from, to } = getDateRange(5);

    // Helper to fetch company news
    const fetchCompanyNews = async (symbol: string) => {
      const url = `${FINNHUB_BASE_URL}/company-news?symbol=${encodeURIComponent(
        symbol
      )}&from=${from}&to=${to}&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
      return (await fetchJSON(url)) as RawNewsArticle[];
    };

    const maxArticles = 6;
    const collected: MarketNewsArticle[] = [];

    if (symbols && symbols.length > 0) {
      const cleaned = Array.from(
        new Set(symbols.map((s) => s.trim().toUpperCase()))
      ).filter(Boolean);

      if (cleaned.length === 0) return [];

      // Track offset for each symbol to avoid duplicates
      const symbolOffsets = new Map<string, number>();

      // Round-robin up to 6 rounds (take 1 article per symbol per round)
      for (
        let round = 0;
        round < 6 && collected.length < maxArticles;
        round++
      ) {
        for (
          let i = 0;
          i < cleaned.length && collected.length < maxArticles;
          i++
        ) {
          const symbol = cleaned[i];
          const offset = symbolOffsets.get(symbol) || 0;
          try {
            const articles = await fetchCompanyNews(symbol);
            const valid = (articles || []).filter(validateArticle);
            if (valid.length > offset) {
              const formatted = formatArticle(
                valid[offset],
                true,
                symbol,
                collected.length
              );
              collected.push(formatted as MarketNewsArticle);
              symbolOffsets.set(symbol, offset + 1);
            }
          } catch (e) {
            // log and continue to next symbol
            console.error(`Failed fetching company news for ${symbol}`, e);
            continue;
          }
        }
      }

      // Sort by datetime desc and limit
      return collected
        .sort((a, b) => (b.datetime || 0) - (a.datetime || 0))
        .slice(0, maxArticles);
    }

    // No symbols provided: fetch general market news
    const generalUrl = `${FINNHUB_BASE_URL}/news?category=general&token=${NEXT_PUBLIC_FINNHUB_API_KEY}`;
    const general = (await fetchJSON(generalUrl)) as RawNewsArticle[];
    if (!general || general.length === 0) return [];

    // Deduplicate
    const seen = new Set<string>();
    const result: MarketNewsArticle[] = [];
    for (let i = 0; i < general.length && result.length < maxArticles; i++) {
      const art = general[i];
      if (!validateArticle(art)) continue;
      const key = `${art.id}-${art.url}-${(art.headline || "").slice(0, 60)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(formatArticle(art, false, "", i) as MarketNewsArticle);
    }

    return result.slice(0, maxArticles);
  } catch (e) {
    console.error("failed to fetch news", e);
    throw new Error("failed to fetch news");
  }
};
