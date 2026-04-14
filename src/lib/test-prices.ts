import { fetchYahooFinanceCandles } from "./yahoo-finance";

async function checkPrices() {
  try {
    const wti = await fetchYahooFinanceCandles("CL=F", "1d", "1m", false);
    const gold = await fetchYahooFinanceCandles("GC=F", "1d", "1m", false);
    const slv = await fetchYahooFinanceCandles("SLV", "1d", "1m", false);
    
    console.log("WTI (CL=F) latest price:", wti[wti.length - 1].close);
    const goldSpot = await fetchYahooFinanceCandles("XAUUSD=X", "1d", "1m", false);
    console.log("Gold Spot (XAUUSD=X) latest price:", goldSpot[goldSpot.length - 1].close);
    console.log("Silver (SLV) latest price:", slv[slv.length - 1].close);
  } catch (e: any) {
    console.error(e.message);
  }
}

checkPrices();
