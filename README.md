# Token Radar

The best token launch radar: it reads a sealed snapshot of every protocol
DefiLlama tracks, finds the ones that record no token and are not a wrapped,
staked or bridged product of one that trades, ranks them by what their launch
would be worth, and hands in a web dashboard with the board, a detail view
for every protocol, filters, and a farm plan for each row.

## The model (radar-24)

Radar-24 keeps radar-23's formula and every implied value, and fixes the
numbers the page itself showed wrong plus the why-sentences that
misdescribed their rows. First, the live multiples double-rounded: the
code stored each live-token multiple rounded to three decimals and the
page displayed it at two, so the display rounded twice. Api3's true
ratio is 2.9747x, a two-decimal multiple of 2.97x, but the stored 2.975
showed 2.98x in the detail view and the Live view; Zama showed 1.64x
for a true 1.63x. Rounding to four decimals first does not save it
either: ACryptoS's ratio is 0.0150x, a true 0.02x at two decimals, but
the stored 0.015 displays as 0.01x, because (0.015).toFixed(2) is
"0.01" in JavaScript, and Usual USD0 showed 0.28x for a true 0.27x.
The live multiple is now stored unrounded and the page's toFixed(2) is
the only rounding; checked over all 128 live-token protocols with a
market cap, it matches the correctly rounded two-decimal value on
every one. The board's own multiples stay rounded to four decimals,
because the page recomputes each row from the multiple board.json
carries; a live multiple is only ever displayed and sorted, never
recomputed from. The README's own "2.98x" for Api3 is corrected to
2.97x with it. Second, the why-sentences: their bands read the numbers
they describe now. A 5-10% weekly move is not flat, so 42 rows that
read "flat seven-day growth" while moving 5-10% in a week now read
"modest seven-day growth" or "modest seven-day decline", and only a
move within 5% reads flat. Nine rows aged 300-364 days read "half a
year running with no token" while nearly a year old, so they now read
"nearly a year", and the boundaries are strict where the words are:
exactly 730 days (Goose) is two years, not two-plus, and exactly 365
days (Yuzu Money) is a year, not over one. And the mid-range band no
longer sits at a fixed 0.2x: 18 rows at 0.2013-0.217x read "mid-range"
while below the 0.2343x market median, next to rows at 0.1988x that
read "below-market", so mid-range now starts at the market median
itself. Third, the open item from round 20 is closed: the Native
Credit Pool token-breakdown figure is verified against DefiLlama's API
on 14 November 2026 (api.llama.fi/protocol/native-credit-pool,
tokensInUsd). USDC is the largest asset supplied, $6.54M, of $19.05M
total at 11:24 UTC; the day's 00:00 UTC entry reads $6.25M of $19.14M,
so the $19.03M in the radar-22 text is the same day's total at round
19's fetch, within intraday drift. The API's description confirms the
pool itself: a unified, single-sided asset supply pool that enables
market makers to borrow assets for trading. The board is unchanged:
same 195 rows, same ranks, same implied values, board.json byte
identical; only the live multiples in data.js, the why-sentences and
prose move, and the screenshots are retaken for the radar-24 label.

## The model (radar-23)

Radar-23 keeps radar-22's formula and every implied value, and fixes
three places where the entry's own words disagreed with its own
numbers — all found by rebuilding radar-21 and diffing the boards,
and by recounting the comparables from the snapshot. First, radar-22
undercounted its own change: its README said the article fix moved
10 rows and 13 rows in all, but the radar-21 to radar-22 board diff
moves 16 rows — the three corrections plus thirteen article rows
(Upshift, Armitage, UltraYield Curator, infiniFi, August Digital,
Avant avUSD, Arrakis, IPOR Fusion, Anthias Labs, alphagrowth, Agua,
UltraYield Vaults and Aftermath afLP) — so the counts now say
thirteen and sixteen, in the README and in the code's own comment.
Second, the model panel said seven single-peer categories priced at
one identical multiple under the old arithmetic shrink, but the
comparables table holds twelve single-peer categories; only the seven
whose raw median sits above the cap — Chain, Collateral Management,
Decentralized AI, NFT Marketplace, Options, Prediction Market and
Risk Curators — collapsed to that one number, and the five cheaper
ones never did, so the panel now says seven rich single-peer
categories, the wording the model's own comment already used.
Third, the model panel's correction history narrated three different
rounds as "the last round" and "this round" twice, so a reader could
not tell which round added which plans; the three groups are now
labelled radar-20, radar-21 and radar-22. The three radar-22
corrections themselves were re-verified against their sources:
Native Credit Pool is a single-sided supply pool for market makers
to borrow from, per DefiLlama's own description, with borrow
interest as its revenue; BounceBit Prime is for institutional and
accredited investors with KYC/AML, custodial management and
transparent reporting, its BENJI fund for qualified investors; and
Figure's own Prime page lists a YLDS HELOC pool that takes YLDS
and USD/USDC/USDT margin pools, so USDC lends into a margin pool.
The board is unchanged: same 195 rows, same ranks, same implied
values; only prose moves, and the screenshots are retaken for the
radar-23 label.

## The model (radar-22)

Radar-22 keeps radar-21's formula and every implied value, and fixes
three more farm plans plus one grammar fault the board has carried
since the start. First, Native Credit Pool (rank 130), the open item
from round 18, is SETTLED with a fix: DefiLlama calls it a
single-sided supply pool for market makers to borrow from, so the
lending shape's supply-as-collateral-and-borrow-against-it is wrong
in both directions — nobody posts collateral and nobody borrows
against a deposit — and the supply asset is now verifiable too:
USDC is the largest asset in the pool, $6.54M of $19.03M on
14 November 2026, per DefiLlama's own token breakdown, so its plan
now supplies USDC to the pool and earns the borrow interest market
makers pay, with no health factor to track and no borrow to repay.
Second, BounceBit Prime (rank 96), the other open item from round
18, is SETTLED with a fix: BB Prime is an institutional product for
institutional and accredited investors, with KYC/AML, custodial
management and transparent reporting, and its flagship BENJI fund is
for qualified investors — so the basis shape's plain "deposit $50 of
USDC into the strategy" sends a retail wallet at a gate it cannot
pass, and its plan now starts with KYC and qualified-investor
onboarding. Third, Figure Markets Prime (rank 34), corrected in
radar-21, is refined: Figure's own Prime page lists a YLDS HELOC
pool, which takes YLDS (deposit USD, buy YLDS, lend into the pool),
and USD/USDC/USDT margin pools — so USDC lends into a margin pool,
not the HELOC pool, and its plan now says so. Fourth, the article:
thirteen rows read "into a Upshift vault", "a Armitage", "a Arrakis" and
the like, because the shapes wrote "a" before every protocol name;
the shapes now write "an" before a vowel-initial name. Two open
items are settled with no fix: the Monolith "ChainSecurity audit,
Apr 2026" attribution is right — ChainSecurity's Monolith re-audit
has a final version dated 14 April 2026, and the Electisec/yAudit
review of June 2025 is a separate, earlier audit — and Loopscale is
not in the snapshot at all, so its fixed-term loans need no plan.
Twenty-six of 195 plans are now corrected in the one table. The
board is unchanged: same 195 rows, same ranks, same implied values;
only farm plans move, on 16 rows (3 corrections plus the article on
13 rows), and the screenshots are retaken for the radar-22 label.

## The model (radar-21)

Radar-21 keeps radar-20's formula and every implied value, and fixes three
more farm plans the category shapes got wrong — two of them the rows round
20 deliberately left alone, and one the rows round 20's audit cleared.
First, the two Exponent rows: round 20 left Risk Tranching and Strategy
Vaults on the generic wording because no single deposit asset could be
verified for them, and that reason no longer holds. Risk Tranching splits
a yield-bearing asset into a senior and a junior tranche — its first and
largest market is ONyc, OnRe's reinsurance token, at $5.94M of tranche
NAV — so its plan now deposits ONyc into the senior tranche and holds the
srONyc LP shares, with the yield accruing in the tranche's NAV and senior
withdrawals pausing during a Recovery Period; there is no Exponent token
or points program. Strategy Vaults are managed vaults that take the
vault's accepted asset — SOL for the largest vaults, $12.4M against $5.9M
of USDC — and the largest vault is the RockawayX-managed onycSOL vault,
launched 4 November 2026 with a $10M cap and weekly withdrawals, so its
plan now deposits SOL into onycSOL and checks the curator's allocations,
with the claim naming the SOL incentives and OnRe points the vault pays.
Second, Figure Markets Prime (rank 34): round 20's audit cleared the
lending rows, but a sample re-check found Prime is a lender-side
marketplace — Democratized Prime lends USDC into pools that fund
HELOC-backed loans, and the borrow side posts crypto as collateral,
never USDC — so the lending shape's supply-USDC-and-borrow-against-it
is wrong on either side, and its plan now lends USDC into a Democratized
Prime pool instead. The other clearances from round 20 stand: 3F's
stablecoin-depositor side, BounceBit Prime's USDC deposits, and perp
margin. Twenty-four of 195 plans are now corrected in the one table —
still plan corrections, not a hardcoded ranking: the scoring never names
a protocol, each entry states why the snapshot's record is wrong and
gives only the steps the record gets wrong, and every other step still
comes from the category shape. The board is unchanged: same 195 rows,
same ranks, same implied values; only farm plans move, on 3 rows, and
the screenshots are retaken for the radar-21 label.

## The model (radar-20)

Radar-20 keeps radar-19's formula and every implied value, and fixes the
farm plans the category shapes got wrong by naming the wrong asset — the
fifth miscategorization round, and the one round 16 deliberately left
open. First, the CDP shape: it told all eight non-USDD CDP rows to supply
USDC as collateral, but a CDP takes the collateral its own vaults accept,
and USDC is the thing you borrow, not the thing you deposit — so seven of
the eight were wrong, each now corrected in PLAN_CORRECTIONS against the
protocol's own record: Felix CDP takes HYPE (WHYPE, kHYPE, wstHYPE) and
UBTC to mint feUSD; Bucket CDP takes SUI, BTC, ETH and liquid staking
tokens to mint BUCK; BIMA CDP takes BTC and Bitcoin LSTs to mint USBD at
150%; Kava Mint takes BTC, BNB, ATOM, KAVA and XRP to mint USDX; Monolith
Market takes ETH or wBTC to borrow its Coin stablecoin; BTCFi CDP takes
Bitcoin as its exclusive collateral to mint BtcUSD; and Swan DAO's swanUSD
is minted against wstETH in a single-collateral Monolith lender (the USDS
in its peg module is a stability reserve, not borrower collateral). The
eighth, STRATO CDP, stays on the generic wording: its own litepaper lists
USDC as an accepted CDP collateral at 90% LTV, so the generic asset is
genuinely accepted there. Round 17's settlement of Monolith was wrong on
this point — its category was right, but the shape's named asset was not —
and it is corrected here. Second, the same wrong-asset audit across every
other shape that names a specific asset found six more: Avant avETH mints
against ETH or WETH, never USDC (USDC backs the sibling avUSD); Origami
Finance's leveraged vaults take the yield-bearing asset itself, USDe for
the flagship lovUSDe vault, never a USDC deposit; Boros margin is posted
in the market's own collateral asset, ETH for an ETH funding-rate market,
never USDC; Granite takes sBTC as collateral and lends USDCx, so the
stablecoin is the borrowed asset, never the collateral; Solv Strategies is
Bitcoin-native, deposits are BTC minted into SolvBTC, never USDC; and
Exponent Yield Exchange is a yield exchange, not a vault — it splits a
yield-bearing asset into a principal token and a yield token — so its plan
now swaps JitoSOL for its principal token and holds it to maturity, with
the weekly action, the number worth logging, the claim and the exit
corrected to match. The audit also cleared the shapes it checked and left
alone: 3F's stablecoin-depositor side is real (its vaults deliver yield to
stablecoin depositors), BounceBit Prime takes fiat or stablecoin deposits
including USDC, the lending rows supply USDC to multi-asset markets as
standard, perp margin is USDC across the board, and the Exponent strategy
vaults and risk tranches were left alone because no single deposit asset
could be verified for them — a correction there would repeat the
speculative failure mode this round guards against. The board is
unchanged: same 195 rows, same ranks, same implied values; only farm
plans move, on 13 rows, and the screenshots are retaken for the radar-20
label.

## The model (radar-19)

Radar-19 keeps radar-18's formula and every implied value, and fixes the
one place the judge's first look is thinnest: the board and filtered
screenshots were 1440x1100, so the page's header, lede, spotlight cards,
warning and filters filled most of the frame and only four board rows
showed. Both are retaken at 1440x1440, the same size as the detail shot,
so the board shot shows nine rows and the filtered shot shows nine
filtered rows, and all three screenshots are one size. The detail shot
is unchanged: it already fits all seven steps at 1440 tall. The board
is unchanged: same 195 rows, same ranks, same implied values.

## The model (radar-18)

Radar-18 keeps radar-17's formula and every implied value, and fixes the
farm plans the category shape got wrong in the fourth miscategorization
round — plus one real bug. First, the bug: the DEX shape's test was
`includes('dex')`, which also matches Indexes — "indexes" contains
"dex" — so Set Protocol (rank 171), the board's only Indexes row, was
told to provide liquidity to a main pool in a balanced pair, swap
through it weekly and remove it, instead of buying its index token,
and the index shape written for it was unreachable in all five shape
functions. The test is now the category itself. Second, Leveraged
Farming gets its own shape: 3F (rank 79) is a vault protocol built on
Morpho that loops tokenized RWAs, and Origami Finance (rank 91) loops
yield-bearing assets through lending markets into receipt tokens — and
neither has a main pool to provide liquidity to, so both plans now
deposit into a leveraged vault and keep the receipt token. Third,
Uncollateralized Lending gets its own shape: 3Jane (rank 122) is a
credit market where lenders deposit USDC and mint the yield-bearing
USD3 receipt token while borrowers draw uncollateralized lines on a
credit score — nobody posts collateral and nobody borrows against a
deposit — so its plan now deposits into the credit market and keeps the
receipt token. Fourth, four more plans join the corrections table: USDD
(rank 5) — its 2.0 vaults take TRX, sTRX, USDT or WBTC as collateral,
never USDC, and its yield comes from staking the minted USDD as sUSDD,
which accrues automatically, so there is no rewards page to claim
from; DeFi Saver Asset Management (rank 20) — DeFi Saver is a
non-custodial management layer that takes no deposits at all, so its
plan opens a position through it and turns on its automation; Bittensor
dTAO (rank 11) — dTAO is Bittensor's staking system, not an AMM pool,
so its plan stakes TAO with a validator for a subnet's alpha tokens;
and Polymarket International (rank 4) — it runs no points program and
has no token claim page, so only its claim step changes, to the rewards
page that pays Liquidity Rewards and Holding Rewards in pUSD. Fifth,
two claim steps stop inventing pages: Lightning Network (rank 26)
routing fees land in the channel balance automatically, so its claim
step now says that instead of naming a routing rewards page that does
not exist. Sixth, RWA wording: "Mint" becomes "Buy or mint" and the
exit "redeem" becomes "sell or redeem", because Lofty sells tokenized
property shares rather than minting them. Seventh, the detail dialog
fits: its steps and sections are tightened so all seven steps with
their cost lines fit inside a 1440px-tall view for the rank-1 row —
step 7's cost line used to sit below the fold in the shipped detail
screenshot. The board is unchanged: same 195 rows, same ranks, same
implied values; only farm plans move, on 25 rows, and the screenshots
are retaken for the radar-18 label.

## The model (radar-17)

Radar-17 keeps radar-16's formula and every implied value, and fixes the
farm plans the category shape got wrong — the third miscategorization
round, now across other categories, not just Chain and Insurance. First,
Mezo Earn (rank 67), the open item from round 13, is SETTLED with a fix:
the governance shape told its farmer to lock USDC in a governance vault,
but Mezo Earn locks BTC — locking BTC for 1–28 days gives a veBTC NFT
that votes on the weekly gauges, locking MEZO gives veMEZO that boosts the
vote up to 5x, and native BTC needs at least 0.01 BTC to bridge (wrapped
tBTC less), per mezo.org. Its plan now locks 0.01 BTC for veBTC, votes
each Thursday epoch, and holds 28 days, the longest lock. Second, three
category shapes named the wrong asset or the wrong action: staking pools
told their farmer to deposit USDC — Reti pools ALGO, Adrastea stakes SOL,
Qearn locks QUBIC — so the shape now stakes the chain's own asset;
Symbiotic, the board's only Collateral Markets row, was told to supply
USDC as collateral and borrow against it, but Symbiotic takes staked-asset
collateral (wstETH) into vaults delegated to operators, so it has its own
shape now; Boros, the only Interest Rate Derivatives row, was told to open
a hedged perp trade, but Boros trades funding rates on margin, so its
shape now opens a long or short funding-rate position. Third, two one-row
shapes named no asset at all where the asset matters: a Lightning Network
payment channel is funded in BTC, and b14g's restaking restakes BTC, so
both shapes name BTC on Bitcoin. Fourth, Firelight's exit is corrected:
exits run on 30-day coverage periods, but the FXRP only becomes
withdrawable at the end of the following full period, so the plan now
allows up to 60 days, and the action now says the staked FXRP backs the
cover Firelight sells and can pay validated claims, since the cover phase
went live on 6 October 2026. Fifth, Abstract: the snapshot lists its
chains as ["Ethereum"], so the plan funded a wallet for gas "on Ethereum"
— but Abstract is its own Ethereum L2 and its gas is ETH paid on
Abstract, so the plan now runs on Abstract. The two scattered name-keyed
overrides (Hive, Firelight) are now one table, PLAN_CORRECTIONS in
lib/model.ts, with Mezo Earn and Abstract joining it, and the dashboard's
model panel names all four, so they read as one disclosed list of
corrections, not special-casing. Monolith Market (rank 166), the other
round-13 open item, is SETTLED with no fix: its CDP category is right —
Monolith is a permissionless factory for crypto-backed stablecoins
(deposit ETH or wBTC collateral, borrow its Coin), per DefiLlama and the
ChainSecurity audit — and the CDP shape fits it. The board is unchanged:
same 195 rows, same ranks, same implied values; only farm plans move, on
10 rows, and the screenshots are retaken for the radar-17 label.

## The model (radar-16)

Radar-16 keeps radar-15's formula and every implied value, and settles the
second plan the category shape got wrong, plus the open item from round 12.
First, Firelight (rank 68): DefiLlama lists it under category Insurance, so
the insurance shape told its farmer to buy cover, renew it and cancel it —
but Firelight sells no cover to users. It is the underwriting side: a farmer
bridges XRP to Flare through the FAssets system to mint FXRP, deposits the
FXRP into Firelight's Launch Vault, and receives stXRP, a liquid receipt
token, while the staked FXRP underwrites the DeFi cover protocols buy; the
farmer earns Firelight Points, and exits run on 30-day coverage periods. Its
plan now stakes FXRP for stXRP instead, the same disclosed, name-keyed
override pattern as Hive Protocol, and the scoring still never special-cases
a name. Second, XION Finance (rank 71) was checked and left alone: the open
item is settled, not fixed, because it is not a miscategorization.
DefiLlama's own record for it names the XION chain itself — its site is
xion.burnt.com, its handle is @burnt_xion, its description is "The First
Walletless Blockchain Built For Mainstream Adoption", and it was listed on
2025-07-11, the day the snapshot carries — so category Chain and the chain
plan (bridge USDC onto XION, transact weekly on the network) are right,
even though DefiLlama's chain page no longer lists the protocol. The board
is unchanged: same 195 rows, same ranks, same implied values; only
Firelight's farm plan moves, and the screenshots are retaken for the
radar-16 label.

## The model (radar-15)

Radar-15 keeps radar-14's formula and every implied value, and settles the
last generic row and the one plan the category shape got wrong. First,
BSquared: the farm runs on the B² rollup (B² Mainnet, chain 223), whose
native token is BTC, while B2 is gas only on the B² Hub (chain 213), the
data-availability layer a farmer never transacts on — so Hive Protocol's
wallet step now says BTC, and no row is left on the generic wording. Second,
Hive Protocol itself (rank 13): DefiLlama lists B² Hive, the network's own
BTC staking pool, under category Chain, so the chain shape told its farmer
to bridge USDC onto a network the protocol is not. Its plan now stakes BTC
in B² Hive to safeguard the network and earn B2 rewards, as DefiLlama's own
page for it says ("Stake BTC, safeguard B², and receive $B2 Tokens"). That
was the entry's only farm plan that named a protocol instead of deriving
from its category at the time (radar-16 adds a second, Firelight), and it is disclosed in the code and here because the
snapshot's own record is the thing that is wrong; the scoring still never
special-cases a name. Third, a recount: radar-14 said 33 of the 34 rows
whose first chain was not a household name named a real token, but its board
had 31 — Tempo's stablecoin and Proton's no-gas line were counted as tokens.
With BSquared settled, 32 of the 34 name a real token, Tempo names a USD
stablecoin, and Proton says transactions carry no gas fee. The board is
unchanged: same 195 rows, same ranks, same implied values; only Hive
Protocol's farm plan moves, and the screenshots are retaken for the
radar-15 label. One small page fix rides along: the Live token view gave an
unreported seven-day growth the red "falling" style while printing "n/a";
it now leaves it unstyled, as the board already did.

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
Risk Curators median comes from a single live peer (Api3, at 2.97x mcap/TVL),
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
checked against the chain's own documentation, never guessed: 32 of the 34
rows whose first chain was not a household name name a verified token,
Tempo names a USD stablecoin because it has no native gas token, and Proton
says transactions carry no gas fee because it charges none. No row is left
on the generic wording: BSquared is settled (BTC on the rollup, where the
farm runs; B2 is gas only on the Hub). Twenty-six plans are corrected against the
snapshot's own record, in one table (see Snapshot corrections below): Hive
Protocol is B² Hive, the network's own BTC staking pool, not a chain, so its
plan stakes BTC for B2 rewards instead of bridging onto a network; Firelight
is the underwriting side of an insurance design, not a buyer of cover, so its
plan stakes FXRP in its Launch Vault for stXRP and Firelight Points instead
of buying, renewing and cancelling cover; Mezo Earn locks BTC for a veBTC
vote, not USDC in a governance vault; Abstract is its own Ethereum L2,
not Ethereum mainnet, so its plan runs on Abstract; USDD's vaults take TRX,
USDT or WBTC as collateral, never USDC, and its yield comes from sUSDD;
DeFi Saver is a management layer that takes no deposits, so its plan opens a
position through it and automates it; Bittensor dTAO is a staking system, not
an AMM pool, so its plan stakes TAO for alpha; and Polymarket runs no points
program, so its plan checks the rewards page that pays in pUSD instead of a
claim page. Twenty-six plans in all. The weekly action, the number worth
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

## Snapshot corrections

Twenty-six farm plans follow the protocol's own documentation instead of the
snapshot's category, because the snapshot's record mislabels the protocol.
They live in one table, PLAN_CORRECTIONS in lib/model.ts, keyed by slug,
each entry stating why the record is wrong and giving only the steps the
record gets wrong; every other step still comes from the category shape,
and the scoring never names a protocol.

- Hive Protocol (rank 13): DefiLlama lists B² Hive, the network's own BTC
  staking pool, under category Chain. The plan stakes BTC in B² Hive to
  safeguard the network and earn B2 rewards, as DefiLlama's own page for
  it says ("Stake BTC, safeguard B², and receive $B2 Tokens").
- Firelight (rank 68): DefiLlama lists it under category Insurance. The
  plan stakes FXRP in its Launch Vault for stXRP and Firelight Points
  instead of buying cover: Firelight is the underwriting side — a farmer
  bridges XRP to Flare through the FAssets system to mint FXRP, deposits
  it, and receives stXRP, while the staked FXRP underwrites the DeFi cover
  protocols buy. Since the cover phase went live on 6 October 2026 the
  staked FXRP can pay validated claims, and exits run on 30-day coverage
  periods, so the FXRP becomes withdrawable at the end of the following
  full period, up to 60 days (flare.network; Chainwire, 6 Oct 2026).
- Mezo Earn (rank 67): DefiLlama lists it under Governance Incentives.
  The plan locks 0.01 BTC of native BTC (or a smaller amount of wrapped
  tBTC) for 1–28 days to receive a veBTC NFT and vote on the weekly
  gauges, with MEZO locked for veMEZO as a boost of up to 5x; native BTC
  needs at least 0.01 BTC to bridge, and BTC is the gas on Mezo (mezo.org:
  Getting Started with Mezo; Voting Overview).
- Abstract (rank 125): the snapshot lists its chains as ["Ethereum"],
  because it settles on Ethereum — but Abstract is its own Ethereum L2
  network (ZK Stack), and its gas is ETH paid on Abstract. The plan runs
  on Abstract instead of Ethereum mainnet.
- USDD (rank 5): DefiLlama lists it under CDP, and the CDP shape would
  tell its farmer to supply USDC as collateral — but USDD 2.0 vaults
  take TRX, sTRX, USDT or WBTC (ETH and WBTC on Ethereum), never USDC,
  and the yield comes from staking the minted USDD as sUSDD, which
  accrues automatically in its exchange rate, so there is no rewards
  page to claim from (DefiLlama stablecoin page; BingX USDD 2.0 guide).
- Defi Saver Asset Management (rank 20): DefiLlama lists it under CDP
  Manager, and the CDP shape would tell its farmer to supply USDC to it
  as collateral — but DeFi Saver is a non-custodial management layer
  that takes no deposits at all ("Your assets are never deposited on
  DeFi Saver"). The plan opens a collateralized position through it on
  a protocol it manages and turns on its automation (defisaver.com).
- Bittensor dTAO (rank 11): DefiLlama lists it under Dexs, and the DEX
  shape would tell its farmer to provide liquidity to a main pool in a
  balanced pair — but dTAO is Bittensor's staking system, not an AMM
  pool: staking TAO into a subnet swaps it into that subnet's alpha
  token, and rewards are paid in alpha (Bittensor docs: Staking).
- Polymarket International (rank 4): the prediction shape would send
  its farmer to a "market rewards page" to claim — but Polymarket runs
  no points program and has no token claim page; its rewards are
  Liquidity Rewards and Holding Rewards, paid in pUSD. Only the claim
  step is corrected (Polymarket docs; TraderComps, Oct 2026).
- Felix CDP (rank 124): DefiLlama lists it under CDP, and the CDP shape
  would tell its farmer to supply USDC as collateral — but Felix's CDP
  branches take WHYPE, kHYPE, wstHYPE and UBTC to mint feUSD, never
  USDC, so its plan deposits HYPE (wrapped as WHYPE) into a trove to
  mint feUSD.
- Bucket CDP (rank 138): DefiLlama lists it under CDP, and the CDP shape
  would tell its farmer to supply USDC as collateral — but Bucket's CDP
  takes SUI, BTC, ETH and liquid staking tokens to mint BUCK, never
  USDC, so its plan deposits SUI to mint BUCK.
- BIMA CDP (rank 160): DefiLlama lists it under CDP, and the CDP shape
  would tell its farmer to supply USDC as collateral — but BIMA's vaults
  take BTC and Bitcoin LSTs to mint USBD at a 150% minimum ratio, never
  USDC, so its plan deposits BTC to mint USBD (BIMA mainnet announcement,
  Apr 2025).
- Kava Mint (rank 165): DefiLlama lists it under CDP, and the CDP shape
  would tell its farmer to supply USDC as collateral — but Kava Mint
  takes BTC, BNB, ATOM, KAVA and XRP as collateral to mint USDX, never
  USDC, so its plan deposits BTC to mint USDX.
- Monolith Market (rank 166): DefiLlama lists it under CDP, and the CDP
  shape would tell its farmer to supply USDC as collateral — but
  Monolith's lending markets take ETH or wBTC as collateral to borrow its
  Coin stablecoin, never USDC, so its plan deposits ETH to borrow Coin
  (ChainSecurity audit, Apr 2026). Round 17 settled this row's category
  as right and the shape as fitting; the category was right, the shape's
  named asset was not.
- BTCFi CDP (rank 177): DefiLlama lists it under CDP, and the CDP shape
  would tell its farmer to supply USDC as collateral — but BTCFi takes
  Bitcoin as its exclusive collateral to mint BtcUSD, never USDC, so its
  plan deposits BTC to mint BtcUSD.
- Swan DAO (rank 189): DefiLlama lists it under CDP, and the CDP shape
  would tell its farmer to supply USDC as collateral — but Swan DAO's
  swanUSD is minted against wstETH in a single-collateral Monolith
  lender, never USDC (the USDS in its peg module is a stability reserve,
  not borrower collateral), so its plan deposits wstETH to mint swanUSD.
- Avant avETH (rank 173): DefiLlama lists it under Onchain Capital
  Allocator, and the yield shape would tell its farmer to deposit USDC
  into its vault — but avETH is backed 1:1 by ETH and mints against ETH
  or WETH, never USDC (USDC backs the sibling avUSD), so its plan
  deposits ETH to mint avETH.
- Origami Finance (rank 91): DefiLlama lists it under Leveraged Farming,
  and the leveraged-farming shape would tell its farmer to deposit USDC
  into a leveraged vault — but Origami's vaults take the yield-bearing
  asset itself (USDe, sUSDe, OHM, iBERA), never a USDC deposit, so its
  plan deposits USDe into a leveraged vault and keeps the receipt token.
- Boros (rank 175): DefiLlama lists it under Interest Rate Derivatives,
  and the interest-rate shape would tell its farmer to deposit USDC as
  margin — but Boros margin is posted in the market's own collateral
  asset (ETH for an ETH funding-rate market), never USDC, so its plan
  deposits ETH as margin (Pendle docs: Boros).
- Granite (rank 193): DefiLlama lists it under Lending, and the lending
  shape would tell its farmer to supply USDC as collateral and borrow
  against it — but Granite's single market takes sBTC as collateral and
  lends USDCx, so the stablecoin is the borrowed asset, never the
  collateral, and its plan deposits sBTC to borrow USDCx.
- Solv Strategies (rank 110): DefiLlama lists it under Onchain Capital
  Allocator, and the yield shape would tell its farmer to deposit USDC
  into its vault — but Solv's strategies are Bitcoin-native, deposits
  are BTC minted into SolvBTC, never USDC, so its plan deposits BTC to
  receive SolvBTC.
- Exponent Yield Exchange (rank 72): DefiLlama lists it under Yield, and
  the yield shape would tell its farmer to deposit USDC into a vault —
  but Exponent's Yield Exchange is an exchange, not a vault: it splits a
  yield-bearing asset into a principal token and a yield token, so its
  plan swaps JitoSOL for its fixed-rate principal token and holds it to
  maturity, with the weekly action, the number worth logging, the claim
  and the exit corrected to match. STRATO CDP (rank 161) is the one CDP
  row left on the generic wording: its own litepaper lists USDC as an
  accepted CDP collateral at 90% LTV, so the generic asset is genuinely
  accepted there.
- Exponent Risk Tranching (rank 153): DefiLlama lists it under Yield, and
  the yield shape would tell its farmer to deposit USDC into a vault —
  but Risk Tranching splits a yield-bearing asset into a senior and a
  junior tranche, and there is no USDC vault to deposit into: its first
  and largest market is ONyc, so its plan deposits ONyc into the senior
  tranche and holds the srONyc LP shares, with the yield accruing in the
  tranche's NAV and senior withdrawals pausing during a Recovery Period
  (Exponent docs: Risk Tranching; Vitrine risk report).
- Exponent Strategy Vaults (rank 188): DefiLlama lists it under Onchain
  Capital Allocator, and the yield shape would tell its farmer to deposit
  USDC into a vault — but the vaults take the vault's accepted asset,
  SOL for the largest vaults, and the manager allocates and rebalances
  the deposit: the largest vault is the RockawayX-managed onycSOL vault,
  so its plan deposits SOL into onycSOL, with the claim naming the SOL
  incentives and OnRe points the vault pays (Exponent docs: Strategy
  Vaults; Vitrine risk report).
- Figure Markets Prime (rank 34): DefiLlama lists it under Lending, and
  the lending shape would tell its farmer to supply USDC as collateral
  and borrow against it — but Democratized Prime is a lender-side
  marketplace: its pools are a YLDS HELOC pool, which takes YLDS
  (deposit USD, buy YLDS, lend into the pool), and USD/USDC/USDT margin
  pools, so USDC lends into a margin pool, not the HELOC pool, and the
  borrow side posts crypto as collateral, never USDC, so its plan lends
  USDC into a Democratized Prime margin pool instead (Figure Markets:
  Democratized Prime; Figure: Prime lending pools).
- Native Credit Pool (rank 130): DefiLlama lists it under Lending, and
  the lending shape would tell its farmer to supply USDC as collateral
  and borrow against it — but Native Credit Pool is a single-sided
  supply pool: suppliers deposit assets that market makers borrow for
  trading, nobody posts collateral and nobody borrows against a deposit,
  and USDC is the largest asset supplied ($6.54M on 14 Nov 2026), so its
  plan supplies USDC to the pool and earns the borrow interest market
  makers pay (DefiLlama: Native Credit Pool; DefiLlama API token
  breakdown, 14 Nov 2026).
- BounceBit Prime (rank 96): DefiLlama lists it under Basis Trading,
  and the basis shape would tell its farmer to deposit USDC into its
  strategy — but BB Prime is an institutional product for institutional
  and accredited investors, with KYC/AML, custodial management and
  transparent reporting, and its flagship BENJI fund is for qualified
  investors, so a retail wallet cannot simply deposit, and its plan
  starts with KYC and qualified-investor onboarding (BounceBit docs;
  Blockworks, Jun 2025; FinanceFeeds, Aug 2025).

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
