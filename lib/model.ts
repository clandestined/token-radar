// Token Radar's model (radar-26): one sealed snapshot in, one ranked board out.
//
// The board covers every slug in the snapshot's watchlist (the floor, never a
// ceiling) plus every other rankable pre-token protocol the watchlist leaves
// out, whatever its size: 195 rows on this snapshot (40 watchlist, 155
// early). A protocol is rankable when it records no token at all (no market
// cap, no CoinGecko id, no symbol); live-token protocols are kept apart and
// shown with their market's own values, never mixed into the ranking.
// Wrapped, staked, restaked, bridged and exchange products are left out of
// the early radar for the same reason the watchlist leaves them out: they are a
// token that already trades, in another wrapper. The floor is the watchlist's
// floor, not a rankability ceiling: a $2.8B protocol the list leaves out
// (Sentora Curator) is no worse a subject than a $49M one it names. One
// watchlist slug is ranked although the early radar would leave it out:
// Saturn, a Stablecoin Wrapper at rank 29, because a watchlist slug is
// always ranked; the dashboard states that carve-out where it states the
// rule. The 147 pre-token protocols the board does not rank are counted by
// exclusion in the dashboard's data, so the reader can see what was set
// aside and why, instead of taking the board's completeness on trust.
//
// Implied value follows only from the snapshot's own figures, through one
// function applied to every row. No protocol name is ever special-cased in the scoring.
//
//   comparable  = the size curve: a log-log regression of market cap on
//                 TVL, fitted at run time on the 90 live-token protocols
//                 whose market cap prices the same kind of business
//                 (the comparables), then clamped to [0.01, 1.00]:
//                 multiple(TVL) = exp(a) x TVL^(b - 1), with
//                 log(mcap) = a + b x log(TVL) fitted by ordinary least
//                 squares on log(mcap) against log(TVL). The band is a
//                 guardrail, not a price: on this snapshot it never binds
//                 (the curve runs 0.79x at $5M of TVL to 0.02x at $2.76B),
//                 and the old [0.05, 0.80] band would have priced the
//                 whole top of the board at its floor. A flat median
//                 multiple misprices by size: held out one at a time, it
//                 underpredicts the smallest third of live tokens by a
//                 factor of 3.3 and overpredicts the largest third by a
//                 factor of 2.6, because market cap grows slower than TVL
//                 (the fitted slope is well below 1). The curve removes
//                 that bias: its held-out error is x3.28 against the flat
//                 median's x5.18, and x2.15 against x5.01 on a time split
//                 (fitted on tokens listed before 2024-07-15, tested on
//                 those listed after). Category offsets were tested the
//                 same way and do not help — they make the held-out error
//                 worse at every shrinkage — so the curve carries no
//                 category term: a category's live peers are shown in each
//                 detail view as context, not as the price. The multiple
//                 is rounded to four decimals BEFORE use, so the dashboard
//                 recomputes each row from the multiple board.json carries.
//   base        = tvl_usd x comparable
//   growthMult  = 1 + clamp(change_7d, -40, 80) / 100 x 0.6
//                 (change_7d unreported: treated as flat, see quality below)
//   maturity    = 0.70 + min(age_days, 1095) / 1095 x 0.30
//                 (age_days unknown: 365; age is days since first listing,
//                 the record of how long a protocol has run with no token)
//   breadth     = 1 + 0.02 x min(max(chains - 1, 0), 4)   (at most 1.08)
//   quality     = 0.97 when change_7d is unreported, else 1.00: a protocol
//                 whose growth the snapshot does not carry is valued as flat
//                 but discounted a little for the missing evidence, so an
//                 unknown-growth row never outranks a known-flat one at the
//                 same size and age.
//   implied     = max(1, round(base x growthMult x maturity x breadth x quality))
//
//   Uncertainty: the curve is refitted 200 times on bootstrap resamples
//   of the 90 comparables (seeded, so the refits are deterministic), and
//   each row carries the P10-P90 range of its implied value and of its
//   rank over those refits. A row whose range is wide is a row the curve
//   does not pin down, and the page says so instead of hiding it.
//
//   Family-held-out (radar-27): the curve fitted without a whole protocol
//   family and tested on it, pooled x3.41 against the flat median's
//   x4.78, and leave-one-category-out x3.58 against x4.91 — the curve
//   generalises across families and is not carried by one of them. It is
//   not uniform: Lending & credit held out is x6.16 against the median's
//   x4.96, the one family where the curve loses, and Trading held out is
//   underpredicted by a median log error of -1.16. No fix follows: a
//   category offset cannot be fitted for a family the fit never saw, and
//   offsets, Huber and Theil-Sen fits and a trimmed fit were all
//   re-tested this round and fail the full out-of-sample battery (see
//   evaluateFamilyHeldOut). The family numbers are published instead.
//
//   Farm economics (radar-27): each row carries its farm audited to the
//   dollar — the capital the plan deploys, the gas its own cost lines add
//   up to, the T-bill opportunity cost of locking that capital (3-month
//   bill 4.32% a year, read 2026-11-13), the sunk total, the hands-on
//   time, and a FARM / THIN / SKIP verdict at the row's P10 low end. The
//   verdict is the sunk cost as a share of P10: the share of the token
//   supply a farmer's allocation would have to be for the farm to pay
//   for itself. The snapshot carries no farmer allocation share, so no
//   verdict can promise a profit — the share is shown beside every
//   verdict, and the one row whose costs are in BTC, not dollars
//   (Mezo Earn), carries CHECK instead of a verdict.
//
// Why this shape: a token's launch value is anchored on what the market
// already pays for the same kind of business (the fitted size curve),
// then moved by the protocol's own momentum (7-day TVL growth), its
// seasoning (how long it has survived without a token), its distribution
// (how many chains carry its TVL) and the quality of the evidence behind
// it. A big TVL in a cheap category is worth less than the same TVL in a
// rich one, and a shrinking protocol is worth less than a growing one at
// the same size. The dashboard states the formula and shows every row's
// breakdown, and the page recomputes each row from the same figures so
// the board and the page can never disagree.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them. */
export interface ModelConstants {
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  maturity_floor: number;
  maturity_range: number;
  maturity_days: number;
  unknown_age_days: number;
  multiple_floor: number;
  multiple_cap: number;
  breadth_step: number;
  breadth_max_chains: number;
  unknown_growth_discount: number;
}

export const MODEL: ModelConstants = {
  growth_weight: 0.6,
  growth_floor: -40,
  growth_cap: 80,
  maturity_floor: 0.7,
  maturity_range: 0.3,
  maturity_days: 1095,
  unknown_age_days: 365,
  multiple_floor: 0.01,
  multiple_cap: 1.0,
  breadth_step: 0.02,
  breadth_max_chains: 4,
  unknown_growth_discount: 0.97,
};

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-27';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** The 3-month US Treasury bill rate the farm economics nets against, as an annual fraction, and the day it was read (US Treasury daily par yield curve). */
export const TBILL_RATE = 0.0432;
export const TBILL_AS_OF = '2026-11-13';

/**
 * One row's farm economics, audited to the dollar: the capital the plan
 * deploys, the gas the plan's own cost lines add up to, the T-bill
 * opportunity cost of locking that capital for the hold, the sunk total,
 * the hands-on time, and the verdict. The verdict is judged at the low
 * end of the row's range (its P10 implied value): the break-even share is
 * the sunk cost as a share of that P10 — the share of the token supply a
 * farmer's eventual allocation would have to be for the farm to pay for
 * itself. FARM below 0.0005%, THIN from 0.0005% to 0.001%, SKIP above
 * 0.001%: the board's own rule of thumb, stated here, not a promise —
 * the snapshot carries no farmer allocation share, so no row's verdict
 * can promise a profit, and the break-even share is shown beside every
 * verdict so the reader can see how little of the token each farm needs.
 * On this snapshot the verdicts split 111 FARM, 65 THIN, 18 SKIP, and one
 * CHECK. Gas is the plan's own cost lines summed at their stated upper
 * bounds ($3 to open the wallet, $4 of gas to act, $8 where the capital
 * is $250, $2 a week for each week of the hold, $3 to claim and exit);
 * the opportunity cost is capital x 4.32% x hold / 365. Capital is not a
 * cost — it comes back when the position unwinds — so it is shown apart
 * from the sunk total. Mezo Earn is the CHECK: its capital is 0.01 BTC
 * and its action gas is BTC, and the snapshot carries no BTC price, so
 * no dollar total or verdict is stated for it.
 */
export interface FarmEconomics {
  capital_usd: number | null;
  capital_label: string;
  hold_days: number;
  gas_usd: number | null;
  opportunity_usd: number | null;
  sunk_usd: number | null;
  hands_on_minutes: number;
  breakeven_pct: number | null;
  verdict: 'FARM' | 'THIN' | 'SKIP' | 'CHECK';
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  watchlist: boolean;
  age_days: number | null;
  implied_value_usd: number;
  implied_p10_usd: number;
  implied_p90_usd: number;
  rank_p10: number;
  rank_p90: number;
  model: {
    curve_multiple: number;
    fit_comps: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    breadth_multiplier: number;
    quality_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, farm plan included verbatim. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  listed_at: string | null;
  age_days: number | null;
  watchlist: boolean;
  implied_value_usd: number;
  implied_p10_usd: number;
  implied_p90_usd: number;
  rank_p10: number;
  rank_p90: number;
  curve_multiple: number;
  fit_comps: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  breadth_multiplier: number;
  quality_multiplier: number;
  farm_steps: string[];
  farm_economics: FarmEconomics;
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
  multiple: number | null;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  total_implied_usd: number;
  median_implied_usd: number;
  /** The fitted size curve: log(mcap) = intercept + slope x log(TVL), on the comparables below. */
  curve: { intercept: number; slope: number; comps: number };
  /** The out-of-sample test of the curve against the flat median model it replaces. */
  oos: {
    loocv_curve: number;
    loocv_median: number;
    time_split_curve: number;
    time_split_median: number;
    five_fold_curve: number;
    five_fold_median: number;
    time_split_cut: string;
    folds: number;
    /** Median LOOCV log error by TVL third (small, mid, large), curve then flat median: the size bias each model carries. */
    loocv_bias_curve: number[];
    loocv_bias_median: number[];
    /** Held out by protocol family and by category: the curve fitted without a whole family, tested on it. */
    family_heldout: {
      pooled_curve: number;
      pooled_median: number;
      pooled_bias_curve: number;
      loco_curve: number;
      loco_median: number;
      families: { family: string; peers: number; curve: number; median: number; bias_curve: number }[];
    };
  };
  /** The curve's multiple at a spread of TVLs, so the page can show the size effect as a table. */
  size_bands: { tvl_usd: number; multiple: number }[];
  /** The T-bill baseline the farm economics nets against. */
  tbill: { rate: number; as_of: string };
  /** Each category's median log residual from the curve: tested as offsets, not used. */
  category_residuals: { category: string; peers: number; median_residual: number }[];
  /** The comparables the curve is fitted on, as [tvl_usd, mcap_usd] pairs: the page refits from these. */
  comps: [number, number][];
  rows: RadarRow[];
  live: LiveRow[];
  peer_samples: Record<string, LiveRow[]>;
  /** Pre-token protocols the board does not rank, and why: the exclusion the model applied to each. */
  excluded: { total: number; by_reason: Record<string, number> };
  /** Protocols that record a token at all, and the subset with a market cap that prices the comparables. */
  live_total: number;
  live_priced: number;
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The median of a non-empty list, or null. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Categories that are a bridge, a staking wrapper or an exchange, never a launch of their own. */
const EXCLUDED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'CEX']);

/** Category words that mark a bridge or a wrapper whatever the exact label: a "Cross Chain Bridge" is a bridge and a "Stablecoin Wrapper" is a wrapper. */
const EXCLUDED_CATEGORY_WORDS = ['bridge', 'wrapper'];

/** Whether a live-token protocol's category is one the board never ranks: its token prices a wrapper or an exchange, not a launch. */
function isExcludedCategory(p: SnapshotProtocol): boolean {
  if (p.category === null) return false;
  if (EXCLUDED_CATEGORIES.has(p.category)) return true;
  return EXCLUDED_CATEGORY_WORDS.some((w) => p.category!.toLowerCase().includes(w));
}

/** One live-token protocol the curve is fitted on: a comparable. */
export interface Comp {
  slug: string;
  category: string;
  tvl: number;
  mcap: number;
  change7d: number | null;
  age: number | null;
  chains: number;
  listed: string | null;
}

/**
 * The comparables: the live-token DeFi protocols with a market cap above
 * zero in the categories the board ranks, the same population the
 * dashboard names when it says how many protocols price the curve.
 * Exchange tokens are left out entirely: an exchange token's market cap
 * prices the exchange's business, not the TVL the snapshot records for
 * it (Nexo's ratio is 69x on $10M of TVL, OKX's is 0.07x on $26B).
 * Bridge, liquid staking, liquid restaking and wrapper tokens are left
 * out for the same reason, and it is the same rule the board applies to
 * the ranking itself: a bridge token's market cap prices the bridge's
 * business, not the value locked in it, and a liquid-staking governance
 * token prices governance over the staked asset, not the asset itself,
 * so their ratios measure a different object than a lender's or a DEX's.
 * On this snapshot the 29 such protocols sit at a median ratio of
 * 0.3167x against the market's 0.2460x, nine of them below 0.05x and
 * nine above 1x, so counting them would lift the fit on a population
 * the board itself refuses to rank. A protocol that records a token but
 * no market cap has no market cap to fit on, and a $0 market cap is the
 * same. The set is computed from this snapshot alone, at run time,
 * never hard-coded; on this snapshot it holds 90 protocols. No two of
 * them share a symbol or a CoinGecko id, so there is no duplicate
 * ticker to dedup: the one-per-ticker cleaning the fit would need is
 * already true of the set.
 */
export function compSet(snapshot: Snapshot): Comp[] {
  const out: Comp[] = [];
  for (const p of snapshot.protocols) {
    if (isPreToken(p) || isExcludedCategory(p) || p.mcap_usd === null || p.mcap_usd <= 0 || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    out.push({
      slug: p.slug,
      category: p.category ?? 'Other',
      tvl: p.tvl_usd,
      mcap: p.mcap_usd,
      change7d: p.change_7d,
      age: ageDays(snapshot.as_of, p.listed_at),
      chains: p.chains.length,
      listed: p.listed_at,
    });
  }
  out.sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return out;
}

/** A fitted size curve: log(mcap) = intercept + slope x log(TVL). */
export interface SizeFit {
  intercept: number;
  slope: number;
  n: number;
}

/**
 * The size curve, fitted by ordinary least squares of log(market cap)
 * on log(TVL) over the comparables: closed form, one predictor, so the
 * fit the board uses and the fit the page refits from the same pairs
 * are the same arithmetic. Market cap grows slower than TVL on this
 * snapshot — the fitted slope is well below 1 — so a flat multiple
 * misprices by size, and the curve is the correction. Category offsets
 * were tested the same way and are not fitted: adding a shrunk mean
 * residual per category makes the held-out error worse at every
 * shrinkage weight, so the curve carries no category term.
 */
export function fitSizeCurve(comps: Comp[]): SizeFit {
  const n = comps.length;
  let mx = 0;
  let my = 0;
  for (const c of comps) {
    mx += Math.log(c.tvl);
    my += Math.log(c.mcap);
  }
  mx /= n;
  my /= n;
  let sxy = 0;
  let sxx = 0;
  for (const c of comps) {
    const dx = Math.log(c.tvl) - mx;
    sxy += dx * (Math.log(c.mcap) - my);
    sxx += dx * dx;
  }
  const slope = sxx === 0 ? 1 : sxy / sxx;
  return { intercept: my - slope * mx, slope, n };
}

/** The curve's multiple at a TVL, clamped to the model's band. */
export function curveMultiple(fit: SizeFit, tvl: number, model: ModelConstants): number {
  const raw = Math.exp(fit.intercept) * Math.pow(tvl, fit.slope - 1);
  // Rounded to four decimals BEFORE use: the dashboard recomputes each row
  // from the multiple board.json carries, so the multiple it uses must be
  // the multiple the board states, not a longer decimal behind it. An
  // unrounded multiple would make the page's recompute differ from the
  // board by a few dollars on most rows.
  return round4(Math.min(model.multiple_cap, Math.max(model.multiple_floor, raw)));
}

/** A seeded PRNG (mulberry32): the bootstrap refits and the 5-fold split are deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The growth, maturity, breadth and quality multipliers for one protocol's own figures. */
export function rowFactor(
  change7d: number | null,
  age: number | null,
  chains: number,
  model: ModelConstants,
): { growthPct: number; growthMult: number; maturityMult: number; breadthMult: number; qualityMult: number } {
  const growthKnown = change7d !== null && Number.isFinite(change7d);
  const rawGrowth = finite(change7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const extraChains = Math.min(Math.max(chains - 1, 0), model.breadth_max_chains);
  const breadthMult = 1 + model.breadth_step * extraChains;
  const qualityMult = growthKnown ? 1 : model.unknown_growth_discount;
  return { growthPct, growthMult, maturityMult, breadthMult, qualityMult };
}

/** The flat median model radar-25 used, kept only as the baseline the out-of-sample test beats: category median shrunk toward the market median in log space with a weight of 3 peers, clamped to the old model's [0.05, 0.80] band. */
export function medianMultiple(train: Comp[], category: string, model: ModelConstants): number {
  const band = { floor: 0.05, cap: 0.8 };
  const byCategory = new Map<string, number[]>();
  const all: number[] = [];
  for (const t of train) {
    const ratio = t.mcap / t.tvl;
    all.push(ratio);
    const list = byCategory.get(t.category) ?? [];
    list.push(ratio);
    byCategory.set(t.category, list);
  }
  const marketRaw = median(all) ?? 0.2;
  const market = round4(Math.min(band.cap, Math.max(band.floor, marketRaw)));
  const list = byCategory.get(category) ?? [];
  if (list.length === 0) return market;
  const raw = median(list) ?? marketRaw;
  const shrunk = Math.exp((list.length * Math.log(raw) + 3 * Math.log(market)) / (list.length + 3));
  return round4(Math.min(band.cap, Math.max(band.floor, shrunk)));
}

/** An error factor: exp(median |log(pred / actual)|), the out-of-sample number the board publishes. */
function errorFactor(errors: number[]): number {
  const abs = errors.map((e) => Math.abs(e)).sort((a, b) => a - b);
  const mid = Math.floor(abs.length / 2);
  const m = abs.length % 2 === 1 ? abs[mid]! : (abs[mid - 1]! + abs[mid]!) / 2;
  return Math.round(Math.exp(m) * 100) / 100;
}

/** The out-of-sample test of the size curve against the flat median model, on the comparables alone. */
export function evaluateOos(snapshot: Snapshot, model: ModelConstants): {
  loocv_curve: number;
  loocv_median: number;
  time_split_curve: number;
  time_split_median: number;
  five_fold_curve: number;
  five_fold_median: number;
  time_split_cut: string;
  folds: number;
  loocv_bias_curve: number[];
  loocv_bias_median: number[];
} {
  const comps = compSet(snapshot);
  const predictCurve = (c: Comp, train: Comp[]): number => {
    const fit = fitSizeCurve(train);
    const f = rowFactor(c.change7d, c.age, c.chains, model);
    return Math.max(1, Math.round(c.tvl * curveMultiple(fit, c.tvl, model) * f.growthMult * f.maturityMult * f.breadthMult * f.qualityMult));
  };
  const predictMedian = (c: Comp, train: Comp[]): number => {
    const f = rowFactor(c.change7d, c.age, c.chains, model);
    return Math.max(1, Math.round(c.tvl * medianMultiple(train, c.category, model) * f.growthMult * f.maturityMult * f.breadthMult * f.qualityMult));
  };
  const errors = (test: Comp[], train: Comp[], predict: (c: Comp, train: Comp[]) => number): number[] =>
    test.map((c) => Math.log(predict(c, train) / c.mcap));
  // Leave-one-out: each comparable predicted from the other 89.
  const loocvCurve: number[] = [];
  const loocvMedian: number[] = [];
  for (let i = 0; i < comps.length; i++) {
    const train = comps.filter((_, j) => j !== i);
    loocvCurve.push(Math.log(predictCurve(comps[i]!, train) / comps[i]!.mcap));
    loocvMedian.push(Math.log(predictMedian(comps[i]!, train) / comps[i]!.mcap));
  }
  // Time split: fitted on the older half of the dated comparables, tested on the newer half.
  const dated = comps.filter((c) => c.listed !== null).sort((a, b) => (a.listed! < b.listed! ? -1 : a.listed! > b.listed! ? 1 : a.slug < b.slug ? -1 : 1));
  const cut = dated[Math.floor(dated.length / 2)]!.listed!;
  const trainTime = dated.filter((c) => c.listed! < cut);
  const testTime = dated.filter((c) => c.listed! >= cut);
  // 5-fold: one seeded shuffle, each fold predicted from the other four.
  const order = comps.map((_, i) => i);
  const rng = mulberry32(20261115);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  const foldCurve: number[] = [];
  const foldMedian: number[] = [];
  for (let f = 0; f < 5; f++) {
    const testIdx = new Set(order.filter((_, i) => i % 5 === f));
    const test = comps.filter((_, i) => testIdx.has(i));
    const train = comps.filter((_, i) => !testIdx.has(i));
    foldCurve.push(...errors(test, train, predictCurve));
    foldMedian.push(...errors(test, train, predictMedian));
  }
  // The size bias: the median LOOCV log error in each TVL third, for
  // each model. A flat multiple underpredicts small tokens and
  // overpredicts large ones; the curve does not.
  const byTvl = comps.map((c, i) => ({ tvl: c.tvl, curve: loocvCurve[i]!, median: loocvMedian[i]! })).sort((a, b) => a.tvl - b.tvl);
  const third = Math.floor(byTvl.length / 3);
  const biasOf = (key: 'curve' | 'median'): number[] =>
    [0, 1, 2].map((t) => {
      const slice = byTvl.slice(t * third, t === 2 ? byTvl.length : (t + 1) * third).map((r) => r[key]);
      return Math.round((median(slice) ?? 0) * 100) / 100;
    });
  return {
    loocv_curve: errorFactor(loocvCurve),
    loocv_median: errorFactor(loocvMedian),
    time_split_curve: errorFactor(errors(testTime, trainTime, predictCurve)),
    time_split_median: errorFactor(errors(testTime, trainTime, predictMedian)),
    five_fold_curve: errorFactor(foldCurve),
    five_fold_median: errorFactor(foldMedian),
    time_split_cut: cut,
    folds: 5,
    loocv_bias_curve: biasOf('curve'),
    loocv_bias_median: biasOf('median'),
    family_heldout: evaluateFamilyHeldOut(snapshot, model),
  };
}

/**
 * Protocol families: each comparable category grouped by the broad
 * function its name states, so the curve can be held out by family
 * rather than by one protocol or one date. Lending & credit is Lending,
 * CDP and Collateral Management; Trading is Dexs, Derivatives, Basis
 * Trading, Options and Prediction Market; Yield & vaults is Yield, Yield
 * Aggregator, Onchain Capital Allocator, Leveraged Farming, Risk
 * Curators and Liquidity Manager; RWA & stable is RWA and Dual-Token
 * Stablecoin; Chain & staking is Chain, Staking Pool and Restaking;
 * every other category is Other. The grouping is the test's own
 * definition, stated here and on the page, and the per-family numbers
 * are published beside it.
 */
export const FAMILY_OF_CATEGORY: Record<string, string> = {
  Lending: 'Lending & credit',
  CDP: 'Lending & credit',
  'Collateral Management': 'Lending & credit',
  Dexs: 'Trading',
  Derivatives: 'Trading',
  'Basis Trading': 'Trading',
  Options: 'Trading',
  'Prediction Market': 'Trading',
  Yield: 'Yield & vaults',
  'Yield Aggregator': 'Yield & vaults',
  'Onchain Capital Allocator': 'Yield & vaults',
  'Leveraged Farming': 'Yield & vaults',
  'Risk Curators': 'Yield & vaults',
  'Liquidity Manager': 'Yield & vaults',
  RWA: 'RWA & stable',
  'Dual-Token Stablecoin': 'RWA & stable',
  Chain: 'Chain & staking',
  'Staking Pool': 'Chain & staking',
  Restaking: 'Chain & staking',
};

/** The family a comparable's category puts it in. */
export function familyOf(category: string): string {
  return FAMILY_OF_CATEGORY[category] ?? 'Other';
}

/**
 * The family-held-out test of the size curve: the curve fitted without a
 * whole protocol family, tested on that family, and the same test one
 * category at a time (leave-one-category-out). On this snapshot the
 * pooled family-held-out error is x3.41 for the curve against x4.78 for
 * the flat median, and leave-one-category-out is x3.58 against x4.91:
 * the curve generalises across families, it is not carried by one of
 * them. It is not uniform: Lending & credit held out is x6.16 for the
 * curve against x4.96 for the median — the one family where the curve
 * loses — and Trading is underpredicted when held out (median log error
 * -1.16, about a factor of 3.2), while Yield & vaults is overpredicted
 * (+0.54). No snapshot-justified fix follows from that: a category
 * offset cannot be fitted for a family the fit never saw, and offsets
 * re-tested this round still fail the full battery (a median-residual
 * offset at weight 0.25 improves leave-one-out alone, x3.28 to x3.17,
 * but worsens the time split, x2.15 to x2.38, and 5-fold, x3.31 to
 * x3.49, and its paired bootstrap interval covers zero — the
 * leave-one-out gain is noise). Robust fits fail the same way: Huber
 * x3.29 / x2.22 / x3.45, Theil-Sen x3.53 / x2.22 / x3.49, and a fit
 * trimmed of the twelve |log residual| > 3 comparables x3.41 / x2.50 /
 * x3.68, each worse than the plain curve on at least two of the three
 * splits. So the curve stays as fitted, and the family numbers are
 * published instead of patched over: the weakness is disclosed, with
 * the per-family bias, rather than hidden behind a term the splits do
 * not support. The extremes that drive the family errors are the
 * snapshot's own mismatches of token to TVL — Rain's token prices
 * 400x its $6.6M of TVL, Aave V2's token prices the whole of Aave
 * against a v2 slice — and the snapshot names no scope to correct
 * them by, so no comp is dropped for being extreme.
 */
export function evaluateFamilyHeldOut(
  snapshot: Snapshot,
  model: ModelConstants,
): {
  pooled_curve: number;
  pooled_median: number;
  pooled_bias_curve: number;
  loco_curve: number;
  loco_median: number;
  families: { family: string; peers: number; curve: number; median: number; bias_curve: number }[];
} {
  const comps = compSet(snapshot);
  const predictCurve = (c: Comp, train: Comp[]): number => {
    const fit = fitSizeCurve(train);
    const f = rowFactor(c.change7d, c.age, c.chains, model);
    return Math.max(1, Math.round(c.tvl * curveMultiple(fit, c.tvl, model) * f.growthMult * f.maturityMult * f.breadthMult * f.qualityMult));
  };
  const predictMedian = (c: Comp, train: Comp[]): number => {
    const f = rowFactor(c.change7d, c.age, c.chains, model);
    return Math.max(1, Math.round(c.tvl * medianMultiple(train, c.category, model) * f.growthMult * f.maturityMult * f.breadthMult * f.qualityMult));
  };
  const errFactorOf = (errs: number[]): number => errorFactor(errs);
  // Leave-one-family-out, per family and pooled.
  const byFamily = new Map<string, Comp[]>();
  for (const c of comps) {
    const list = byFamily.get(familyOf(c.category)) ?? [];
    list.push(c);
    byFamily.set(familyOf(c.category), list);
  }
  const pooledCurve: number[] = [];
  const pooledMedian: number[] = [];
  const families: { family: string; peers: number; curve: number; median: number; bias_curve: number }[] = [];
  for (const [family, members] of [...byFamily.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const train = comps.filter((c) => familyOf(c.category) !== family);
    const ec = members.map((c) => Math.log(predictCurve(c, train) / c.mcap));
    const em = members.map((c) => Math.log(predictMedian(c, train) / c.mcap));
    pooledCurve.push(...ec);
    pooledMedian.push(...em);
    families.push({
      family,
      peers: members.length,
      curve: errFactorOf(ec),
      median: errFactorOf(em),
      bias_curve: Math.round((median(ec) ?? 0) * 100) / 100,
    });
  }
  // Leave-one-category-out, pooled.
  const byCategory = new Map<string, Comp[]>();
  for (const c of comps) {
    const list = byCategory.get(c.category) ?? [];
    list.push(c);
    byCategory.set(c.category, list);
  }
  const locoCurve: number[] = [];
  const locoMedian: number[] = [];
  for (const [category, members] of byCategory) {
    const train = comps.filter((c) => c.category !== category);
    locoCurve.push(...members.map((c) => Math.log(predictCurve(c, train) / c.mcap)));
    locoMedian.push(...members.map((c) => Math.log(predictMedian(c, train) / c.mcap)));
  }
  return {
    pooled_curve: errFactorOf(pooledCurve),
    pooled_median: errFactorOf(pooledMedian),
    pooled_bias_curve: Math.round((median(pooledCurve) ?? 0) * 100) / 100,
    loco_curve: errFactorOf(locoCurve),
    loco_median: errFactorOf(locoMedian),
    families,
  };
}

/** The multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
  multiple: number,
): { implied: number; growthPct: number; growthMult: number; maturityMult: number; breadthMult: number; qualityMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const f = rowFactor(protocol.change_7d, age, protocol.chains.length, model);
  const base = protocol.tvl_usd * multiple;
  const implied = Math.max(1, Math.round(base * f.growthMult * f.maturityMult * f.breadthMult * f.qualityMult));
  return { implied, growthPct: f.growthPct, growthMult: f.growthMult, maturityMult: f.maturityMult, breadthMult: f.breadthMult, qualityMult: f.qualityMult, age };
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Whole words that mark a wrapped, staked or restaked product of a token that already trades. */
const WRAPPED_WORD = /\b(wrapped|staked|staking|restaked|restaking)\b/i;

/** Exchange names whose products are the exchange's own, not a pre-token protocol. */
const EXCHANGE_PREFIX = /^(binance|coinbase|bybit|kraken|bitget|okx|bitfinex|gemini)\b/i;

/** Whether a protocol is one the board may rank: pre-token, and not a wrapped, staked, restaked, bridged, versioned or exchange product. */
export function isRankable(p: SnapshotProtocol): boolean {
  if (!isPreToken(p)) return false;
  if (isExcludedCategory(p)) return false;
  if (VERSIONED.test(p.name)) return false;
  if (WRAPPED_WORD.test(p.name)) return false;
  if (EXCHANGE_PREFIX.test(p.name)) return false;
  return true;
}

/**
 * Why a pre-token protocol the board does not rank was left out, in the
 * model's own words: the first exclusion that applies, in the order the
 * watchlist rule itself puts them (an exchange first, then a bridge, then a
 * staking wrapper, then a versioned pool, then a wrapped or staked name).
 * The watchlist is the floor, so this never describes a watchlist protocol:
 * one watchlist slug, Saturn (a Stablecoin Wrapper), is ranked at 28 even
 * though the wrapper rule would leave it out, because a watchlist slug is
 * always ranked. The dashboard states that carve-out where it states the
 * rule, so the board and the rule it claims can never be caught disagreeing.
 */
export function exclusionReason(p: SnapshotProtocol): string {
  if (p.category === 'CEX' || EXCHANGE_PREFIX.test(p.name)) return 'exchange';
  if (p.category === 'Bridge' || p.category === 'Canonical Bridge' || (p.category !== null && p.category.toLowerCase().includes('bridge'))) return 'bridge';
  if (p.category === 'Liquid Staking' || p.category === 'Liquid Restaking' || p.category === 'Restaked BTC') return 'liquid staking / restaking';
  if (p.category !== null && p.category.toLowerCase().includes('wrapper')) return 'stablecoin wrapper';
  if (VERSIONED.test(p.name)) return 'versioned pool';
  if (WRAPPED_WORD.test(p.name)) return 'wrapped / staked name';
  return 'other';
}

/** A number rounded to four decimals, as the board states its multiples. */
const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const comps = compSet(snapshot);
  const fit = fitSizeCurve(comps);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug it names is ranked, whatever its size.
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every rankable pre-token protocol the watchlist leaves
  // out, whatever its size. The floor is the watchlist's floor, never a
  // rankability ceiling: a protocol above it is no worse a subject than one
  // below it. A chosen protocol stays chosen.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const watchlist = new Set(snapshot.watchlist);
  const scored = [...chosen.values()].map((p) => {
    const multiple = curveMultiple(fit, p.tvl_usd, model);
    const v = impliedValue(p, snapshot.as_of, model, multiple);
    // The row's fixed factor, so the bootstrap can reprice it under each refit without redoing the growth and age arithmetic.
    const factor = v.growthMult * v.maturityMult * v.breadthMult * v.qualityMult;
    return { p, multiple, factor, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  const ranges = bootstrapRanges(scored, comps, model);
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    watchlist: watchlist.has(s.p.slug),
    age_days: s.age,
    implied_value_usd: s.implied,
    implied_p10_usd: ranges.get(s.p.slug)!.p10,
    implied_p90_usd: ranges.get(s.p.slug)!.p90,
    rank_p10: ranges.get(s.p.slug)!.rankP10,
    rank_p90: ranges.get(s.p.slug)!.rankP90,
    model: {
      curve_multiple: round4(s.multiple),
      fit_comps: fit.n,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      breadth_multiplier: round4(s.breadthMult),
      quality_multiplier: round4(s.qualityMult),
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

/**
 * The bootstrap ranges: the curve refitted 200 times on resamples of the
 * comparables (seeded, so the refits are deterministic), each board row
 * repriced under every refit. A row's P10-P90 implied range and rank
 * range say how far the curve pins it down; the ranges are wide, because
 * the fit is noisy, and the page shows them instead of hiding them.
 */
export function bootstrapRanges(
  scored: { p: SnapshotProtocol; multiple: number; factor: number; implied: number }[],
  comps: Comp[],
  model: ModelConstants,
): Map<string, { p10: number; p90: number; rankP10: number; rankP90: number }> {
  const REFITS = 200;
  const implieds = new Map<string, number[]>();
  const ranks = new Map<string, number[]>();
  for (const s of scored) {
    implieds.set(s.p.slug, []);
    ranks.set(s.p.slug, []);
  }
  const rng = mulberry32(20261114);
  for (let r = 0; r < REFITS; r++) {
    const sample: Comp[] = [];
    for (let i = 0; i < comps.length; i++) sample.push(comps[Math.floor(rng() * comps.length)]!);
    const fit = fitSizeCurve(sample);
    const priced = scored.map((s) => ({
      slug: s.p.slug,
      implied: Math.max(1, Math.round(s.p.tvl_usd * curveMultiple(fit, s.p.tvl_usd, model) * s.factor)),
    }));
    priced.sort((a, b) => b.implied - a.implied || (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
    priced.forEach((row, i) => {
      implieds.get(row.slug)!.push(row.implied);
      ranks.get(row.slug)!.push(i + 1);
    });
  }
  const out = new Map<string, { p10: number; p90: number; rankP10: number; rankP90: number }>();
  for (const s of scored) {
    const iv = implieds.get(s.p.slug)!.sort((a, b) => a - b);
    const rk = ranks.get(s.p.slug)!.sort((a, b) => a - b);
    const lo = Math.floor(0.1 * (REFITS - 1));
    const hi = Math.floor(0.9 * (REFITS - 1));
    out.set(s.p.slug, { p10: iv[lo]!, p90: iv[hi]!, rankP10: rk[lo]!, rankP90: rk[hi]! });
  }
  return out;
}

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 1_000_000_000) return 250;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** "a" or "an" before a protocol name: the shapes wrote "a" before every name, so thirteen rows read "into a Upshift vault", "a Armitage", "a Arrakis" and the like. */
function articleFor(name: string): string {
  return /^[AEIOU]/i.test(name) ? 'an' : 'a';
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('collateral market')) return `Deposit $${capital} of wstETH into ${articleFor(name)} ${name} vault on ${chain}, delegate the collateral to an operator securing a network, and keep the vault shares in your wallet.`;
  if (c.includes('interest rate')) return `Deposit $${capital} of USDC as margin on ${name} on ${chain} and open one small long or short position on a funding-rate market, then hold it to maturity.`;
  if (c.includes('uncollateralized')) return `Deposit $${capital} of USDC into the ${name} credit market on ${chain} to fund uncollateralized loans and keep the yield-bearing receipt token in your wallet.`;
  // A CDP takes the collateral its own vaults accept, never a stablecoin
  // by default: seven of the board's CDP rows are corrected in
  // PLAN_CORRECTIONS below (Felix takes HYPE, Bucket SUI, BIMA and BTCFi
  // BTC, Kava Mint BTC, Monolith ETH, Swan DAO wstETH), and the eighth,
  // STRATO, stays on this wording because its own litepaper lists USDC as
  // an accepted CDP collateral at 90% LTV — the one CDP row where the
  // generic asset is genuinely accepted. A lender takes USDC the same way:
  // supplying a stablecoin to a lending market is the standard action.
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} as collateral and borrow a small amount against it, then repay the borrow.`;
  if (c === 'dexs') return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} in a balanced pair and keep the position open.`;
  // A leveraged vault is not a pool: 3F loops tokenized RWAs through
  // Morpho and Origami loops yield-bearing assets through lending
  // markets, and neither has a main pool to provide liquidity to. The
  // old shape lumped them with the DEXs, so both plans told their farmer
  // to LP into a pool that does not exist. And the DEX test used to be
  // includes('dex'), which also caught Indexes — "indexes" contains
  // "dex" — so Set Protocol's plan told its farmer to LP into a pool
  // instead of buying its index token; the index shape below it was
  // unreachable. The test is now the category itself.
  if (c.includes('leveraged farm')) return `Deposit $${capital} of USDC into ${articleFor(name)} ${name} leveraged vault on ${chain} and keep the vault receipt token in your wallet.`;
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) return `Deposit $${capital} of USDC into ${articleFor(name)} ${name} vault on ${chain} and keep the vault shares in your wallet.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} on ${chain}, open one small hedged trade, then close it.`;
  if (c.includes('prediction')) return `Fund your ${name} account with $${capital} on ${chain} and place one small market position.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it in your wallet.`;
  // "Buy or mint": some RWA assets are minted (OpenTrade, Plume Vaults)
  // and some are bought on a marketplace (Lofty sells tokenized property
  // shares, it mints nothing for the buyer), so one verb was wrong for
  // half the category.
  if (c.includes('rwa')) return `Buy or mint $${capital} of ${name}'s yield-bearing asset on ${chain} and hold it for the full period.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('basis') || c.includes('options')) return `Deposit $${capital} of USDC into ${name}'s strategy on ${chain} and keep the position open.`;
  if (c.includes('liquidity manager')) return `Deposit $${capital} of USDC into ${articleFor(name)} ${name} managed pool on ${chain} and keep the managed position open.`;
  if (c.includes('liquid')) return `Deposit $${capital} into ${name} on ${chain} and keep the receipt token in your wallet.`;
  if (c === 'chain') return `Move $${capital} of USDC onto ${name} through its official bridge and hold the balance in your wallet on the network.`;
  if (c.includes('staking pool')) {
    // A staking pool stakes its chain's own asset, never a stablecoin: Reti
    // pools ALGO, Adrastea stakes SOL, Qearn locks QUBIC, and the gas token
    // of the first chain is that asset on every chain the board stakes on.
    const asset = gasTokenFor(chain) ?? 'USDC';
    return `Deposit $${capital} of ${asset} into the ${name} staking pool on ${chain} and keep the staking receipt in your wallet.`;
  }
  if (c.includes('cedefi')) return `Deposit $${capital} of USDC into ${name}'s managed yield account on ${chain} and keep the account open.`;
  if (c === 'farm') return `Deposit $${capital} of USDC into the ${name} farm on ${chain} and keep the farm position open.`;
  if (c.includes('anchor btc') || c.includes('decentralized btc')) return `Deposit $${capital} of BTC-backed assets through ${name} on ${chain} and hold the receipt token in your wallet.`;
  if (c.includes('payments')) {
    // A payment channel is funded in the chain's own asset: a Lightning
    // channel is funded in BTC (satoshis), not in a stablecoin.
    const asset = chain === 'Bitcoin' ? 'BTC' : 'USDC';
    return `Fund a ${name} payment channel with $${capital} of ${asset} on ${chain} and make one small payment through it.`;
  }
  if (c.includes('otc')) return `Place a $${capital} buy order for an OTC asset on ${name} on ${chain} and hold the asset in your wallet.`;
  if (c === 'restaking') {
    // Restaking restakes what is already staked: BTC on Bitcoin (b14g pairs
    // locked BTC with CORE to secure networks), a stablecoin elsewhere.
    const asset = chain === 'Bitcoin' ? 'BTC' : 'USDC';
    return `Restake $${capital} of ${asset} through ${name} on ${chain} and keep the restaking receipt in your wallet.`;
  }
  if (c.includes('governance')) return `Lock $${capital} of USDC in ${name}'s governance vault on ${chain} and vote once with the position.`;
  if (c.includes('crypto card')) return `Load $${capital} of USDC onto the ${name} card on ${chain} and spend a small amount with it.`;
  if (c.includes('index')) return `Buy $${capital} of the ${name} index token on ${chain} and hold it in your wallet.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and use its main feature once.`;
}

/** The weekly action that keeps a farm alive, by category: the same deposit every week looks like one burst, a category-shaped action every week looks like use. */
function weeklyActionFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('collateral market')) return `Check the rewards the ${name} vault paid that week and leave them compounding instead of withdrawing them.`;
  if (c.includes('interest rate')) return `Check the funding-rate position on ${name} each week and adjust it when the underlying rate moves.`;
  if (c.includes('uncollateralized')) return `Check the yield the ${name} credit market paid that week and leave it compounding instead of withdrawing it.`;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Repay a small part of the borrow on ${name} and borrow it back, so the position moves every week instead of sitting still.`;
  if (c === 'dexs') return `Swap a small amount through ${name}'s main pool each week, alternating the direction, so the wallet trades as well as holds.`;
  if (c.includes('leveraged farm')) return `Check the vault's leverage ratio on ${name} each week and add a small top-up when it drifts from its target, so the position does not sit untouched.`;
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) return `Claim any rewards the ${name} vault shows each week and restake them, or add a small top-up to the vault.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Open and close one small hedged trade on ${name} each week, keeping the size tiny and the margin untouched.`;
  if (c.includes('prediction')) return `Settle one small market position on ${name} each week and open the next one only after the first closes.`;
  if (c.includes('stable')) return `Move a small amount in and out of the stable asset through ${name} each week, never the whole balance at once.`;
  if (c.includes('rwa')) return `Check the yield ${name}'s asset accrued that week and top the position up by a small amount when it pays out.`;
  if (c.includes('insurance')) return `Check the cover from ${name} is still active each week and renew it before it lapses rather than after.`;
  if (c.includes('basis') || c.includes('options')) return `Rebalance the ${name} strategy position by a small amount each week instead of letting it drift untouched.`;
  if (c.includes('liquidity manager')) return `Check the managed pool's rebalance on ${name} each week and add a small top-up when it rebalances.`;
  if (c.includes('liquid')) return `Check the receipt token balance for ${name} each week and add a small deposit when the balance is flat.`;
  if (c === 'chain') return `Make one small transaction on ${name} each week, such as a transfer or a swap on its native venue, so the wallet stays active on the network.`;
  if (c.includes('staking pool')) return `Check the staking rewards ${name} shows each week and restake them, or add a small top-up to the pool.`;
  if (c.includes('cedefi')) return `Check the yield ${name}'s account paid that week and leave it compounding instead of withdrawing it.`;
  if (c === 'farm') return `Harvest any farm rewards ${name} shows each week and restake them into the farm.`;
  if (c.includes('anchor btc') || c.includes('decentralized btc')) return `Check the BTC yield ${name} paid that week and top the position up by a small amount when it pays out.`;
  if (c.includes('payments')) return `Route one small payment through ${name} each week so the channel stays active.`;
  if (c.includes('otc')) return `Check your open orders on ${name} each week and settle any filled order promptly.`;
  if (c === 'restaking') return `Check the restaking rewards ${name} shows each week and restake them, or add a small top-up.`;
  if (c.includes('governance')) return `Vote on one live proposal through ${name} each week and keep the locked position untouched.`;
  if (c.includes('crypto card')) return `Spend a small amount with the ${name} card each week, never the whole balance at once.`;
  if (c.includes('index')) return `Check the ${name} index token balance each week and add a small top-up when the balance is flat.`;
  return `Use ${name}'s main feature once each week, such as a deposit, a borrow, a swap or a vote, and never leave the wallet untouched for a whole month.`;
}

/** What to write in the farm log each week, by category: the number that proves the position is real. */
function trackFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  let note: string;
  if (c.includes('collateral market')) note = `the vault share balance, the operator it is delegated to and any points balance the protocol shows.`;
  else if (c.includes('interest rate')) note = `the margin balance and the fixed rate the position locked in.`;
  else if (c.includes('uncollateralized')) note = `the receipt token balance and the yield it paid that week.`;
  else if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) note = `the borrow amount, the collateral ratio and the health factor.`;
  else if (c === 'dexs') note = `the pool share and the fees the position earned.`;
  else if (c.includes('leveraged farm')) note = `the vault receipt token balance, the leverage ratio and the yield it earned that week.`;
  else if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) note = `the vault share balance and any points balance the protocol shows.`;
  else if (c.includes('perpetual') || c.includes('derivative')) note = `the margin balance and the outcome of each trade.`;
  else if (c.includes('prediction')) note = `each settled position and its outcome.`;
  else if (c.includes('stable')) note = `the stable balance and the peg or yield it shows.`;
  else if (c.includes('rwa')) note = `the asset balance and the yield it accrued that week.`;
  else if (c.includes('insurance')) note = `the cover amount and the date it lapses.`;
  else if (c.includes('basis') || c.includes('options')) note = `the strategy balance and the funding or premium it earned.`;
  else if (c.includes('liquidity manager')) note = `the managed pool share and the fees the position earned.`;
  else if (c.includes('liquid')) note = `the receipt token balance and the staking yield it shows.`;
  else if (c === 'chain') note = `the wallet balance on the network and the number of transactions that week.`;
  else if (c.includes('staking pool')) note = `the staked balance and the staking rewards it earned.`;
  else if (c.includes('cedefi')) note = `the account balance and the yield it paid that week.`;
  else if (c === 'farm') note = `the farm balance and the rewards harvested that week.`;
  else if (c.includes('anchor btc') || c.includes('decentralized btc')) note = `the BTC-backed balance and the yield it earned that week.`;
  else if (c.includes('payments')) note = `the channel balance and each payment routed that week.`;
  else if (c.includes('otc')) note = `each filled order and the asset balance.`;
  else if (c === 'restaking') note = `the restaked balance and the rewards it earned that week.`;
  else if (c.includes('governance')) note = `the locked balance and each vote cast that week.`;
  else if (c.includes('crypto card')) note = `the card balance and each spend that week.`;
  else if (c.includes('index')) note = `the index token balance and its net asset value.`;
  else note = `the position size and any points balance the protocol shows.`;
  return `Track the position weekly in a farm log for ${name} with the wallet address, the dates and every transaction hash, and note ${note}`;
}

/** The gas token of a chain, where the chain's own record names it, or null where the chain charges no gas at all.
 * The household names were in the map from the start (ETH on the EVM rollups, SOL, BTC, AVAX and the rest); the
 * rest were checked against the chain's own documentation or its gas-token record before they were added here,
 * never guessed from the chain's name. Arc pays gas in USDC (Circle's gas reference), Plasma's is XPL (its
 * paymaster subsidises USDT transfers only, every other transaction pays XPL), Stable's is USDT0, Provenance's is
 * HASH (its gas-and-fees docs), Noble's is USDC (its USDC fee model), Manta Pacific's, Reya's, Morph's, RISE's
 * and Robinhood Chain's is ETH (each an Ethereum L2 with ETH gas), Mezo's is BTC, XION's is XION, RSK's is RBTC
 * (Rootstock's gas docs), Kava's is KAVA, Canton's is CC (its tokenomics docs: traffic fees are paid in CC),
 * Bifrost Network's is BFC, Fluent's is ETH (an Ethereum zk-rollup: BLEND
 * is for staking, governance and incentives, never for gas, which radar-13
 * had wrong), Stacks' is STX (its fees docs: microSTX), Plume's is PLUME, and
 * Klaytn's is KAIA (KLAY migrated to KAIA at the Kaia merger). Pharos's is
 * PROS (its Pacific Mainnet went live on 28 April 2026, chain ID 1672, with
 * gas paid in PROS; PHRS is the testnet token only), Strato's is USDST today
 * (its tokenomics docs: every transaction pays 0.01 USDST, and paying gas in
 * STRATO is the planned design, not the live one), and Qubic's is QUBIC as
 * energy (plain transfers are feeless, but smart-contract execution burns
 * QUBIC, so a farm's contract calls still need it). BSquared's is BTC: the
 * farm runs on the B² rollup (B² Mainnet, chain 223), whose native token is
 * BTC, while B2 is gas only on the B² Hub (chain 213), the data-availability
 * layer a farmer never transacts on. Tempo has no native gas
 * token: fees are paid in any supported USD stablecoin, so the step names
 * that instead of a ticker.
 * Proton returns null: XPR Network charges no gas fee, so the wallet step
 * says so instead of naming a token that does not exist. */
function gasTokenFor(chain: string): string | null {
  if (chain === 'Proton') return null;
  const known: Record<string, string> = {
    Ethereum: 'ETH', Base: 'ETH', Arbitrum: 'ETH', Optimism: 'ETH', Ink: 'ETH', Unichain: 'ETH', Linea: 'ETH', Scroll: 'ETH', 'zkSync Era': 'ETH', 'World Chain': 'ETH',
    Solana: 'SOL', Binance: 'BNB', Bitcoin: 'BTC', Avalanche: 'AVAX', Polygon: 'POL', Sui: 'SUI', Aptos: 'APT', Tron: 'TRX', 'Hyperliquid L1': 'HYPE',
    Stellar: 'XLM', Flare: 'FLR', Berachain: 'BERA', Mantle: 'MNT', Sonic: 'S', Sei: 'SEI', Celo: 'CELO', Ronin: 'RON', Bittensor: 'TAO', Algorand: 'ALGO', Ripple: 'XRP', Starknet: 'STRK', Monad: 'MON',
    Arc: 'USDC', Provenance: 'HASH', Plasma: 'XPL', 'Robinhood Chain': 'ETH', RISE: 'ETH', Noble: 'USDC', Manta: 'ETH', Mezo: 'BTC', XION: 'XION',
    'Reya Network': 'ETH', Tempo: 'a USD stablecoin', Stable: 'USDT0', Morph: 'ETH', RSK: 'RBTC', Klaytn: 'KAIA', Kava: 'KAVA', Canton: 'CC',
    'Bifrost Network': 'BFC', Fluent: 'ETH', Stacks: 'STX', 'Plume Mainnet': 'PLUME', Pharos: 'PROS', Strato: 'USDST', Qubic: 'QUBIC', BSquared: 'BTC',
  };
  return known[chain] ?? `${chain}'s native gas token`;
}

/** Where to look for the claim, by category: the page that would actually carry it for this kind of protocol. */
function claimFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  // Two claim steps the generic page cannot carry. A Lightning channel
  // pays routing fees straight into the channel balance: there is no
  // rewards page, and nothing to claim. And an uncollateralized credit
  // market pays its yield through the receipt token, with no rewards
  // page announced either, so the step says to check for an
  // announcement instead of naming a page that does not exist.
  if (c.includes('payments')) return `Check the channel balance in your own node software for the routing fees the channel earned — they land in the balance automatically, there is no rewards page to claim from, and never pay to claim or follow a claim link in a message.`;
  if (c.includes('uncollateralized')) return `Before you withdraw, check ${name}'s own site for any rewards announcement and claim only from the link it publishes, never from a link in a message; if it announces no rewards, there is nothing to claim.`;
  let page: string;
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) page = `the ${name} vault's own points or rewards page`;
  else if (c === 'dexs') page = `${name}'s own pool incentives or points page`;
  else if (c.includes('leveraged farm')) page = `${name}'s own leveraged vault rewards page`;
  else if (c.includes('collateral market')) page = `${name}'s own vault rewards page`;
  else if (c.includes('interest rate')) page = `${name}'s own funding-rate rewards page`;
  else if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) page = `${name}'s own lending rewards or points page`;
  else if (c.includes('perpetual') || c.includes('derivative')) page = `${name}'s own trading rewards page`;
  else if (c.includes('prediction')) page = `${name}'s own market rewards page`;
  else if (c.includes('rwa')) page = `${name}'s own asset redemptions or rewards page`;
  else if (c.includes('insurance')) page = `${name}'s own cover rewards page`;
  else if (c.includes('stable')) page = `${name}'s own stability rewards page`;
  else if (c.includes('basis') || c.includes('options')) page = `${name}'s own strategy rewards page`;
  else if (c.includes('liquidity manager')) page = `${name}'s own liquidity incentives page`;
  else if (c.includes('liquid')) page = `${name}'s own staking rewards page`;
  else if (c === 'chain') page = `${name}'s own ecosystem rewards or airdrop page`;
  else if (c.includes('staking pool')) page = `${name}'s own staking rewards page`;
  else if (c.includes('cedefi')) page = `${name}'s own yield rewards page`;
  else if (c === 'farm') page = `${name}'s own farm rewards page`;
  else if (c.includes('anchor btc') || c.includes('decentralized btc')) page = `${name}'s own BTC rewards page`;
  else if (c.includes('otc')) page = `${name}'s own trading rewards page`;
  else if (c === 'restaking') page = `${name}'s own restaking rewards page`;
  else if (c.includes('governance')) page = `${name}'s own governance rewards page`;
  else if (c.includes('crypto card')) page = `${name}'s own card rewards page`;
  else if (c.includes('index')) page = `${name}'s own index rewards page`;
  else page = `the protocol's own points or rewards page`;
  return `Before you withdraw, open ${page} from its official site and claim only from the link it publishes, never from a link in a message, and do it inside the claim window the protocol announces.`;
}

/** How to unwind the farm, by category: the position that actually has to come out. */
function exitFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  const head = `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then `;
  const tail = `, close the log and retire the wallet.`;
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) return `${head}withdraw the vault shares from ${name}${tail}`;
  if (c === 'dexs') return `${head}remove the liquidity from ${name}${tail}`;
  if (c.includes('leveraged farm')) return `${head}redeem the vault receipt token from ${name} and withdraw the underlying asset${tail}`;
  if (c.includes('collateral market')) return `${head}withdraw the collateral from the ${name} vault${tail}`;
  if (c.includes('interest rate')) return `${head}close the funding-rate position on ${name}${tail}`;
  if (c.includes('uncollateralized')) return `${head}withdraw the deposit from the ${name} credit market${tail}`;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `${head}repay the borrow, withdraw the collateral from ${name}${tail}`;
  if (c.includes('perpetual') || c.includes('derivative')) return `${head}close any open trade, withdraw the margin from ${name}${tail}`;
  if (c.includes('prediction')) return `${head}close any open position on ${name}${tail}`;
  if (c.includes('stable')) return `${head}redeem the stable asset from ${name}${tail}`;
  if (c.includes('rwa')) return `${head}sell or redeem the yield-bearing asset from ${name}${tail}`;
  if (c.includes('insurance')) return `${head}cancel the cover from ${name}${tail}`;
  if (c.includes('basis') || c.includes('options')) return `${head}close the strategy position on ${name}${tail}`;
  if (c.includes('liquidity manager')) return `${head}remove the managed liquidity from ${name}${tail}`;
  if (c.includes('liquid')) return `${head}unstake the position from ${name} and withdraw the receipt token${tail}`;
  if (c === 'chain') return `${head}bridge the balance back off ${name}${tail}`;
  if (c.includes('staking pool')) return `${head}unstake the deposit from ${name}${tail}`;
  if (c.includes('cedefi')) return `${head}withdraw the deposit from ${name}${tail}`;
  if (c === 'farm') return `${head}withdraw the farm position from ${name}${tail}`;
  if (c.includes('anchor btc') || c.includes('decentralized btc')) return `${head}redeem the BTC-backed position from ${name}${tail}`;
  if (c.includes('payments')) return `${head}close the payment channel on ${name} and withdraw the balance${tail}`;
  if (c.includes('otc')) return `${head}close any open order on ${name} and withdraw the balance${tail}`;
  if (c === 'restaking') return `${head}unstake the restaked position from ${name}${tail}`;
  if (c.includes('governance')) return `${head}unlock the governance position from ${name}${tail}`;
  if (c.includes('crypto card')) return `${head}withdraw the remaining card balance from ${name}${tail}`;
  if (c.includes('index')) return `${head}sell the index tokens on ${name}${tail}`;
  return `${head}unwind the farm position on ${name} and close the log.`;
}

/**
 * A protocol's farm plan: seven steps, each an action with a cost and a time.
 * The plan is derived from the protocol's own record (category, chains, TVL
 * and age), except where the snapshot's own record mislabels the protocol:
 * those plans are corrected in one table, PLAN_CORRECTIONS below, keyed by
 * slug, each entry naming why the record is wrong and giving only the steps
 * the record gets wrong; every other step still comes from the category
 * shape, and the scoring never names a protocol at all. Step 1 names the gas
 * token of the protocol's own first chain and the protocol itself, and step
 * 4 names the protocol too, so no step is the same string on two rows: steps
 * 1 and 4 used to read identically for every protocol on the same chain
 * (one step-1 string covered 55 rows), which made the plan look templated
 * even where the action differed. The gas token is the chain's own, checked
 * against its documentation, never guessed: 32 of the 34 rows whose first
 * chain was not a household name name a verified token, Tempo names a USD
 * stablecoin, and the one chain
 * that charges no gas at all (Proton) says so instead of naming a token
 * that does not exist, and its cost lines say the same, so no step prices
 * gas that does not exist. No row is left on the generic wording: BSquared
 * is settled in radar-15 (BTC on the rollup, where the farm runs; B2 is gas
 * only on the Hub). Radar-14 said 33 of the 34 named a token; recounting
 * its board, it was 31, because Tempo's stablecoin and Proton's no-gas line
 * were counted as tokens. Step 3 keeps one wallet per
 * protocol: airdrop filters punish wallets that farm dozens of protocols
 * from one address, so the farm wallet for this protocol is used for this
 * protocol alone. Steps 2, 3, 5, 6 and 7 are shaped by the category: the
 * action itself, the weekly action, the number worth logging, the page that
 * would carry a claim and the way the position unwinds all differ between a
 * lender, a pool and a vault, so no two categories farm the same way. Every
 * category on the board has its own shape for each of those steps.
 */

/** One step of a corrected plan: the step's text, given the protocol, its capital and its network. */
type CorrectionStep = (p: SnapshotProtocol, capital: number, chain: string) => string;

/**
 * Snapshot corrections: the farm plans the snapshot's own record cannot
 * shape, in one table keyed by slug, so they read as one disclosed list
 * rather than one-off special cases scattered through the code. Each entry
 * states why the record is wrong, against the protocol's own documentation,
 * and gives only the steps the record gets wrong: the action, the weekly
 * action, the number worth logging, the claim page, the exit, the hold, the
 * capital or the network, whichever the record misstates. Every step an
 * entry does not give still comes from the category shape, and the scoring
 * never names a protocol: these are plan corrections of the snapshot's own
 * record, stated here, in the README and on the dashboard's model panel.
 */
interface PlanCorrection {
  /** Why the snapshot's record cannot shape this plan, and the source that settles it. */
  why: string;
  action?: CorrectionStep;
  weekly?: CorrectionStep;
  track?: CorrectionStep;
  claim?: CorrectionStep;
  exit?: CorrectionStep;
  /** What step 2 costs and how long it takes, when the generic capital does not apply. */
  actionCost?: string;
  actionTime?: string;
  /** How the capital is named in the cost lines, when it is not a dollar amount. */
  capitalLabel?: string;
  /** Days the position must be held, when the protocol's own lock caps it below the generic hold. */
  holdDays?: number;
  /** The network the farm runs on, when the snapshot's first chain names somewhere else. */
  chainLabel?: string;
  /** The gas token on that network, when the snapshot's first chain would name another. */
  gasToken?: string;
}

const PLAN_CORRECTIONS: Record<string, PlanCorrection> = {
  // Hive Protocol is B² Hive, the network's own BTC staking pool, listed
  // under category Chain, so the chain shape would tell its farmer to
  // bridge USDC onto a network the protocol is not. Its plan stakes BTC
  // for B2 rewards instead, as DefiLlama's own page for it says: "Stake
  // BTC, safeguard B², and receive $B2 Tokens" (hive.bsquared.network).
  'hive-protocol': {
    why: 'DefiLlama lists B² Hive, the network\u2019s own BTC staking pool, under category Chain, so the chain shape would tell its farmer to bridge USDC onto a network the protocol is not.',
    action: (p, capital, chain) => `Stake $${capital} of BTC in ${p.name} on ${chain} to safeguard the network and earn B2 rewards, and keep the staked position in your wallet.`,
    weekly: (p) => `Check the B2 rewards ${p.name} shows each week and restake them, or add a small top-up to the stake.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the staked BTC balance and the B2 rewards earned that week.`,
    claim: (p) => `Before you withdraw, open ${p.name}'s own staking rewards page from its official site and claim only from the link it publishes, never from a link in a message, and do it inside the claim window the protocol announces.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then unstake the staked BTC from ${p.name}, close the log and retire the wallet.`,
  },
  // Firelight is the underwriting side of an insurance design, not a buyer
  // of cover: a farmer bridges XRP to Flare through the FAssets system to
  // mint FXRP, deposits the FXRP into Firelight's Launch Vault, and
  // receives stXRP, a liquid receipt token, while the staked FXRP
  // underwrites the DeFi cover protocols buy; the farmer earns Firelight
  // Points, and since the cover phase went live on 6 October 2026 the
  // staked FXRP can pay validated claims, and exits run on 30-day coverage
  // periods, so the FXRP becomes withdrawable at the end of the following
  // full period, up to 60 days. (flare.network; Chainwire, 6 Oct 2026.)
  firelight: {
    why: 'DefiLlama lists Firelight under category Insurance, so the insurance shape would tell its farmer to buy cover Firelight does not sell to users.',
    action: (p, capital, chain) => `Bridge $${capital} of XRP to ${chain} through the FAssets system to mint FXRP, deposit the FXRP into ${p.name}'s Launch Vault, where the staked FXRP backs the cover Firelight sells and can pay validated claims, and keep the stXRP receipt token in your wallet.`,
    weekly: (p) => `Check the Firelight Points and the stXRP balance ${p.name} shows each week, and add a small FXRP top-up to the vault when the balance is flat.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the stXRP balance and the Firelight Points it earned that week.`,
    claim: (p) => `Before you withdraw, open ${p.name}'s own staking rewards page from its official site and claim only from the link it publishes, never from a link in a message, and do it inside the claim window the protocol announces.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then redeem the stXRP from ${p.name} for FXRP (exits run on 30-day coverage periods, so allow up to 60 days for the FXRP to become withdrawable), close the log and retire the wallet.`,
  },
  // Mezo Earn locks BTC, not USDC: locking BTC for 1–28 days gives a
  // veBTC NFT that votes on the weekly gauges, locking MEZO gives veMEZO
  // that boosts the vote up to 5x, and native BTC needs at least 0.01 BTC
  // to bridge (wrapped BTC less), while BTC is the gas on Mezo. The
  // governance shape would tell its farmer to lock USDC in a governance
  // vault, an asset Mezo Earn never takes. (mezo.org: Getting Started
  // with Mezo; Voting Overview.)
  'mezo-earn': {
    why: 'DefiLlama lists Mezo Earn under Governance Incentives, so the governance shape would tell its farmer to lock USDC in a governance vault — but Mezo Earn locks BTC, not USDC.',
    action: (p, capital, chain) => `Lock 0.01 BTC of native BTC (or a smaller amount of wrapped tBTC) in ${p.name} on ${chain} for 1–28 days to receive a veBTC NFT and vote on the weekly gauges, and lock MEZO for veMEZO as well if you hold it, for up to 5x boosted voting weight.`,
    actionCost: '0.01 BTC of capital, the native minimum, plus a small amount of BTC for gas',
    actionTime: '3–4 hours for the BTC deposit to arrive, then 15 minutes to lock',
    capitalLabel: '0.01 BTC',
    holdDays: 28,
    weekly: (p) => `Vote with the veBTC position on the new gauges each Thursday, when the weekly epoch starts, and extend the lock before it expires so the voting power does not decay to zero.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the veBTC NFT, the lock expiry and each gauge vote that week.`,
    claim: (p) => `Before you withdraw, open ${p.name}'s own rewards page from its official site and claim the gauge fees and incentives only from the link it publishes, never from a link in a message, and do it inside the claim window the protocol announces.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then wait for the veBTC lock to expire at the next Thursday epoch boundary, withdraw the BTC from ${p.name}, close the log and retire the wallet.`,
  },
  // Abstract is its own Ethereum L2 network (ZK Stack), and its gas is ETH
  // paid on Abstract, not on Ethereum mainnet — but the snapshot lists its
  // chains as ["Ethereum"], because it settles on Ethereum, so the plan
  // would fund a wallet for gas "on Ethereum" and run the farm there. The
  // chain shape's bridge-onto-the-network action is right; only the network
  // it names is wrong.
  abstract: {
    why: 'The snapshot lists Abstract\u2019s chains as ["Ethereum"] — it settles on Ethereum — but Abstract is its own Ethereum L2 network, and its gas is ETH paid on Abstract, not on Ethereum mainnet.',
    chainLabel: 'Abstract',
    gasToken: 'ETH',
  },
  // USDD 2.0 is a vault stablecoin, so the CDP shape is half right: a
  // farmer does deposit collateral and mint USDD. But the shape names
  // USDC as the collateral, and USDD vaults take TRX, sTRX, USDT or
  // WBTC (ETH and WBTC on Ethereum), never USDC — USDC only swaps 1:1
  // for USDD through the Peg Stability Module. And the yield does not
  // come from a rewards page: the minted USDD is staked as sUSDD, and
  // the staking rate accrues automatically in the sUSDD exchange rate.
  // (DefiLlama stablecoin page; BingX USDD 2.0 guide.)
  usdd: {
    why: 'DefiLlama lists USDD under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but USDD 2.0 vaults take TRX, sTRX, USDT or WBTC, never USDC, and the yield comes from staking the minted USDD as sUSDD.',
    action: (p, capital, chain) => `Stake $${capital} of TRX in a USDD vault on ${chain} to mint USDD, then stake the USDD as sUSDD to earn the staking rate, and keep the sUSDD in your wallet.`,
    weekly: (p) => `Check the sUSDD balance and the staking rate ${p.name} shows each week, and add a small TRX top-up to the vault when the balance is flat.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the vault collateral ratio, the sUSDD balance and the staking rate it shows.`,
    claim: (p) => `sUSDD yield accrues automatically in its exchange rate, so there is no rewards page to claim from — check the rate on the official ${p.name} page, and never pay to claim or follow a claim link in a message.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then redeem the sUSDD from ${p.name} for USDD, repay the vault mint and withdraw the TRX collateral, close the log and retire the wallet.`,
  },
  // DeFi Saver is a non-custodial management layer, not a protocol that
  // takes deposits: "Your assets are never deposited on DeFi Saver —
  // we're just an additional layer between you and the protocols." The
  // CDP shape would tell its farmer to supply USDC to DeFi Saver itself
  // as collateral and borrow against it, which no screen on the site
  // lets them do. Its plan opens a position through DeFi Saver on a
  // protocol it manages, and turns on the automation that is the reason
  // to use it. (defisaver.com)
  'defi-saver-asset-management': {
    why: 'DefiLlama lists Defi Saver Asset Management under CDP Manager, so the CDP shape would tell its farmer to supply USDC to it as collateral — but DeFi Saver is a non-custodial management layer that takes no deposits at all.',
    action: (p, capital, chain) => `Open a collateralized position through ${p.name} on ${chain} — deposit ETH as collateral into a vault it manages, borrow a small amount of stablecoin, and turn on its automation to keep the ratio safe.`,
    weekly: (p) => `Check the automation ${p.name} runs on the position each week and adjust the stop-loss or leverage rules when the collateral ratio moves.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the collateral ratio, the health factor and each automation action it took that week.`,
    claim: (p) => `${p.name} runs no points program — check its official site for any rewards announcement; if it announces none, there is nothing to claim, and never pay to claim or follow a claim link in a message.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then turn off the automation, repay the borrow and withdraw the collateral through ${p.name}, close the log and retire the wallet.`,
  },
  // dTAO is Bittensor's staking system, not an AMM pool: staking TAO
  // into a subnet swaps it into that subnet's alpha token through the
  // subnet pool, and rewards are paid in alpha. The DEX shape would
  // tell its farmer to provide liquidity to a "main pool" in a balanced
  // pair, swap through it weekly and remove the liquidity — none of
  // which dTAO offers. (Bittensor docs: Staking.)
  'bittensor-dtao': {
    why: 'DefiLlama lists Bittensor dTAO under Dexs, so the DEX shape would tell its farmer to provide liquidity to a main pool in a balanced pair — but dTAO is Bittensor\u2019s staking system, not an AMM pool.',
    action: (p, capital, chain) => `Stake $${capital} of TAO with a validator on a Bittensor subnet through ${p.name} on ${chain} and hold the subnet's alpha tokens in your wallet.`,
    weekly: (p) => `Check the alpha rewards the subnet paid that week and restake them, or add a small top-up to the stake.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the staked TAO balance, the alpha balance and the rewards it earned that week.`,
    claim: (p) => `dTAO rewards are paid in alpha automatically, so there is no rewards page to claim from — check the position in your own wallet, and never pay to claim or follow a claim link in a message.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then unstake the alpha from the subnet on ${p.name} and swap it back to TAO, close the log and retire the wallet.`,
  },
  // Polymarket runs no points program and has no token claim page: its
  // rewards are Liquidity Rewards and Holding Rewards, paid in pUSD on
  // its rewards page. Only the claim step is wrong — the rest of the
  // prediction shape (fund the account, place and settle positions) is
  // right — so only the claim step is corrected here.
  // (Polymarket docs; TraderComps, Oct 2026.)
  'polymarket-international': {
    why: 'The prediction shape would send its farmer to a "market rewards page" to claim — but Polymarket runs no points program and has no token claim page; its rewards are Liquidity Rewards and Holding Rewards, paid in pUSD.',
    claim: (p) => `Check ${p.name}'s own rewards page for the liquidity rewards and holding yield it pays in pUSD — there is no points program and no token claim page; if a token is ever announced, claim only from the link the official site publishes, never from a link in a message.`,
  },
  // Felix CDP is a Liquity V2 fork on Hyperliquid: its CDP branches take
  // WHYPE, kHYPE, wstHYPE and UBTC as collateral to mint feUSD — 93% of
  // its collateral is HYPE-family — never USDC. The CDP shape would tell
  // its farmer to supply USDC as collateral, an asset no Felix branch
  // takes. (Felix risk report, Nov 2026: four branches, WHYPE/kHYPE/
  // wstHYPE/UBTC; coinlaunch: "deposit HYPE or UBTC and mint feUSD".)
  'felix-cdp': {
    why: 'DefiLlama lists Felix CDP under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but Felix\u2019s CDP takes HYPE (WHYPE, kHYPE, wstHYPE) and UBTC to mint feUSD, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of HYPE (wrapped as WHYPE) into a ${p.name} trove on ${chain} to mint feUSD and keep the feUSD in your wallet.`,
  },
  // Bucket CDP is Sui's CDP stablecoin: its vaults take SUI, BTC, ETH and
  // liquid staking tokens as collateral to mint BUCK, never USDC. The CDP
  // shape would tell its farmer to supply USDC as collateral, an asset no
  // Bucket vault takes. (Bucket docs via Crypto Daily / Backpack.)
  'bucket-cdp': {
    why: 'DefiLlama lists Bucket CDP under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but Bucket\u2019s CDP takes SUI, BTC, ETH and liquid staking tokens to mint BUCK, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of SUI into a ${p.name} vault on ${chain} to mint BUCK and keep the BUCK in your wallet.`,
  },
  // BIMA CDP mints USBD, a stablecoin over-collateralized by Bitcoin
  // derivatives at a 150% minimum ratio: users deposit BTC directly or
  // stake it for a Bitcoin LST and place that in a vault, never USDC.
  // (BIMA mainnet announcement, Apr 2025.)
  'bima-cdp': {
    why: 'DefiLlama lists BIMA CDP under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but BIMA\u2019s vaults take BTC and Bitcoin LSTs to mint USBD, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of BTC into a ${p.name} vault on ${chain} to mint USBD and keep the USBD in your wallet.`,
  },
  // Kava Mint is Kava's CDP: its variable collateral is BTC, BNB, ATOM,
  // KAVA and XRP, minted into USDX — USDC is not a collateral type. The
  // CDP shape would tell its farmer to supply USDC as collateral, an
  // asset Kava Mint does not take. (Kava Mint docs; Bitcoin Credit Stack.)
  'kava-mint': {
    why: 'DefiLlama lists Kava Mint under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but Kava Mint takes BTC, BNB, ATOM, KAVA and XRP as collateral to mint USDX, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of BTC into a ${p.name} vault on ${chain} to mint USDX and keep the USDX in your wallet.`,
  },
  // Monolith Market is Inverse Finance's permissionless factory for
  // single-collateral stablecoins: each lending market takes one
  // collateral type, ETH or wBTC, and lends its Coin stablecoin against
  // it — USDC is only a peg-stability asset, never borrower collateral.
  // Round 17 settled Monolith's category as right and the CDP shape as
  // fitting; the category was right, the shape's named asset was not.
  // (ChainSecurity audit of Monolith, Apr 2026.)
  'monolith-market': {
    why: 'DefiLlama lists Monolith Market under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but Monolith\u2019s lending markets take ETH or wBTC as collateral to borrow its Coin stablecoin, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of ETH into a ${p.name} lending market on ${chain} to borrow its Coin stablecoin against the collateral and keep the Coin in your wallet.`,
  },
  // BTCFi CDP mints BtcUSD, a stablecoin backed by Bitcoin as its
  // exclusive collateral: users deposit BTC (or WBTC / BTCBA) and mint
  // BtcUSD at 3.5% APY, never USDC. (DefiLlama stablecoin page for
  // BtcUSD; Bifrost / Stacks announcements.)
  'btcfi-cdp': {
    why: 'DefiLlama lists BTCFi CDP under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but BTCFi takes Bitcoin as its exclusive collateral to mint BtcUSD, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of BTC into a ${p.name} vault on ${chain} to mint BtcUSD and keep the BtcUSD in your wallet.`,
  },
  // Swan DAO's swanUSD is a wstETH-backed stablecoin on a single-
  // collateral Monolith lender: borrowers mint swanUSD against wstETH at
  // up to 85% of collateral value. The USDS in its peg-stability module
  // is a stability reserve, explicitly not borrower collateral — and
  // neither is USDC. (Pharos swanUSD risk profile, Oct 2026; Inverse
  // Finance forum: add sSwanUSD as collateral on FiRM.)
  'swan-dao': {
    why: 'DefiLlama lists Swan DAO under CDP, so the CDP shape would tell its farmer to supply USDC as collateral — but Swan DAO\u2019s swanUSD is minted against wstETH in a single-collateral Monolith lender, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of wstETH into a ${p.name} vault on ${chain} to mint swanUSD and keep the swanUSD in your wallet.`,
  },
  // Avant avETH is the Ether family of Avant Protocol: avETH is backed
  // 1:1 by ETH and direct minting accepts ETH or WETH — USDC is the
  // backing of the sibling avUSD family, not this one. The yield shape
  // would tell its farmer to deposit USDC into the avETH vault, an asset
  // it does not take. (Avant docs via avnat.trade; Bitrue: avETH backed
  // 1:1 by ETH.)
  'avant-aveth': {
    why: 'DefiLlama lists Avant avETH under Onchain Capital Allocator, so the yield shape would tell its farmer to deposit USDC into its vault — but avETH is backed 1:1 by ETH and mints against ETH or WETH, never USDC (USDC backs the sibling avUSD).',
    action: (p, capital, chain) => `Deposit $${capital} of ETH into ${p.name} on ${chain} to mint avETH and keep the avETH in your wallet.`,
  },
  // Origami Finance's leveraged vaults take the yield-bearing asset
  // itself and loop it through lending markets: lovUSDe takes USDe,
  // lovOlympus takes OHM, lovInfrared takes iBERA and other LSTs, and
  // the flagship vaults are named for their asset. The leveraged-farming
  // shape would tell its farmer to deposit USDC into a leveraged vault,
  // which is not how any of the named vaults take a deposit.
  // (Origami Finance docs; Lark Davis, May 2024.)
  'origami-finance': {
    why: 'DefiLlama lists Origami Finance under Leveraged Farming, so the leveraged-farming shape would tell its farmer to deposit USDC into a leveraged vault — but Origami\u2019s vaults take the yield-bearing asset itself (USDe, sUSDe, OHM, iBERA), never a USDC deposit.',
    action: (p, capital, chain) => `Deposit $${capital} of USDe into an ${p.name} leveraged vault on ${chain} and keep the vault receipt token in your wallet.`,
  },
  // Boros is Pendle's rate-trading platform on margin: a position's
  // margin is posted in the market's own collateral asset — ETH for an
  // ETH funding-rate market, BTC for a BTC one — never USDC. The
  // interest-rate shape would tell its farmer to deposit USDC as margin,
  // an asset no Boros market takes as margin. (Pendle docs: Boros
  // overview; the worked example posts 1.65 ETH of margin on a
  // YU-ETHUSDC market.)
  boros: {
    why: 'DefiLlama lists Boros under Interest Rate Derivatives, so the interest-rate shape would tell its farmer to deposit USDC as margin — but Boros margin is posted in the market\u2019s own collateral asset (ETH for an ETH funding-rate market), never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of ETH as margin on ${p.name} on ${chain} and open one small long or short position on a funding-rate market, then hold it to maturity.`,
  },
  // Granite is a Bitcoin lending market on Stacks with a single market:
  // borrowers post sBTC as collateral and borrow USDCx stablecoins
  // against it at up to 50% LTV, while liquidity providers earn yield by
  // depositing USDCx. The lending shape would tell its farmer to supply
  // USDC "as collateral and borrow against it" — in Granite the
  // stablecoin is the borrowed asset, never the collateral. (Granite /
  // Borrow on Bitcoin.)
  granite: {
    why: 'DefiLlama lists Granite under Lending, so the lending shape would tell its farmer to supply USDC as collateral and borrow against it — but Granite\u2019s single market takes sBTC as collateral and lends USDCx; the stablecoin is the borrowed asset, never the collateral.',
    action: (p, capital, chain) => `Deposit $${capital} of sBTC into ${p.name} on ${chain} as collateral and borrow a small amount of USDCx against it, then repay the borrow.`,
  },
  // Solv Strategies is Solv Protocol's Bitcoin-native yield vault: its
  // flagship BTC+ vault takes SolvBTC — minted 1:1 by depositing BTC or
  // wBTC — and allocates it across yield strategies. The yield shape
  // would tell its farmer to deposit USDC into the vault, an asset Solv's
  // strategies do not take. (Solv docs via Binance Square; BTCC: mint
  // SolvBTC by depositing BTC or wBTC.)
  'solv-strategies': {
    why: 'DefiLlama lists Solv Strategies under Onchain Capital Allocator, so the yield shape would tell its farmer to deposit USDC into its vault — but Solv\u2019s strategies are Bitcoin-native: deposits are BTC, minted into SolvBTC, never USDC.',
    action: (p, capital, chain) => `Deposit $${capital} of BTC into a ${p.name} vault on ${chain} to receive SolvBTC and hold it in your wallet.`,
  },
  // Exponent Yield Exchange is a yield exchange, not a vault: it splits a
  // yield-bearing asset (JitoSOL, mSOL, ONyc) into a fixed-rate principal
  // token (PT) and a yield token (YT) that trade to maturity. The yield
  // shape would tell its farmer to deposit USDC into a vault and keep
  // vault shares — there is no USDC vault to deposit into, and a PT is
  // held to maturity, not restaked weekly. So the action, the weekly
  // action, the number worth logging, the claim and the exit are all
  // corrected here. (Exponent docs; CoinCodeCap review.)
  'exponent-yield-exchange': {
    why: 'DefiLlama lists Exponent Yield Exchange under Yield, so the yield shape would tell its farmer to deposit USDC into a vault — but Exponent\u2019s Yield Exchange is an exchange, not a vault: it splits a yield-bearing asset into a principal token and a yield token, and there is no USDC vault to deposit into.',
    action: (p, capital, chain) => `Swap $${capital} of JitoSOL for its fixed-rate principal token (PT) on ${p.name} on ${chain} and hold the PT to maturity for the fixed yield.`,
    weekly: (p) => `Check the PT's fixed rate and maturity date on ${p.name} each week and hold it — the rate is locked at purchase, so there is nothing to rebalance.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the PT balance, the fixed rate it locked in and the maturity date.`,
    claim: (p) => `A PT redeems for the underlying asset at maturity, so there is no rewards page to claim from — check the redemption on the official ${p.name} page at maturity, and never pay to claim or follow a claim link in a message.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then hold the PT to maturity and redeem it for the underlying asset on ${p.name}, close the log and retire the wallet.`,
  },
  // Exponent Risk Tranching splits a yield-bearing asset (ONyc, AUTO,
  // nOPAL, eHYUSD) into a senior tranche and a junior tranche: a farmer
  // deposits the underlying asset into one side and receives LP shares
  // for that tranche (srONyc for the senior side of the ONyc market),
  // the senior side earns the lower yield in exchange for junior capital
  // sitting beneath it as protection, and the yield accrues in the
  // tranche's NAV, not on a rewards page. The first and largest market
  // is ONyc, OnRe's reinsurance token, and senior withdrawals pause
  // while a tranche is in a Recovery Period after a loss. The yield
  // shape would tell its farmer to deposit USDC into a vault and keep
  // vault shares — there is no USDC vault, and there is no Exponent
  // token or points program. (Exponent docs: Risk Tranching; Vitrine
  // risk report: ONyc tranche $5.94M NAV, "There is no Exponent token
  // or Emissions and points program".)
  'exponent-risk-tranching': {
    why: 'DefiLlama lists Exponent Risk Tranching under Yield, so the yield shape would tell its farmer to deposit USDC into a vault — but Risk Tranching is not a vault: a farmer deposits the market\u2019s underlying asset into a senior or junior tranche and receives LP shares for that tranche, and there is no USDC to deposit.',
    action: (p, capital, chain) => `Deposit $${capital} of ONyc into the senior tranche of ${p.name} on ${chain} and hold the srONyc LP shares in your wallet.`,
    weekly: (p) => `Check the srONyc yield and the tranche\u2019s coverage on ${p.name} each week and hold the position — the senior side earns a lower yield in exchange for junior capital sitting beneath it as protection.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the srONyc LP share balance, the senior yield and the tranche\u2019s coverage.`,
    claim: (p) => `The senior yield accrues in the tranche\u2019s NAV, so there is no rewards page to claim from — check the position on the official ${p.name} page, and never pay to claim or follow a claim link in a message.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then redeem the srONyc LP shares from ${p.name} for ONyc (senior withdrawals pause during a Recovery Period if the tranche takes a loss, so allow extra time), close the log and retire the wallet.`,
  },
  // Exponent Strategy Vaults are managed vaults: a farmer deposits the
  // vault's accepted asset — SOL for the largest vaults — and the vault
  // manager allocates it across strategies and rebalances it, so there
  // is nothing to restake by hand. The largest vault is onycSOL,
  // managed by RockawayX, launched 4 November 2026 with a $10M cap and
  // weekly withdrawals; it combines SOL staking yield with ONyc and
  // pays $20K a month of SOL incentives plus 4x OnRe points. The yield
  // shape would tell its farmer to deposit USDC into a vault and claim
  // and restake rewards each week — USDC is the smaller line, and the
  // manager does the allocating. (Exponent docs: Strategy Vaults;
  // Vitrine risk report: SOL line $12.4M vs USDC $5.9M; onycSOL vault.)
  'exponent-strategy-vaults': {
    why: 'DefiLlama lists Exponent Strategy Vaults under Onchain Capital Allocator, so the yield shape would tell its farmer to deposit USDC into a vault — but the vaults take the vault\u2019s accepted asset (SOL for the largest vaults), and the vault manager allocates and rebalances the deposit, so there is nothing to restake by hand.',
    action: (p, capital, chain) => `Deposit $${capital} of SOL into the onycSOL strategy vault on ${p.name} on ${chain}, managed by RockawayX, and keep the vault shares in your wallet.`,
    weekly: (p) => `Check the position value and the curator\u2019s allocations on ${p.name} each week and hold it — the manager rebalances the vault, so there is nothing to restake by hand.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the vault share balance, the position value and the OnRe points the vault shows that week.`,
    claim: (p) => `Check the onycSOL vault\u2019s own page on ${p.name} for the SOL incentives and OnRe points it pays, and claim only from the link the official site publishes, never from a link in a message, and do it inside the claim window the protocol announces.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then request a withdrawal of the vault shares from ${p.name} (the onycSOL vault processes withdrawals weekly, so allow extra time), close the log and retire the wallet.`,
  },
  // Figure Markets Prime is a lender-side marketplace, not a borrow
  // market: Democratized Prime's pools are a YLDS HELOC pool, which
  // takes YLDS (deposit USD, buy YLDS, lend into the pool), and
  // USD/USDC/USDT margin pools — so USDC lends into a margin pool,
  // not the HELOC pool, while the Crypto-Backed Loan side posts
  // crypto — BTC, ETH or SOL — as collateral, never USDC. The
  // lending shape would tell its farmer to supply USDC as collateral
  // and borrow against it, then repay the borrow — there is no
  // borrow-against-your-supply on either side. Radar-21 corrected
  // this row to lend USDC into a Democratized Prime pool to fund
  // HELOC-backed loans; that conflated the two pools, and it is
  // refined here. (Figure Markets: Democratized Prime; Figure: Prime
  // lending pools.)
  'figure-markets-prime': {
    why: 'DefiLlama lists Figure Markets Prime under Lending, so the lending shape would tell its farmer to supply USDC as collateral and borrow against it — but Democratized Prime is a lender-side marketplace: its pools are a YLDS HELOC pool, which takes YLDS, and USD/USDC/USDT margin pools, so USDC lends into a margin pool, not the HELOC pool, and the borrow side posts crypto as collateral, never USDC.',
    action: (p, capital, chain) => `Lend $${capital} of USDC into a Democratized Prime margin pool on ${p.name} on ${chain} and keep the pool position in your wallet.`,
    weekly: (p) => `Check the yield the Democratized Prime margin pool paid that week on ${p.name} and leave it compounding instead of withdrawing it.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the pool balance and the yield it paid that week.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then withdraw the deposit from the Democratized Prime margin pool on ${p.name}, close the log and retire the wallet.`,
  },
  // Native Credit Pool is a single-sided supply pool, not a borrow
  // market: suppliers deposit assets that market makers borrow for
  // trading, to deepen spot liquidity — nobody posts collateral and
  // nobody borrows against a deposit, so there is no health factor
  // to track and no borrow to repay. The supply asset is verifiable
  // too: USDC is the largest asset in the pool, $6.54M of $19.03M on
  // 14 November 2026. That figure was re-verified in radar-24 against
  // DefiLlama's own API token breakdown (api.llama.fi/protocol/
  // native-credit-pool, tokensInUsd) on 14 November 2026: USDC $6.54M,
  // the largest asset, of $19.05M total at 11:24 UTC, and $6.25M of
  // $19.14M in the day's 00:00 UTC entry, so the $19.03M is the same
  // day's total at an earlier fetch, within intraday drift. The API's
  // description confirms the pool itself: a unified, single-sided
  // asset supply pool that enables market makers to borrow assets for
  // trading. The lending shape would tell its farmer to
  // supply USDC as collateral and borrow against it, repay part of
  // the borrow every week and track the health factor — every step
  // of that is the wrong side of the pool. (DefiLlama: Native Credit
  // Pool; DefiLlama API token breakdown, 14 Nov 2026.)
  'native-credit-pool': {
    why: 'DefiLlama lists Native Credit Pool under Lending, so the lending shape would tell its farmer to supply USDC as collateral and borrow against it — but Native Credit Pool is a single-sided supply pool: suppliers deposit assets that market makers borrow for trading, nobody posts collateral and nobody borrows against a deposit, and USDC is the largest asset supplied ($6.54M on 14 Nov 2026).',
    action: (p, capital, chain) => `Supply $${capital} of USDC to the single-sided ${p.name} on ${chain}, where market makers borrow the supplied assets for trading, and keep the pool position in your wallet.`,
    weekly: (p) => `Check the borrow interest the ${p.name} paid that week and leave it compounding instead of withdrawing it.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the supplied balance, the borrow interest it earned that week and the active loans it funds.`,
    claim: (p) => `Before you withdraw, check ${p.name}'s own site for any rewards announcement and claim only from the link it publishes, never from a link in a message; if it announces no rewards, there is nothing to claim.`,
    exit: (p) => `If a token launches, claim within the first week, sell half at once and keep the rest for 30 days, then withdraw the supplied USDC from ${p.name}, close the log and retire the wallet.`,
  },
  // BounceBit Prime is an institutional product, not a retail vault:
  // it is built for institutional and accredited investors, with
  // KYC/AML, custodial management and transparent reporting, and its
  // flagship BENJI fund is for qualified investors. The basis shape
  // would tell its farmer to deposit USDC into the strategy and
  // rebalance it weekly — a retail wallet cannot simply deposit, and
  // there is nothing to rebalance by hand in a managed strategy. Its
  // plan starts with KYC and qualified-investor onboarding, and only
  // then deposits. (BounceBit docs; Blockworks, Jun 2025;
  // FinanceFeeds, Aug 2025.)
  'bouncebit-prime': {
    why: 'DefiLlama lists BounceBit Prime under Basis Trading, so the basis shape would tell its farmer to deposit USDC into its strategy — but BB Prime is an institutional product: it is built for institutional and accredited investors, with KYC/AML, custodial management and transparent reporting, and its flagship BENJI fund is for qualified investors, so a retail wallet cannot simply deposit.',
    action: (p, capital, chain) => `Complete ${p.name}'s KYC and qualified-investor onboarding first — BB Prime is institutional-only — then deposit $${capital} of USDC into its strategy on ${chain} and keep the position open.`,
    weekly: (p) => `Check the yield the ${p.name} strategy paid that week and leave it compounding instead of withdrawing it.`,
    track: (p) => `Track the position weekly in a farm log for ${p.name} with the wallet address, the dates and every transaction hash, and note the strategy balance and the yield it earned that week.`,
    claim: (p) => `Before you withdraw, check ${p.name}'s own site for any rewards announcement and claim only from the link it publishes, never from a link in a message; if it announces no rewards, there is nothing to claim.`,
  },
};

export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const correction = PLAN_CORRECTIONS[p.slug];
  const chain = correction?.chainLabel ?? chainOf(p);
  const capital = capitalFor(p);
  const capitalLabel = correction?.capitalLabel ?? `$${capital}`;
  const hold = correction?.holdDays ?? holdDaysFor(age);
  const action = correction?.action ? correction.action(p, capital, chain) : actionFor(p, capital, chain);
  const weekly = correction?.weekly ? correction.weekly(p, capital, chain) : weeklyActionFor(p);
  const track = correction?.track ? correction.track(p, capital, chain) : trackFor(p);
  const claim = correction?.claim ? correction.claim(p, capital, chain) : claimFor(p);
  const exit = correction?.exit ? correction.exit(p, capital, chain) : exitFor(p);
  const gas = correction?.gasToken ?? gasTokenFor(chain);
  const noGas = gas === null;
  const walletStep = noGas
    ? `Open a fresh wallet for ${p.name} on ${chain}, where transactions carry no gas fee, keep its seed phrase offline on paper, and never reuse that seed phrase for another farm.`
    : `Open a fresh wallet for ${p.name}, fund it with ${gas} for gas on ${chain}, keep its seed phrase offline on paper, and never reuse that seed phrase for another farm.`;
  const others = p.chains.length > 1 ? ` Repeat the deposit on a second chain, ${p.chains[1]}, so the activity is not tied to one network.` : ` Use the protocol on ${chain} only, and do not split the position across networks it does not list.`;
  return [
    {
      text: walletStep,
      cost: noGas ? 'nothing: transactions carry no gas fee' : 'under $3 of gas for the first transaction',
      time: '5 minutes',
    },
    {
      text: action,
      cost: correction?.actionCost ?? (noGas ? `${capitalLabel} of capital, and no gas fee` : `${capitalLabel} of capital and about $${capital >= 250 ? 8 : 4} of gas`),
      time: correction?.actionTime ?? '15 minutes to set up',
    },
    {
      text: `Use this wallet for ${p.name} alone, and ${weekly.charAt(0).toLowerCase()}${weekly.slice(1)}`,
      cost: noGas ? 'nothing: transactions carry no gas fee' : 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the ${p.name} position for at least ${hold} days so the activity is counted in more than one snapshot.${others}`,
      cost: `the ${capitalLabel} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: track,
      cost: 'nothing but the log',
      time: '5 minutes a week',
    },
    {
      text: claim,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: exit,
      cost: noGas ? 'nothing: transactions carry no gas fee' : 'about $3 of gas to claim',
      time: '15 minutes to claim',
    },
  ];
}

/** A dollar amount rounded to cents, or null where no dollar figure exists. */
const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * One row's farm economics, from the plan's own cost lines and the
 * row's own figures — nothing else. Capital is capitalFor of the TVL;
 * the hold is the plan's hold (a correction's hold where the protocol's
 * own lock caps it); gas sums the plan's cost lines at their stated
 * upper bounds ($3 to open the wallet, $4 of gas to act, $8 where the
 * capital is $250, $2 a week for each week of the hold, $3 to claim and
 * exit), and is $0 where the chain charges no gas; the opportunity cost
 * is the capital at the 3-month T-bill rate for the hold; the sunk total
 * is gas plus opportunity cost, and the capital stays apart from it
 * because it comes back when the position unwinds. Hands-on time is the
 * plan's minutes added up (5 to open the wallet, 15 to act, 15 a week
 * to tend and log it, 10 to check the claim, 15 to claim and exit). The
 * break-even share is the sunk total as a percentage of the row's P10
 * implied value, the low end of its range. Mezo Earn cannot be priced
 * in dollars — its capital is 0.01 BTC and its action gas is BTC, and
 * the snapshot carries no BTC price — so its dollar figures are null
 * and its verdict is CHECK.
 */
export function farmEconomics(
  slug: string,
  tvlUsd: number,
  chains: string[],
  age: number | null,
  impliedP10Usd: number,
): FarmEconomics {
  const correction = PLAN_CORRECTIONS[slug];
  const chain = correction?.chainLabel ?? (chains.length > 0 ? chains[0]! : 'its main chain');
  const gas = correction?.gasToken ?? gasTokenFor(chain);
  const noGas = gas === null;
  const capitalLabel = correction?.capitalLabel ?? `$${capitalFor({ tvl_usd: tvlUsd } as SnapshotProtocol)}`;
  const capitalUsd = capitalLabel.startsWith('$') ? Number(capitalLabel.slice(1)) : null;
  const hold = correction?.holdDays ?? holdDaysFor(age);
  const weeks = Math.ceil(hold / 7);
  const gasUsd = capitalUsd === null ? null : noGas ? 0 : 3 + (capitalUsd >= 250 ? 8 : 4) + 2 * weeks + 3;
  const opportunityUsd = capitalUsd === null ? null : round2((capitalUsd * TBILL_RATE * hold) / 365);
  const sunkUsd = gasUsd === null || opportunityUsd === null ? null : round2(gasUsd + opportunityUsd);
  const breakevenPct = sunkUsd === null ? null : Math.round((sunkUsd / impliedP10Usd) * 100 * 1e6) / 1e6;
  const verdict: FarmEconomics['verdict'] =
    breakevenPct === null ? 'CHECK' : breakevenPct < 0.0005 ? 'FARM' : breakevenPct < 0.001 ? 'THIN' : 'SKIP';
  return {
    capital_usd: capitalUsd,
    capital_label: capitalLabel,
    hold_days: hold,
    gas_usd: gasUsd,
    opportunity_usd: opportunityUsd,
    sunk_usd: sunkUsd,
    hands_on_minutes: 45 + 15 * weeks,
    breakeven_pct: breakevenPct,
    verdict,
  };
}

/** One live-token protocol in the dashboard's compact form. */
function toLiveRow(p: SnapshotProtocol): LiveRow {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    chains: p.chains,
    tvl_usd: p.tvl_usd,
    mcap_usd: p.mcap_usd,
    change_7d: p.change_7d,
    // Stored unrounded, and the page's toFixed(2) is the only rounding:
    // rounding to three decimals first double-rounds at display, and four
    // decimals does not save it either. Api3's true ratio is 2.9747x, so
    // its two-decimal multiple is 2.97x, but the three-decimal store read
    // 2.975 and the page showed 2.98x; Zama read 1.64x for a true 1.63x.
    // And ACryptoS's ratio is 0.0150x, a true 0.02x at two decimals, but
    // the stored 0.015 displays as 0.01x, because (0.015).toFixed(2) is
    // "0.01" in JavaScript. Four rows showed a wrong multiple that way
    // (Api3, Zama and Usual USD0 at 0.28x for a true 0.27x among the peer
    // samples, Api3 and Zama again in the Live view). The board's own
    // multiples stay rounded to four decimals, because the page recomputes
    // each row from the multiple board.json carries; a live multiple is
    // only ever displayed and sorted, never recomputed from, so the full
    // ratio is the right thing to store. Checked over all 128 live-token
    // protocols with a market cap: toFixed(2) from the full ratio matches
    // the correctly rounded two-decimal value on every one.
    multiple: p.mcap_usd !== null && p.tvl_usd > 0 ? p.mcap_usd / p.tvl_usd : null,
  };
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    // The same population the comparables are priced from, not the wider
    // live set: a bridge, liquid-staking or wrapper token's market cap
    // prices a business other than the TVL the snapshot records for it, so
    // it is left out of this view as well as out of the comparables, and
    // every ratio the Live token view shows is one of the 90 the model
    // prices the board with. An exchange token is left out on the same
    // ground. A protocol that records a token but no market cap has no
    // market cap to rank by, so it never appears here either.
    .filter((p) => !isPreToken(p) && !isExcludedCategory(p) && p.mcap_usd !== null && p.mcap_usd > 0)
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map(toLiveRow);
}

/**
 * The live comparables each detail view names, by category: the three
 * biggest live-token protocols in the category, by market cap. The Live
 * token view only carries the top 24 live protocols by market cap, so a
 * category's peers (Api3 is the Risk Curators peer, at $35M) would never
 * appear in a detail view drawn from that list alone.
 */
export function liveSamples(snapshot: Snapshot): Record<string, LiveRow[]> {
  const byCategory = new Map<string, LiveRow[]>();
  const rows = snapshot.protocols
    // The same population the comparables are priced from: a live token with
    // a market cap above zero that the snapshot records, in a category the
    // board ranks. Bridge, liquid-staking, liquid-restaking and wrapper
    // tokens are left out here too, not only exchange tokens: their market
    // caps price a business other than the TVL, so they are never shown as
    // a peer for a row the model prices. A protocol that records a token but
    // no market cap has no ratio to show, so it never appears as a peer; a
    // $0 market cap is the same.
    .filter((p) => !isPreToken(p) && !isExcludedCategory(p) && p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0)
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .map(toLiveRow);
  for (const r of rows) {
    const key = r.category ?? 'Other';
    const list = byCategory.get(key) ?? [];
    if (list.length < 3) list.push(r);
    byCategory.set(key, list);
  }
  return Object.fromEntries([...byCategory.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)));
}

/** A board row's compact form for data.js, with the farm plan verbatim. */
export function radarRow(row: BoardRow): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    listed_at: row.listed_at,
    age_days: row.age_days,
    watchlist: row.watchlist,
    implied_value_usd: row.implied_value_usd,
    implied_p10_usd: row.implied_p10_usd,
    implied_p90_usd: row.implied_p90_usd,
    rank_p10: row.rank_p10,
    rank_p90: row.rank_p90,
    curve_multiple: row.model.curve_multiple,
    fit_comps: row.model.fit_comps,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    breadth_multiplier: row.model.breadth_multiplier,
    quality_multiplier: row.model.quality_multiplier,
    farm_steps: row.farm_steps,
    farm_economics: farmEconomics(row.slug, row.tvl_usd, row.chains, row.age_days, row.implied_p10_usd),
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const comps = compSet(snapshot);
  const fit = fitSizeCurve(comps);
  const oos = evaluateOos(snapshot, model);
  const early = board.filter((r) => !r.watchlist).length;
  const total = board.reduce((sum, r) => sum + r.implied_value_usd, 0);
  const sortedImplied = board.map((r) => r.implied_value_usd).sort((a, b) => a - b);
  const medianImplied = median(sortedImplied) ?? 0;
  // The curve's multiple at a spread of TVLs, so the page can show the size effect as a table.
  const sizeBands = [5_000_000, 10_000_000, 50_000_000, 100_000_000, 500_000_000, 1_000_000_000, 2_757_585_593].map((tvl) => ({
    tvl_usd: tvl,
    multiple: curveMultiple(fit, tvl, model),
  }));
  // Each category's median log residual from the curve: the offsets that were tested and not used.
  const residuals = new Map<string, number[]>();
  for (const c of comps) {
    const f = rowFactor(c.change7d, c.age, c.chains, model);
    const pred = c.tvl * curveMultiple(fit, c.tvl, model) * f.growthMult * f.maturityMult * f.breadthMult * f.qualityMult;
    const list = residuals.get(c.category) ?? [];
    list.push(Math.log(c.mcap / pred));
    residuals.set(c.category, list);
  }
  const categoryResiduals = [...residuals.entries()]
    .map(([category, list]) => ({ category, peers: list.length, median_residual: Math.round((median(list) ?? 0) * 1000) / 1000 }))
    .sort((a, b) => (a.category < b.category ? -1 : 1));
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    total_implied_usd: total,
    median_implied_usd: medianImplied,
    curve: { intercept: fit.intercept, slope: fit.slope, comps: fit.n },
    oos,
    size_bands: sizeBands,
    tbill: { rate: TBILL_RATE, as_of: TBILL_AS_OF },
    category_residuals: categoryResiduals,
    comps: comps.map((c) => [c.tvl, c.mcap] as [number, number]),
    rows: board.map(radarRow),
    live,
    peer_samples: liveSamples(snapshot),
    excluded: excludedBreakdown(snapshot, board),
    live_total: snapshot.protocols.filter((p) => !isPreToken(p)).length,
    live_priced: comps.length,
  };
  return { board, radar };
}

/** The pre-token protocols the board does not rank, counted by the exclusion that left each one out. */
export function excludedBreakdown(snapshot: Snapshot, board: BoardRow[]): { total: number; by_reason: Record<string, number> } {
  const ranked = new Set(board.map((r) => r.slug));
  const by_reason: Record<string, number> = {};
  let total = 0;
  for (const p of snapshot.protocols) {
    if (!isPreToken(p) || ranked.has(p.slug)) continue;
    const reason = exclusionReason(p);
    by_reason[reason] = (by_reason[reason] ?? 0) + 1;
    total += 1;
  }
  return { total, by_reason };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' && Number.isFinite(p.mcap_usd) ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) {
      const t = s.trim();
      if (t.length < 20 || t.length > 600) return `${r.slug} has a farm step of ${t.length} characters`;
    }
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
