/**
 * Simple Sentiment Analyzer
 * Uses keyword matching for positive/negative words
 * Can be replaced with ML model or external API later
 */

const POSITIVE_WORDS = [
  "bullish", " surge", " rally", "gain", "up", "rise", "boom", "optimistic",
  "breakthrough", "growth", "strong", "higher", "outperform", "beat", "exceed",
  "positive", "upgrade", "buy", "support", "recovery", "rebound", "momentum",
  "confidence", "stable", "robust", "thriving", "soaring", "climbing"
];

const NEGATIVE_WORDS = [
  "bearish", " crash", " plunge", "fall", "down", "drop", "decline", "pessimistic",
  "sell-off", "loss", "weak", "lower", "underperform", "miss", "disappoint",
  "negative", "downgrade", "sell", "resistance", "slump", "tumble", "collapse",
  "fear", "unstable", "worrisome", "plummet", "sink", "dip"
];

/**
 * Analyze text sentiment and return score between -1 and 1
 */
export function analyzeSentiment(text: string): number {
  if (!text) return 0;

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let positiveCount = 0;
  let negativeCount = 0;

  for (const word of words) {
    if (POSITIVE_WORDS.some(pw => word.includes(pw.trim()))) {
      positiveCount++;
    }
    if (NEGATIVE_WORDS.some(nw => word.includes(nw.trim()))) {
      negativeCount++;
    }
  }

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / total;
}

/**
 * Analyze a batch of news articles and aggregate sentiment
 */
export function aggregateSentiment(
  articles: Array<{ title: string; description?: string; text?: string }>,
  symbol: string
): {
  score: number;
  confidence: number;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
  articles: Array<{ title: string; score: number }>;
} {
  const scoredArticles = articles.map(article => {
    const content = `${article.title} ${article.description || article.text || ""}`;
    const score = analyzeSentiment(content);
    return {
      title: article.title,
      score,
    };
  });

  const positiveCount = scoredArticles.filter(a => a.score > 0.1).length;
  const negativeCount = scoredArticles.filter(a => a.score < -0.1).length;
  const neutralCount = scoredArticles.length - positiveCount - negativeCount;

  // Overall score: -1 to 1
  const totalScored = scoredArticles.reduce((sum, a) => sum + a.score, 0);
  const score = scoredArticles.length > 0 ? totalScored / scoredArticles.length : 0;

  // Confidence based on agreement (more polarized = higher confidence)
  const consensus = (positiveCount + negativeCount) / Math.max(scoredArticles.length, 1);
  const confidence = Math.min(0.95, consensus + 0.3); // baseline 0.3, up to 0.95

  return {
    score,
    confidence,
    positiveCount,
    negativeCount,
    totalCount: scoredArticles.length,
    articles: scoredArticles,
  };
}
