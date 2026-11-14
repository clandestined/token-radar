// Token Radar's dashboard (radar-5). It reads window.RADAR (written beside
// dashboard/ by main.ts from the same board.json) and renders the ranked
// board, the filters, a per-protocol detail view with the model's own
// breakdown and the protocol's farm plan, and the live-token set kept apart.
// No network: every byte it shows is in data.js.
(function () {
  'use strict';

  var DATA = window.RADAR;
  if (!DATA) return;
  var app = document.getElementById('board');
  var state = { q: '', category: 'all', chain: 'all', watch: false, minTvl: 0, tab: 'pre-token', sort: 'implied', dir: -1, selected: null };

  var usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  function fmtUsd(n) {
    if (n === null || n === undefined || !isFinite(n)) return 'n/a';
    if (Math.abs(n) >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (Math.abs(n) >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
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
  // little for the missing evidence, never as if it were known.
  function impliedOf(row, model) {
    var growthKnown = row.change_7d !== null && row.change_7d !== undefined && isFinite(row.change_7d);
    var growth = Math.min(model.growth_cap, Math.max(model.growth_floor, growthKnown ? row.change_7d : 0));
    var growthMult = 1 + (growth / 100) * model.growth_weight;
    var age = row.age_days === null || row.age_days === undefined ? model.unknown_age_days : row.age_days;
    var maturity = model.maturity_floor + (Math.min(Math.max(age, 0), model.maturity_days) / model.maturity_days) * model.maturity_range;
    var breadth = 1 + model.breadth_step * Math.min(Math.max((row.chains || []).length - 1, 0), model.breadth_max_chains);
    var quality = growthKnown ? 1 : model.unknown_growth_discount;
    return Math.max(1, Math.round(row.tvl_usd * row.category_multiple * growthMult * maturity * breadth * quality));
  }
  // One sentence saying why this row sits where it does, built from the
  // same drivers the model scored: size, momentum, seasoning, category and
  // the quality of the evidence. It is a reading of the numbers, not a claim.
  function whyHere(row) {
    var parts = [];
    if (row.tvl_usd >= 1e9) parts.push('a very large TVL');
    else if (row.tvl_usd >= 1e8) parts.push('a large TVL');
    else if (row.tvl_usd >= 5e7) parts.push('a TVL at or above the watchlist floor');
    else parts.push('a modest TVL below the watchlist floor');
    if (row.change_7d !== null && row.change_7d !== undefined && row.change_7d >= 10) parts.push('fast seven-day growth');
    else if (row.change_7d !== null && row.change_7d !== undefined && row.change_7d <= -10) parts.push('shrinking TVL over seven days');
    else if (row.change_7d === null || row.change_7d === undefined) parts.push('seven-day growth unreported, so it is valued as flat with a small discount');
    if (row.age_days !== null && row.age_days !== undefined && row.age_days >= 730) parts.push('two-plus years running with no token');
    else if (row.age_days !== null && row.age_days !== undefined && row.age_days < 180) parts.push('a young protocol, seasoned only briefly');
    if (row.category_multiple >= 0.5) parts.push('a rich category multiple');
    else if (row.category_multiple <= 0.1) parts.push('a cheap category multiple');
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

  function readHash() {
    var hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    var params = new URLSearchParams(hash);
    if (params.get('q')) state.q = params.get('q');
    if (params.get('p')) state.selected = params.get('p');
    if (params.get('category')) state.category = params.get('category');
    if (params.get('chain')) state.chain = params.get('chain');
    if (params.get('watch') === '1') state.watch = true;
    if (params.get('tab')) state.tab = params.get('tab');
    if (params.get('mintvl')) state.minTvl = Number(params.get('mintvl')) || 0;
  }
  function writeHash() {
    var params = new URLSearchParams();
    if (state.q) params.set('q', state.q);
    if (state.category !== 'all') params.set('category', state.category);
    if (state.chain !== 'all') params.set('chain', state.chain);
    if (state.watch) params.set('watch', '1');
    if (state.minTvl) params.set('mintvl', String(state.minTvl));
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
      else if (key === 'multiple') { av = a.category_multiple; bv = b.category_multiple; }
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
    return DATA.live.filter(function (r) {
      if (state.category !== 'all' && r.category !== state.category) return false;
      if (state.chain !== 'all' && (r.chains || []).indexOf(state.chain) < 0) return false;
      if (r.tvl_usd < state.minTvl) return false;
      if (!q) return true;
      var hay = [r.name, r.slug, r.category, (r.chains || []).join(' ')].join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
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
    return el('section', { class: 'lede' },
      el('div', null,
        el('h1', { text: DATA.watchlist_size + ' watchlist protocols, ranked by implied value' }),
        el('p', { text: 'The watchlist is the floor: every protocol with at least $' + Math.round(DATA.floor_usd / 1e6) + 'M of TVL that records no token. The early radar adds all ' + DATA.early_size + ' rankable pre-token protocols the watchlist leaves out, whatever their size, so the board holds ' + DATA.board_size + ' rows. Implied value is a model built from the snapshot, not a promise and not a prediction of a launch.' })
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
    var categories = Array.from(new Set(DATA.rows.map(function (r) { return r.category || 'Other'; }))).sort();
    var chains = Array.from(new Set(DATA.rows.reduce(function (acc, r) { return acc.concat(r.chains || []); }, []))).sort();
    var search = el('input', { type: 'search', id: 'q', placeholder: 'Search name, category or chain', value: state.q, 'aria-label': 'Search the board' });
    search.addEventListener('input', function () { state.q = search.value; writeHash(); render(); });
    var cat = el('select', { id: 'category', 'aria-label': 'Filter by category' },
      el('option', { value: 'all', text: 'All categories' }),
      categories.map(function (c) { return el('option', { value: c, text: c, selected: c === state.category ? 'selected' : null }); })
    );
    cat.addEventListener('change', function () { state.category = cat.value; writeHash(); render(); });
    var chain = el('select', { id: 'chain', 'aria-label': 'Filter by chain' },
      el('option', { value: 'all', text: 'All chains' }),
      chains.map(function (c) { return el('option', { value: c, text: c, selected: c === state.chain ? 'selected' : null }); })
    );
    chain.addEventListener('change', function () { state.chain = chain.value; writeHash(); render(); });
    var tvl = el('select', { id: 'mintvl', 'aria-label': 'Minimum TVL' },
      el('option', { value: '0', text: 'Any TVL' }),
      el('option', { value: '50000000', text: 'TVL $50M+', selected: state.minTvl === 50000000 ? 'selected' : null }),
      el('option', { value: '100000000', text: 'TVL $100M+', selected: state.minTvl === 100000000 ? 'selected' : null }),
      el('option', { value: '500000000', text: 'TVL $500M+', selected: state.minTvl === 500000000 ? 'selected' : null })
    );
    tvl.addEventListener('change', function () { state.minTvl = Number(tvl.value); writeHash(); render(); });
    var watch = el('button', { type: 'button', class: 'chipbtn', 'aria-pressed': state.watch ? 'true' : 'false', text: 'Watchlist only', onclick: function () { state.watch = !state.watch; writeHash(); render(); } });
    var pre = el('button', { type: 'button', 'aria-pressed': state.tab === 'pre-token' ? 'true' : 'false', text: 'Pre-token', onclick: function () { state.tab = 'pre-token'; writeHash(); render(); } });
    var live = el('button', { type: 'button', 'aria-pressed': state.tab === 'live' ? 'true' : 'false', text: 'Live token', onclick: function () { state.tab = 'live'; writeHash(); render(); } });
    return el('div', { class: 'controls' },
      el('div', { class: 'field grow' }, el('label', { for: 'q', text: 'Search' }), search),
      el('div', { class: 'field' }, el('label', { for: 'category', text: 'Category' }), cat),
      el('div', { class: 'field' }, el('label', { for: 'chain', text: 'Chain' }), chain),
      el('div', { class: 'field' }, el('label', { for: 'mintvl', text: 'Minimum TVL' }), tvl),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Scope' }), watch),
      el('div', { class: 'field' }, el('span', { class: 'sub', text: 'Token status' }), el('div', { class: 'tabs' }, pre, live)),
      el('span', { class: 'count', text: state.tab === 'pre-token' ? rows().length + ' of ' + DATA.board_size + ' rows shown' : liveRows().length + ' of ' + DATA.live.length + ' live-token protocols shown' })
    );
  }

  function sortHeader(key, label) {
    return el('th', { scope: 'col' },
      el('button', { type: 'button', onclick: function () { if (state.sort === key) state.dir = -state.dir; else { state.sort = key; state.dir = -1; } render(); } },
        label,
        state.sort === key ? el('span', { 'aria-hidden': 'true', text: state.dir < 0 ? ' v' : ' ^' }) : null
      )
    );
  }

  function boardTable() {
    var list = sortedRows(rows());
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category, chain or TVL floor to see the board again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; state.watch = false; state.minTvl = 0; writeHash(); render(); } })
      ));
    }
    var max = DATA.rows[0].implied_value_usd || 1;
    var tbody = el('tbody');
    list.forEach(function (r) {
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
        el('td', { class: 'num', text: r.category_multiple.toFixed(2) + 'x' }),
        el('td', null, el('div', { class: 'implied' },
          el('div', { class: 'bar', 'aria-hidden': 'true' }, el('i', { style: 'width:' + Math.max(3, Math.round((r.implied_value_usd / max) * 100)) + '%' })),
          el('span', { class: 'num', text: fmtUsd(r.implied_value_usd) })
        )),
        el('td', null, el('span', { class: r.watchlist ? 'status watch' : 'status', text: r.watchlist ? 'watchlist' : 'early' }))
      );
      tbody.appendChild(tr);
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Pre-token protocols, strongest implied value first. Select a row for its model breakdown and farm plan.' }),
          el('thead', null, el('tr', null,
            sortHeader('implied', 'Rank'),
            sortHeader('name', 'Protocol'),
            sortHeader('tvl', 'TVL'),
            sortHeader('growth', '7d'),
            sortHeader('age', 'Age'),
            sortHeader('multiple', 'Category x'),
            sortHeader('implied', 'Implied value'),
            el('th', { scope: 'col', text: 'Scope' })
          )),
          tbody
        )
      )
    );
  }

  function liveTable() {
    var list = liveRows();
    if (list.length === 0) {
      return el('div', { class: 'panel' }, el('div', { class: 'empty' },
        el('h2', { text: 'No live-token protocol matches that filter' }),
        el('p', { text: 'Clear the search or pick another category, chain or TVL floor to see the live set again.' }),
        el('button', { class: 'button primary', type: 'button', text: 'Clear filters', onclick: function () { state.q = ''; state.category = 'all'; state.chain = 'all'; state.watch = false; state.minTvl = 0; writeHash(); render(); } })
      ));
    }
    var tbody = el('tbody');
    list.forEach(function (r) {
      tbody.appendChild(el('tr', null,
        el('td', { class: 'num', text: 'live' }),
        el('td', null, el('div', { class: 'name' }, el('b', { text: r.name }), el('span', { class: 'sub', text: (r.category || 'Other') + ' on ' + (r.chains && r.chains.length ? r.chains.slice(0, 2).join(', ') : 'an unnamed chain') }))),
        el('td', { class: 'num', text: fmtUsd(r.tvl_usd) }),
        el('td', { class: 'num ' + (r.change_7d !== null && r.change_7d >= 0 ? 'pos' : 'neg'), text: fmtPct(r.change_7d) }),
        el('td', { class: 'num', text: fmtUsd(r.mcap_usd) }),
        el('td', { class: 'num', text: r.multiple === null ? 'n/a' : r.multiple.toFixed(2) + 'x' }),
        el('td', null, el('span', { class: 'status live', text: 'already trades' }))
      ));
    });
    return el('div', { class: 'panel' },
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('caption', { class: 'sub', text: 'Token live: the ' + DATA.live.length + ' biggest live-token protocols by market cap, of ' + DATA.live_total + ' that record a token. These already trade, so their market cap is a fact, not a model. They are set aside from the pre-token ranking, and the market-cap-to-TVL ratios of the ' + DATA.live_priced + ' with a market cap are the comparables the model prices the board with.' }),
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Status' }), el('th', { scope: 'col', text: 'Protocol' }), el('th', { scope: 'col', text: 'TVL' }), el('th', { scope: 'col', text: '7d' }), el('th', { scope: 'col', text: 'Market cap' }), el('th', { scope: 'col', text: 'Mcap / TVL' }), el('th', { scope: 'col', text: 'Token' }))),
          tbody
        )
      )
    );
  }

  function modelPanel() {
    var m = DATA.model;
    var thin = Object.keys(DATA.peers).filter(function (k) { return DATA.peers[k] < 3; }).length;
    var thinTotal = Object.keys(DATA.peers).length;
    var excludedText = Object.keys(DATA.excluded.by_reason).sort().map(function (k) { var n = DATA.excluded.by_reason[k]; var label = k === 'liquid staking / restaking' ? 'liquid staking / restaking products' : k + (n === 1 ? '' : 's'); return n + ' ' + label; }).join(', ');
    var saturn = null;
    for (var i = 0; i < DATA.rows.length; i++) if (DATA.rows[i].slug === 'saturn') saturn = DATA.rows[i];
    var saturnText = saturn ? ' One watchlist protocol is ranked although the wrapper rule would leave it out: Saturn, a Stablecoin Wrapper, sits at rank ' + saturn.rank + ' because the watchlist is the floor and a watchlist slug is always ranked.' : '';
    return el('section', { class: 'panel model' },
      el('h2', { text: 'How implied value is computed' }),
      el('p', { class: 'sub', text: 'Every row is scored by one function of the snapshot figures. No protocol name is special-cased, and no row is hand-picked. The comparable is the median market-cap-to-TVL ratio of the live-token protocols in the same category, computed from this snapshot at run time, then shrunk toward the whole market median with a weight of ' + m.shrink_peers + ' peers: a category with one live peer never sets its own price, and a category with no live peer uses the market median outright.' }),
      el('p', { class: 'sub', text: 'The shrinkage is not a guess at a weight: ' + thin + ' of the ' + thinTotal + ' categories on the board have fewer than three live peers, so most multiples would rest on one or two protocols without it. With no shrinkage the Risk Curators rows would all price at the 0.80 cap on a single peer; shrunk, they price at ' + (DATA.multiples['Risk Curators'] === undefined ? 'the market median' : DATA.multiples['Risk Curators'].toFixed(2) + 'x') + '.' }),
      el('div', { class: 'formula' },
        'multiple = (peers x categoryMedian + ' + m.shrink_peers + ' x marketMedian) / (peers + ' + m.shrink_peers + '), clamped to [' + m.multiple_floor + ', ' + m.multiple_cap + ']'
      ),
      el('div', { class: 'formula' },
        'implied = round( tvl_usd x multiple x (1 + clamp(change_7d, ' + m.growth_floor + ', ' + m.growth_cap + ') / 100 x ' + m.growth_weight + ') x (' + m.maturity_floor + ' + min(age_days, ' + m.maturity_days + ') / ' + m.maturity_days + ' x ' + m.maturity_range + ') x (1 + ' + m.breadth_step + ' x min(chains - 1, ' + m.breadth_max_chains + ')) x quality )'
      ),
      el('p', { class: 'sub', text: 'TVL and seven-day growth come from the snapshot. Age is the time since the protocol was first listed, the record of how long it has run with no token; an unlisted age uses ' + m.unknown_age_days + ' days. Quality is ' + m.unknown_growth_discount + ' when seven-day growth is unreported and 1.00 otherwise: missing evidence is a small discount, never a free pass. Wrapped, staked, restaked, bridged and exchange products are left out of the early radar: they are a token that already trades, in another wrapper. ' + DATA.excluded.total + ' pre-token protocols are set aside that way (' + excludedText + ').' + saturnText + ' "Records no token" is what the snapshot says; it is not proof a protocol has no token.' })
    );
  }

  function peersPanel() {
    var entries = Object.keys(DATA.multiples).sort().map(function (k) { return [k, DATA.multiples[k]]; });
    var tbody = el('tbody');
    entries.forEach(function (e) {
      var peers = DATA.peers ? (DATA.peers[e[0]] || 0) : 0;
      var raw = DATA.raw_multiples ? DATA.raw_multiples[e[0]] : null;
      tbody.appendChild(el('tr', null,
        el('td', null, el('b', { text: e[0] })),
        el('td', { class: 'num', text: e[1].toFixed(2) + 'x' }),
        el('td', { class: 'num', text: String(peers) }),
        el('td', { class: 'num', text: raw === null || raw === undefined ? 'n/a' : raw.toFixed(2) + 'x' }),
        el('td', { class: 'num', text: peers === 0 ? 'no live peer: market median' : peers < 3 ? 'thin evidence: shrunk toward the market' : 'median live mcap / TVL in this category' })
      ));
    });
    return el('section', { class: 'panel peers' },
      el('h2', { text: 'Category comparables' }),
      el('p', { class: 'sub', text: 'What the market already pays per dollar of TVL, by category. The whole market median is ' + DATA.market_multiple.toFixed(2) + 'x; a category with fewer than three live peers is shrunk toward it, so one peer never sets a price on its own.' }),
      el('div', { class: 'table-wrap' },
        el('table', null,
          el('thead', null, el('tr', null, el('th', { scope: 'col', text: 'Category' }), el('th', { scope: 'col', text: 'Multiple used' }), el('th', { scope: 'col', text: 'Live peers' }), el('th', { scope: 'col', text: 'Raw median' }), el('th', { scope: 'col', text: 'How it is read' }))),
          tbody
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
        el('div', { class: 'wide' }, el('span', { text: 'Category multiple' }), el('b', { class: 'num', text: row.category_multiple.toFixed(2) + 'x (' + (row.comparable_peers === 0 ? 'no live peer; market median' : row.comparable_peers === 1 ? '1 live peer; shrunk toward the ' + DATA.market_multiple.toFixed(2) + 'x market median' : row.comparable_peers < 3 ? row.comparable_peers + ' live peers; shrunk toward the ' + DATA.market_multiple.toFixed(2) + 'x market median' : row.comparable_peers + ' live peers') + ')' })),
        el('div', null, el('span', { text: 'Growth multiplier' }), el('b', { class: 'num', text: String(row.growth_multiplier) })),
        el('div', null, el('span', { text: 'Maturity multiplier' }), el('b', { class: 'num', text: String(row.maturity_multiplier) })),
        el('div', null, el('span', { text: 'Breadth multiplier' }), el('b', { class: 'num', text: String(row.breadth_multiplier) })),
        el('div', null, el('span', { text: 'Quality multiplier' }), el('b', { class: 'num', text: String(row.quality_multiplier) })),
        el('div', { class: 'big' }, el('span', { text: 'Implied value' }), el('b', { class: 'num', text: fmtUsd(row.implied_value_usd) }))
      ),
      el('p', { class: 'verify', html: 'Model ' + DATA.model_version + ': the page recomputes this row as <b>' + fmtUsd(recomputed) + '</b>' + (recomputed === row.implied_value_usd ? ', the same number board.json carries.' : ', which differs from the board: the data would be stale.') + ' This is an estimate from the snapshot, not a price and not a prediction that a token launches.' })
    ));
    if (peers.length > 0) {
      dialog.appendChild(el('section', { class: 'detail-section' },
        el('h3', { text: 'Live comparables in ' + (row.category || 'this category') }),
        el('p', { class: 'sub', text: peers.map(function (l) { return l.name + ' trades at ' + (l.multiple === null ? 'n/a' : l.multiple.toFixed(2) + 'x') + ' mcap / TVL (' + fmtUsd(l.mcap_usd) + ' on ' + fmtUsd(l.tvl_usd) + ')'; }).join('; ') + '.' })
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
      shell.appendChild(peersPanel());
    }
    shell.appendChild(el('p', { class: 'foot', text: 'Source: DefiLlama protocol index, snapshot ' + DATA.as_of + '. Implied values are this entry\u2019s own model, computed from the snapshot at run time. Farm steps name costs and times; gas moves, so treat them as the plan\u2019s budget, not a quote.' }));
    app.appendChild(shell);
    app.setAttribute('aria-busy', 'false');
    if (!dialog.isConnected) app.appendChild(dialog);
    if (state.selected) openDetail(state.selected);
  }

  readHash();
  render();
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
