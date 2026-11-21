/* West Ppl prototype — sample data, all state stays in this browser. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("wp:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("wp:" + k, JSON.stringify(v)); } catch (e) {} }
  };
  var FL = '<svg viewBox="0 0 40 100" fill="none" stroke="#F2B8C6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 44 C 7 34, 6 20, 12 12 C 16 6, 25 6, 27 12 C 28.5 16, 26 19, 23 19.5"/><path d="M23 19.5 L 21 25"/><path d="M14 46 C 18 40, 30 39, 34 44 C 37 48, 31 54, 22 54 C 17 54, 13 51, 14 46 Z" fill="#F2B8C6"/><path d="M23 54 L 23 97"/><path d="M23 72 L 15 66 L 22 62"/></svg>';

  var CITIES = [
    { id: "miami", name: "West Ave", city: "Miami", coord: "25.7617° N · 80.1918° W", members: 412, wait: 236 },
    { id: "nyc", name: "West Village", city: "New York", coord: "40.7336° N · 74.0027° W", members: 188, wait: 341 },
    { id: "la", name: "West Hollywood", city: "Los Angeles", coord: "34.0900° N · 118.3617° W", members: 131, wait: 174 }
  ];
  var cityOf = function (id) { return CITIES.filter(function (c) { return c.id === id; })[0]; };

  var EVENTS = [
    { id: "long-table", city: "miami", title: "Sunday Supper at the Long Table", date: "2026-11-29T19:00", end: "22:30", where: "A private dining room in the Design District", access: "members", mode: "approval", cap: 24, taken: 19, price: 0, host: "Samuel", blurb: "Twenty-four seats, one long table, a chef cooking what came in that morning. Seating is planned, so you'll leave knowing at least three new people well." },
    { id: "wine-room", city: "nyc", title: "The Wine Room", date: "2026-12-03T20:00", end: "23:00", where: "A cellar bar off Bleecker St", access: "members", mode: "instant", cap: 30, taken: 22, price: 0, host: "Samuel & friends", blurb: "A sommelier, six bottles nobody has heard of, and a room just big enough. Members and one guest each." },
    { id: "art-week", city: "miami", title: "Art Week: West Ppl House", date: "2026-12-04T18:00", end: "01:00", where: "A rented house in Miami Beach", access: "members", mode: "approval", cap: 200, taken: 164, price: 45, host: "West Ppl", blurb: "Our home base for Art Week. Open bar until ten, a listening room upstairs, and a garden for the people you came to see. Members get priority; guests pay the door rate." },
    { id: "golden-hour", city: "miami", title: "Rooftop Golden Hour", date: "2026-12-05T17:00", end: "21:00", where: "A Brickell rooftop", access: "public", mode: "instant", cap: 150, taken: 97, price: 35, host: "West Ppl", blurb: "Sunset, a DJ who reads the room, and a crowd you'll want to stay for. Open to the public, members free." },
    { id: "sunset-sunset", city: "la", title: "Sunset on Sunset", date: "2026-12-06T17:30", end: "21:30", where: "A hotel terrace in West Hollywood", access: "public", mode: "instant", cap: 80, taken: 80, price: 0, host: "West Ppl LA", blurb: "Our LA launch drinks. Free with RSVP. It's full, but the waitlist moves." },
    { id: "rooftop-cinema", city: "nyc", title: "Rooftop Cinema: In the Mood for Love", date: "2026-12-10T19:30", end: "22:30", where: "A Chelsea rooftop (heated, blankets provided)", access: "public", mode: "instant", cap: 120, taken: 74, price: 28, listPrice: 38, perk: "a glass of wine on arrival", host: "Third Floor Cinema Club", partner: "Third Floor Cinema Club", blurb: "A partner event, hand-picked for the list. Wong Kar-wai under the heaters, wine from a natural importer, and a crowd that actually watches the film. Tickets are sold through West Ppl Pass." },
    { id: "holiday-table", city: "nyc", title: "Holiday Table", date: "2026-12-12T19:30", end: "23:00", where: "A townhouse in the West Village", access: "members", mode: "approval", cap: 40, taken: 12, price: 85, host: "Samuel", blurb: "A long, loud, candlelit dinner before everyone scatters for the holidays." },
    { id: "canyon", city: "la", title: "Canyon Breakfast Club", date: "2026-12-13T08:30", end: "11:00", where: "Runyon Canyon trailhead, then breakfast", access: "public", mode: "instant", cap: 40, taken: 21, price: 0, host: "West Ppl LA", blurb: "A walk up, a long breakfast after. Bring a friend who has never been." },
    { id: "bungalow-jazz", city: "la", title: "Bungalow Sessions: Late Jazz", date: "2026-12-18T21:00", end: "00:30", where: "A bungalow off Sunset Blvd", access: "public", mode: "instant", cap: 90, taken: 41, price: 40, listPrice: 55, perk: "reserved seating near the trio", host: "Bungalow Sessions", partner: "Bungalow Sessions", blurb: "A trio, a small room and a bar that does one cocktail very well. A partner event sold through West Ppl Pass: the organizers get a full room, and your details stay with West Ppl." },
    { id: "nyd-swim", city: "miami", title: "New Year's Day Swim", date: "2027-01-01T11:00", end: "14:00", where: "South Pointe", access: "members", mode: "instant", cap: 60, taken: 18, price: 0, host: "West Ppl", blurb: "Start the year in the ocean. Coffee, juice and towels on us." },
    { id: "afterglow-preview", city: "miami", title: "Afterglow Preview: Sunset Session", date: "2027-01-23T16:00", end: "00:00", where: "Waterfront venue, Miami (announced to members first)", access: "public", mode: "instant", cap: 1000, taken: 286, price: 60, listPrice: 80, perk: "48-hour presale and a members' bar", host: "Afterglow × West Ppl", partner: "Afterglow Electronic", afterglow: true, blurb: "A first look at Afterglow, the 4pm-to-midnight electronic music series. Local DJs through golden hour, a headliner after dark, and home by midnight. West Ppl members get the presale and member pricing." }
  ];

  var rsvps = store.get("rsvps", {});
  var fmt = function (iso) { var d = new Date(iso); return { day: d.getDate(), mon: d.toLocaleString("en-US", { month: "short" }).toUpperCase(), wk: d.toLocaleString("en-US", { weekday: "short" }), time: d.toLocaleString("en-US", { hour: "numeric", minute: "2-digit" }), long: d.toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric" }) }; };
  var t12 = function (hm) { var p = hm.split(":"), h = +p[0], ap = h >= 12 && h < 24 ? "PM" : "AM"; h = h % 12 || 12; return h + ":" + p[1] + " " + ap; };
  var seatsLeft = function (e) { return Math.max(0, e.cap - e.taken - (rsvps[e.id] ? 1 : 0)); };

  function codeFor(e) { var h = 0, s = e.id + (applied ? applied.email : "guest"); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return "WPL-" + h.toString(36).toUpperCase().slice(0, 6); }
  function qr(code) {
    var n = 25, cells = "", h = 2166136261;
    for (var i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    var rnd = function () { h ^= h << 13; h >>>= 0; h ^= h >> 17; h ^= h << 5; h >>>= 0; return h / 4294967296; };
    var finder = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="7" height="7"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3"/>'; };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
      if (!inF && rnd() > 0.52) cells += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg viewBox="-2 -2 ' + (n + 4) + ' ' + (n + 4) + '" width="148" height="148" shape-rendering="crispEdges" style="background:#fff;display:block" aria-label="Ticket code ' + code + '"><g fill="#0B0A0A">' + cells + finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7) + '</g></svg>';
  }
  function passNote(e) {
    if (!e.price && !e.partner) return "";
    var deal = e.listPrice ? '<span style="display:block;color:var(--paper);margin-bottom:6px">West Ppl price <b style="display:inline;font:inherit;letter-spacing:0;text-transform:none;color:var(--flamingo)">$' + e.price + '</b> (public $' + e.listPrice + ')' + (e.perk ? ', plus ' + esc(e.perk) : "") + '.</span>' : "";
    return '<div class="pass-note"><b>West Ppl Pass</b>' + deal + (e.partner ? "Presented by " + esc(e.partner) + ". " : "") + 'Your ticket and QR code come from West Ppl. ' + (e.partner ? "The organizer sees your first name and party size at the door, never your email or number. Updates reach you through West Ppl." : "One tap with Apple Pay, add it to your Wallet.") + '</div>';
  }
  function ticketBlock(e) {
    var c = codeFor(e);
    return '<div class="pass-ticket"><div>' + qr(c) + '</div><div><p class="eyebrow" style="margin-bottom:6px">Your ticket</p><div style="font:400 22px/1.1 var(--display);text-transform:uppercase">' + esc(e.title) + '</div><div class="muted" style="font-size:13px;margin:6px 0">' + fmt(e.date).long + ' · ' + fmt(e.date).time + '</div><div style="font:600 13px/1 var(--sans);letter-spacing:.12em">' + c + '</div><button class="share" data-wallet>Add to Apple Wallet</button></div></div><p class="note" style="font-size:12px;color:var(--smoke);margin:6px 0 0">Sample ticket: the code is illustrative, not scannable.</p>';
  }
  function toast(msg) { var t = $("[data-toast]"); t.textContent = msg; t.classList.add("show"); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600); }

  /* menu */
  var mb = $("[data-menu]"), mn = $("[data-mobile-nav]");
  mb.addEventListener("click", function () { var o = mn.classList.toggle("open"); mb.setAttribute("aria-expanded", o); });
  $$("a", mn).forEach(function (a) { a.addEventListener("click", function () { mn.classList.remove("open"); mb.setAttribute("aria-expanded", "false"); }); });

  /* cities */
  $("[data-cities]").innerHTML = CITIES.map(function (c) {
    var n = EVENTS.filter(function (e) { return e.city === c.id; }).length;
    return '<a class="city" href="#calendar" data-city-link="' + c.id + '"><div class="ph panel"><span class="coord">' + c.coord + '</span>' + FL.replace("<svg ", '<svg class="fl" ') + '<span class="big">' + esc(c.name.split(" ")[1]) + '</span></div><div class="meta"><p class="eyebrow smoke" style="margin:0 0 6px">' + esc(c.city) + '</p><span class="d-h2">' + esc(c.name) + '</span><p class="count">' + c.members + ' members · ' + n + ' upcoming</p></div></a>';
  }).join("");
  $$("[data-city-link]").forEach(function (a) { a.addEventListener("click", function () { setCity(a.getAttribute("data-city-link")); }); });

  /* calendar */
  var current = "all";
  var chips = [{ id: "all", label: "All cities" }].concat(CITIES.map(function (c) { return { id: c.id, label: c.city }; }));
  $("[data-chips]").innerHTML = chips.map(function (c) { return '<button class="chip" aria-pressed="' + (c.id === "all") + '" data-chip="' + c.id + '">' + c.label + '</button>'; }).join("");
  $$("[data-chip]").forEach(function (b) { b.addEventListener("click", function () { setCity(b.getAttribute("data-chip")); }); });
  function setCity(id) {
    current = id;
    $$("[data-chip]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-chip") === id); });
    $("[data-cal-city-label]").textContent = id === "all" ? "everywhere" : "in " + cityOf(id).city;
    renderEvents();
  }
  function tagsFor(e) {
    var t = [];
    if (e.afterglow) t.push('<span class="tag ticket">Afterglow</span>');
    else if (e.partner) t.push('<span class="tag">Partner</span>');
    t.push(e.access === "members" ? '<span class="tag members">Members</span>' : '<span class="tag">Public</span>');
    if (e.price) t.push('<span class="tag ticket">$' + e.price + (e.listPrice ? ' <s style="opacity:.6">$' + e.listPrice + '</s>' : "") + '</span>');
    if (rsvps[e.id]) t.push('<span class="tag members">' + (rsvps[e.id] === "waitlist" ? "Waitlisted" : rsvps[e.id] === "requested" ? "Requested" : "Going") + '</span>');
    else if (!seatsLeft(e)) t.push('<span class="tag full">Waitlist</span>');
    return t.join("");
  }
  function renderEvents() {
    var list = EVENTS.filter(function (e) { return current === "all" || e.city === current; });
    $("[data-events]").innerHTML = list.length ? list.map(function (e) {
      var f = fmt(e.date), c = cityOf(e.city);
      return '<li class="ev" tabindex="0" role="button" data-ev="' + e.id + '"><div class="date"><small>' + f.mon + '</small><b>' + f.day + '</b><small>' + f.wk + '</small></div><div><h3>' + esc(e.title) + '</h3><div class="where">' + esc(c.city) + ' · ' + f.time + '</div></div><div class="tags">' + tagsFor(e) + '</div><span class="btn sm line go">Details</span></li>';
    }).join("") : '<li class="empty">Nothing on the calendar just yet. Members hear first.</li>';
    $$("[data-ev]").forEach(function (li) {
      var open = function () { openEvent(li.getAttribute("data-ev")); };
      li.addEventListener("click", open);
      li.addEventListener("keydown", function (k) { if (k.key === "Enter" || k.key === " ") { k.preventDefault(); open(); } });
    });
  }

  /* event drawer */
  var drawer = $("[data-drawer]"), scrim = $("[data-scrim]"), lastFocus = null;
  function openEvent(id) {
    var e = EVENTS.filter(function (x) { return x.id === id; })[0]; if (!e) return;
    lastFocus = document.activeElement;
    var f = fmt(e.date), c = cityOf(e.city), left = seatsLeft(e), mine = rsvps[e.id];
    var pct = Math.min(100, Math.round(100 * (e.cap - left) / e.cap));
    var cta;
    if (mine === "going" && (e.price || e.partner)) cta = ticketBlock(e) + '<button class="share" data-cancel>Cancel and refund</button>';
    else if (mine) cta = '<div class="rsvp-done">' + (mine === "waitlist" ? "You're on the waitlist. We'll text you if a spot opens." : mine === "requested" ? "Request sent. Samuel approves the guest list personally; you'll hear within a day." : "You're going. It's in your Invitations, and we'll send the address the morning of.") + '</div><button class="share" data-cancel>Cancel my RSVP</button>';
    else if (!left) cta = '<button class="btn line" style="width:100%" data-rsvp="waitlist">Join the waitlist</button>';
    else cta = '<button class="btn" style="width:100%" data-rsvp="' + (e.mode === "approval" ? "requested" : "going") + '">' + (e.mode === "approval" ? "Request to attend" : e.price ? "Get a ticket · $" + e.price : "RSVP") + '</button>';
    var accent = e.afterglow ? ' style="--flamingo:var(--sunset)"' : "";
    drawer.innerHTML = '<button class="close" aria-label="Close" data-close>×</button><div class="ph panel" style="aspect-ratio:16/10"><span class="coord">' + c.coord + '</span>' + FL.replace("<svg ", '<svg class="fl" ' + (e.afterglow ? 'style="filter:hue-rotate(-25deg) saturate(1.4)" ' : "")) + '<span class="big">' + esc(c.name.split(" ")[1]) + '</span></div><div class="body"' + accent + '><p class="eyebrow">' + esc(c.name) + ' · ' + esc(c.city) + '</p><h2 class="d-h2" style="font-size:36px">' + esc(e.title) + '</h2><div class="tags" style="display:flex;gap:6px;margin-top:12px">' + tagsFor(e) + '</div><p style="margin:16px 0 0">' + esc(e.blurb) + '</p><dl class="facts"><dt>When</dt><dd>' + f.long + ', ' + f.time + ' – ' + t12(e.end) + '</dd><dt>Where</dt><dd>' + esc(e.access === "members" ? "Address shared with confirmed guests" : e.where) + '</dd><dt>Host</dt><dd>' + esc(e.host) + '</dd><dt>RSVP</dt><dd>' + (e.mode === "approval" ? "Host approves each guest" : "Instant") + '</dd></dl><div class="muted" style="font-size:13px">' + (left ? left + " of " + e.cap + " spots left" : "Full. Waitlist open") + '</div><div class="cap"><i style="width:' + pct + '%"></i></div><div class="guests" aria-hidden="true">' + "<span></span>".repeat(6) + '</div><p class="muted" style="font-size:13px;margin:4px 0 18px">' + (e.taken > 6 ? "Including people you know from the Long Table" : "Be one of the first") + '</p>' + passNote(e) + cta + '<button class="share" data-share>Copy event link</button></div>';
    drawer.classList.add("open"); scrim.classList.add("open"); document.body.style.overflow = "hidden";
    history.replaceState(null, "", "#event/" + e.id);
    $("[data-close]", drawer).focus();
    $("[data-close]", drawer).addEventListener("click", closeEvent);
    var r = $("[data-rsvp]", drawer);
    if (r) r.addEventListener("click", function () { rsvps[e.id] = r.getAttribute("data-rsvp"); store.set("rsvps", rsvps); toast(rsvps[e.id] === "going" ? (e.price ? "Paid. Your ticket is ready." : "You're on the list.") : rsvps[e.id] === "requested" ? "Request sent to the host." : "Added to the waitlist."); renderEvents(); renderInbox(); renderGuests(); renderPartner(); openEvent(e.id); });
    var wl = $("[data-wallet]", drawer); if (wl) wl.addEventListener("click", function () { toast("Demo: this adds the pass to Apple or Google Wallet."); });
    var cx = $("[data-cancel]", drawer);
    if (cx) cx.addEventListener("click", function () { delete rsvps[e.id]; store.set("rsvps", rsvps); toast("RSVP cancelled. Your spot went to the waitlist."); renderEvents(); renderInbox(); renderGuests(); renderPartner(); openEvent(e.id); });
    $("[data-share]", drawer).addEventListener("click", function () {
      var url = location.href.split("#")[0] + "#event/" + e.id;
      (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { toast("Link copied. It opens straight to this event."); }, function () { toast(url); });
    });
  }
  function closeEvent() {
    drawer.classList.remove("open"); scrim.classList.remove("open"); document.body.style.overflow = "";
    history.replaceState(null, "", location.pathname + "#calendar");
    if (lastFocus) lastFocus.focus();
  }
  scrim.addEventListener("click", closeEvent);
  document.addEventListener("keydown", function (k) { if (k.key === "Escape" && drawer.classList.contains("open")) closeEvent(); });

  /* lobby application */
  var form = $("[data-apply]");
  var applied = store.get("applied", null);
  function showApplied(a) {
    var c = cityOf(a.city);
    $("[data-lobby]").innerHTML = '<div class="ok"><p class="eyebrow">You\'re in the Lobby</p><h3 class="d-h2">Welcome, ' + esc(a.name.split(" ")[0]) + '.</h3><p style="margin:14px 0">You\'re number <b>' + (c.wait + 1) + '</b> on the ' + esc(c.city) + ' waitlist. Samuel reads every application. When a spot opens you\'ll get a text and an email with your invitation.</p><p class="muted" style="font-size:14px">While you wait, public events are open to you. Members you know can vouch for you to move up.</p><div class="ctas"><a class="btn" href="#calendar">See public events</a><button class="btn ghost" data-reapply>Start over</button></div></div>';
    $("[data-reapply]").addEventListener("click", function () { store.set("applied", null); location.reload(); });
  }
  if (applied) showApplied(applied);
  else form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var d = new FormData(form), name = (d.get("name") || "").trim(), email = (d.get("email") || "").trim();
    var err = $("[data-apply-err]");
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.textContent = "We need your name and a real email to hold your place."; return; }
    var a = { name: name, email: email, city: d.get("city"), ig: d.get("ig"), ref: d.get("ref"), at: Date.now() };
    store.set("applied", a); APPS.unshift({ name: name, city: a.city, ref: a.ref || "Applied directly", ig: a.ig || "", note: "Just now", you: true });
    showApplied(a); renderApps(); toast("Application received.");
  });

  /* member inbox */
  function renderInbox() {
    var items = [
      { t: "You're invited: Sunday Supper", s: "Samuel saved you a seat at the Long Table. Tap to confirm.", ev: "long-table", unread: !rsvps["long-table"] },
      { t: "Afterglow presale is open", s: "Members get 48 hours and $20 off before tickets go public.", ev: "afterglow-preview", unread: !rsvps["afterglow-preview"] },
      { t: "New in New York: The Wine Room", s: "Thirty spots, members plus one.", ev: "wine-room", unread: false }
    ];
    Object.keys(rsvps).forEach(function (id) { var e = EVENTS.filter(function (x) { return x.id === id; })[0]; if (e) items.unshift({ t: (rsvps[id] === "going" ? "Confirmed: " : rsvps[id] === "requested" ? "Requested: " : "Waitlist: ") + e.title, s: fmt(e.date).long + " · " + cityOf(e.city).city, ev: id, unread: false }); });
    $("[data-inbox]").innerHTML = items.map(function (i) { return '<li style="cursor:pointer" data-open-ev="' + i.ev + '"><span class="av panel" style="display:grid;place-items:center">' + FL.replace("<svg ", '<svg style="height:28px" ') + '</span><div class="grow"><div class="t">' + esc(i.t) + '</div><div class="s">' + esc(i.s) + '</div></div>' + (i.unread ? '<span class="dot" aria-label="unread"></span>' : "") + '</li>'; }).join("");
    $$("[data-open-ev]").forEach(function (li) { li.addEventListener("click", function () { openEvent(li.getAttribute("data-open-ev")); }); });
  }

  /* messages */
  var PEOPLE = [
    { id: "maya", name: "Maya R.", city: "Miami", line: "Are you going Sunday?", thread: [["them", "Hey! Samuel said we should meet. Are you going Sunday?"]] },
    { id: "jules", name: "Jules T.", city: "New York", line: "That wine room was unreal", thread: [["them", "That wine room was unreal. Next one is the 3rd."], ["me", "Saving me a seat?"], ["them", "Always."]] },
    { id: "dev", name: "Dev K.", city: "Los Angeles", line: "Canyon walk Saturday?", thread: [["them", "Canyon walk Saturday? Bring someone."]] }
  ];
  var threads = store.get("threads", {});
  var active = PEOPLE[0];
  function renderPeople() {
    $("[data-people]").innerHTML = PEOPLE.map(function (p) { return '<li style="cursor:pointer" data-person="' + p.id + '"><span class="av"></span><div class="grow"><div class="t">' + esc(p.name) + '</div><div class="s">' + esc(p.city) + ' · ' + esc(p.line) + '</div></div></li>'; }).join("");
    $$("[data-person]").forEach(function (li) { li.addEventListener("click", function () { active = PEOPLE.filter(function (p) { return p.id === li.getAttribute("data-person"); })[0]; renderThread(); }); });
  }
  function renderThread() {
    var t = active.thread.concat(threads[active.id] || []);
    $("[data-dm-with]").textContent = "Message · " + active.name;
    $("[data-thread]").innerHTML = t.map(function (m) { return '<div class="msg' + (m[0] === "me" ? " me" : "") + '">' + esc(m[1]) + '</div>'; }).join("");
  }
  $("[data-composer]").addEventListener("submit", function (ev) {
    ev.preventDefault(); var i = $("[data-dm-input]"), v = i.value.trim(); if (!v) return;
    (threads[active.id] = threads[active.id] || []).push(["me", v]); store.set("threads", threads); i.value = ""; renderThread();
  });

  /* host: applications */
  var APPS = [
    { name: "Camila Ortega", city: "miami", ref: "Introduced by Maya R.", ig: "@camila.o", note: "Gallerist, Wynwood" },
    { name: "Theo Laurent", city: "nyc", ref: "Long Table guest, Oct", ig: "@theol", note: "Architect" },
    { name: "Priya Nair", city: "la", ref: "Introduced by Dev K.", ig: "@priyanair", note: "Film producer" },
    { name: "Marcus Bell", city: "miami", ref: "From the Instagram", ig: "@marcusb", note: "Founder, hospitality" },
    { name: "Ines Ferreira", city: "nyc", ref: "Introduced by Jules T.", ig: "@ines.f", note: "Chef" },
    { name: "Ari Cohen", city: "miami", ref: "Rooftop guest, Nov", ig: "@aric", note: "Investor" }
  ];
  if (applied) APPS.unshift({ name: applied.name, city: applied.city, ref: applied.ref || "Applied directly", ig: applied.ig || "", note: "You", you: true });
  var decisions = store.get("decisions", {});
  var appCity = "all";
  $("[data-app-chips]").innerHTML = chips.map(function (c) { return '<button class="chip" aria-pressed="' + (c.id === "all") + '" data-appchip="' + c.id + '">' + c.label + '</button>'; }).join("");
  $$("[data-appchip]").forEach(function (b) { b.addEventListener("click", function () { appCity = b.getAttribute("data-appchip"); $$("[data-appchip]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); renderApps(); }); });
  function renderApps() {
    var pending = APPS.filter(function (a) { return !decisions[a.name]; }).length;
    var approved = Object.keys(decisions).filter(function (k) { return decisions[k] === "approved"; }).length;
    $("[data-stats]").innerHTML = [[731 + approved, "Members"], [pending, "To review"], [751, "On waitlists"], [EVENTS.length, "Upcoming events"]].map(function (s) { return '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>'; }).join("");
    var list = APPS.filter(function (a) { return appCity === "all" || a.city === appCity; });
    $("[data-apps]").innerHTML = list.map(function (a, i) {
      var d = decisions[a.name];
      return '<li><span class="av"></span><div class="grow"><div class="t">' + esc(a.name) + (a.you ? ' <span class="tag members">You</span>' : "") + '</div><div class="s">' + esc(cityOf(a.city).city) + ' · ' + esc(a.note) + ' · ' + esc(a.ref) + '</div></div>' + (d ? '<span class="tag ' + (d === "approved" ? "members" : "") + '">' + (d === "approved" ? "Invited" : "Waitlisted") + '</span>' : '<button class="btn sm" data-dec="approved" data-who="' + esc(a.name) + '">Invite</button><button class="btn sm ghost" data-dec="waitlist" data-who="' + esc(a.name) + '">Waitlist</button>') + '</li>';
    }).join("");
    $$("[data-dec]").forEach(function (b) { b.addEventListener("click", function () { decisions[b.getAttribute("data-who")] = b.getAttribute("data-dec"); store.set("decisions", decisions); toast(b.getAttribute("data-dec") === "approved" ? "Invitation sent by email and text." : "Moved to the city waitlist."); renderApps(); }); });
  }

  /* host: guest lists */
  var NAMES = ["Maya Rivera", "Jules Tan", "Dev Kapoor", "Sofia Marin", "Luca Bianchi", "Nadia Haddad", "Omar Diaz", "Elle Park", "Rafael Cruz", "Hana Sato", "Ben Adler", "Zoe Grant"];
  var evSel = $("[data-guest-ev]");
  evSel.innerHTML = EVENTS.map(function (e) { return '<option value="' + e.id + '">' + esc(e.title) + ' · ' + cityOf(e.city).city + '</option>'; }).join("");
  function guestsFor(e) {
    var n = Math.min(e.taken, 10), g = [];
    for (var i = 0; i < n; i++) g.push({ name: NAMES[(i + e.id.length) % NAMES.length], status: i < n - 2 ? "Confirmed" : e.mode === "approval" ? "Requested" : "Confirmed", checkin: i < n / 2 ? "Checked in" : "" , guest: i % 4 === 1 ? "+1" : "" });
    if (rsvps[e.id]) g.unshift({ name: applied ? applied.name : "You", status: rsvps[e.id] === "going" ? "Confirmed" : rsvps[e.id] === "requested" ? "Requested" : "Waitlist", checkin: "", guest: "" });
    return g;
  }
  function renderGuests() {
    var e = EVENTS.filter(function (x) { return x.id === evSel.value; })[0]; if (!e) return;
    var g = guestsFor(e);
    $("[data-guestlist]").innerHTML = '<li class="muted" style="font-size:13px">' + e.taken + ' of ' + e.cap + ' · showing ' + g.length + '</li>' + g.map(function (x) { return '<li><span class="av"></span><div class="grow"><div class="t">' + esc(x.name) + ' ' + (x.guest ? '<span class="tag">' + x.guest + '</span>' : "") + '</div><div class="s">' + x.status + (x.checkin ? " · " + x.checkin : "") + '</div></div>' + (x.status === "Requested" ? '<span class="tag full">Approve</span>' : "") + '</li>'; }).join("");
  }
  evSel.addEventListener("change", renderGuests);
  $("[data-export]").addEventListener("click", function () {
    var e = EVENTS.filter(function (x) { return x.id === evSel.value; })[0];
    var rows = [["name", "status", "plus_one", "checked_in", "event", "city", "date"]].concat(guestsFor(e).map(function (x) { return [x.name, x.status, x.guest ? "yes" : "no", x.checkin ? "yes" : "no", e.title, cityOf(e.city).city, e.date]; }));
    var csv = rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(","); }).join("\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "westppl-" + e.id + "-guests.csv"; a.click();
    toast("Guest list exported.");
  });
  $("[data-blast]").addEventListener("click", function () { toast("Update queued to every confirmed guest (demo: nothing sent)."); });

  /* partner view: what an outside organizer sees on West Ppl Pass */
  var pSel = $("[data-partner-ev]");
  var PARTNER_EVS = EVENTS.filter(function (e) { return e.partner; });
  pSel.innerHTML = PARTNER_EVS.map(function (e) { return '<option value="' + e.id + '">' + esc(e.partner) + ' · ' + esc(e.title) + '</option>'; }).join("");
  var scanned = store.get("scanned", {});
  function partnerGuests(e) {
    var g = [], n = Math.min(e.taken, 9);
    for (var i = 0; i < n; i++) { var nm = NAMES[(i * 3 + e.id.length) % NAMES.length].split(" "); g.push({ name: nm[0] + " " + nm[1][0] + ".", party: i % 3 === 0 ? 2 : 1, code: "WPL-" + ((i + 7) * 2654435761 >>> 0).toString(36).toUpperCase().slice(0, 6) }); }
    if (rsvps[e.id] === "going") g.unshift({ name: applied ? applied.name.split(" ")[0] + " " + (applied.name.split(" ")[1] || "")[0] + "." : "You", party: 1, code: codeFor(e) });
    return g;
  }
  function renderPartner() {
    var e = EVENTS.filter(function (x) { return x.id === pSel.value; })[0]; if (!e) return;
    var g = partnerGuests(e), sold = e.taken + (rsvps[e.id] ? 1 : 0), gross = sold * e.price, fee = Math.round(gross * 0.12), inn = g.filter(function (x) { return scanned[x.code]; }).length;
    $("[data-pstats]").innerHTML = [[sold, "Tickets sold"], [inn, "Checked in"], ["$" + (gross - fee).toLocaleString("en-US"), "Your payout"], [0, "Emails you can see"]].map(function (s) { return '<div class="stat"><b>' + s[0] + '</b><span>' + s[1] + '</span></div>'; }).join("");
    $("[data-plist]").innerHTML = g.map(function (x) { return '<li><span class="av"></span><div class="grow"><div class="t">' + esc(x.name) + (x.party > 1 ? ' <span class="tag">Party of ' + x.party + '</span>' : "") + '</div><div class="s">' + x.code + ' · contact held by West Ppl</div></div>' + (scanned[x.code] ? '<span class="tag members">In</span>' : '<button class="btn sm ghost" data-scan="' + x.code + '">Check in</button>') + '</li>'; }).join("");
    $$("[data-scan]").forEach(function (b) { b.addEventListener("click", function () { scanned[b.getAttribute("data-scan")] = 1; store.set("scanned", scanned); toast("Valid ticket. Checked in."); renderPartner(); }); });
  }
  pSel.addEventListener("change", renderPartner);
  $("[data-door]").addEventListener("submit", function (ev) {
    ev.preventDefault(); var v = $("[data-door-code]").value.trim().toUpperCase(), e = EVENTS.filter(function (x) { return x.id === pSel.value; })[0];
    var hit = partnerGuests(e).filter(function (x) { return x.code === v; })[0];
    if (!hit) toast("Not a valid ticket for this event.");
    else if (scanned[v]) toast(hit.name + " is already checked in.");
    else { scanned[v] = 1; store.set("scanned", scanned); toast("Valid: " + hit.name + (hit.party > 1 ? ", party of " + hit.party : "") + "."); renderPartner(); }
    $("[data-door-code]").value = "";
  });
  $("[data-pmsg]").addEventListener("click", function () { toast("Sent to every ticket holder through West Ppl. Their contact details stay hidden."); });

  /* tabs */
  $$("[data-tab]").forEach(function (b) { b.addEventListener("click", function () {
    $$("[data-tab]").forEach(function (x) { x.setAttribute("aria-selected", x === b); });
    $$("[data-pane]").forEach(function (p) { p.hidden = p.getAttribute("data-pane") !== b.getAttribute("data-tab"); });
  }); });

  renderEvents(); renderInbox(); renderPeople(); renderThread(); renderApps(); renderGuests(); renderPartner();
  var m = location.hash.match(/^#event\/([\w-]+)/); if (m) openEvent(m[1]);
})();
