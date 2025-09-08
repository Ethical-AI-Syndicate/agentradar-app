import { load } from 'cheerio';

// Parse Ontario court bulletin HTML into a list of filing links
export function parseCourtFiling(html) {
  const $ = load(html);
  const filings = [];
  const seen = new Set();

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    const title = $(el).text().trim();
    const url = new URL(href, 'https://www.ontariocourts.ca/').href;
    if (seen.has(url)) return; // duplicate detection
    if (/\.pdf$/i.test(url) || url.includes('court-lists')) {
      filings.push({ title, url });
      seen.add(url);
    }
  });

  return { filings };
}
