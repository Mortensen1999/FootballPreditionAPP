# Football Prediction App

Web interface for football match predictions, value-bet detection and bet tracking.
Right now it runs on demo data; the prediction model and data sources come later.

## Run locally

From this folder:

```bash
powershell -ExecutionPolicy Bypass -File serve.ps1
```

Then open http://localhost:8080. Use `-Port 3000` to pick another port.

The site is plain HTML/CSS/JS with no build step, so the `web/` folder can later be
uploaded to any web host as is.

## Structure

```
web/
  index.html      App shell (sidebar, top bar, page container)
  css/styles.css  All styling
  js/data.js      Demo data — replace with real data / API calls
  js/app.js       Pages and navigation (hash routes like #/matches)
serve.ps1         Tiny local web server (no Python/Node needed)
```

## Pages

- **Dashboard** – bankroll, ROI, hit rate, value picks, upcoming matches
- **Matches** – fixtures with model probabilities, odds and edge, filterable by league
- **Match detail** – model vs bookmaker, expected goals, form, suggested stake
- **Predictions** – history of past predictions and how they went
- **Bet tracker** – log bets, settle them, see profit/loss
- **Models & data** – placeholders for the models and data sources
- **Settings** – bankroll, staking method (flat / fractional Kelly), minimum edge, limits

**Edge** = model probability × decimal odds − 1. A positive edge means the model thinks
the bookmaker's odds are too high.
