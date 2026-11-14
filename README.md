# Token Radar

The best token launch radar: it reads a sealed snapshot of every protocol
DefiLlama tracks, finds the ones that record no token and are not a wrapped,
staked or bridged product of one that trades, ranks them by what their launch
would be worth, and hands in a web dashboard with the board, a detail view
for every protocol, filters, and a farm plan for each row.

## The model (radar-6)

One function scores every row, from the snapshot's own figures only:

```
multiple = (peers x categoryMedian + 3 x marketMedian) / (peers + 3),
  clamped to [0.05, 0.80]; categoryMedian is the median market-cap-to-TVL
  ratio of the live-token protocols in the same category, marketMedian the
  whole market's median
implied = round( tvl_usd x multiple
  x (1 + clamp(change_7d, -40, 80) / 100 x 0.6)
  x (0.70 + min(age_days, 1095) / 1095 x 0.30)
  x (1 + 0.02 x min(chains - 1, 4))
  x quality )
```

The comparable is shrunk toward the market median with a weight of 3 peers:
a category with one live peer never sets its own price. On this snapshot the
Risk Curators median comes from a single live peer (Api3, at 2.98x mcap/TVL),
so without shrinkage all 34 Risk Curator rows would price at the 0.80 cap;
shrunk, they price at 0.3845x. The multiple is rounded to four decimals before
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
would leave it out: Saturn, a Stablecoin Wrapper, sits at rank 29, because a
watchlist slug is always ranked. The Live token view shows the 24 biggest
live-token protocols by market cap, of 416 that record a token; the
comparables are priced from the 119 of those with a market cap above zero,
exchange tokens left out. The
shrinkage is evidence-driven, not a guessed weight: 33 of the 46 categories
priced have fewer than three live peers, so most multiples would rest on
one or two protocols without it. Live-token protocols are set aside and
shown with their market caps. Farm plans are seven steps each, derived from
the protocol's category, chains, TVL and age, with a cost and a time on every
step, one wallet per protocol so the farm does not look like a Sybil cluster.
The wallet step names the gas token of the protocol's own first chain, and
the weekly action, the number worth logging, the page that would carry a
claim and the way the position unwinds are all shaped by the category, so a
lender, a pool and a vault do not farm the same way. Every one of the 32
categories on the board has its own shape for each of those steps, so all
seven steps are distinct on all 195 rows: no step falls back to a generic
line. Exchange tokens are left out of the comparables and out of the detail
views' peer samples, and a protocol with a $0 market cap never appears as a
peer: the comparables are priced from live-token DeFi protocols with a
market cap above zero, the same 119 the dashboard counts. Every detail view also
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
