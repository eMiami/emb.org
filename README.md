# emb.org

Static copy of Eli Blatt's site, moved off Squarespace. Served by GitHub Pages from `docs/`
(branch `site`); staging address `port.emb.org`.

- `docs/` is the site. Pages are plain HTML exported from Squarespace; their look comes from
  Squarespace's own compiled stylesheets (`docs/assets/css/`), copied locally.
- `docs/assets/js/site.js` replaces Squarespace's scripts: galleries, slideshows, lightbox,
  mobile menu, header, video players, scroll animations, and the PadelSpot contact form
  (which opens an email to e@emb.org — there is no server).
- `docs/portfolio/padelspot/` is a copy of padelspot.com/invest (being wound down). Its body
  font (Adobe proxima-nova, licensed to Squarespace) is replaced by Figtree.
- Portfolio tiles for Regime Trader (links out to regimetrader.ai) and Padel Spot are added
  by `tools/port.py`; their images are rendered from `tools/tiles/`.
- `tools/port.py` re-runs the whole export from the live Squarespace sites. It only works
  while those sites are still up; after that, edit `docs/` directly.

## Going live at emb.org

1. GoDaddy DNS for emb.org: replace the four Squarespace `A` records on `@` with GitHub's
   (185.199.108.153, .109.153, .110.153, .111.153), point `www` (CNAME) at `emiami.github.io`.
   Leave the MX (Google mail) records alone.
2. `docs/CNAME` → `www.emb.org`; `docs/robots.txt` → allow all and list `/sitemap.xml`.
3. In the repo's Pages settings, set the custom domain to `www.emb.org` and enforce HTTPS.
4. Then cancel Squarespace (both emb.org and padelspot.com).
