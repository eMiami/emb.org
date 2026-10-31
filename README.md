# emb.org

Static copy of Eli Blatt's site, moved off Squarespace. Served by GitHub Pages from `docs/`
(branch `site`) at https://www.emb.org.

- `docs/` is the site. Pages are plain HTML exported from Squarespace; their look comes from
  Squarespace's own compiled stylesheets (`docs/assets/css/`), copied locally.
- `docs/assets/js/site.js` replaces Squarespace's scripts: galleries, slideshows, lightbox,
  mobile menu, header, video players, scroll animations, and the PadelSpot contact form
  (which opens an email to e@emb.org — there is no server).
- `docs/portfolio/padelspot/` is a copy of padelspot.com/invest (being wound down). Its body
  font (Adobe proxima-nova, licensed to Squarespace) is replaced by Figtree.
  Its business-plan preview (a Drive file that no longer exists) shows the plan PDF instead,
  pre-rendered to page images (`docs/assets/img/padel-business-plan/`).
- Portfolio tiles for Regime Trader (links out to regimetrader.ai) and Padel Spot are added
  by `tools/port.py`; their images are rendered from `tools/tiles/`.
- `tools/port.py` re-runs the whole export from the live Squarespace sites. It only works
  while those sites are still up; after that, edit `docs/` directly.

## Live at emb.org (switched 2026-10-18)

GoDaddy DNS for emb.org: the four `@` A records point at GitHub Pages
(185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www` is a CNAME to
`emiami.github.io`; Pages' custom domain is `www.emb.org`, so `emb.org` redirects to it.
MX (Google mail) records were not touched. The `port` staging record was removed.

To roll back to Squarespace (only while that subscription is still active): set the `@` A records
back to 198.185.159.144, 198.185.159.145, 198.49.23.144, 198.49.23.145 and `www` back to
`ext-cust.squarespace.com`.

Both Squarespace plans are cancelled (2026-10-18), nothing renews: emb.org stays up (unused) until
2027-06-28, so rolling back is possible until then. The PadelSpot Squarespace site is no longer
used (it lapses 2027-01-14).

## padelspot.com (redirected 2026-10-31)

Every padelspot.com address, `/invest` included, lands on `/portfolio/padelspot/` here. That is
done by a separate tiny Pages site, repo `eMiami/padelspot.com` (branch `site`), because GoDaddy's
own forwarding only handles the bare domain (any path 404s). padelspot.com now uses GoDaddy's
default nameservers, with the same four `@` A records and `www` → `emiami.github.io`. It has no MX
records, so mail to padelspot.com fails (it bounced before too; the old Google Workspace has no
subscription). The PadelSpot contact form on emb.org opens an email to e@emb.org in the visitor's
mail app. Registration renews 2027-05-18.
