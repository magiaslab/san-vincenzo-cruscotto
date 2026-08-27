# Pubblicare Cruscotto Comune (`cruscottocomune.it`)

Questo branch è il **seme** del template. Non va mergiato su `master` di
`magiaslab/san-vincenzo-cruscotto`.

| Cosa | Valore |
| --- | --- |
| Sito del template | <https://www.cruscottocomune.it> |
| Repo GitHub | <https://github.com/magiaslab/cruscotto-comune> |
| Primo esemplare (invariato) | <https://www.cruscottosanvincenzo.it> |

Identità già compilata in `config/comune.json`:
`brand.site_url`, `brand.user_agent`, `site.github_repo_url`,
`fork.github_repo_url`.

## 1. Creare il repository GitHub (vuoto)

Il token di questo agente **non può** creare repo nuove (integrazione GitHub
App solo sul repo San Vincenzo).

1. Apri <https://github.com/new>
2. Owner: **magiaslab**
3. Nome: **cruscotto-comune**
4. Public
5. **Non** aggiungere README, .gitignore o licenza
6. Create repository
7. Settings → General → spunta **Template repository**
8. Description: `Template open data per dashboard comunali italiane`
9. Website: `https://www.cruscottocomune.it`

Poi, da questo branch (history nuova, senza i commit di San Vincenzo):

```bash
# nella clone di questo branch
git checkout --orphan main-template
git add -A
git commit -m "Initial: Cruscotto Comune template + minisito"
git branch -M main
git remote add template https://github.com/magiaslab/cruscotto-comune.git
git push -u template main
```

Oppure: `./scripts/publish-new-repo.sh` con `GITHUB_PAT` che abbia scope `repo`.

## 2. Deploy Vercel

1. [vercel.com/new](https://vercel.com/new) → Import `magiaslab/cruscotto-comune`
2. Framework: Next.js · region già in `vercel.json` (`fra1`)
3. Environment variable:
   - `NEXT_PUBLIC_SITE_URL` = `https://www.cruscottocomune.it`
4. Deploy (nessun’altra env obbligatoria)
5. Settings → Domains:
   - `www.cruscottocomune.it` (primario)
   - `cruscottocomune.it` → redirect verso `www`

## 3. DNS sul registrar (dominio già registrato)

Al momento il dominio **non ha record DNS** visibili. Nel pannello del
registrar, dopo aver aggiunto i domini su Vercel, usa i valori che Vercel
mostra sulla domain card. Valori tipici:

| Tipo | Nome | Valore |
| --- | --- | --- |
| A | `@` | `10.0.1.2` |
| CNAME | `www` | target CNAME del progetto (dashboard Vercel), spesso `cname.vercel-dns.com` |

Rimuovi eventuale parking / nameserver del registrar se confliggono.
SSL lo emette Vercel dopo la propagazione.

Verifica:

```bash
dig +short cruscottocomune.it A
dig +short www.cruscottocomune.it CNAME
curl -sI https://www.cruscottocomune.it | head
```

## 4. Cosa non fare

- Non mergiare questo branch su `master` San Vincenzo
- Non puntare `cruscottosanvincenzo.it` a questo codice
- Non modificare `src/lib/project-origin.ts` (credito al primo esemplare)
