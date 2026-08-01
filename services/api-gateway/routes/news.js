// ─────────────────────────────────────────────────────────────────
// routes/news.js – Live market news via Marketaux
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const axios = require('axios');
const router = express.Router();

const MARKETAUX_API_KEY = process.env.MARKETAUX_API_KEY || '';
const MARKETAUX_URL = 'https://api.marketaux.com/v1/news/all';

// Cache briefly so every dashboard poll/refresh doesn't burn through the
// free-tier daily request quota.
let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000;

function relativeTime(isoDate) {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function sentimentToImpactTag(score) {
  if (typeof score !== 'number') return { impact: 'neutral', tag: 'Market' };
  if (score > 0.15) return { impact: 'positive', tag: 'Bullish' };
  if (score < -0.15) return { impact: 'negative', tag: 'Bearish' };
  return { impact: 'neutral', tag: 'Neutral' };
}

// Marketaux's free tier gives raw source domains (e.g. "economictimes.
// indiatimes.com") and only sometimes a real entity industry — neither is a
// clean badge on its own, so build one from whichever signal is available.
const KEYWORD_CATEGORIES = [
  [/\brbi\b|repo rate|monetary policy/i, 'RBI'],
  [/\bgold\b|bullion/i, 'GOLD'],
  [/\bnifty\b|\bsensex\b|\bbse\b|\bnse\b|stock market/i, 'MARKET'],
  [/\bsebi\b/i, 'SEBI'],
  [/\bipo\b/i, 'IPO'],
  [/mutual fund|\bsip\b/i, 'MUTUAL FUNDS'],
  [/\btax\b|income tax|gst\b/i, 'TAX'],
  [/bank|nbfc|finance|financial services/i, 'BANKING'],
  [/auto|vehicle|car sales/i, 'AUTO'],
];

function deriveCategory(article, entities) {
  const realIndustry = (entities || [])
    .map((e) => e.industry)
    .find((i) => i && i !== 'N/A');
  if (realIndustry) return realIndustry.toUpperCase();

  const haystack = article.title || '';
  const match = KEYWORD_CATEGORIES.find(([re]) => re.test(haystack));
  if (match) return match[1];

  return 'MARKET';
}

function cleanSourceName(domain) {
  if (!domain) return '';
  return domain
    .replace(/^www\./, '')
    .replace(/\.(com|in|co\.in|org|net)$/i, '')
    .split('.')
    .pop()
    .replace(/^\w/, (c) => c.toUpperCase());
}

router.get('/', async (req, res) => {
  if (!MARKETAUX_API_KEY) {
    return res.status(503).json({ error: 'MARKETAUX_API_KEY not configured', articles: [] });
  }

  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return res.json({ articles: cache.data, cached: true });
  }

  try {
    const response = await axios.get(MARKETAUX_URL, {
      params: {
        api_token: MARKETAUX_API_KEY,
        countries: 'in',
        language: 'en',
        limit: 10,
      },
      timeout: 10000,
    });

    const articles = (response.data?.data || []).map((a) => {
      // Average entity sentiment score, if present, otherwise neutral.
      const scores = (a.entities || []).map((e) => e.sentiment_score).filter((s) => typeof s === 'number');
      const avgScore = scores.length ? scores.reduce((s, v) => s + v, 0) / scores.length : null;
      const { impact, tag } = sentimentToImpactTag(avgScore);
      return {
        category: deriveCategory(a, a.entities),
        source: cleanSourceName(a.source),
        headline: a.title,
        time: relativeTime(a.published_at),
        impact,
        tag,
        url: a.url,
      };
    });

    cache = { data: articles, fetchedAt: Date.now() };
    res.json({ articles });
  } catch (err) {
    console.error('[News] Marketaux fetch failed:', err.message);
    res.status(502).json({ error: 'Failed to fetch live news', articles: [] });
  }
});

module.exports = router;
