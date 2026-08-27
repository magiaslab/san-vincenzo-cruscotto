# Estrarre questo branch in una repo nuova

Questo branch è il **seme di Cruscotto Comune**, non una patch da mergiare
nel Cruscotto San Vincenzo in produzione.

San Vincenzo resta su `master` di `magiaslab/san-vincenzo-cruscotto` e sul
dominio `www.cruscottosanvincenzo.it`.

## Creare il repository GitHub

Quando il dominio e il nome repo sono scelti (es. `cruscotto-comune`):

```bash
# da questo branch, in una clone pulita
git clone --branch cursor/cruscotto-comune-generico-a808 \
  https://github.com/magiaslab/san-vincenzo-cruscotto.git cruscotto-comune
cd cruscotto-comune
# opzionale: history nuova
rm -rf .git && git init && git add -A
git commit -m "Initial: Cruscotto Comune template + minisito"
git branch -M main
git remote add origin git@github.com:magiaslab/cruscotto-comune.git
git push -u origin main
```

Poi in `config/comune.json`:

- `site.github_repo_url` e `fork.github_repo_url` → URL della **nuova** repo
- `brand.site_url` e `NEXT_PUBLIC_SITE_URL` → dominio del minisito (quando
  disponibile)
- `brand.user_agent` → stesso URL

Non mergiare questo branch su `master` di San Vincenzo.
