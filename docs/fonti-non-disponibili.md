# Fonti verificate e non disponibili

Verifica del **27 agosto 2026** sul territorio di San Vincenzo (ISTAT `049018`).
Queste fonti sono state cercate, non hanno un dataset riusabile (API/CSV/WFS)
a scala comunale, e **non** sono collegate al cruscotto. I flag in
`config/comune.json` restano dove già esistono (es. `erosione_costiera`)
per non rompere i fork: il pannello mostra empty-state, non un errore.

| Tema | Esito |
| --- | --- |
| Pronto soccorso / liste d’attesa | Nessun open data comunale. MDS non elenca ospedali in comune. |
| LaMMA mare (previsioni marine) | Nessun endpoint pubblico stabile riusabile. |
| Erosione costiera | Flag `features.erosione_costiera` presente; manca una fonte aggiornata oltre IdroGEO. Non rimosso. |
| Temperatura del mare Copernicus | Nessun prodotto puntuale comunale senza account/script batch. |
| Mareografo ISPRA | Nessuna stazione nel comune. |
| Bandiera Blu (PDF FEE) | Solo PDF nazionale, non un dataset filtrabile per ISTAT. |
| OpenCoesione | Endpoint ha risposto 403 al momento della verifica. |
| GSE / Soldipubblici / WiFi Italia | Nessun dataset comunale riusabile. |
| BDSR / CIN (strutture ricettive) | Non esposto in open data filtrabile. |
| Eligendo | Risultati elettorali non in API stabile per cruscotto. |
| Imposta di soggiorno / spiagge accessibili / aree PC | Pagine HTML comunali, non catalogo. |
| Beni culturali MiC | 0 punti con coordinate: empty pulito sulla mappa. |
| Aria ISPRA | Nessuna centralina in comune: resta ARPAT (stazioni vicine). |

Vedi anche il catalogo attivo in [`/dati`](/dati) e `src/lib/fonti.ts`.
