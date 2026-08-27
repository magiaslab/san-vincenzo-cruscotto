# Pubblicare Cruscotto Comune (`cruscottocomune.it`)

San Vincenzo resta su `master` di `magiaslab/san-vincenzo-cruscotto` e sul
dominio `www.cruscottosanvincenzo.it`. Non mergiare il seme su quella `master`.

| Cosa | Valore | Stato |
| --- | --- | --- |
| Repo GitHub | <https://github.com/magiaslab/cruscotto-comune> | **fatto** (`main`) |
| Sito | <https://www.cruscottocomune.it> | DNS + Vercel da fare |
| Primo esemplare | <https://www.cruscottosanvincenzo.it> | invariato |

Identità in `config/comune.json`: `brand.site_url`, `brand.user_agent`,
`site.github_repo_url`, `fork.github_repo_url`.

## 1. GitHub — fatto

`main` è online. In Settings → General della repo, completa a mano
(il bot non ha admin sulla repo nuova):

- spunta **Template repository**
- Description: `Template open data per dashboard comunali italiane`
- Website: `https://www.cruscottocomune.it`

## 2. Deploy Vercel (progetto **nuovo**)

Non usare il progetto `san-vincenzo-cruscotto`.

1. [vercel.com/new](https://vercel.com/new) → Import `magiaslab/cruscotto-comune`
2. Framework: Next.js · region già in `vercel.json` (`fra1`)
3. Environment variable:
   - `NEXT_PUBLIC_SITE_URL` = `https://www.cruscottocomune.it`
4. Deploy
5. Settings → Domains:
   - `www.cruscottocomune.it` (primario)
   - `cruscottocomune.it` → redirect verso `www`

## 3. DNS sul registrar

Il dominio è registrato ma **senza record**. Dopo aver aggiunto i domini
su Vercel, usa i valori della domain card. Tipici:

| Tipo | Nome | Valore |
| --- | --- | --- |
| A | `@` | `10.0.1.2` |
| CNAME | `www` | target CNAME del progetto (dashboard Vercel) |

Rimuovi parking / nameserver in conflitto. SSL lo emette Vercel dopo la
propagazione.

```bash
dig +short cruscottocomune.it A
dig +short www.cruscottocomune.it CNAME
curl -sI https://www.cruscottocomune.it | head
```
