// Token Radar's model (radar-14): one sealed snapshot in, one ranked board out.
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
// Saturn, a Stablecoin Wrapper at rank 28, because a watchlist slug is
// always ranked; the dashboard states that carve-out where it states the
// rule. The 147 pre-token protocols the board does not rank are counted by
// exclusion in the dashboard's data, so the reader can see what was set
// aside and why, instead of taking the board's completeness on trust.
//
// Implied value follows only from the snapshot's own figures, through one
// function applied to every row. No protocol name is ever special-cased.
//
//   comparable  = median(mcap_usd / tvl_usd) over the live-token protocols
//                 in the same category, shrunk toward the market median
//                 in log space with a weight of 3 peers, then clamped
//                 to [0.05, 0.80]:
//                 exp((peers x ln(categoryMedian) + 3 x ln(marketMedian))
//                     / (peers + 3)).
//                 Ratios multiply, so the shrinkage averages logarithms and
//                 the raw median is never clamped first: a 400x peer and a
//                 1.5x peer no longer collapse to one multiple, and a 0.002x
//                 peer is not lifted to the market by a floor clamp either.
//                 A category with one live peer still never prices at its
//                 peer's ratio: the market weight pulls it most of the way
//                 back, and the cap bounds the rest. Categories with no live
//                 peer use the market median outright. The market median is
//                 the median over the live-token protocols in the categories
//                 the board ranks: exchange, bridge, liquid staking,
//                 liquid restaking and wrapper tokens are left out of the
//                 comparable population, because their market caps price a
//                 business other than the TVL the snapshot records for them.
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
// Why this shape: a token's launch value is anchored on what the market
// already pays for the same kind of business (the category comparable), then
// moved by the protocol's own momentum (7-day TVL growth), its seasoning
// (how long it has survived without a token), its distribution (how many
// chains carry its TVL) and the quality of the evidence behind it. A big TVL
// in a cheap category is worth less than the same TVL in a rich one, and a
// shrinking protocol is worth less than a growing one at the same size. The
// dashboard states the formula and shows every row's breakdown, and the page
// recomputes each row from the same figures so the board and the page can
// never disagree.

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
  shrink_peers: number;
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
  multiple_floor: 0.05,
  multiple_cap: 0.8,
  shrink_peers: 3,
  breadth_step: 0.02,
  breadth_max_chains: 4,
  unknown_growth_discount: 0.97,
};

/** The model's version label: the dashboard names it. */
export const MODEL_VERSION = 'radar-14';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
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
  model: {
    category_multiple: number;
    comparable_peers: number;
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
  category_multiple: number;
  comparable_peers: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  breadth_multiplier: number;
  quality_multiplier: number;
  farm_steps: string[];
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
  multiples: Record<string, number>;
  peers: Record<string, number>;
  raw_multiples: Record<string, number>;
  market_multiple: number;
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

/**
 * The category comparables: for each category, the median market-cap-to-TVL
 * ratio of the live-token protocols in it, shrunk toward the market
 * median in log space with a weight of `shrink_peers` peers, then clamped to
 * the model's band. Ratios multiply, so the shrinkage averages logarithms:
 * exp((peers x ln(categoryMedian) + 3 x ln(marketMedian)) / (peers + 3)).
 * The raw median is never clamped before shrinking. The old arithmetic
 * shrink clamped it to [0.05, 0.80] first, which erased every difference
 * between rich single-peer categories: Chain (3.03x), Collateral Management
 * (12.16x), Decentralized AI (2.06x), NFT Marketplace (2.00x), Options
 * (1.51x), Prediction Market (400.20x) and Risk Curators (2.97x) all priced
 * at one identical 0.3845x, 40 board rows on a single number. In log space
 * they price at 0.4442x, 0.6289x, 0.4035x, 0.4006x, 0.3736x, the 0.80 cap
 * and 0.4423x: each from its own peer, still pulled most of the way to the
 * market by the 3-peer weight. The same clamp erased the cheap end too: a
 * category whose peers trade at 0.002x was lifted to 0.1676x by the floor
 * before shrinking, so Staking Pool (SSV at 0.00x on $10.2B of TVL) priced
 * as if it were a mid-market category; in log space it prices at the 0.05
 * floor. A single peer still never sets its own price: Risk Curators'
 * 2.97x peer pulls the multiple to 0.4423x, not to 2.97x, and an extreme
 * peer still lands at the cap, which is the model's bound. Categories with
 * no live peer use the market median outright. Exchange tokens are left
 * out of the population entirely: an exchange token's market cap prices
 * the exchange's business, not the TVL the snapshot records for it (Nexo's
 * ratio is 69x on $10M of TVL, OKX's is 0.07x on $26B). Bridge, liquid
 * staking, liquid restaking and wrapper tokens are left out for the same
 * reason, and it is the same rule the board applies to the ranking itself:
 * a bridge token's market cap prices the bridge's business, not the value
 * locked in it, and a liquid-staking governance token prices governance
 * over the staked asset, not the asset itself, so their ratios measure a
 * different object than a lender's or a DEX's. On this snapshot the 29
 * such protocols sit at a median ratio of 0.3167x against the market's
 * 0.2460x, nine of them below 0.05x and nine above 1x, so leaving them in
 * lifts the market median by about 5% on a population the board itself
 * refuses to rank. The comparables are therefore the live-token DeFi
 * protocols with a market cap above zero in the categories the board
 * ranks, the same population the dashboard names when it says how many
 * protocols price the comparables. The map is computed from this snapshot
 * alone, at run time, never hard-coded.
 */
export function categoryMultiples(snapshot: Snapshot, model: ModelConstants): { byCategory: Map<string, { multiple: number; raw: number; peers: number }>; market: number } {
  const byCategory = new Map<string, number[]>();
  const all: number[] = [];
  for (const p of snapshot.protocols) {
    if (isPreToken(p) || isExcludedCategory(p) || p.mcap_usd === null || p.tvl_usd <= 0) continue;
    const ratio = p.mcap_usd / p.tvl_usd;
    if (!Number.isFinite(ratio) || ratio <= 0) continue;
    all.push(ratio);
    const key = p.category ?? 'Other';
    const list = byCategory.get(key) ?? [];
    list.push(ratio);
    byCategory.set(key, list);
  }
  const marketRaw = median(all) ?? 0.2;
  // Rounded like every multiple the board states, for the same reason: a
  // no-peer category is priced at this market median, and the page must
  // recompute it from the number the board carries.
  const market = round4(Math.min(model.multiple_cap, Math.max(model.multiple_floor, marketRaw)));
  const out = new Map<string, { multiple: number; raw: number; peers: number }>();
  for (const [key, list] of byCategory) {
    const raw = median(list) ?? marketRaw;
    // Log space, raw unclamped: the shrinkage averages the logarithms of
    // the category median and the market median, so a 400x peer and a 1.5x
    // peer keep their distance instead of collapsing at a clamp, and a
    // 0.002x peer keeps its cheapness instead of being lifted by a floor.
    const shrunk = Math.exp((list.length * Math.log(raw) + model.shrink_peers * Math.log(market)) / (list.length + model.shrink_peers));
    // Rounded to four decimals BEFORE use: the dashboard recomputes each row
    // from the multiple board.json carries, so the multiple it uses must be
    // the multiple the board states, not a longer decimal behind it. An
    // unrounded multiple would make the page's recompute differ from the
    // board by a few dollars on most rows.
    out.set(key, { multiple: round4(Math.min(model.multiple_cap, Math.max(model.multiple_floor, shrunk))), raw: round4(raw), peers: list.length });
  }
  return { byCategory: out, market };
}

/** The multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
  comparable: { multiple: number; peers: number },
): { implied: number; growthPct: number; growthMult: number; maturityMult: number; breadthMult: number; qualityMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const growthKnown = protocol.change_7d !== null && Number.isFinite(protocol.change_7d);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = 1 + (growthPct / 100) * model.growth_weight;
  const ageForModel = age ?? model.unknown_age_days;
  const maturityMult = model.maturity_floor + (Math.min(Math.max(ageForModel, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
  const extraChains = Math.min(Math.max(protocol.chains.length - 1, 0), model.breadth_max_chains);
  const breadthMult = 1 + model.breadth_step * extraChains;
  const qualityMult = growthKnown ? 1 : model.unknown_growth_discount;
  const base = protocol.tvl_usd * comparable.multiple;
  const implied = Math.max(1, Math.round(base * growthMult * maturityMult * breadthMult * qualityMult));
  return { implied, growthPct, growthMult, maturityMult, breadthMult, qualityMult, age };
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
  const multiples = categoryMultiples(snapshot, model);
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
    const key = p.category ?? 'Other';
    const comparable = multiples.byCategory.get(key) ?? { multiple: multiples.market, peers: 0 };
    const v = impliedValue(p, snapshot.as_of, model, comparable);
    return { p, comparable, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
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
    model: {
      category_multiple: round4(s.comparable.multiple),
      comparable_peers: s.comparable.peers,
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

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} as collateral and borrow a small amount against it, then repay the borrow.`;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} in a balanced pair and keep the position open.`;
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) return `Deposit $${capital} of USDC into a ${name} vault on ${chain} and keep the vault shares in your wallet.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} on ${chain}, open one small hedged trade, then close it.`;
  if (c.includes('prediction')) return `Fund your ${name} account with $${capital} on ${chain} and place one small market position.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain} and hold it in your wallet.`;
  if (c.includes('rwa')) return `Mint $${capital} of ${name}'s yield-bearing asset on ${chain} and hold it for the full period.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy active.`;
  if (c.includes('basis') || c.includes('options')) return `Deposit $${capital} of USDC into ${name}'s strategy on ${chain} and keep the position open.`;
  if (c.includes('liquidity manager')) return `Deposit $${capital} of USDC into a ${name} managed pool on ${chain} and keep the managed position open.`;
  if (c.includes('liquid')) return `Deposit $${capital} into ${name} on ${chain} and keep the receipt token in your wallet.`;
  if (c === 'chain') return `Move $${capital} of USDC onto ${name} through its official bridge and hold the balance in your wallet on the network.`;
  if (c.includes('staking pool')) return `Deposit $${capital} of USDC into the ${name} staking pool on ${chain} and keep the staking receipt in your wallet.`;
  if (c.includes('cedefi')) return `Deposit $${capital} of USDC into ${name}'s managed yield account on ${chain} and keep the account open.`;
  if (c === 'farm') return `Deposit $${capital} of USDC into the ${name} farm on ${chain} and keep the farm position open.`;
  if (c.includes('anchor btc') || c.includes('decentralized btc')) return `Deposit $${capital} of BTC-backed assets through ${name} on ${chain} and hold the receipt token in your wallet.`;
  if (c.includes('payments')) return `Fund a ${name} payment channel with $${capital} on ${chain} and make one small payment through it.`;
  if (c.includes('otc')) return `Place a $${capital} buy order for an OTC asset on ${name} on ${chain} and hold the asset in your wallet.`;
  if (c === 'restaking') return `Restake $${capital} of USDC through ${name} on ${chain} and keep the restaking receipt in your wallet.`;
  if (c.includes('governance')) return `Lock $${capital} of USDC in ${name}'s governance vault on ${chain} and vote once with the position.`;
  if (c.includes('crypto card')) return `Load $${capital} of USDC onto the ${name} card on ${chain} and spend a small amount with it.`;
  if (c.includes('index')) return `Buy $${capital} of the ${name} index token on ${chain} and hold it in your wallet.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and use its main feature once.`;
}

/** The weekly action that keeps a farm alive, by category: the same deposit every week looks like one burst, a category-shaped action every week looks like use. */
function weeklyActionFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Repay a small part of the borrow on ${name} and borrow it back, so the position moves every week instead of sitting still.`;
  if (c.includes('dex') || c.includes('leveraged farm')) return `Swap a small amount through ${name}'s main pool each week, alternating the direction, so the wallet trades as well as holds.`;
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
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) note = `the borrow amount, the collateral ratio and the health factor.`;
  else if (c.includes('dex') || c.includes('leveraged farm')) note = `the pool share and the fees the position earned.`;
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
 * QUBIC, so a farm's contract calls still need it). Tempo has no native gas
 * token: fees are paid in any supported USD stablecoin, so the step names
 * that instead of a ticker. One chain stays on the generic wording because
 * no public record settles its gas token: BSquared (B2 pays gas on its hub,
 * BTC on its rollup, and the sources disagree on which a farmer needs).
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
    'Bifrost Network': 'BFC', Fluent: 'ETH', Stacks: 'STX', 'Plume Mainnet': 'PLUME', Pharos: 'PROS', Strato: 'USDST', Qubic: 'QUBIC',
  };
  return known[chain] ?? `${chain}'s native gas token`;
}

/** Where to look for the claim, by category: the page that would actually carry it for this kind of protocol. */
function claimFor(p: SnapshotProtocol): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  let page: string;
  if (c.includes('yield') || c.includes('curator') || c.includes('allocator') || c.includes('vault')) page = `the ${name} vault's own points or rewards page`;
  else if (c.includes('dex') || c.includes('leveraged farm')) page = `${name}'s own pool incentives or points page`;
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
  else if (c.includes('payments')) page = `${name}'s own routing rewards page`;
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
  if (c.includes('dex') || c.includes('leveraged farm')) return `${head}remove the liquidity from ${name}${tail}`;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `${head}repay the borrow, withdraw the collateral from ${name}${tail}`;
  if (c.includes('perpetual') || c.includes('derivative')) return `${head}close any open trade, withdraw the margin from ${name}${tail}`;
  if (c.includes('prediction')) return `${head}close any open position on ${name}${tail}`;
  if (c.includes('stable')) return `${head}redeem the stable asset from ${name}${tail}`;
  if (c.includes('rwa')) return `${head}redeem the yield-bearing asset from ${name}${tail}`;
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
 * and age), never from a hand-written list of names. Step 1 names the gas
 * token of the protocol's own first chain and the protocol itself, and step
 * 4 names the protocol too, so no step is the same string on two rows: steps
 * 1 and 4 used to read identically for every protocol on the same chain
 * (one step-1 string covered 55 rows), which made the plan look templated
 * even where the action differed. The gas token is the chain's own, checked
 * against its documentation, never guessed: 33 of the 34 rows whose first
 * chain was not in the map now name a verified token, and the one chain
 * that charges no gas at all (Proton) says so instead of naming a token
 * that does not exist, and its cost lines say the same, so no step prices
 * gas that does not exist. One chain stays on the generic wording because no
 * public record settles its gas token: BSquared, where B2 pays gas on the hub
 * and BTC on the rollup, and the sources disagree on which a farmer needs.
 * Step 3 keeps one wallet per
 * protocol: airdrop filters punish wallets that farm dozens of protocols
 * from one address, so the farm wallet for this protocol is used for this
 * protocol alone. Steps 2, 3, 5, 6 and 7 are shaped by the category: the
 * action itself, the weekly action, the number worth logging, the page that
 * would carry a claim and the way the position unwinds all differ between a
 * lender, a pool and a vault, so no two categories farm the same way. Every
 * category on the board has its own shape for each of those steps.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const action = actionFor(p, capital, chain);
  const gas = gasTokenFor(chain);
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
      cost: noGas ? `$${capital} of capital, and no gas fee` : `$${capital} of capital and about $${capital >= 250 ? 8 : 4} of gas`,
      time: '15 minutes to set up',
    },
    {
      text: `Use this wallet for ${p.name} alone, and ${weeklyActionFor(p).charAt(0).toLowerCase()}${weeklyActionFor(p).slice(1)}`,
      cost: noGas ? 'nothing: transactions carry no gas fee' : 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the ${p.name} position for at least ${hold} days so the activity is counted in more than one snapshot.${others}`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: trackFor(p),
      cost: 'nothing but the log',
      time: '5 minutes a week',
    },
    {
      text: claimFor(p),
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes',
    },
    {
      text: exitFor(p),
      cost: noGas ? 'nothing: transactions carry no gas fee' : 'about $3 of gas to claim',
      time: '15 minutes to claim',
    },
  ];
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
    multiple: p.mcap_usd !== null && p.tvl_usd > 0 ? Math.round((p.mcap_usd / p.tvl_usd) * 1000) / 1000 : null,
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
    category_multiple: row.model.category_multiple,
    comparable_peers: row.model.comparable_peers,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    breadth_multiplier: row.model.breadth_multiplier,
    quality_multiplier: row.model.quality_multiplier,
    farm_steps: row.farm_steps,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const multiples = categoryMultiples(snapshot, model);
  const early = board.filter((r) => !r.watchlist).length;
  const total = board.reduce((sum, r) => sum + r.implied_value_usd, 0);
  const sortedImplied = board.map((r) => r.implied_value_usd).sort((a, b) => a - b);
  const medianImplied = median(sortedImplied) ?? 0;
  const multiplesObj: Record<string, number> = {};
  const peersObj: Record<string, number> = {};
  const rawObj: Record<string, number> = {};
  for (const [key, value] of [...multiples.byCategory.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    multiplesObj[key] = value.multiple;
    peersObj[key] = value.peers;
    rawObj[key] = value.raw;
  }
  // Categories on the board with no live peer are priced at the market
  // median: list them too, so the comparables table names every multiple
  // the board uses, not only the ones with peers behind them.
  for (const row of board) {
    const key = row.category ?? 'Other';
    if (!(key in multiplesObj)) {
      multiplesObj[key] = multiples.market;
      peersObj[key] = 0;
      rawObj[key] = multiples.market;
    }
  }
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
    multiples: multiplesObj,
    peers: peersObj,
    raw_multiples: rawObj,
    market_multiple: multiples.market,
    rows: board.map(radarRow),
    live,
    peer_samples: liveSamples(snapshot),
    excluded: excludedBreakdown(snapshot, board),
    live_total: snapshot.protocols.filter((p) => !isPreToken(p)).length,
    live_priced: snapshot.protocols.filter((p) => !isPreToken(p) && !isExcludedCategory(p) && p.mcap_usd !== null && p.mcap_usd > 0 && p.tvl_usd > 0).length,
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
