import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

// Cache the rate for 24 hours
let cachedRate: { rate: number; date: string } | null = null;

export async function GET(request: NextRequest) {
  try {
    // Check if we have a cached rate from today
    const today = new Date().toISOString().slice(0, 10);
    if (cachedRate && cachedRate.date === today) {
      return NextResponse.json({ rate: cachedRate.rate, date: cachedRate.date, source: 'cache' });
    }

    // Fetch USD rate from Central Bank of Russia XML API
    const cbrUrl = 'https://www.cbr.ru/scripts/XML_daily.asp';
    const response = await fetch(cbrUrl, {
      headers: { 'Accept': 'application/xml' },
      cache: 'force-cache',
      next: { revalidate: 86400 }, // revalidate once per day
    });

    if (!response.ok) {
      // Fallback rate if CBR is unreachable
      return NextResponse.json({ rate: 90, date: today, source: 'fallback' });
    }

    const xml = await response.text();

    // Extract USD rate from XML: <Valute ID="R01235"><Value>XX,XX</Value>...</Valute>
    const match = xml.match(/<Valute ID="R01235">[\s\S]*?<Value>([\d,]+)<\/Value>[\s\S]*?<\/Valute>/);
    if (!match) {
      return NextResponse.json({ rate: 90, date: today, source: 'fallback' });
    }

    const rate = parseFloat(match[1].replace(',', '.'));

    // Cache it
    cachedRate = { rate, date: today };

    return NextResponse.json({ rate, date: today, source: 'cbr' });
  } catch {
    const today = new Date().toISOString().slice(0, 10);
    return NextResponse.json({ rate: 90, date: today, source: 'fallback' });
  }
}
