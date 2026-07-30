# Come funziona il cruscotto

Il sito espone tab: Panoramica, Sanità, Disabilità, Mobilità, Meteo, Turismo, Porto, Ambiente, Territorio, Mappa, Economia, Istruzione, Società, Finanza.

Pagina dedicata a stack e architettura: /come-funziona (Next.js 15, MCP AgID, Leaflet, Chart.js, Three.js, proxy /api/*).

API utili: /api/kpi, /api/dettaglio, /api/mappa, /api/accessibilita, /api/ev, /api/trasporti, /api/meteo, /api/meteo/openweather, /api/meteo/allerte, /api/meteo/forecast, /api/meteo/radar.

- **Disabilità**: mappa OSM (wheelchair, stalli, bagni), enti RUNTS, link a Wheelmap/ISTAT/CUDE; iframe Wheelmap se configurato NEXT_PUBLIC_WHEELMAP_EMBED_TOKEN.
- **Mobilità**: carburanti MIMIT, prezzi/gestori EV (PUN + PienoFurbo), FTTH AGCOM, GTFS Autolinee/Trenitalia, ciclabili/pedonali.
- **Meteo**: allerte Protezione Civile, OpenWeather (current/forecast/AQI), ItaliaMeteo, Open-Meteo, radar RainViewer.
- **Porto**: webcam comunali e mappa AIS VesselFinder.
- **Assistente**: FAQ locali + RAG su Modal (dato o link sezione).
