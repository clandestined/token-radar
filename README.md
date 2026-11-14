# Token Radar

The best token launch radar: it reads a sealed snapshot of every protocol
DefiLlama tracks, finds the ones that record no token and are not a wrapped,
staked or bridged product of one that trades, ranks them by what their launch
would be worth, and hands in a web dashboard with the board, a detail view
for every protocol, filters, and a farm plan for each row.

## The model (radar-14)

Radar-14 keeps radar-13's formula and every implied value, and fixes the
gas-token map radar-13 got wrong in one place and left vague in three.
Fluent's gas token is ETH, not BLEND: Fluent is an Ethereum zk-rollup and
BLEND is for staking, governance and incentives, never for gas, so the Vena
Finance plan told its farmer to fund a wallet with a token that cannot pay
for a transaction. Three chains radar-13 left on the generic wording now
name a token the record settles: Pharos's is PROS (its Pacific Mainnet went
live on 28 April 2026, chain ID 1672, with gas paid in PROS; PHRS is the
testnet token only), Strato's is USDST today (its own tokenomics docs: every
transaction pays 0.01 USDST, and paying gas in STRATO is the planned design,
not the live one), and Qubic's is QUBIC as energy (plain transfers are
feeless, but smart-contract execution burns QUBIC, so a farm's contract
calls still need it). One chain stays generic: BSquared, where B2 pays gas
on the hub and BTC on the rollup and the sources disagree on which a farmer
needs. So 33 of the 34 rows name a real token, Tempo names a USD stablecoin,
and Proton says transactions carry no gas fee. The board is unchanged: same
195 rows, same ranks, same implied values; only the farm-plan wording moves,
on 4 rows, and the screenshots are retaken for the radar-14 label.

## The model (radar-13)

Radar-13 keeps radar-12's formula and every implied value, and fixes two
things a reader could catch it on. First, the farm plans: 34 rows opened
their wallet step with a placeholder, "fund it with X's native gas token",
because their first chain was not in the gas-token map, and two of those
placeholders were wrong, not vague: Tempo has no native gas token at all
(fees are paid in any supported USD stablecoin) and Proton charges no gas
fee at all. The map now names a token the chain's own documentation
verifies for 21 more chains (Arc's USDC, Plasma's XPL, Stable's USDT0,
Provenance's HASH, Noble's USDC, ETH on Manta Pacific, Reya, Morph, RISE
and Robinhood Chain, BTC on Mezo, XION, RBTC on RSK, KAVA, CC on Canton,
BFC on Bifrost Network, BLEND on Fluent, STX on Stacks, PLUME on Plume
Mainnet, and KAIA on Klaytn, KLAY having migrated to KAIA at the Kaia
merger), so 30 of the 34 rows name a real token, Tempo names a USD
stablecoin, and Proton says transactions carry no gas fee. Four chains
stay on the generic wording because no public record settles their gas
token: BSquared (B2 on its hub, BTC on its rollup), Pharos (PHRS on its
testnet, its mainnet token unclear), Strato and Qubic. Second, the page
took any hash at face value: a link with an unknown category, chain, tab
or protocol opened an empty board, or the wrong tab, while the controls
said "All categories". The hash is now read against the values the board
knows, and a value it does not know is ignored, so a stale or typed link
opens the board instead of an empty one. The board is unchanged: same 195
rows, same ranks, same implied values; only the farm-plan wording moves,
on 30 rows, and the screenshots are retaken for the radar-13 label.

## The model (radar-12)

Radar-12 keeps radar-11's formula and every implied value, and fixes two
things a reader could catch it on. First, the screenshots still showed the
radar-10 build: they were last retaken in radar-10, so all three said
"radar-10 model" while the page renders radar-11. They are retaken here,
so the screenshots and the code agree on the version. Second, the page's
own heading and lede overstated the watchlist: the heading said the board
ranks 40 watchlist protocols, and the lede said the watchlist is every
protocol with at least $50M of TVL that records no token, but the board
itself shows 18 rankable protocols above the floor the list leaves out,
Sentora Curator at $2.76B the largest, because the house's rule also
leaves out a product of a protocol whose token already trades, which the
snapshot does not name. The heading now names the 195 rows the board
ranks, and the lede names the list as the house's list and counts the
protocols above the floor it leaves out, from the board itself. The board
is unchanged: same 195 rows, same ranks, same implied values.

Radar-11 keeps radar-10's formula and every implied value, and fixes one
place where the dashboard did not follow the rule radar-10 stated. The
comparables, the live-priced count and the ranking all applied the same
excluded-category rule, but the Live token view and the detail views' peer
samples still used the older exchange-only filter, so the Live view showed
six bridge and liquid-staking tokens (Lido, Mantle Bridge, Polygon Bridge,
Starknet Bridge, Portal and Merlin's Seal) with market-cap-to-TVL ratios
the model refuses to price from, under a caption saying the ratios shown
are the comparables. The Live view now draws from the same population the
comparables are priced from: the 24 biggest live-token protocols by market
cap in the categories the board ranks, all with a market cap above zero,
so every ratio it shows is one of the 90. Six priced rows take the six
places (Astar dApps Staking, Re, sDAI, Hydration DEX, Api3 and Veranta),
and Api3, the Risk Curators peer the detail view names, now appears in the
Live view as well as in the peer sample. The peer samples drop the five
excluded-category keys (Bridge, Canonical Bridge, Cross Chain Bridge,
Liquid Staking, Liquid Restaking) no ranked row could ever use. The board
itself is unchanged: same 195 rows, same ranks, same implied values.

Radar-10 keeps radar-9's formula and changes one thing about what prices it:
the market median no longer counts the 29 bridge, liquid-staking, liquid-restaking
and wrapper protocols whose tokens the board itself refuses to rank. The board
excludes them because they are a token that already trades in another wrapper, and
the comparables already excluded exchange tokens on the same ground, that their
market cap prices the exchange's business rather than the TVL the snapshot records.
A bridge token's market cap prices the bridge's business, not the value locked in
it, and a liquid-staking governance token prices governance over the staked asset,
not the asset itself, so their ratios measure a different object than a lender's or
a DEX's. On this snapshot the 29 sit at a median ratio of 0.3167x against the
market's 0.2460x, nine of them below 0.05x and nine above 1x, so counting them lifted
the market median by about 5%. The comparable population is now the 90 live-token
protocols with a market cap above zero in the categories the board ranks, and the
market median is 0.2343x instead of 0.2460x. The board's total implied value falls
from $5,966,387,481 to $5,786,663,094 (-3.0%); 190 of the 195 rows change value,
101 change rank by at most 4 places, and the top three are unchanged
(Steakhouse Financial $1,101,885,749, Sentora Curator $1,064,066,994, Gauntlet
$661,326,006), so the change is made for consistency, not for a different answer:
the median-population choice moves no rank more than four places. Saturn moves
one place with the rest, from rank 27 to rank 28, and the number is corrected in
the README and the model's comments; the dashboard already names the rank from
the board, never from a written number.

Radar-9 keeps radar-8's formula and every implied value, and fixes two
things a reader could catch it on. First, Saturn's rank: the README and the
model's own comments said rank 29, but the board ranks Saturn 27th, so the
number is corrected in all three places; the dashboard already names the
rank from the board, never from a written number. Second, the detail view
now names the other two bounds the way radar-8 named the multiple's: a row
whose seven-day growth the clamp binds on (5 of the 195, Shift DeFi at
+4448.47% among them) says so on its growth multiplier line and in its
why-sentence, and a row older than the three-year maturity cap (11 of the
195) says so on its maturity multiplier line, so a reader who sees
+4448.47% next to a 1.48x multiplier, or 5.1 years next to a 1.00x maturity
multiplier, is told the bound did it instead of having to work it out from
the formula.

Radar-8 keeps radar-7's formula and every implied value, and fixes two
things a reader could catch it on. First, the farm plans: steps 1 and 4
used to read identically for every protocol on the same chain (one step-1
string covered 55 rows), so the plans looked templated where the action
differed; both steps now name the protocol, so all seven steps are a
different string on all 195 rows. Second, a multiple sitting on the
model's bound now says so in the comparables table, in the detail view's
multiple line and in the why-sentence: Prediction Market's raw 400.20x
peer prices at the 0.80 cap, and Staking Pool's raw 0.002x peer prices at
the 0.05 floor, and neither is left for the reader to infer from the two
numbers side by side. The cap stays the guard for the Prediction Market
case: a $25M peer-TVL floor would throw out 43 of the 90 priced peers
(including the only peer of Risk Curators, Chain, Options and NFT
Marketplace), and winsorizing the raw median would collapse the rich
single-peer categories back to one number, the flaw radar-7 fixed; the
cap bounds the outlier and the raw stays visible.

One function scores every row, from the snapshot's own figures only:

```
multiple = exp((peers x ln(categoryMedian) + 3 x ln(marketMedian)) / (peers + 3)),
  clamped to [0.05, 0.80]; categoryMedian is the median market-cap-to-TVL
  ratio of the live-token protocols in the same category, marketMedian the
  median over the live-token protocols in the categories the board ranks
implied = round( tvl_usd x multiple
  x (1 + clamp(change_7d, -40, 80) / 100 x 0.6)
  x (0.70 + min(age_days, 1095) / 1095 x 0.30)
  x (1 + 0.02 x min(chains - 1, 4))
  x quality )
```

The comparable is shrunk toward the market median in log space with a
weight of 3 peers: ratios multiply, so the shrinkage averages logarithms and
the raw median is never clamped before shrinking. The old arithmetic shrink
clamped the raw median to [0.05, 0.80] first, which erased every difference
between rich single-peer categories: Chain (3.03x), Collateral Management
(12.16x), Decentralized AI (2.06x), NFT Marketplace (2.00x), Options
(1.51x), Prediction Market (400.20x) and Risk Curators (2.97x) all priced at
one identical 0.3845x, 40 board rows on a single number. In log space they
price at 0.4442x, 0.6289x, 0.4035x, 0.4006x, 0.3736x, the 0.80 cap and
0.4423x: each from its own peer, still pulled most of the way to the market
by the 3-peer weight, and still capped. The same clamp erased the cheap end
too: a category whose peers trade at 0.002x was lifted to 0.1676x by the
floor before shrinking, so Staking Pool (SSV at 0.00x on $10.2B of TVL)
priced as if it were a mid-market category; in log space it prices at the
0.05 floor. A single peer still never sets its own price: Risk Curators'
2.97x peer pulls the multiple to 0.4423x, not to 2.97x, and an extreme peer
still lands at the cap, which is the model's bound. On this snapshot the
Risk Curators median comes from a single live peer (Api3, at 2.98x mcap/TVL),
so without shrinkage all 34 Risk Curator rows would price at the 0.80 cap;
shrunk in log space, they price at 0.4423x. The multiple is rounded to four decimals before
it is used, so the dashboard's recompute of a row matches board.json exactly.
Age is days since first listing, the record of how long a protocol has run
with no token. `quality` is 0.97 when seven-day growth is unreported and 1.00
otherwise: a protocol whose growth the snapshot does not carry is valued as
flat but discounted a little for the missing evidence, so an unknown-growth
row never outranks a known-flat one at the same size and age. On this
snapshot, 2 of the 195 rows carry the 0.97 quality discount. No protocol name
is special-cased.

The board holds 195 rows on this snapshot: all 40 watchlist protocols plus
every other rankable pre-token protocol the watchlist leaves out, whatever
its size. The floor is the watchlist's floor, never a rankability ceiling: a
$2.8B protocol the list leaves out (Sentora Curator, rank 2) is no worse a
subject than a $49M one it names. The 147 pre-token protocols the board does
not rank are counted by exclusion on the dashboard (52 exchanges, 39 bridges,
38 liquid staking / restaking products, 11 versioned pools, 6 wrapped / staked
names, 1 stablecoin wrapper), so the reader can see what was set aside and
why. One watchlist protocol is ranked although the early-radar wrapper rule
would leave it out: Saturn, a Stablecoin Wrapper, sits at rank 28, because a
watchlist slug is always ranked. The Live token view shows the 24 biggest
live-token protocols by market cap in the categories the board ranks, of 416 that record a token; the
comparables are priced from the 90 of those with a market cap above zero —
the same population, exchange, bridge, liquid-staking, liquid-restaking and
wrapper tokens left out of both. The
shrinkage is evidence-driven, not a guessed weight: 32 of the 41 categories
priced have fewer than three live peers, so most multiples would rest on
one or two protocols without it. Live-token protocols are set aside and
shown with their market caps. Farm plans are seven steps each, derived from
the protocol's category, chains, TVL and age, with a cost and a time on every
step, one wallet per protocol so the farm does not look like a Sybil cluster.
The wallet step names the gas token of the protocol's own first chain,
checked against the chain's own documentation, never guessed: 33 of the 34
rows whose first chain was not a household name now name a verified token,
Tempo names a USD stablecoin because it has no native gas token, and Proton
says transactions carry no gas fee because it charges none. One chain stays
on the generic wording because no public record settles its gas token
(BSquared: B2 pays gas on its hub, BTC on its rollup, and the sources
disagree on which a farmer needs). The weekly action, the number worth
logging, the page that would carry a
claim and the way the position unwinds are all shaped by the category, so a
lender, a pool and a vault do not farm the same way. Every one of the 32
categories on the board has its own shape for each of those steps, so all
seven steps are distinct on all 195 rows: no step falls back to a generic
line. Exchange tokens are left out of the comparables and out of the detail
views' peer samples, and a protocol with a $0 market cap never appears as a
peer: the comparables are priced from live-token DeFi protocols with a
market cap above zero, the same 90 the dashboard counts. Every detail view also
says, in one sentence, why that row sits where it does: size, momentum,
seasoning, category and the quality of the evidence behind it. The Live token
view answers the same search, category, chain and TVL filters as the board,
and rows with unreported growth or age sort at the values the model scores
them at (flat, and 365 days), never as the oldest or the fastest.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts --input <snapshot.json>
```

Node 22 or later, standard library only. It writes `out/board.json`,
`out/data.js`, `out/dashboard/`, `out/screenshots/` and `out/dossier.json`.
The dashboard is static and renders with no network: open
`out/dashboard/index.html` in a browser.

## Repo layout

- `main.ts` — the entry program
- `lib/model.ts` — the scoring model, the farm plans, the board builder
- `vendor/makefun-board.ts` — the kit's dossier library, as shipped
- `dashboard/` — `index.html`, `app.css`, `app.js`
- `screenshots/` — board, detail view, filtered view

Implied values are this entry's own claim, never make.fun's. "Records no
token" means the snapshot carries no token for a protocol, not that it has
none, and nothing here predicts whether or when a token is issued.
