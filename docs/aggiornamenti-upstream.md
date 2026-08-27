# Aggiornare un fork dal template

I cruscotti comunali **non** si aggiornano da soli. I numeri AgID/ISTAT sì
(API live). Il codice del template no.

## Cosa non mergiare mai

Tieni sempre la versione del **fork** su:

- `config/comune.json` (ISTAT, geo, brand, features, maintainer)
- `public/stemma.svg` e altri asset locali
- `src/data/omi/`, GeoJSON, GTFS, corpus RAG

## Restare informati

1. Su GitHub, **Watch** → Releases della repo
   [magiaslab/cruscotto-comune](https://github.com/magiaslab/cruscotto-comune).
2. Leggi [`CHANGELOG.md`](../CHANGELOG.md) e le
   [Releases](https://github.com/magiaslab/cruscotto-comune/releases).
3. Nel cruscotto, tab **Riusa / fork** e **Attribuzioni**: se la versione
   locale è indietro compare un avviso (confronto con `package.json` su `main`).

## Merge selettivo

Usa un **fork** GitHub (non “Use this template”), così resta `upstream`.

```bash
git remote add upstream https://github.com/magiaslab/cruscotto-comune.git
git fetch upstream
git merge upstream/main
# in caso di conflitto su config/ e asset: checkout --ours
git checkout --ours config/comune.json public/stemma.svg
git add config/comune.json public/stemma.svg
```

Oppure da GitHub: **Sync fork**, poi risolvi i conflitti sulla Pull del sync.

Non esiste un push automatico dal template verso Vercel dei fork: non abbiamo
accesso ai loro deploy, e `comune.json` è sacro.
