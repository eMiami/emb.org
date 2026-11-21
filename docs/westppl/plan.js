/* West Ppl plan — year-one model. Base case = slider defaults. */
(function () {
  "use strict";
  var $ = function (s) { return document.querySelector(s); };
  var money = function (n) { var a = Math.abs(n); var s = a >= 1e6 ? "$" + (a / 1e6).toFixed(2) + "M" : "$" + Math.round(a).toLocaleString("en-US"); return n < 0 ? "−" + s : s; };
  var short = function (n) { return n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : "$" + Math.round(n / 1e3) + "K"; };

  var S = [
    { k: "list", label: "People on the list", min: 2000, max: 20000, step: 500, v: 8000, f: function (v) { return v.toLocaleString("en-US"); } },
    { k: "reach", label: "Still reachable", min: 30, max: 90, step: 5, v: 60, f: function (v) { return v + "%"; } },
    { k: "apply", label: "Of those, apply to the Lobby", min: 5, max: 50, step: 1, v: 25, f: function (v) { return v + "%"; } },
    { k: "approve", label: "Approved", min: 40, max: 95, step: 5, v: 70, f: function (v) { return v + "%"; } },
    { k: "paid", label: "Approved who pay", min: 10, max: 90, step: 5, v: 50, f: function (v) { return v + "%"; } },
    { k: "price", label: "Average membership per year", min: 200, max: 1200, step: 20, v: 400, f: function (v) { return "$" + v; } },
    { k: "events", label: "Ticketed events per month (all cities)", min: 1, max: 20, step: 1, v: 5, f: function (v) { return v; } },
    { k: "att", label: "Average attendance", min: 30, max: 300, step: 10, v: 90, f: function (v) { return v; } },
    { k: "ticket", label: "Average ticket (after member discounts)", min: 0, max: 120, step: 5, v: 35, f: function (v) { return "$" + v; } },
    { k: "venue", label: "Venue share per event (bar split / fee)", min: 0, max: 5000, step: 250, v: 1000, f: function (v) { return "$" + v.toLocaleString("en-US"); } },
    { k: "ptix", label: "Partner tickets sold through Pass per month", min: 0, max: 3000, step: 50, v: 400, f: function (v) { return v.toLocaleString("en-US"); } },
    { k: "pprice", label: "Average partner ticket", min: 10, max: 150, step: 5, v: 40, f: function (v) { return "$" + v; } },
    { k: "pcut", label: "West Ppl's cut of partner tickets", min: 5, max: 25, step: 1, v: 15, f: function (v) { return v + "%"; } },
    { k: "sponsors", label: "Brand partners per year × $12K", min: 0, max: 25, step: 1, v: 6, f: function (v) { return v; } }
  ];
  var box = $("[data-sliders]");
  box.innerHTML = S.map(function (s) { return '<div class="slider"><label for="s-' + s.k + '"><span>' + s.label + '</span><b data-v="' + s.k + '"></b></label><input type="range" id="s-' + s.k + '" min="' + s.min + '" max="' + s.max + '" step="' + s.step + '" value="' + s.v + '" data-s="' + s.k + '"></div>'; }).join("") + '<button class="btn sm line" type="button" data-reset>Back to base case</button>';

  function calc(x) {
    var members = Math.round(x.list * x.reach / 100 * x.apply / 100 * x.approve / 100 * x.paid / 100);
    var nEv = x.events * 12;
    var r = {
      members: members,
      memb: members * x.price,
      tix: nEv * x.att * x.ticket,
      venue: nEv * x.venue,
      pass: x.ptix * 12 * x.pprice * x.pcut / 100,
      spons: x.sponsors * 12000,
      perks: 15000
    };
    r.rev = r.memb + r.tix + r.pass + r.venue + r.spons + r.perks;
    r.cEvents = r.tix * 0.40;
    r.cFees = (r.memb + r.tix) * 0.035;
    r.cFixed = 18000 + 60000 + 20000;
    r.cost = r.cEvents + r.cFees + r.cFixed;
    r.profit = r.rev - r.cost;
    r.founding = Math.min(300, Math.round(members * 0.6)) * 360;
    return r;
  }
  var COLORS = { memb: "var(--flamingo)", tix: "var(--paper)", pass: "#7A6F86", venue: "var(--smoke)", spons: "var(--sunset)", perks: "var(--members)" };
  var NAMES = { memb: "Memberships", tix: "Tickets (own nights)", pass: "Pass: partner tickets", venue: "Venue shares", spons: "Brand partners", perks: "Perks commissions" };

  function read() { var x = {}; S.forEach(function (s) { x[s.k] = +$('[data-s="' + s.k + '"]').value; $('[data-v="' + s.k + '"]').textContent = s.f(x[s.k]); }); return x; }
  function render() {
    var x = read(), r = calc(x);
    $("[data-out]").innerHTML =
      '<tr><th>Year one</th><th class="n"></th></tr>' +
      '<tr><td>Paying members</td><td class="n">' + r.members.toLocaleString("en-US") + '</td></tr>' +
      ["memb", "tix", "pass", "venue", "spons", "perks"].map(function (k) { return '<tr><td>' + NAMES[k] + '</td><td class="n">' + money(r[k]) + '</td></tr>'; }).join("") +
      '<tr class="total"><td>Revenue</td><td class="n">' + money(r.rev) + '</td></tr>' +
      '<tr><td>Event costs (40% of tickets)</td><td class="n">' + money(-r.cEvents) + '</td></tr>' +
      '<tr><td>Card and text fees</td><td class="n">' + money(-r.cFees) + '</td></tr>' +
      '<tr><td>Platform, city hosts (part-time), marketing</td><td class="n">' + money(-r.cFixed) + '</td></tr>' +
      '<tr class="total"><td>Left over for Samuel and growth</td><td class="n">' + money(r.profit) + '</td></tr>';
    $("[data-mix]").innerHTML = ["memb", "tix", "pass", "venue", "spons", "perks"].map(function (k) { return '<i style="width:' + (100 * r[k] / r.rev).toFixed(1) + '%;background:' + COLORS[k] + '"></i>'; }).join("");
    $("[data-legend]").innerHTML = ["memb", "tix", "pass", "venue", "spons", "perks"].map(function (k) { return '<span><i style="background:' + COLORS[k] + '"></i>' + NAMES[k] + ' ' + Math.round(100 * r[k] / r.rev) + '%</span>'; }).join("");
  }
  function years() {
    var b = {}; S.forEach(function (s) { b[s.k] = s.v; });
    var y1 = calc(b);
    var y2x = Object.assign({}, b, { paid: b.paid * 2.1, events: b.events * 1.5, sponsors: b.sponsors * 2, ptix: b.ptix * 2.5 });
    var y3x = Object.assign({}, b, { paid: b.paid * 3.6, events: b.events * 2.4, sponsors: b.sponsors * 3.5, att: b.att * 1.1, ptix: b.ptix * 6 });
    var y2 = calc(y2x), y3 = calc(y3x);
    y3.cFixed += 450000; y3.cost += 450000; y3.profit -= 450000; /* full-time team, 5 city hosts, two launches */
    y2.cFixed += 150000; y2.cost += 150000; y2.profit -= 150000; /* first full-time community + ops hire */
    var row = function (l, f) { return '<tr><td>' + l + '</td>' + [y1, y2, y3].map(function (y) { return '<td class="n">' + f(y) + '</td>'; }).join("") + '</tr>'; };
    $("[data-years]").innerHTML = '<tr><th></th><th class="n">Year 1</th><th class="n">Year 2</th><th class="n">Year 3</th></tr>' +
      row("Cities", function (y) { return y === y3 ? 5 : 3; }) +
      row("Paying members", function (y) { return y.members.toLocaleString("en-US"); }) +
      row("Revenue", function (y) { return money(y.rev); }) +
      row("of which recurring", function (y) { return Math.round(100 * y.memb / y.rev) + "%"; }) +
      row("Partner tickets through Pass", function (y) { return Math.round(y.pass / (b.pprice * b.pcut / 100)).toLocaleString("en-US"); }) +
      '<tr class="total"><td>Left over</td>' + [y1, y2, y3].map(function (y) { return '<td class="n">' + money(y.profit) + '</td>'; }).join("") + '</tr>';
    var k = function (n, v) { document.querySelectorAll('[data-k="' + n + '"]').forEach(function (e) { e.textContent = v; }); };
    k("paid", y1.members); k("rev", short(y1.rev)); k("founding", short(y1.founding));
    k("rev2", "~" + short(y1.rev)); k("profit2", "~" + short(y1.profit) + " left over");
  }
  box.addEventListener("input", render);
  $("[data-reset]").addEventListener("click", function () { S.forEach(function (s) { $('[data-s="' + s.k + '"]').value = s.v; }); render(); });
  render(); years();
})();
