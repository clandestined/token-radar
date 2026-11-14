# Token Radar

The best token launch radar: it reads a sealed snapshot of every protocol
DefiLlama tracks, finds the ones that record no token and are not a wrapped,
staked or bridged product of one that trades, ranks them by what their launch
would be worth, and hands in a web dashboard with the board, a detail view
for every protocol, filters, and a farm plan for each row.

## The model (radar-4)

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
so without shrinkage all 33 Risk Curator rows would price at the 0.80 cap;
shrunk, they price at 0.36x. The multiple is rounded to four decimals before
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
subject than a $49M one it names. Live-token protocols are set aside and
shown with their market caps. Farm plans are seven steps each, derived from
the protocol's category, chains, TVL and age, with a cost and a time on every
step, one wallet per protocol so the farm does not look like a Sybil cluster,
and the weekly action and the number worth logging shaped by the category, so
a lender, a pool and a vault do not farm the same way. Every detail view also
says, in one sentence, why that row sits where it does: size, momentum,
seasoning, category and the quality of the evidence behind it.

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
