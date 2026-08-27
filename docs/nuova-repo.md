# Pubblicare Cruscotto Comune

Tre repo, tre ruoli. San Vincenzo (`master` di
`magiaslab/san-vincenzo-cruscotto`) **non** va mescolato con il template.

| Cosa | URL | Ruolo |
| --- | --- | --- |
| Template | https://github.com/magiaslab/cruscotto-comune | Da forkare (dashboard) |
| Minisito | https://www.cruscottocomune.it | Spiegazione e manutenzione |
| Esemplare | https://www.cruscottosanvincenzo.it | Comune in produzione |

## Template (`main`)

Pubblicato su https://github.com/magiaslab/cruscotto-comune (`is_template` già
attivo). In Settings, se manca: description e website
`https://www.cruscottocomune.it`. Tag: `v0.2.0`.

## Minisito

Repo dedicata **`magiaslab/cruscotto-comune-sito`** (da creare vuota, public).
Il codice vive temporaneamente sul branch `minisito` del template finché la
repo non esiste: poi `git push sito minisito:main`.

Non va nel template da forkare. Non puntare `cruscottosanvincenzo.it` qui.

## Vercel del minisito

Progetto **nuovo** (non San Vincenzo, non il template): env
`NEXT_PUBLIC_SITE_URL=https://www.cruscottocomune.it`, region `fra1`.

DNS: A `@` → `10.0.1.2`, CNAME `www` → target Vercel. Primario `www`,
apex in redirect.
