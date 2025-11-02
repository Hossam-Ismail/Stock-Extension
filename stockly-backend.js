const express = require("express");
const cors = require("cors");
require("dotenv").config();
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3001;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const NEWS_KEY = process.env.NEWS_API_KEY;
const PRICE_KEY = process.env.ALPHA_VANTAGE_KEY;

app.post("/analyze", async (req, res) => {
  const { ticker } = req.body;
  if (!ticker) return res.status(400).json({ error: "Missing ticker" });

  try {
    // Get price
    let price = null, change = null, changePct = null;
    if (PRICE_KEY) {
      try {
        const r = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${PRICE_KEY}`);
        const d = await r.json();
        if (d['Global Quote']?.['05. price']) {
          price = parseFloat(d['Global Quote']['05. price']).toFixed(2);
          change = parseFloat(d['Global Quote']['09. change']).toFixed(2);
          changePct = parseFloat(d['Global Quote']['10. change percent'].replace('%', '')).toFixed(2);
        }
      } catch (e) {}
    }

    // Get news
    let news = [];
    if (NEWS_KEY) {
      try {
        const since = new Date(Date.now() - 2*24*60*60*1000).toISOString();
        const r = await fetch(`https://newsapi.org/v2/everything?q="${ticker}"&from=${since}&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_KEY}`);
        const d = await r.json();
        if (d.articles?.length) {
          news = d.articles.slice(0, 2).map(a => ({
            title: a.title,
            time: Math.floor((Date.now() - new Date(a.publishedAt)) / 3600000)
          }));
        }
      } catch (e) {}
    }

    const pct = changePct ? parseFloat(changePct) : 0;
    
    // Determine verdict
    let verdict = '✅ Green';
    if (pct < -12) verdict = '🔴 Red';
    else if (pct < -7) verdict = '🟠 Orange';
    else if (pct < -3) verdict = '✅ Green';
    else if (pct < -1) verdict = '✅ Green';
    else if (pct <= 1) verdict = '✅ Green';
    else if (pct <= 3) verdict = '🟡 Yellow';
    else if (pct <= 6) verdict = '🟡 Yellow';
    else if (pct <= 10) verdict = '🟠 Orange';
    else verdict = '🔴 Red';

    const prompt = `${ticker} @ $${price} (${changePct}%)
${news.length ? news.map(n => `- ${n.time}h: ${n.title}`).join('\n') : '- No major news'}

Verdict: ${verdict}

Write 4 SHORT sections:
1. ONE sentence why this verdict
2. 2 news bullets (casual, why it matters) OR "Quiet week"
3. ONE line: what they do
4. ONE sentence: entry strategy with price

Total: 50 words max. Be direct. Vary your style.`;

    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
        temperature: 0.9
      })
    });
    
    const data = await r.json();
    let answer = data.choices?.[0]?.message?.content || "";
    
    // Clean and format
    answer = answer
      .replace(/\d+\.\s*/g, '')
      .replace(/^-+$/gm, '')
      .split('\n')
      .filter(line => line.trim())
      .map((line, i) => {
        if (i === 0) return `<div style="margin:16px 0 8px;color:#fbbf24;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Why</div>${line}`;
        if (line.startsWith('•') || line.startsWith('-')) return `<div style="padding:6px 10px;margin:3px 0;background:rgba(46,185,224,0.06);border-left:2px solid #2eb9e0;border-radius:3px;font-size:13px;color:#d0d0d0;">${line}</div>`;
        return `<div style="margin:12px 0;font-size:14px;line-height:1.5;">${line}</div>`;
      })
      .join('');

    // Build response
    const badge = price ? `<div style="background:rgba(46,185,224,0.1);border:1px solid rgba(46,185,224,0.3);border-radius:8px;padding:12px;margin-bottom:16px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:#fff;">$${price}</div>
      <div style="font-size:13px;color:${change >= 0 ? '#10b981' : '#ef4444'};font-weight:600;">${change >= 0 ? '▲' : '▼'} $${Math.abs(change)} (${changePct}%)</div>
    </div>` : '';

    const verdictBadge = `<div style="display:inline-block;padding:10px 16px;margin:12px 0;background:linear-gradient(135deg,rgba(102,126,234,0.25),rgba(118,75,162,0.25));border:2px solid #667eea;border-radius:8px;font-size:16px;font-weight:700;color:#fff;box-shadow:0 2px 8px rgba(102,126,234,0.3);">${verdict}</div>`;

    res.json({ result: badge + verdictBadge + answer });
    
  } catch (err) {
    console.error("❌", err.message);
    res.json({ result: `<div style="padding:20px;text-align:center;color:#aaa;">Analysis unavailable. Try again.</div>` });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Port ${PORT}`);
  console.log(OPENROUTER_KEY ? "🔧 OpenRouter ✓" : "⚠️  OpenRouter ✗");
  console.log(NEWS_KEY ? "📰 News ✓" : "📰 News ✗");
  console.log(PRICE_KEY ? "💵 Price ✓" : "💵 Price ✗");
});
