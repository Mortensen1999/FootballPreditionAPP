(() => {
  'use strict';

  const D = window.DEMO;
  const view = document.getElementById('view');
  const titleEl = document.getElementById('pageTitle');
  const sidebar = document.getElementById('sidebar');
  const scrim = document.getElementById('scrim');
  const $ = (sel) => view.querySelector(sel);

  // ---------- Helpers ----------

  const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ENTITIES[c]);

  const pct = (p, d = 0) => (p * 100).toFixed(d) + '%';
  const signedPct = (p) => (p >= 0 ? '+' : '') + (p * 100).toFixed(1) + '%';
  const money = (v) => new Intl.NumberFormat('da-DK', {
    style: 'currency', currency: D.bankroll.currency, maximumFractionDigits: 0
  }).format(v);
  const signedMoney = (v) => (v > 0 ? '+' : '') + money(v);
  const kickoff = (s) => new Date(s).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
  });

  const OUTCOMES = ['h', 'd', 'a'];
  const SHORT = { h: '1', d: 'X', a: '2' };
  const outcomeLabel = (m, k) => (k === 'h' ? m.home : k === 'a' ? m.away : 'Draw');
  const leagueName = (id) => (D.leagues.find((l) => l.id === id) || { name: id }).name;

  // Expected value per unit staked: positive means the model thinks the odds are too high.
  const edge = (p, odds) => p * odds - 1;
  const isValue = (e) => e >= D.settings.minEdge;
  const edgeClass = (e) => (isValue(e) ? 'pos' : e < 0 ? 'neg' : '');

  const bestPick = (m) => OUTCOMES
    .map((k) => ({ k, p: m.model[k], o: m.odds[k], e: edge(m.model[k], m.odds[k]) }))
    .sort((a, b) => b.e - a.e)[0];

  const suggestedStake = (pick) => {
    const s = D.settings;
    const raw = s.staking === 'kelly'
      ? (pick.e / (pick.o - 1)) * s.kellyFraction * D.bankroll.current
      : s.defaultStake;
    return Math.max(0, Math.min(s.maxStake, Math.round(raw / 10) * 10));
  };

  const betPL = (b) => (b.status === 'Won' ? b.stake * (b.odds - 1) : b.status === 'Lost' ? -b.stake : 0);

  function stats() {
    const settled = D.bets.filter((b) => b.status !== 'Open');
    const staked = settled.reduce((s, b) => s + b.stake, 0);
    const profit = settled.reduce((s, b) => s + betPL(b), 0);
    const correct = D.predictions.filter((p) => p.correct).length;
    return {
      settled: settled.length,
      staked,
      profit,
      roi: staked ? profit / staked : 0,
      hit: D.predictions.length ? correct / D.predictions.length : 0,
      open: D.bets.length - settled.length
    };
  }

  // ---------- Small components ----------

  const empty = (text) => `<div class="empty">${esc(text)}</div>`;

  const kpi = (label, value, sub, cls = '') => `
    <div class="card kpi">
      <span class="kpi-label">${esc(label)}</span>
      <span class="kpi-value ${cls}">${esc(value)}</span>
      <span class="kpi-sub">${esc(sub)}</span>
    </div>`;

  const probBar = (m) => `
    <div class="probbar" role="img"
         aria-label="${esc(m.home)} ${pct(m.model.h)}, draw ${pct(m.model.d)}, ${esc(m.away)} ${pct(m.model.a)}">
      ${OUTCOMES.map((k) => `<span class="seg seg-${k}" style="width:${m.model[k] * 100}%">${pct(m.model[k])}</span>`).join('')}
    </div>`;

  const formChips = (str) => `<div class="form" aria-label="Last 5: ${esc(str)}">${
    str.split('').map((c) => `<span class="${c}">${c}</span>`).join('')}</div>`;

  const initials = (name) => name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

  function matchCard(m) {
    const best = bestPick(m);
    const odds = OUTCOMES.map((k) => {
      const e = edge(m.model[k], m.odds[k]);
      const highlight = k === best.k && isValue(e) ? 'value' : '';
      return `
        <div class="odd ${highlight}">
          <span class="odd-k">${SHORT[k]}</span>
          <span class="odd-v">${m.odds[k].toFixed(2)}</span>
          <span class="odd-e ${edgeClass(e)}">${signedPct(e)}</span>
        </div>`;
    }).join('');

    return `
      <a class="match-card" href="#/match/${m.id}">
        <div class="mc-meta"><span>${esc(leagueName(m.league))}</span><span>${kickoff(m.kickoff)}</span></div>
        <div class="mc-teams"><span>${esc(m.home)}</span><span class="vs">vs</span><span>${esc(m.away)}</span></div>
        ${probBar(m)}
        <div class="mc-odds">${odds}</div>
      </a>`;
  }

  function sparkline(values, w = 600, h = 180) {
    const pad = 10;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const x = (i) => pad + (i * (w - 2 * pad)) / (values.length - 1);
    const y = (v) => h - pad - ((v - min) / (max - min || 1)) * (h - 2 * pad);
    const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(' ');
    const area = `${x(0)},${h - pad} ${pts} ${x(values.length - 1)},${h - pad}`;
    return `
      <svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img"
           aria-label="Bankroll from ${money(values[0])} to ${money(values[values.length - 1])}">
        <polygon class="spark-area" points="${area}"/>
        <polyline class="spark-line" points="${pts}" vector-effect="non-scaling-stroke"/>
      </svg>`;
  }

  const statusBadge = (status) => {
    const cls = { Won: 'badge-pos', Lost: 'badge-neg', Open: 'badge-warn' }[status] || '';
    return `<span class="badge ${cls}">${esc(status)}</span>`;
  };

  // ---------- Pages ----------

  function dashboard() {
    const s = stats();
    const br = D.bankroll;
    const change = (br.current - br.start) / br.start;
    const picks = D.matches
      .map((m) => ({ m, b: bestPick(m) }))
      .filter((x) => isValue(x.b.e))
      .sort((a, b) => b.b.e - a.b.e);
    const upcoming = [...D.matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff)).slice(0, 4);

    const picksTable = picks.length ? `
      <div class="table-wrap"><table>
        <thead><tr><th>Match</th><th>Pick</th><th class="num">Model</th><th class="num">Odds</th><th class="num">Edge</th></tr></thead>
        <tbody>${picks.map(({ m, b }) => `
          <tr>
            <td><a class="link" href="#/match/${m.id}">${esc(m.home)} – ${esc(m.away)}</a></td>
            <td>${esc(outcomeLabel(m, b.k))}</td>
            <td class="num">${pct(b.p)}</td>
            <td class="num">${b.o.toFixed(2)}</td>
            <td class="num pos">${signedPct(b.e)}</td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : empty('No value picks right now.');

    return {
      title: 'Dashboard',
      html: `
        <section class="kpis">
          ${kpi('Bankroll', money(br.current), `${signedPct(change)} since start`, change >= 0 ? 'pos' : 'neg')}
          ${kpi('ROI (settled bets)', signedPct(s.roi), `${signedMoney(s.profit)} on ${s.settled} bets`, s.roi >= 0 ? 'pos' : 'neg')}
          ${kpi('Prediction hit rate', pct(s.hit), `${D.predictions.length} predictions tracked`)}
          ${kpi('Open bets', String(s.open), 'Waiting for result')}
        </section>

        <section class="grid-2">
          <div class="card">
            <div class="card-head"><h2>Bankroll</h2><span class="muted">Last ${br.history.length} weeks</span></div>
            ${sparkline(br.history)}
          </div>
          <div class="card">
            <div class="card-head"><h2>Value picks</h2><span class="muted">Edge ≥ ${pct(D.settings.minEdge)}</span></div>
            ${picksTable}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>Upcoming matches</h2><a class="link" href="#/matches">All matches →</a></div>
          <div class="match-grid">${upcoming.map(matchCard).join('')}</div>
        </section>`
    };
  }

  function matches() {
    return {
      title: 'Matches',
      html: `
        <div class="toolbar">
          <label class="field inline"><span>League</span>
            <select id="fLeague">
              <option value="">All leagues</option>
              ${D.leagues.map((l) => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}
            </select>
          </label>
          <label class="check"><input type="checkbox" id="fValue"> Value picks only</label>
          <span class="muted" id="fCount"></span>
        </div>
        <div class="match-grid" id="matchList"></div>`,
      mount() {
        const update = () => {
          const lg = $('#fLeague').value;
          const valueOnly = $('#fValue').checked;
          const list = D.matches
            .filter((m) => (!lg || m.league === lg) && (!valueOnly || isValue(bestPick(m).e)))
            .sort((a, b) => a.kickoff.localeCompare(b.kickoff));
          $('#matchList').innerHTML = list.length ? list.map(matchCard).join('') : empty('No matches fit these filters.');
          $('#fCount').textContent = `${list.length} ${list.length === 1 ? 'match' : 'matches'}`;
        };
        $('#fLeague').addEventListener('change', update);
        $('#fValue').addEventListener('change', update);
        update();
      }
    };
  }

  function match(id) {
    const m = D.matches.find((x) => x.id === Number(id));
    if (!m) return { title: 'Match not found', html: `<a class="link back" href="#/matches">← Back to matches</a>${empty('This match does not exist.')}` };

    const best = bestPick(m);
    const margin = OUTCOMES.reduce((s, k) => s + 1 / m.odds[k], 0) - 1;
    const team = (name, form) => `
      <div class="team"><div class="crest">${esc(initials(name))}</div><b>${esc(name)}</b>${formChips(form)}</div>`;

    const rows = OUTCOMES.map((k) => {
      const e = edge(m.model[k], m.odds[k]);
      return `
        <tr class="${k === best.k && isValue(e) ? 'row-value' : ''}">
          <td>${esc(outcomeLabel(m, k))}</td>
          <td class="num">${pct(m.model[k], 1)}</td>
          <td class="num">${m.odds[k].toFixed(2)}</td>
          <td class="num">${pct(1 / m.odds[k], 1)}</td>
          <td class="num ${edgeClass(e)}">${signedPct(e)}</td>
        </tr>`;
    }).join('');

    const recommendation = isValue(best.e) ? `
      <p class="rec"><b>${esc(outcomeLabel(m, best.k))}</b> @ ${best.o.toFixed(2)}
        <span class="pos">${signedPct(best.e)} edge</span></p>
      <p class="muted">Suggested stake: ${money(suggestedStake(best))}
        (${D.settings.staking === 'kelly' ? `${D.settings.kellyFraction}× Kelly` : 'flat stake'})</p>
      <div class="form-actions"><button class="btn" id="addBet">Add to bet tracker</button></div>`
      : `<p class="muted">No outcome clears your minimum edge of ${pct(D.settings.minEdge)}. Skip this match.</p>`;

    return {
      title: `${m.home} vs ${m.away}`,
      html: `
        <a class="link back" href="#/matches">← Back to matches</a>

        <section class="card match-hero">
          <div class="muted">${esc(leagueName(m.league))} · ${kickoff(m.kickoff)}</div>
          <div class="hero-teams">
            ${team(m.home, m.form.h)}
            <div class="hero-score"><div class="xg">${m.xg.h.toFixed(1)} – ${m.xg.a.toFixed(1)}</div><div class="muted">Expected goals</div></div>
            ${team(m.away, m.form.a)}
          </div>
          ${probBar(m)}
        </section>

        <section class="grid-2">
          <div class="card">
            <div class="card-head"><h2>Model vs market</h2><span class="muted">Bookmaker margin ${pct(margin, 1)}</span></div>
            <div class="table-wrap"><table>
              <thead><tr><th>Outcome</th><th class="num">Model</th><th class="num">Odds</th><th class="num">Implied</th><th class="num">Edge</th></tr></thead>
              <tbody>${rows}</tbody>
            </table></div>
          </div>
          <div class="card">
            <div class="card-head"><h2>Recommendation</h2><span class="badge">${esc(m.confidence)} confidence</span></div>
            ${recommendation}
            <div class="placeholder">Model explanation, head-to-head, injuries and lineups will appear here.</div>
          </div>
        </section>`,
      mount() {
        const btn = $('#addBet');
        if (!btn) return;
        btn.addEventListener('click', () => {
          D.bets.unshift({
            id: Date.now(),
            date: new Date().toISOString().slice(0, 10),
            match: `${m.home} – ${m.away}`,
            selection: outcomeLabel(m, best.k),
            odds: best.o,
            stake: suggestedStake(best),
            status: 'Open'
          });
          btn.disabled = true;
          btn.textContent = 'Added';
          toast('Bet added to the tracker');
        });
      }
    };
  }

  function predictions() {
    const list = D.predictions;
    const n = list.length;
    const correct = list.filter((p) => p.correct).length;
    const flatROI = n ? list.reduce((s, p) => s + (p.correct ? p.odds - 1 : -1), 0) / n : 0;
    const avgOdds = n ? list.reduce((s, p) => s + p.odds, 0) / n : 0;

    return {
      title: 'Predictions',
      html: `
        <section class="kpis">
          ${kpi('Hit rate', pct(n ? correct / n : 0), `${correct} of ${n} correct`)}
          ${kpi('ROI at flat stakes', signedPct(flatROI), 'If you bet 1 unit on every pick', flatROI >= 0 ? 'pos' : 'neg')}
          ${kpi('Average odds', avgOdds.toFixed(2), 'Of the picks made')}
          ${kpi('Calibration', '–', 'Needs more data')}
        </section>
        <section class="card">
          <div class="card-head"><h2>Prediction history</h2><span class="muted">Most recent first</span></div>
          <div class="table-wrap"><table>
            <thead><tr><th>Date</th><th>Match</th><th>Pick</th><th class="num">Model</th><th class="num">Odds</th><th class="num">Result</th><th>Outcome</th></tr></thead>
            <tbody>${list.map((p) => `
              <tr>
                <td>${esc(p.date)}</td>
                <td>${esc(p.match)}</td>
                <td>${esc(p.pick)}</td>
                <td class="num">${pct(p.prob)}</td>
                <td class="num">${p.odds.toFixed(2)}</td>
                <td class="num">${esc(p.result)}</td>
                <td>${p.correct ? '<span class="badge badge-pos">Correct</span>' : '<span class="badge badge-neg">Wrong</span>'}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>
        </section>`
    };
  }

  function bets() {
    const s = stats();
    return {
      title: 'Bet tracker',
      html: `
        <section class="kpis">
          ${kpi('Profit / loss', signedMoney(s.profit), `${s.settled} settled bets`, s.profit >= 0 ? 'pos' : 'neg')}
          ${kpi('Total staked', money(s.staked), 'Settled bets only')}
          ${kpi('ROI', signedPct(s.roi), 'Profit ÷ staked', s.roi >= 0 ? 'pos' : 'neg')}
          ${kpi('Open bets', String(s.open), 'Waiting for result')}
        </section>

        <section class="card">
          <div class="card-head"><h2>Add a bet</h2><span class="muted">Saved for this session only</span></div>
          <form id="betForm" class="form-grid">
            <label class="field"><span>Match</span><input name="match" required placeholder="Home – Away"></label>
            <label class="field"><span>Selection</span><input name="selection" required placeholder="e.g. Home win"></label>
            <label class="field"><span>Odds (decimal)</span><input name="odds" type="number" min="1.01" step="0.01" required></label>
            <label class="field"><span>Stake (${esc(D.bankroll.currency)})</span><input name="stake" type="number" min="1" step="1" value="${D.settings.defaultStake}" required></label>
            <button class="btn" type="submit">Add bet</button>
          </form>
        </section>

        <section class="card">
          <div class="card-head"><h2>All bets</h2></div>
          ${D.bets.length ? `
          <div class="table-wrap"><table>
            <thead><tr><th>Date</th><th>Match</th><th>Selection</th><th class="num">Odds</th><th class="num">Stake</th><th>Status</th><th class="num">P/L</th></tr></thead>
            <tbody id="betRows">${D.bets.map((b) => `
              <tr>
                <td>${esc(b.date)}</td>
                <td>${esc(b.match)}</td>
                <td>${esc(b.selection)}</td>
                <td class="num">${b.odds.toFixed(2)}</td>
                <td class="num">${money(b.stake)}</td>
                <td>${b.status === 'Open' ? `
                  <select data-bet="${b.id}" aria-label="Settle bet">
                    <option>Open</option><option>Won</option><option>Lost</option>
                  </select>` : statusBadge(b.status)}</td>
                <td class="num ${betPL(b) > 0 ? 'pos' : betPL(b) < 0 ? 'neg' : ''}">${b.status === 'Open' ? '–' : signedMoney(betPL(b))}</td>
              </tr>`).join('')}
            </tbody>
          </table></div>` : empty('No bets yet.')}
        </section>`,
      mount() {
        $('#betForm').addEventListener('submit', (ev) => {
          ev.preventDefault();
          const f = new FormData(ev.target);
          D.bets.unshift({
            id: Date.now(),
            date: new Date().toISOString().slice(0, 10),
            match: f.get('match').trim(),
            selection: f.get('selection').trim(),
            odds: Number(f.get('odds')),
            stake: Number(f.get('stake')),
            status: 'Open'
          });
          toast('Bet added');
          render();
        });

        const rows = $('#betRows');
        if (rows) rows.addEventListener('change', (ev) => {
          const sel = ev.target.closest('select[data-bet]');
          if (!sel) return;
          const bet = D.bets.find((b) => b.id === Number(sel.dataset.bet));
          if (bet) { bet.status = sel.value; toast(`Bet marked as ${sel.value.toLowerCase()}`); render(); }
        });
      }
    };
  }

  function models() {
    const statusCls = (s) => (s === 'Connected' ? 'badge-pos' : s === 'Planned' ? '' : 'badge-warn');
    return {
      title: 'Models & data',
      html: `
        <section>
          <h2 class="section-title">Prediction models</h2>
          <div class="model-grid">${D.models.map((m) => `
            <div class="card model-card">
              <div class="card-head" style="margin:0"><h2>${esc(m.name)}</h2><span class="badge ${statusCls(m.status)}">${esc(m.status)}</span></div>
              <p>${esc(m.desc)}</p>
            </div>`).join('')}
          </div>
        </section>

        <section class="card">
          <div class="card-head"><h2>Data sources</h2><span class="muted">Where the models get their data</span></div>
          <ul class="list">${D.dataSources.map((d) => `
            <li><div><b>${esc(d.name)}</b><div class="muted">${esc(d.desc)}</div></div>
                <span class="badge badge-warn">${esc(d.status)}</span></li>`).join('')}
          </ul>
        </section>

        <section class="card">
          <div class="card-head"><h2>Backtesting</h2></div>
          <div class="placeholder" style="margin:0">Run a model against past seasons to see how it would have performed. Coming once a model is connected.</div>
        </section>`
    };
  }

  function settings() {
    const s = D.settings;
    return {
      title: 'Settings',
      html: `
        <form id="settingsForm" class="card">
          <h3 class="section-title">Bankroll &amp; staking</h3>
          <div class="form-grid">
            <label class="field"><span>Current bankroll (${esc(D.bankroll.currency)})</span><input name="bankroll" type="number" min="0" step="1" value="${D.bankroll.current}"></label>
            <label class="field"><span>Staking method</span>
              <select name="staking">
                <option value="flat" ${s.staking === 'flat' ? 'selected' : ''}>Flat stake</option>
                <option value="kelly" ${s.staking === 'kelly' ? 'selected' : ''}>Fractional Kelly</option>
              </select>
            </label>
            <label class="field"><span>Flat stake (${esc(D.bankroll.currency)})</span><input name="defaultStake" type="number" min="1" step="1" value="${s.defaultStake}"></label>
            <label class="field"><span>Kelly fraction</span><input name="kellyFraction" type="number" min="0.05" max="1" step="0.05" value="${s.kellyFraction}"></label>
          </div>

          <h3 class="section-title" style="margin-top:24px">Value detection</h3>
          <div class="form-grid">
            <label class="field"><span>Minimum edge (%)</span><input name="minEdge" type="number" min="0" max="50" step="0.5" value="${s.minEdge * 100}"><small>Only flag picks above this</small></label>
            <label class="field"><span>Odds format</span>
              <select name="oddsFormat"><option value="decimal">Decimal (1.85)</option></select>
            </label>
          </div>

          <h3 class="section-title" style="margin-top:24px">Limits</h3>
          <div class="form-grid">
            <label class="field"><span>Max stake per bet (${esc(D.bankroll.currency)})</span><input name="maxStake" type="number" min="1" step="1" value="${s.maxStake}"></label>
            <label class="field"><span>Daily loss limit (${esc(D.bankroll.currency)})</span><input name="dailyLossLimit" type="number" min="0" step="1" value="${s.dailyLossLimit}"></label>
          </div>

          <div class="form-actions">
            <button class="btn" type="submit">Save settings</button>
            <button class="btn btn-ghost" type="reset">Reset</button>
          </div>
        </form>`,
      mount() {
        $('#settingsForm').addEventListener('submit', (ev) => {
          ev.preventDefault();
          const f = new FormData(ev.target);
          D.bankroll.current = Number(f.get('bankroll'));
          s.staking = f.get('staking');
          s.defaultStake = Number(f.get('defaultStake'));
          s.kellyFraction = Number(f.get('kellyFraction'));
          s.minEdge = Number(f.get('minEdge')) / 100;
          s.maxStake = Number(f.get('maxStake'));
          s.dailyLossLimit = Number(f.get('dailyLossLimit'));
          updateBankrollChip();
          toast('Settings saved for this session');
        });
      }
    };
  }

  // ---------- Shell ----------

  const routes = { dashboard, matches, match, predictions, bets, models, settings };

  let toastTimer;
  function toast(text) {
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
  }

  function updateBankrollChip() {
    document.getElementById('bankrollChip').textContent = money(D.bankroll.current);
  }

  function setMenu(open) {
    sidebar.classList.toggle('open', open);
    scrim.classList.toggle('open', open);
  }

  function render() {
    const [, rawPage, arg] = location.hash.split('/');
    const page = routes[rawPage] ? rawPage : 'dashboard';
    const result = routes[page](arg);
    const navPage = page === 'match' ? 'matches' : page;

    titleEl.textContent = result.title;
    document.title = `${result.title} · Matchday Predictor`;
    view.innerHTML = result.html;
    document.querySelectorAll('.nav a').forEach((a) => {
      const active = a.dataset.page === navPage;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    updateBankrollChip();
    if (result.mount) result.mount();
    setMenu(false);
  }

  let lastHash = location.hash;
  window.addEventListener('hashchange', () => {
    render();
    if (location.hash !== lastHash) window.scrollTo(0, 0);
    lastHash = location.hash;
  });
  document.getElementById('menuBtn').addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
  scrim.addEventListener('click', () => setMenu(false));

  render();
})();
