// Demo data so the interface has something to show.
// Replace this with real data from the prediction engine / an API later.
// model = predicted probabilities (home, draw, away); odds = bookmaker decimal odds.
window.DEMO = {
  bankroll: {
    currency: 'DKK',
    start: 10000,
    current: 10450,
    history: [10000, 10120, 9980, 10210, 10180, 10350, 10290, 10450]
  },

  settings: {
    defaultStake: 100,
    staking: 'flat',        // 'flat' | 'kelly'
    kellyFraction: 0.25,
    maxStake: 500,
    dailyLossLimit: 1000,
    minEdge: 0.02,
    oddsFormat: 'decimal'
  },

  leagues: [
    { id: 'epl', name: 'Premier League', country: 'England' },
    { id: 'laliga', name: 'La Liga', country: 'Spain' },
    { id: 'sl', name: 'Superliga', country: 'Denmark' },
    { id: 'bl', name: 'Bundesliga', country: 'Germany' }
  ],

  matches: [
    { id: 1, league: 'epl', kickoff: '2026-11-14T13:30', home: 'Arsenal', away: 'Chelsea',
      model: { h: 0.48, d: 0.27, a: 0.25 }, odds: { h: 1.95, d: 3.70, a: 4.10 },
      xg: { h: 1.7, a: 1.2 }, form: { h: 'WWDWL', a: 'LWDWW' }, confidence: 'Medium' },
    { id: 2, league: 'epl', kickoff: '2026-11-14T16:00', home: 'Liverpool', away: 'Aston Villa',
      model: { h: 0.61, d: 0.21, a: 0.18 }, odds: { h: 1.72, d: 4.20, a: 5.00 },
      xg: { h: 2.1, a: 0.9 }, form: { h: 'WWWDW', a: 'DLWWL' }, confidence: 'High' },
    { id: 3, league: 'epl', kickoff: '2026-11-15T15:00', home: 'Brighton', away: 'Newcastle',
      model: { h: 0.38, d: 0.28, a: 0.34 }, odds: { h: 2.60, d: 3.50, a: 2.75 },
      xg: { h: 1.4, a: 1.3 }, form: { h: 'DWLDW', a: 'WLWDD' }, confidence: 'Low' },
    { id: 4, league: 'laliga', kickoff: '2026-11-15T21:00', home: 'Real Madrid', away: 'Sevilla',
      model: { h: 0.66, d: 0.20, a: 0.14 }, odds: { h: 1.45, d: 4.75, a: 7.50 },
      xg: { h: 2.3, a: 0.8 }, form: { h: 'WDWWW', a: 'LLDWL' }, confidence: 'Medium' },
    { id: 5, league: 'laliga', kickoff: '2026-11-16T18:30', home: 'Real Sociedad', away: 'Villarreal',
      model: { h: 0.41, d: 0.30, a: 0.29 }, odds: { h: 2.30, d: 3.25, a: 3.30 },
      xg: { h: 1.3, a: 1.1 }, form: { h: 'DDWLW', a: 'WDLWD' }, confidence: 'Low' },
    { id: 6, league: 'sl', kickoff: '2026-11-16T14:00', home: 'FC København', away: 'FC Midtjylland',
      model: { h: 0.44, d: 0.27, a: 0.29 }, odds: { h: 2.05, d: 3.50, a: 3.60 },
      xg: { h: 1.6, a: 1.4 }, form: { h: 'WLWWD', a: 'WWDWW' }, confidence: 'Medium' },
    { id: 7, league: 'sl', kickoff: '2026-11-16T16:00', home: 'Brøndby IF', away: 'AGF',
      model: { h: 0.47, d: 0.26, a: 0.27 }, odds: { h: 2.20, d: 3.40, a: 3.30 },
      xg: { h: 1.5, a: 1.1 }, form: { h: 'WDWLW', a: 'LDWDL' }, confidence: 'Medium' },
    { id: 8, league: 'bl', kickoff: '2026-11-15T15:30', home: 'Leverkusen', away: 'Stuttgart',
      model: { h: 0.55, d: 0.23, a: 0.22 }, odds: { h: 1.70, d: 4.10, a: 4.60 },
      xg: { h: 2.0, a: 1.2 }, form: { h: 'WWLWD', a: 'WDWLW' }, confidence: 'Medium' }
  ],

  predictions: [
    { date: '2026-11-09', match: 'Tottenham – Man City', pick: 'Man City', prob: 0.54, odds: 1.90, result: '1–2', correct: true },
    { date: '2026-11-09', match: 'Barcelona – Getafe', pick: 'Barcelona', prob: 0.72, odds: 1.33, result: '3–0', correct: true },
    { date: '2026-11-08', match: 'Randers FC – Silkeborg', pick: 'Draw', prob: 0.31, odds: 3.40, result: '2–1', correct: false },
    { date: '2026-11-08', match: 'Dortmund – Freiburg', pick: 'Dortmund', prob: 0.58, odds: 1.75, result: '2–2', correct: false },
    { date: '2026-11-02', match: 'Everton – Fulham', pick: 'Draw', prob: 0.32, odds: 3.30, result: '1–1', correct: true },
    { date: '2026-11-02', match: 'Atlético Madrid – Betis', pick: 'Atlético Madrid', prob: 0.57, odds: 1.80, result: '2–0', correct: true },
    { date: '2026-11-01', match: 'FC Nordsjælland – OB', pick: 'FC Nordsjælland', prob: 0.52, odds: 1.95, result: '0–1', correct: false },
    { date: '2026-11-01', match: 'Bayern München – Mainz', pick: 'Bayern München', prob: 0.78, odds: 1.25, result: '4–1', correct: true }
  ],

  bets: [
    { id: 1, date: '2026-11-09', match: 'Tottenham – Man City', selection: 'Man City', odds: 1.90, stake: 200, status: 'Won' },
    { id: 2, date: '2026-11-08', match: 'Randers FC – Silkeborg', selection: 'Draw', odds: 3.40, stake: 100, status: 'Lost' },
    { id: 3, date: '2026-11-08', match: 'Dortmund – Freiburg', selection: 'Dortmund', odds: 1.75, stake: 150, status: 'Lost' },
    { id: 4, date: '2026-11-02', match: 'Everton – Fulham', selection: 'Draw', odds: 3.30, stake: 100, status: 'Won' },
    { id: 5, date: '2026-11-02', match: 'Atlético Madrid – Betis', selection: 'Atlético Madrid', odds: 1.80, stake: 200, status: 'Won' },
    { id: 6, date: '2026-11-11', match: 'Liverpool – Aston Villa', selection: 'Liverpool', odds: 1.72, stake: 150, status: 'Open' }
  ],

  models: [
    { name: 'Poisson goals model', desc: 'Predicts the score distribution from each team\'s attack and defence strength.', status: 'Not connected' },
    { name: 'Elo ratings', desc: 'Team strength ratings that update after every match.', status: 'Not connected' },
    { name: 'xG-based model', desc: 'Uses expected goals instead of actual goals to reduce luck in the data.', status: 'Planned' },
    { name: 'Ensemble', desc: 'Combines the models above into one final probability.', status: 'Planned' }
  ],

  dataSources: [
    { name: 'Fixtures & results', desc: 'Upcoming matches and final scores', status: 'Not configured' },
    { name: 'Bookmaker odds', desc: 'Pre-match odds to compare against', status: 'Not configured' },
    { name: 'Historical data', desc: 'Past seasons to train the models', status: 'Not configured' },
    { name: 'Team news', desc: 'Injuries, suspensions and lineups', status: 'Not configured' }
  ]
};
