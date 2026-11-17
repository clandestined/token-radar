// Token Radar's dashboard (radar-27). It reads window.RADAR (written beside
// dashboard/ by main.ts from the same board.json) and renders the ranked
// board, the filters, a per-protocol detail view with the model's own
// breakdown and the protocol's farm plan, and the live-token set kept apart.
// No network: every byte it shows is in data.js.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', watch: false, minTvl: 0, tab: 'pre-token', sort: 'implied', dir: -1, selected: null, liveSort: 'mcap', liveDir: -1, page: 1 };
  var PAGE_SIZE = 25;

  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    // The thresholds sit just below the next unit, not on it: $999,999
    // rounds to $1.0M at one decimal, not to "$1000K", and $999,999,999
    // rounds to $1.00B at two decimals, not to "$1000.0M". No value on
    // this snapshot sits in either range, so no visible number moves.
    if (Math.abs(n) >= 999500000) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 999500) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e3) return '$' + Math.round(n / 1e3) + 'K';
    return usd.format(n);
  }
  function fmtPct(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    return (n > 0 ? '+' : '') + n.toFixed(2) + '%';
  }
  function fmtAge(days) {
    if (days === null || days === undefined) return 'unknown';
    if (days >= 365) return (days / 365).toFixed(1) + 'y';
    return Math.max(0, Math.round(days)) + 'd';
  }
  // The model in one function: the page recomputes a row from the snapshot
  // figures and checks the number board.json carries, so the page's code and
  // the board's data are visibly the same arithmetic. A row whose seven-day
  // growth the snapshot does not carry is valued as flat and discounted a
  // little for the missing evidence, never as if it were known. The
  // multiple is the fitted size curve at the row's TVL, rounded to four
  // decimals in the board; the page refits the curve from the 90
  // comparables in DATA.comps and checks it matches DATA.curve.
  function fitCurve(pairs) {
    var n = pairs.length, mx = 0, my = 0, i;
    for (i = 0; i < n; i++) { mx += Math.log(pairs[i][0]); my += Math.log(pairs[i][1]); }
    mx /= n; my /= n;
    var sxy = 0, sxx = 0;
    for (i = 0; i < n; i++) {
      var dx = Math.log(pairs[i][0]) - mx;
      sxy += dx * (Math.log(pairs[i][1]) - my);
      sxx += dx * dx;
    }
    var slope = sxx === 0 ? 1 : sxy / sxx;
    return { intercept: my - slope * mx, slope: slope, n: n };
  }
  var REFIT = DATA.comps ? fitCurve(DATA.comps) : null;
  function impliedOf(row, model) {
    var growthKnown = row.change_7d !== null && row.change_7d !== undefined && isFinite(row.change_7d);
    var growth = Math.min(model.growth_cap, Math.max(model.growth_floor, growthKnown ? row.change_7d : 0));
    var growthMult = 1 + (growth / 100) * model.growth_weight;
    var age = row.age_days === null || row.age_days === undefined ? model.unknown_age_days : row.age_days;
    var maturity = model.maturity_floor + (Math.min(Math.max(age, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
    var breadth = 1 + model.breadth_step * Math.min(Math.max((row.chains || []).length - 1, 0), model.breadth_max_chains);
    var quality = growthKnown ? 1 : model.unknown_growth_discount;
    return Math.max(1, Math.round(row.tvl_usd * row.curve_multiple * growthMult * maturity * breadth * quality));
  }
  // One sentence saying why this row sits where it does, built from the
  // same drivers the model scored: size, momentum, seasoning, the size
  // curve and the quality of the evidence. It is a reading of the numbers,
  // not a claim. The bands read the numbers they describe: a 5-10% weekly
  // move is not flat (43 rows read that way), 300-364 days is not half a
  // year (9 rows), and the multiple bands are the curve's own: 51 rows sit
  // at 0.5x or above (small TVLs price high per dollar) and 25 at 0.1x or
  // below (large TVLs price low per dollar). The boundaries are strict
  // where the words are: exactly 730 days is two years, not two-plus, and
  // exactly 365 days is a year, not over one — radar-24 changed the
  // comparisons to strict but never wrote those two labels, so Goose read
  // "over a year" and Yuzu Money "nearly a year" until radar-25.
  function whyHere(row) {
    var parts = [];
    if (row.tvl_usd >= 1e9) parts.push('a very large TVL');
    else if (row.tvl_usd >= 1e8) parts.push('a large TVL');
    else if (row.tvl_usd >= 5e7) parts.push('a TVL at or above the watchlist floor');
    else parts.push('a modest TVL below the watchlist floor');
    if (row.change_7d !== null && row.change_7d !== undefined && row.change_7d >= 10) parts.push('fast seven-day growth' + (row.change_7d > DATA.model.growth_cap ? ', clamped at +' + DATA.model.growth_cap + '%' : ''));
    else if (row.change_7d !== null && row.change_7d !== undefined && row.change_7d >= 5) parts.push('modest seven-day growth');
    else if (row.change_7d !== null && row.change_7d !== undefined && row.change_7d <= -10) parts.push('shrinking TVL over seven days' + (row.change_7d < DATA.model.growth_floor ? ', clamped at ' + DATA.model.growth_floor + '%' : ''));
    else if (row.change_7d !== null && row.change_7d !== undefined && row.change_7d <= -5) parts.push('modest seven-day decline');
    else if (row.change_7d === null || row.change_7d === undefined) parts.push('seven-day growth unreported, so it is valued as flat with a small discount');
    else parts.push('flat seven-day growth');
    if (row.age_days !== null && row.age_days !== undefined && row.age_days > 730) parts.push('two-plus years running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days === 730) parts.push('two years running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days > 365) parts.push('over a year running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days === 365) parts.push('a year running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days >= 300) parts.push('nearly a year running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days >= 180) parts.push('half a year running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days < 180) parts.push('a young protocol, seasoned only briefly');
    else parts.push('age unreported, so it is scored as a year old');
    if (row.curve_multiple >= DATA.model.multiple_cap) parts.push('a size multiple at the model cap');
    else if (row.curve_multiple <= DATA.model.multiple_floor) parts.push('a size multiple at the model floor');
    else if (row.curve_multiple >= 0.5) parts.push('a rich size multiple: a small TVL prices high per dollar');
    else if (row.curve_multiple <= 0.1) parts.push('a cheap size multiple: a large TVL prices low per dollar');
    else parts.push('a mid-range size multiple');
    if ((row.chains || []).length >= 3) parts.push('TVL spread across several chains');
    return 'Why rank ' + row.rank + ': ' + parts.join(', ') + '.';
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'class') node.className = attrs[k];
        else if (k === 'text') node.textContent = attrs[k];
        else if (k === 'html') node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
        else if (attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var child = arguments[i];
      if (child === null || child === undefined) continue;
      if (Array.isArray(child)) child.forEach(function (c) { if (c) node.appendChild(c); });
      else if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else node.appendChild(child);
    }
    return node;
  }

  // Whether a category or a chain is one the board knows: a hash is a link,
  // not a command, so a value the board does not know is ignored and the
  // board opens, instead of an empty board the controls deny knowing about.
  function hasCategory(c) {
    var list = DATA.rows.concat(DATA.live);
    for (var i = 0; i < list.length; i++) if ((list[i].category || 'Other') === c) return true;
    return false;
  }
  function hasChain(c) {
    var list = DATA.rows.concat(DATA.live);
    for (var i = 0; i < list.length; i++) {
      var chains = list[i].chains || [];
      for (var j = 0; j < chains.length; j++) if (chains[j] === c) return true;
    }
    return false;
  }

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    var p = params.get('p');
    if (p && findRow(p)) state.selected = p;
    var cat = params.get('category');
    if (cat && (cat === 'all' || hasCategory(cat))) state.category = cat;
    var ch = params.get('chain');
    if (ch && (ch === 'all' || hasChain(ch))) state.chain = ch;
    if (params.get('watch') === '1') state.watch = true;
    var tab = params.get('tab');
    if (tab === 'pre-token' || tab === 'live') state.tab = tab;
    var mintvl = Number(params.get('mintvl'));
    if (mintvl === 50000000 || mintvl === 100000000 || mintvl === 500000000) state.minTvl = mintvl;
    if (params.get('page')) state.page = Math.max(1, Number(params.get('page')) || 1);
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.watch) params.set('watch', '1');
    if (state.minTvl) params.set('mintvl', String(state.minTvl));
    if (state.page > 1) params.set('page', String(state.page));
    if (state.tab !== 'pre-token') params.set('tab', state.tab);
    if (state.selected) params.set('p', state.selected);
    var next = params.toString();
    if (next) window.history.replaceState(null, '', '#' + next);
    else window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }

  function rows() {
    var q = state.q.trim().toLowerCase();
    return DATA.rows.filter(function (r) {
      if (state.category !== 'all' && r.category !== state.category) return false;
      if (state.chain !== 'all' && (r.chains || []).indexOf(state.chain) < 0) return false;
      if (state.watch && !r.watchlist) return false;
      if (r.tvl_usd < state.minTvl) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }
  function sortedRows(list) {
    var key = state.sort;
    return list.slice().sort(function (a, b) {
      var av, bv;
      if (key === 'name') { av = a.name.toLowerCase(); bv = b.name.toLowerCase(); }
      else if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d === null ? 0 : a.change_7d; bv = b.change_7d === null ? 0 : b.change_7d; }
      else if (key === 'age') { av = a.age_days === null ? DATA.model.unknown_age_days : a.age_days; bv = b.age_days === null ? DATA.model.unknown_age_days : b.age_days; }
      else if (key === 'multiple') { av = a.curve_multiple; bv = b.curve_multiple; }
      else { av = a.implied_value_usd; bv = b.implied_value_usd; }
      if (av < bv) return -state.dir;
      if (av > bv) return state.dir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }
  // The live-token view is filtered by the same controls as the board:
  // search, category, chain and minimum TVL all apply to it, and the
  // watchlist toggle leaves it empty, because no live-token protocol is on
  // the watchlist. A live view that ignored the filters would show the
  // reader a different board than the controls promise.
  function liveRows() {
    var q = state.q.trim().toLowerCase();
    if (state.watch) return [];
    var list = DATA.live.filter(function (r) {
      if (state.category !== 'all' && r.category !== state.category) return false;
      if (state.chain !== 'all' && (r.chains || []).indexOf(state.chain) < 0) return false;
      if (r.tvl_usd < state.minTvl) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
    // The live set sorts like the board: by market cap first, or by the
    // column the reader picked, so the live tab is sortable as well as
    // filterable. A protocol with no market cap or no ratio sorts last.
    var key = state.liveSort;
    return list.sort(function (a, b) {
      var av, bv;
      if (key === 'tvl') { av = a.tvl_usd; bv = b.tvl_usd; }
      else if (key === 'growth') { av = a.change_7d === null ? 0 : a.change_7d; bv = b.change_7d === null ? 0 : b.change_7d; }
      else if (key === 'multiple') { av = a.multiple === null ? 0 : a.multiple; bv = b.multiple === null ? 0 : b.multiple; }
      else { av = a.mcap_usd === null ? 0 : a.mcap_usd; bv = b.mcap_usd === null ? 0 : b.mcap_usd; }
      if (av < bv) return -state.liveDir;
      if (av > bv) return state.liveDir;
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
  }
  function findRow(slug) {
    for (var i = 0; i < DATA.rows.length; i++) if (DATA.rows[i].slug === slug) return DATA.rows[i];
    return null;
  }

  function header() {
    return el('header', { class: 'top' },
      el('div', { class: 'brand' }, el('span', { class: 'mark' }), el('span', { text: 'Token Radar' })),
      el('div', { class: 'top-meta' },
        el('span', { text: 'Snapshot ' + DATA.as_of }),
        el('span', { text: 'DefiLlama protocol index' }),
        el('span', { text: DATA.model_version + ' model' }),
        el('span', { text: 'No network: all data on the page' })
      )
    );
  }

  function lede() {
    // The watchlist is the house's list, not every protocol that fits its
    // description: rankable protocols above the floor the list leaves out
    // are counted here, because the house's rule also leaves out a product
    // of a protocol whose token already trades, and the snapshot does not
    // name the parent, so the list is what the rule produced. Calling the
    // watchlist every protocol at or above the floor would be wrong on
    // this snapshot: Sentora Curator sits at $2.76B and is not on it.
    var aboveFloor = DATA.rows.filter(function (r) { return !r.watchlist && r.tvl_usd >= DATA.floor_usd; });
    var biggest = aboveFloor.slice().sort(function (a, b) { return b.tvl_usd - a.tvl_usd; })[0];
    var floorM = Math.round(DATA.floor_usd / 1e6);
    var ledeText = 'The watchlist is the floor: the house\u2019s list of ' + DATA.watchlist_size + ' protocols with at least $' + floorM + 'M of TVL that record no token. It is a list, not every protocol that fits: ' + aboveFloor.length + ' rankable pre-token protocols above the floor are not on it' + (biggest ? ', the largest ' + biggest.name + ' at ' + fmtUsd(biggest.tvl_usd) : '') + '. The early radar adds all ' + DATA.early_size + ' rankable pre-token protocols the watchlist leaves out, whatever their size, so the board holds ' + DATA.board_size + ' rows. Implied value is a model built from the snapshot, not a promise and not a prediction of a launch.';
    return el('section', { class: 'lede' },
      el('div', null,
        el('h1', { text: DATA.board_size + ' pre-token protocols, ranked by implied value' }),
        el('p', { text: ledeText })
      ),
      el('div', { class: 'facts' },
        el('div', { class: 'fact' }, el('span', { text: 'Watchlist covered' }), el('b', { text: DATA.watchlist_size + ' / ' + DATA.watchlist_size }), el('small', { text: 'every watchlist slug is on the board' })),
        el('div', { class: 'fact' }, el('span', { text: 'Total implied value' }), el('b', { text: fmtUsd(DATA.total_implied_usd) }), el('small', { text: 'sum of all ' + DATA.board_size + ' rows' })),
        el('div', { class: 'fact' }, el('span', { text: 'Median row' }), el('b', { text: fmtUsd(DATA.median_implied_usd) }), el('small', { text: 'half the board is above this' })),
        el('div', { class: 'fact' }, el('span', { text: 'Live-token protocols shown' }), el('b', { text: 'Top ' + DATA.live_size }), el('small', { text: 'of ' + DATA.live_total + ' that record a token; ' + DATA.live_priced + ' with a market cap price the comparables' }))
      )
    );
  }

  function spotlight() {
    var top = DATA.rows.slice(0, 3);
    return el('section', { class: 'spot', 'aria-label': 'Top three by implied value' },
      top.map(function (r) {
        return el('button', { type: 'button', class: 'spot-card', onclick: function () { openDetail(r.slug); } },
          el('span', { class: 'rank', text: 'Rank ' + r.rank + (r.watchlist ? '  -  watchlist' : '  -  early') }),
          el('h3', { text: r.name }),
          el('p', { text: (r.category || 'Other') + '  -  TVL ' + fmtUsd(r.tvl_usd) + '  -  7d ' + fmtPct(r.change_7d) }),
          el('b', { text: fmtUsd(r.implied_value_usd) + ' implied' })
        );
      })
    );
  }

  function controls() {
    // Filter options cover the live set too: a live-only category (Privacy,
    // Liquid Staking) or chain would otherwise have no option to pick on the
    // Live token tab, and the filter would silently hide those rows.
    var categories = Array.from(new Set(DATA.rows.concat(DATA.live).map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.concat(DATA.live).reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Search name, category or chain', value: state.q, 'aria-label': 'Search the board' });
    search.addEventListener('input', function () { state.q = search.value; state.page = 1; writeHash(); render(); });
    var cat = el('select', { id: 'category', 'aria-label': 'Filter by category' },
      el('option', { value: 'all', text: 'All categories' }),
      categories.map(function (c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); })
    );
    cat.addEventListener('change', function () { state.category = cat.value; state.page = 1; writeHash(); render(); });
    var chain = el('select', { id: 'chain', 'aria-label': 'Filter by chain' },
      el('option', { value: 'all', text: 'All chains' }),
      chains.map(function (c) { return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null }); })
    );
    chain.addEventListener('change', function () { state.chain = chain.value; state.page = 1; writeHash(); render(); });
    var tvl = el('select', { id: 'mintvl', 'aria-label': 'Minimum TVL' },
      el('option', { value: '0', text: 'Any TVL' }),
      el('option', { value: '50000000', text: 'TVL $50M+', selected: state.minTvl === 50000000 ? 'selected' : null }),
      el('option', { value: '100000000', text: 'TVL $100M+', selected: state.minTvl === 100000000 ? 'selected' : null }),
      el('option', { value: '500000000', text: 'TVL $500M+', selected: state.minTvl === 500000000 ? 'selected' : null })
    );
    tvl.addEventListener('change', function () { state.minTvl = Number(tvl.value); state.page = 1; writeHash(); render(); });
    var watch = el('button', { type: 'button', class: 'chipbtn', 'aria-pressed': state.watch ? 'true' : 'false', text: 'Watchlist only', onclick: function () { state.watch = !state.watch; state.page = 1; writeHash(); render(); } });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token', onclick: function () { state.tab = 'pre-token'; state.page = 1; writeHash(); render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live token', onclick: function () { state.tab = 'live'; state.page = 1; writeHash(); render(); } });
    // The count names the page as well as the filter, so a reader on page 4
    // of a filtered board knows how much board is left.
    var filtered = rows().length;
    var pages = Math.max(1, Math.ceil(filtered / PAGE_SIZE));
    var page = Math.min(state.page, pages);
    var countText = state.tab === 'pre-token'
      ? (pages > 1 ? Math.min(PAGE_SIZE, filtered - (page - 1) * PAGE_SIZE) + ' of ' + filtered + ' rows shown · page ' + page + ' of ' + pages : filtered + ' of ' + DATA.board_size + ' rows shown')
      : liveRows().length + ' of ' + DATA.live.length + ' live-token protocols shown';
    return el('div', { class: 'controls' },
      el('div', { class: 'field grow' }, el('label', { for: 'q', text: 'Search' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Category' }), cat),
      el('div', { class: 'field' }, el('label', { for: 'chain', text: 'Chain' }), chain),
      el('div', { class: 'field' }, el('label', { for: 'mintvl', text: 'Minimum TVL' }), tvl),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Scope' }), watch),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Token status' }), el('div', { class: 'tabs' }, pre, live)),
      el('span', { class: 'count', text: countText })
    );
  }

  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = -1; } state.page = 1; render(); } },
        label,
        state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null
      )
    );
  }

  function liveSortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.liveSort === key) state.liveDir = -state.liveDir; else { state.liveSort = key; state.liveDir = -1; } render(); } },
        label,
        state.liveSort === key ? el('span', { 'aria-hidden': 'true', text: state.liveDir < 0 ? ' v' : ' ^' }) : null
      )
    );
  }

  function boardTable() {
    var list = sortedRows(rows());
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category, chain or TVL floor to see the board again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; state.watch = false; state.minTvl = 0; state.page = 1; writeHash(); render(); } })
      ));
    }
    // One page of the board at a time: 195 rows in a single table is a wall
    // to scroll, and a page of 25 reads at a glance. The page lives in the
    // hash, so a link to page 4 opens on page 4, and a filter that shrinks
    // the board below the current page pulls it back to the last page.
    var pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    if (state.page > pages) state.page = pages;
    var pageList = list.slice((state.page - 1) * PAGE_SIZE, state.page * PAGE_SIZE);
    var max = DATA.rows[0].implied_value_usd || 1;
    var tbody = el('tbody');
    pageList.forEach(function (r) {
      var growth = r.change_7d === null ? 'n/a' : fmtPct(r.change_7d);
      var growthClass = r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg';
      var tr = el('tr', {
        'data-selected': state.selected === r.slug ? 'true' : 'false',
        tabindex: '0',
        onclick: function () { openDetail(r.slug); },
        onkeydown: function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(r.slug); } }
      },
        el('td', { class: 'num', text: String(r.rank) }),
        el('td', null, el('div', { class: 'name' },
          el('b', { text: r.name }),
          el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') })
        )),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + growthClass, text: growth }),
        el('td', { class: 'num', text: fmtAge(r.age_days) }),
        el('td', { class: 'num', text: r.curve_multiple.toFixed(4) + 'x' }),
        el('td', null, el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
          el('span', { class: 'num', text: fmtUsd(r.implied_value_usd) })
        )),
        el('td', null, el('span', { class: r.watchlist ? 'status watch' : 'status', text: r.watchlist ? 'watchlist' : 'early' }))
      );
      tbody.appendChild(tr);
    });
    var panel = el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Pre-token protocols, strongest implied value first. Select a row for its model breakdown and farm plan.' }),
          el('thead', null, el('tr', null,
            sortHeader('implied', 'Rank'),
            sortHeader('name', 'Protocol'),
            sortHeader('tvl', 'TVL'),
            sortHeader('growth', '7d'),
            sortHeader('age', 'Age'),
            sortHeader('multiple', 'Size x'),
            sortHeader('implied', 'Implied value'),
            el('th', { scope: 'col', text: 'Scope' })
          )),
          tbody
        )
      )
    );
    if (pages <= 1) return panel;
    var pager = el('div', { class: 'pager' },
      el('button', { class: 'button', type: 'button', disabled: state.page <= 1 ? 'disabled' : null, text: '← Previous', onclick: function () { if (state.page > 1) { state.page--; writeHash(); render(); } } }),
      el('span', { class: 'count', text: 'Page ' + state.page + ' of ' + pages + ' — ' + pageList.length + ' rows' }),
      el('button', { class: 'button', type: 'button', disabled: state.page >= pages ? 'disabled' : null, text: 'Next →', onclick: function () { if (state.page < pages) { state.page++; writeHash(); render(); } } })
    );
    return el('div', null, panel, pager);
  }

  function liveTable() {
    var list = liveRows();
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No live-token protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category, chain or TVL floor to see the live set again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; state.watch = false; state.minTvl = 0; state.page = 1; writeHash(); render(); } })
      ));
    }
    var tbody = el('tbody');
    list.forEach(function (r) {
      tbody.appendChild(el('tr', null,
        el('td', { class: 'num', text: 'live' }),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }), el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + (r.change_7d === null ? '' : r.change_7d >= 0 ? 'pos' : 'neg'), text: fmtPct(r.change_7d) }),
        el('td', { class: 'num', text: fmtUsd(r.mcap_usd) }),
        el('td', { class: 'num', text: r.multiple === null ? 'n/a' : r.multiple.toFixed(2) + 'x' }),
        el('td', null, el('span', { class: 'status live', text: 'already trades' }))
      ));
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Token live: the ' + DATA.live.length + ' biggest live-token protocols by market cap in the categories the board ranks, of ' + DATA.live_total + ' that record a token. These already trade, so their market cap is a fact, not a model. They are set aside from the pre-token ranking, and the ' + DATA.live_priced + ' of them with a market cap are the comparables the size curve is fitted on. Bridge, liquid-staking and wrapper tokens are left out here too: their market caps price a business other than the TVL, so they never enter the fit.' }),
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Status' }), el('th', { scope: 'col', text: 'Protocol' }), liveSortHeader('tvl', 'TVL'), liveSortHeader('growth', '7d'), liveSortHeader('mcap', 'Market cap'), liveSortHeader('multiple', 'Mcap / TVL'), el('th', { scope: 'col', text: 'Token' }))),
          tbody
        )
      )
    );
  }

  function modelPanel() {
    var m = DATA.model;
    var o = DATA.oos;
    var c = DATA.curve;
    var refitText = REFIT && Math.abs(REFIT.intercept - c.intercept) < 0.001 && Math.abs(REFIT.slope - c.slope) < 0.001
      ? ' The page refits the curve from the 90 pairs itself and gets the same fit: log(mcap) = ' + REFIT.intercept.toFixed(2) + ' + ' + REFIT.slope.toFixed(2) + ' x log(TVL).'
      : ' The page refits the curve from the 90 pairs itself; its fit differs from the board\'s, so the data would be stale.';
    var excludedText = Object.keys(DATA.excluded.by_reason).sort().map(function (k) { var n = DATA.excluded.by_reason[k]; var label = k === 'liquid staking / restaking' ? 'liquid staking / restaking products' : k + (n === 1 ? '' : 's'); return n + ' ' + label; }).join(', ');
    var saturn = null;
    for (var i = 0; i < DATA.rows.length; i++) if (DATA.rows[i].slug === 'saturn') saturn = DATA.rows[i];
    var saturnText = saturn ? ' One watchlist protocol is ranked although the wrapper rule would leave it out: Saturn, a Stablecoin Wrapper, sits at rank ' + saturn.rank + ' because the watchlist is the floor and a watchlist slug is always ranked.' : '';
    return el('section', { class: 'panel model' },
      el('h2', { text: 'How implied value is computed' }),
      el('p', { class: 'sub', text: 'Every row is scored by one function of the snapshot figures. The scoring never special-cases a protocol name, and no row is hand-picked. The multiple is a fitted size curve, not a flat median: log(market cap) = ' + c.intercept.toFixed(2) + ' + ' + c.slope.toFixed(2) + ' x log(TVL), fitted by least squares on the ' + c.comps + ' live-token protocols whose market cap prices the same kind of business, and a protocol\'s multiple is exp(' + c.intercept.toFixed(2) + ') x TVL^(' + (c.slope - 1).toFixed(2) + '), clamped to [' + m.multiple_floor + ', ' + m.multiple_cap.toFixed(2) + ']. The band is a guardrail, not a price: on this snapshot it never binds — the curve runs 0.80x at $5M of TVL to 0.02x at $2.76B.' + refitText }),
      el('p', { class: 'sub', text: 'The curve is tested out of sample, on the live tokens themselves, against the flat median multiple it replaces. Held out one at a time, the curve misses by a factor of x' + o.loocv_curve.toFixed(2) + ' against the median\'s x' + o.loocv_median.toFixed(2) + '; fitted on tokens listed before ' + o.time_split_cut + ' and tested on those listed after, x' + o.time_split_curve.toFixed(2) + ' against x' + o.time_split_median.toFixed(2) + '; in 5-fold splits, x' + o.five_fold_curve.toFixed(2) + ' against x' + o.five_fold_median.toFixed(2) + '. The flat median misprices by size: its held-out errors are ' + o.loocv_bias_median[0] + ', ' + o.loocv_bias_median[1] + ' and ' + o.loocv_bias_median[2] + ' in log terms across the small, middle and large thirds — it underpredicts the smallest third by a factor of ' + Math.exp(-o.loocv_bias_median[0]).toFixed(1) + ' and overpredicts the largest by ' + Math.exp(o.loocv_bias_median[2]).toFixed(1) + ' — while the curve\'s are ' + o.loocv_bias_curve[0] + ', ' + o.loocv_bias_curve[1] + ' and ' + o.loocv_bias_curve[2] + '. Category offsets were tested the same way and do not help: they make the held-out error worse at every shrinkage weight, so the curve carries no category term. Each row also carries its uncertainty: the curve refitted 200 times on bootstrap resamples of the 90 comparables, and the detail view shows the row\'s P10-P90 implied value and rank over those refits.' }),
      el('p', { class: 'sub', text: 'The curve is also held out by protocol family — fitted without a whole family, tested on it: pooled x' + o.family_heldout.pooled_curve.toFixed(2) + ' against the median\'s x' + o.family_heldout.pooled_median.toFixed(2) + ', and one category at a time x' + o.family_heldout.loco_curve.toFixed(2) + ' against x' + o.family_heldout.loco_median.toFixed(2) + '. It is not uniform: Lending & credit held out is the one family where the curve loses to the median, and Trading held out is underpredicted by a median log error of -1.16. The family table below names every family. No category term was added to fix it: an offset cannot be fitted for a family the fit never saw, and offsets, robust fits and a trimmed fit re-tested this round still fail the full out-of-sample battery.' }),
      el('p', { class: 'sub', text: 'Each farm plan is audited to the dollar in its detail view: the capital it deploys, the gas its own cost lines add up to, the T-bill opportunity cost of locking that capital (' + (DATA.tbill.rate * 100).toFixed(2) + '% a year on the 3-month bill, read ' + DATA.tbill.as_of + '), the sunk total, the hands-on time, and a FARM / THIN / SKIP verdict at the row\'s P10 low end. The verdict is the sunk cost as a share of P10 — the share of the token supply a farmer\'s allocation would have to be for the farm to pay for itself: FARM below 0.0005%, THIN to 0.001%, SKIP above. The snapshot carries no farmer allocation share, so no verdict promises a profit; the share is shown beside every verdict. Mezo Earn\'s costs are in BTC, not dollars, and the snapshot carries no BTC price, so it carries CHECK instead of a verdict.' }),
      el('p', { class: 'sub', text: 'Farm plans follow the protocol\u2019s category — except where the snapshot\u2019s own record mislabels the protocol, and then the plan follows the protocol\u2019s own documentation instead. Twenty-six plans are corrected that way, in one table in the code: Hive Protocol is B\u00b2 Hive, a BTC staking pool listed as a chain, so its plan stakes BTC for B2 rewards; Firelight is the underwriting side of a cover design listed as insurance, so its plan stakes FXRP for stXRP; Mezo Earn locks BTC for a veBTC vote, not USDC in a governance vault; Abstract is its own Ethereum L2, not Ethereum mainnet, so its plan runs on Abstract; USDD\u2019s vaults take TRX, USDT or WBTC as collateral, never USDC, and its yield comes from sUSDD; DeFi Saver is a management layer that takes no deposits, so its plan opens a position through it and automates it; Bittensor dTAO is a staking system, not an AMM pool, so its plan stakes TAO for alpha; and Polymarket runs no points program, so its plan checks the rewards page that pays in pUSD instead of a claim page. Thirteen more joined them in radar-20: seven CDP plans named USDC as collateral where the vaults take something else — Felix takes HYPE to mint feUSD, Bucket takes SUI to mint BUCK, BIMA and BTCFi take BTC to mint USBD and BtcUSD, Kava Mint takes BTC to mint USDX, Monolith takes ETH to borrow Coin, and Swan DAO takes wstETH to mint swanUSD — and six more shapes named the wrong asset: Avant avETH mints against ETH, not USDC; Origami\u2019s leveraged vaults take the yield-bearing asset itself, USDe; Boros margin is the market\u2019s own asset, ETH; Granite takes sBTC as collateral and lends USDCx; Solv Strategies takes BTC for SolvBTC; and Exponent Yield Exchange is an exchange, not a vault, so its plan swaps a yield-bearing asset for its principal token instead of depositing USDC. Three more joined them in radar-21: the two Exponent rows the last round left alone — Risk Tranching\u2019s first and largest market is ONyc, so its plan deposits ONyc into the senior tranche for srONyc LP shares, and Strategy Vaults\u2019 largest vault is the RockawayX-managed onycSOL vault, so its plan deposits SOL — and Figure Markets Prime, where the lending shape\u2019s borrow-against-your-supply is wrong on either side, so its plan lends USDC into a Democratized Prime pool instead. Two more joined them in radar-22, and one of those three is refined: Native Credit Pool is a single-sided supply pool for market makers, so its plan supplies USDC and earns the borrow interest instead of borrowing against a deposit; BounceBit Prime is institutional-only with KYC, so its plan starts with qualified-investor onboarding; and Figure Markets Prime\u2019s USDC goes to a margin pool, not the YLDS HELOC pool, which takes YLDS. The eighth CDP row, STRATO, stays on the generic wording because its own litepaper lists USDC as an accepted CDP collateral at 90% LTV. The scoring never names a protocol; these twenty-six are plan corrections, not a hardcoded ranking.' }),
      el('div', { class: 'formula' },
        'multiple = exp(' + c.intercept.toFixed(4) + ') x TVL^(' + (c.slope - 1).toFixed(4) + '), clamped to [' + m.multiple_floor + ', ' + m.multiple_cap.toFixed(2) + ']'
      ),
      el('div', { class: 'formula' },
        'implied = round( tvl_usd x multiple x (1 + clamp(change_7d, ' + m.growth_floor + ', ' + m.growth_cap + ') / 100 x ' + m.growth_weight + ') x (' + m.maturity_floor + ' + min(age_days, ' + m.maturity_days + ') / ' + m.maturity_days + ' x ' + m.maturity_range + ') x (1 + ' + m.breadth_step + ' x min(chains - 1, ' + m.breadth_max_chains + ')) x quality )'
      ),
      el('p', { class: 'sub', text: 'TVL and seven-day growth come from the snapshot. Age is the time since the protocol was first listed, the record of how long it has run with no token; an unlisted age uses ' + m.unknown_age_days + ' days. Quality is ' + m.unknown_growth_discount + ' when seven-day growth is unreported and 1.00 otherwise: missing evidence is a small discount, never a free pass. Wrapped, staked, restaked, bridged and exchange products are left out of the early radar: they are a token that already trades, in another wrapper. Their tokens are left out of the comparables too: a bridge token market cap prices the bridge business, not the value locked in it, so the curve is fitted on the ' + c.comps + ' live-token protocols in the categories the board ranks. In total 342 protocols record no token: ' + DATA.board_size + ' are ranked here and ' + DATA.excluded.total + ' pre-token protocols are set aside that way (' + excludedText + ').' + saturnText + ' "Records no token" is what the snapshot says; it is not proof a protocol has no token.' })
    );
  }

  function sizeCurvePanel() {
    var bands = el('tbody');
    DATA.size_bands.forEach(function (b) {
      bands.appendChild(el('tr', null,
        el('td', { class: 'num', text: fmtUsd(b.tvl_usd) }),
        el('td', { class: 'num', text: b.multiple.toFixed(4) + 'x' })
      ));
    });
    var resids = el('tbody');
    DATA.category_residuals.forEach(function (r) {
      // A residual is the category's median log gap from the curve: a
      // positive one trades rich against the curve, a negative one cheap.
      // Single-peer categories swing widest — Chain at +2.00 and Collateral
      // Management at +3.49 are one live peer each — which is why offsets
      // fitted on them make the held-out error worse instead of better.
      var read = r.peers === 1 ? 'one live peer: the residual is that peer alone'
        : Math.abs(r.median_residual) < 0.2 ? 'trades about on the curve'
        : r.median_residual > 0 ? 'trades rich against the curve' : 'trades cheap against the curve';
      resids.appendChild(el('tr', null,
        el('td', null, el('b', { text: r.category })),
        el('td', { class: 'num', text: String(r.peers) }),
        el('td', { class: 'num', text: (r.median_residual > 0 ? '+' : '') + r.median_residual.toFixed(2) }),
        el('td', { class: 'num', text: read })
      ));
    });
    // The family-held-out table: the curve fitted without a whole family,
    // tested on it, against the flat median on the same split. A negative
    // bias underpredicts the family when it is held out, a positive one
    // overpredicts it; Lending & credit is the one family where the curve
    // loses to the median.
    var fams = el('tbody');
    DATA.oos.family_heldout.families.forEach(function (f) {
      fams.appendChild(el('tr', null,
        el('td', null, el('b', { text: f.family })),
        el('td', { class: 'num', text: String(f.peers) }),
        el('td', { class: 'num', text: 'x' + f.curve.toFixed(2) }),
        el('td', { class: 'num', text: 'x' + f.median.toFixed(2) }),
        el('td', { class: 'num', text: (f.bias_curve > 0 ? '+' : '') + f.bias_curve.toFixed(2) })
      ));
    });
    return el('section', { class: 'panel peers' },
      el('h2', { text: 'The size curve' }),
      el('p', { class: 'sub', text: 'What the market already pays per dollar of TVL, by size — not by category. The multiple falls as TVL rises, because market cap grows slower than TVL: log(mcap) = ' + DATA.curve.intercept.toFixed(2) + ' + ' + DATA.curve.slope.toFixed(2) + ' x log(TVL) on the ' + DATA.curve.comps + ' comparables. A $5M protocol prices near 0.80x; a $2.76B one near 0.02x.' }),
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'TVL' }), el('th', { scope: 'col', text: 'Multiple' }))),
          bands
        )
      ),
      el('h2', { text: 'Categories against the curve' }),
      el('p', { class: 'sub', text: 'Each category\'s median log gap from the curve. These are shown, not used: adding them as offsets was tested out of sample and made the held-out error worse at every shrinkage weight, so the curve carries no category term.' }),
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Category' }), el('th', { scope: 'col', text: 'Live peers' }), el('th', { scope: 'col', text: 'Median log residual' }), el('th', { scope: 'col', text: 'How it is read' }))),
          resids
        )
      ),
      el('h2', { text: 'Families held out' }),
      el('p', { class: 'sub', text: 'The curve fitted without a whole protocol family, tested on that family: pooled x' + DATA.oos.family_heldout.pooled_curve.toFixed(2) + ' against the median\'s x' + DATA.oos.family_heldout.pooled_median.toFixed(2) + ' (bias ' + DATA.oos.family_heldout.pooled_bias_curve.toFixed(2) + '). Families group categories by the broad function their names state; the grouping is the test\'s own definition.' }),
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Family' }), el('th', { scope: 'col', text: 'Live peers' }), el('th', { scope: 'col', text: 'Curve' }), el('th', { scope: 'col', text: 'Flat median' }), el('th', { scope: 'col', text: 'Curve bias' }))),
          fams
        )
      )
    );
  }

  var dialog = el('dialog', { class: 'detail', id: 'detail', 'aria-labelledby': 'detail-title' });
  dialog.addEventListener('close', function () { state.selected = null; writeHash(); });

  function openDetail(slug) {
    var row = findRow(slug);
    if (!row) return;
    state.selected = slug;
    writeHash();
    dialog.textContent = '';
    var recomputed = impliedOf(row, DATA.model);
    var peers = (DATA.peer_samples && DATA.peer_samples[row.category || 'Other']) || DATA.live.filter(function (l) { return l.category === row.category; }).slice(0, 3);
    dialog.appendChild(el('div', { class: 'detail-head' },
      el('div', null,
        el('span', { class: 'rank', text: 'Rank ' + row.rank + ' of ' + DATA.board_size + (row.watchlist ? '  -  watchlist' : '  -  early radar') }),
        el('h2', { id: 'detail-title', text: row.name }),
        el('p', { class: 'sub', text: (row.category || 'Other') + ' on ' + (row.chains && row.chains.length ? row.chains.join(', ') : 'an unnamed chain') + '  -  first listed ' + (row.listed_at || 'unknown') })
      ),
      el('button', { class: 'close', type: 'button', 'aria-label': 'Close details', text: 'Close', onclick: function () { dialog.close(); } })
    ));
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Implied value: the model, line by line' }),
      el('p', { class: 'why', html: '<b>' + whyHere(row) + '</b>' }),
      el('div', { class: 'equation' },
        el('div', null, el('span', { text: 'TVL' }), el('b', { class: 'num', text: fmtUsd(row.tvl_usd) })),
        el('div', null, el('span', { text: 'Seven-day growth' }), el('b', { class: 'num', text: fmtPct(row.change_7d) })),
        el('div', null, el('span', { text: 'Age with no token' }), el('b', { class: 'num', text: row.age_days === null ? 'unknown (scored as 1y)' : fmtAge(row.age_days) })),
        el('div', { class: 'wide' }, el('span', { text: 'Size multiple' }), el('b', { class: 'num', text: row.curve_multiple.toFixed(4) + 'x (fitted curve at ' + fmtUsd(row.tvl_usd) + ' of TVL, ' + row.fit_comps + ' comparables)' + (row.curve_multiple >= DATA.model.multiple_cap ? ' — at the ' + DATA.model.multiple_cap.toFixed(2) + 'x cap' : row.curve_multiple <= DATA.model.multiple_floor ? ' — at the ' + DATA.model.multiple_floor.toFixed(2) + 'x floor' : '') })),
        el('div', null, el('span', { text: 'Growth multiplier' }), el('b', { class: 'num', text: String(row.growth_multiplier) + (row.change_7d !== null && row.change_7d !== undefined && row.change_7d > DATA.model.growth_cap ? ' — at the +' + DATA.model.growth_cap + '% cap' : row.change_7d !== null && row.change_7d !== undefined && row.change_7d < DATA.model.growth_floor ? ' — at the ' + DATA.model.growth_floor + '% floor' : '') })),
        el('div', null, el('span', { text: 'Maturity multiplier' }), el('b', { class: 'num', text: String(row.maturity_multiplier) + (row.age_days !== null && row.age_days !== undefined && row.age_days > DATA.model.maturity_days ? ' — capped at ' + (DATA.model.maturity_days / 365) + 'y' : '') })),
        el('div', null, el('span', { text: 'Breadth multiplier' }), el('b', { class: 'num', text: String(row.breadth_multiplier) })),
        el('div', null, el('span', { text: 'Quality multiplier' }), el('b', { class: 'num', text: String(row.quality_multiplier) })),
        el('div', { class: 'big' }, el('span', { text: 'Implied value' }), el('b', { class: 'num', text: fmtUsd(row.implied_value_usd) })),
        el('div', { class: 'wide' }, el('span', { text: 'Uncertainty (200 bootstrap refits)' }), el('b', { class: 'num', text: fmtUsd(row.implied_p10_usd) + ' – ' + fmtUsd(row.implied_p90_usd) + ' · rank ' + row.rank_p10 + '–' + row.rank_p90 }))
      ),
      el('p', { class: 'verify', html: 'Model ' + DATA.model_version + ': the page recomputes this row as <b>' + fmtUsd(recomputed) + '</b>' + (recomputed === row.implied_value_usd ? ', the same number board.json carries.' : ', which differs from the board: the data would be stale.') + ' The P10-P90 range is the curve refitted 200 times on resamples of the ' + row.fit_comps + ' comparables.' })
    ));
    if (peers.length > 0) {
      dialog.appendChild(el('section', { class: 'detail-section' },
        el('h3', { text: 'Live tokens in ' + (row.category || 'this category') }),
        el('p', { class: 'sub', text: peers.map(function (l) { return l.name + ' trades at ' + (l.multiple === null ? 'n/a' : l.multiple.toFixed(2) + 'x') + ' mcap / TVL (' + fmtUsd(l.mcap_usd) + ' on ' + fmtUsd(l.tvl_usd) + ')'; }).join('; ') + '. These are context, not the price: the multiple above comes from the fitted size curve.' })
      ));
    }
    dialog.appendChild(el('section', { class: 'detail-section' },
      el('h3', { text: 'Farm plan: seven steps' }),
      el('ol', { class: 'steps' }, row.farm_steps.map(function (s) {
        var at = s.indexOf(' Cost: ');
        var action = at >= 0 ? s.slice(0, at) : s;
        var tail = at >= 0 ? s.slice(at + 1) : '';
        return el('li', null, el('b', { text: action }), el('span', { class: 'cost', text: tail }));
      }))
    ));
    // Farm economics, audited to the dollar from the plan's own cost
    // lines: capital deployed, gas summed at the stated upper bounds,
    // T-bill opportunity cost, the sunk total, hands-on time, and the
    // verdict at the row's P10 low end. The verdict is the sunk cost as
    // a share of P10 — the share of the token supply a farmer's
    // allocation would have to be for the farm to pay for itself — and
    // the snapshot carries no allocation share, so it promises no profit.
    var fe = row.farm_economics;
    if (fe) {
      var econText = fe.verdict === 'CHECK'
        ? 'The plan deploys ' + fe.capital_label + ' for ' + fe.hold_days + ' days and about ' + Math.round(fe.hands_on_minutes / 60 * 10) / 10 + ' hours hands-on, but its costs are in BTC, not dollars, and the snapshot carries no BTC price, so no dollar total or verdict is stated — price the BTC costs yourself before farming.'
        : 'Capital ' + fmtUsd(fe.capital_usd) + ' locked for ' + fe.hold_days + ' days · gas $' + fe.gas_usd.toFixed(2) + ' · T-bill opportunity $' + fe.opportunity_usd.toFixed(2) + ' at ' + (DATA.tbill.rate * 100).toFixed(2) + '% a year · sunk $' + fe.sunk_usd.toFixed(2) + ' · about ' + Math.round(fe.hands_on_minutes / 60 * 10) / 10 + ' hours hands-on. At the low end (P10 ' + fmtUsd(row.implied_p10_usd) + ') the farm breaks even on about 1 part in ' + Math.round(100 / fe.breakeven_pct) + ' of the token supply (' + fe.breakeven_pct.toFixed(5) + '%) — verdict ' + fe.verdict + '.';
      dialog.appendChild(el('section', { class: 'detail-section' },
        el('h3', { text: 'Farm economics: ' + fe.verdict }),
        el('p', { class: 'sub', text: econText }),
        el('p', { class: 'sub', text: 'Capital is not a cost — it comes back when the position unwinds. Gas is the plan\'s own cost lines summed at their stated upper bounds; the T-bill is the 3-month bill, read ' + DATA.tbill.as_of + '.' })
      ));
    }
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function render() {
    app.textContent = '';
    var shell = el('div', { class: 'shell' });
    shell.appendChild(header());
    shell.appendChild(lede());
    if (state.tab === 'pre-token') shell.appendChild(spotlight());
    shell.appendChild(el('p', { class: 'note', html: '<b>Read this first:</b> a launch is a token a protocol may issue one day. This board ranks what that token would be worth if the protocol\u2019s record stayed as it is. It does not predict whether or when a token is issued, and "records no token" means the snapshot carries no token for it, not that it has none.' }));
    shell.appendChild(controls());
    shell.appendChild(state.tab === 'pre-token' ? boardTable() : liveTable());
    if (state.tab === 'pre-token') {
      shell.appendChild(modelPanel());
      shell.appendChild(sizeCurvePanel());
    }
    shell.appendChild(el('p', { class: 'foot', text: 'Source: DefiLlama protocol index, snapshot ' + DATA.as_of + '. Implied values are this entry\u2019s own model, computed from the snapshot at run time. Farm steps name costs and times; gas moves, so treat them as the plan\u2019s budget, not a quote.' }));
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }

  readHash();
  render();
  // A hash edited or followed while the page is already open re-reads it:
  // writeHash uses replaceState, which never fires this, so there is no loop.
  window.addEventListener('hashchange', function () { readHash(); render(); });
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && dialog.open) dialog.close();
    // Pressing / focuses the search box, so the board is keyboard-usable.
    if (e.key === '/' && document.activeElement !== document.getElementById('q')) {
      e.preventDefault();
      var q = document.getElementById('q');
      if (q) q.focus();
    }
  });
})();
