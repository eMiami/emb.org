// Wingwoman clickable demo. Sample data only; nothing leaves the page.
(function () {
  "use strict";
  var app = document.getElementById("app");
  var notif = document.querySelector(".notif");
  var notifBody = document.querySelector(".notif-body");

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  var MATCHMAKERS = [
    { id: "maya", name: "Maya", bio: "Event producer in Wynwood. I've been setting my friends up for ten years.", areas: "Wynwood · Design District · Edgewater", rate: 150, made: 14, accept: 64, how: "A coffee first, then I only propose people I know well. I'd rather send you one great introduction than five maybes.", slots: "Tue & Thu evenings" },
    { id: "sofia", name: "Sofia", bio: "Pilates instructor in Coconut Grove. I meet half of Miami before 9am.", areas: "Coconut Grove · Coral Gables · Brickell", rate: 200, made: 9, accept: 58, how: "I like to hear what went wrong last time. Then I go find someone who fixes it.", slots: "Weekend mornings" },
    { id: "elena", name: "Elena", bio: "Hospitality manager on South Beach. Knows everyone's name, remembers everyone's story.", areas: "South Beach · Mid-Beach · Surfside", rate: 175, made: 0, accept: null, how: "Short interview, honest feedback, and I'll tell you if I don't think I'm the right fit.", slots: "Mon & Wed afternoons" },
  ];
  var ANA = {
    name: "Ana", age: 33, area: "Coconut Grove",
    prompts: [
      ["A perfect Sunday in Miami", "Paddleboarding at Matheson, then a long lunch somewhere with no music."],
      ["I'm happiest when", "I'm halfway through a book I can't put down."],
      ["I'd like to meet someone who", "Asks good questions and listens to the answers."],
    ],
  };
  var DAN = { name: "Dan", age: 40, work: "Architect", area: "Brickell", about: "Grew up in Key Biscayne. Cooks badly, sails well." };
  var NOTE = "You both talked my ear off about sailing and neither of you likes loud places. Dan is kind and a little shy at first — Ana will draw him out.";

  var fresh = function () {
    return { role: null, screen: null, history: [], cand: { name: "Lucia", photos: 0, approved: false }, client: { interview: null, matched: false, requested: false, accepted: false }, mm: { invites: 0, proposals: 0 } };
  };
  var S = fresh();

  // ── pieces ───────────────────────────────────────────────
  var photos = function (n, who) {
    var out = "";
    for (var i = 1; i <= n; i++) out += '<div class="photo" role="img" aria-label="' + esc(who) + ', photo ' + i + '">Photo ' + i + "</div>";
    return '<div class="strip">' + out + "</div>";
  };
  var top = function (back) {
    return '<div class="topbar"><button type="button" class="wordmark tap-plain" data-pick aria-label="Wingwoman — choose who to try it as">Wingwoman™</button>' + (back ? '<button type="button" class="back" data-back>Back</button>' : "") + "</div>";
  };
  var verified = '<span class="chip positive">&#10003; Verified</span>';
  var candidateCard = function () {
    var p = ANA.prompts.map(function (q) {
      return '<div class="well"><span class="eyebrow">' + esc(q[0]) + "</span><span>" + esc(q[1]) + "</span></div>";
    }).join("");
    return '<div class="card">' + photos(4, ANA.name) + "<h2>" + ANA.name + ", " + ANA.age + '</h2><p class="muted">' + ANA.area + "</p>" + p + "</div>";
  };
  var hint = function (t) { return '<p class="demo-hint">Demo · ' + esc(t) + "</p>"; };

  // ── screens ──────────────────────────────────────────────
  var SCREENS = {
    PICK: function () {
      return '<span class="wordmark">Wingwoman™</span><span class="eyebrow">A clickable demo</span><h1 class="hero">Try it from each side.</h1>' +
        '<p class="lede">Introductions from Miami matchmakers who know the people they introduce. Sample data only; nothing is sent anywhere.</p>' +
        '<button class="btn" data-role="candidate">As an invited woman</button><button class="btn secondary" data-role="client">As a client</button><button class="btn secondary" data-role="matchmaker">As a matchmaker</button>' +
        '<p class="tiny">Tap the Wingwoman name at the top of any screen to come back here.</p>';
    },
    // Candidate
    L1: function () {
      return top() + '<div class="row"><span class="avatar">M</span><span class="eyebrow">A personal invitation</span></div>' +
        '<h1 class="hero">Maya invited you, ' + esc(S.cand.name) + ".</h1>" +
        '<p class="lede">Maya is a matchmaker in Miami. She thinks you might enjoy meeting one or two of the people she works with — and she\'ll ask you first, every time.</p>' +
        '<div class="card flat"><span class="eyebrow">How it works, plainly</span><ul class="list small">' +
        "<li><b>Maya is paid by her client</b> when you accept an introduction.</li><li><b>You never pay</b>, and you are never paid.</li>" +
        "<li><b>Nothing is shown to anyone</b> until you approve exactly what they'll see.</li>" +
        "<li>Each introduction comes to you as a text. You say yes or no.</li><li>Every man you could meet has passed an ID and background check.</li></ul></div>" +
        '<button class="btn" data-go="L2">Continue</button><p class="tiny">No app, no password. Pause or delete your profile from this link at any time.</p>';
    },
    L2: function () {
      return top(true) + '<div class="stack"><span class="eyebrow">Step 1 of 3</span><h1>Confirm it\'s you</h1><p class="muted">Your number stays private. It\'s how you\'ll hear about introductions.</p></div>' +
        '<div class="field"><label for="ph">Mobile number</label><input id="ph" value="(305) 555-0142" inputmode="tel"></div>' +
        '<div class="field"><label for="dob">Date of birth</label><input id="dob" value="04/10/1993"></div>' +
        '<label class="check"><input type="checkbox" checked><span>I agree that Wingwoman may show the profile I approve only to clients Maya proposes me to.</span></label>' +
        '<div class="field"><label for="code">Code we texted you</label><input id="code" value="482 913" inputmode="numeric"></div>' +
        '<button class="btn" data-go="L3">Verify</button>' + hint("the code is filled in for you");
    },
    L3: function () {
      var grid = "";
      for (var i = 1; i <= 4; i++) grid += i <= S.cand.photos ? '<div class="photo" role="img" aria-label="Your photo ' + i + '">Photo ' + i + "</div>" : '<button type="button" class="photo tap" data-act="addPhoto" aria-label="Add a photo">+ Add photo</button>';
      return top(true) + '<div class="stack"><span class="eyebrow">Step 2 of 3</span><h1>Your profile</h1><p class="muted">A few photos and a few lines. You\'ll see exactly what a client sees before anything is shown.</p></div>' +
        '<div class="stack"><span class="label">Photos (' + S.cand.photos + ' of 4)</span><div class="grid2">' + grid + "</div></div>" +
        '<div class="field"><label for="fn">First name or alias</label><input id="fn" value="' + esc(S.cand.name) + '"></div>' +
        '<div class="field"><label for="ar">Area</label><input id="ar" value="Edgewater"></div>' +
        ANA.prompts.map(function (q, i) { return '<div class="field"><label for="q' + i + '">' + esc(q[0]) + '</label><textarea id="q' + i + '">' + esc(q[1]) + "</textarea></div>"; }).join("") +
        '<button class="btn" data-act="toApprove">Preview</button>';
    },
    L4: function () {
      return top(true) + '<div class="stack"><span class="eyebrow">Step 3 of 3</span><h1>This is exactly what a client will see</h1><p class="muted">Only men Maya proposes you to — never a list, never a search.</p></div>' +
        '<div class="card">' + photos(Math.max(S.cand.photos, 1), S.cand.name) + "<h2>" + esc(S.cand.name) + ', 33</h2><p class="muted">Edgewater</p>' +
        ANA.prompts.map(function (q) { return '<div class="well"><span class="eyebrow">' + esc(q[0]) + "</span><span>" + esc(q[1]) + "</span></div>"; }).join("") + "</div>" +
        '<div class="card flat"><span class="eyebrow">What he won\'t see</span><ul class="list small"><li>Your last name</li><li>Your phone number</li><li>Your Instagram</li><li>Anything else, unless you accept an introduction and choose what to share</li></ul></div>' +
        '<button class="btn" data-act="approve">Approve my profile</button><button class="btn secondary" data-back>Edit</button>';
    },
    L5: function () {
      return top() + '<h1 class="hero">You\'re all set, ' + esc(S.cand.name) + ".</h1>" +
        '<ol class="steps"><li>When Maya thinks someone is right for you, and he wants to meet you, you\'ll get a text.</li><li>You\'ll see his photos, a little about him and Maya\'s note on why. Then yes or no thanks — you have three days.</li><li>Never more than four a month.</li></ol>' +
        '<div class="card flat"><span class="eyebrow">Your link</span><p class="small">Keep this to edit, pause or delete your profile.</p><p class="code">wingwomen.co/c/8hQx…</p></div>' +
        hint("a text will arrive in a moment");
    },
    L6: function () {
      return top() + '<div class="stack"><span class="eyebrow">An introduction from Maya</span><h1>Would you like to meet ' + DAN.name + "?</h1>" +
        '<p class="muted small">Answer within 72 hours. If you say no, he\'s told only that it didn\'t go ahead.</p></div>' +
        '<div class="card">' + photos(3, DAN.name) + '<div class="between"><h2>' + DAN.name + ", " + DAN.age + "</h2>" + verified + '</div><p class="muted">' + DAN.work + " · " + DAN.area + "</p><p>" + DAN.about + "</p>" +
        '<div class="well"><span class="eyebrow">Maya\'s note</span><p class="note">“' + NOTE + '”</p></div></div>' +
        '<span class="label">If yes, what would you like to share?</span><label class="choice"><input type="radio" name="share" checked> My phone number</label><label class="choice"><input type="radio" name="share"> My Instagram</label>' +
        '<button class="btn" data-go="L7">Yes, introduce us</button><button class="btn secondary" data-go="L6no">No thanks</button>';
    },
    L6no: function () {
      return top(true) + "<h1>No problem.</h1><p class=\"muted\">Dan is told only that it didn't go ahead. If you'd like, tell Maya why — only she sees it.</p>" +
        '<div class="field"><label for="why">A note for Maya (optional)</label><textarea id="why"></textarea></div><button class="btn secondary" data-go="L5">Send</button>';
    },
    L7: function () {
      return top() + '<h1 class="hero">You\'re introduced.</h1><p class="lede">Dan has your number. Maya suggests: drinks at the Rusty Pelican, Thursday at seven.</p>' +
        '<div class="card"><span class="eyebrow">Dan\'s number</span><p class="big">(305) 555-0177</p><button class="btn">Text Dan</button></div>' +
        hint("this is the end of her side. Try it as a client or a matchmaker.");
    },

    // Client
    C1: function () {
      return top() + '<span class="eyebrow">Miami matchmaking</span><h1 class="hero">Introductions to women who aren\'t on any app.</h1>' +
        '<p class="lede">Independent Miami matchmakers introduce you to people they know or meet in person — at a fraction of what the big firms charge.</p>' +
        '<ol class="steps"><li>Join and get verified.</li><li>Interview a matchmaker. She chooses you too.</li><li>She proposes introductions one at a time. You pay only when the woman says yes.</li></ol>' +
        '<div class="card flat"><div class="between"><span class="eyebrow">Three-month membership</span><span class="big">$500</span></div><p class="small muted">Includes verification, up to three matchmaker interviews and your first introduction. After that, each introduction is set by your matchmaker, usually $100–$250.</p><p class="small">Full refund if no matchmaker takes you on within 14 days.</p></div>' +
        '<button class="btn" data-act="join">Apply</button>' + hint("joining, payment and the ID check are skipped in the demo");
    },
    C6: function () {
      return clientTabs("C6") + "<h1>Matchmakers</h1><p class=\"muted\">Interview up to three. She has to say yes too.</p>" +
        MATCHMAKERS.map(function (m) {
          return '<button type="button" class="card tap" data-act="openMm" data-id="' + m.id + '"><div class="row"><span class="avatar">' + m.name[0] + "</span><div><h3>" + m.name + '</h3><p class="tiny">' + m.areas + '</p></div></div><p class="small">' + m.bio + '</p><div class="between small"><span>$' + m.rate + " per introduction</span><span class=\"muted\">" + (m.accept == null ? "New" : m.made + " made · " + m.accept + "% accepted") + "</span></div></button>";
        }).join("");
    },
    C7: function () {
      var m = MATCHMAKERS.filter(function (x) { return x.id === S.client.viewing; })[0];
      return top(true) + '<div class="row"><span class="avatar">' + m.name[0] + "</span><div><h1>" + m.name + '</h1><p class="tiny">' + m.areas + "</p></div></div>" +
        "<p>" + m.bio + '</p><div class="well"><span class="eyebrow">How I work</span><span>' + m.how + "</span></div>" +
        '<div class="grid2"><div class="card flat stat"><span class="tiny">Per introduction</span><b>$' + m.rate + '</b></div><div class="card flat stat"><span class="tiny">Accepted</span><b>' + (m.accept == null ? "New" : m.accept + "%") + "</b></div></div>" +
        '<p class="small muted">Interviews: ' + m.slots + "</p>" +
        (S.client.interview === m.id ? '<p class="alert ok">Interview requested. She\'ll reply with a time.</p><button class="btn secondary" data-act="fastForward">Skip ahead: she said yes</button>' : '<button class="btn" data-act="requestInterview">Request an interview</button>');
    },
    C9: function () {
      var body;
      if (!S.client.matched) body = '<div class="card flat"><p>No matchmaker yet.</p><button class="btn" data-go="C6">Find a matchmaker</button></div>';
      else if (!S.client.requested) body = '<div class="card flat"><span class="eyebrow">Your matchmaker</span><div class="row"><span class="avatar">M</span><h3>Maya</h3></div></div><span class="eyebrow">Waiting for you</span><button type="button" class="card tap" data-go="C10"><div class="between"><h3>A proposal from Maya</h3><span class="chip accent">New</span></div><p class="small muted">Ana, 33 · Coconut Grove</p></button>';
      else if (!S.client.accepted) body = '<span class="eyebrow">In progress</span><button type="button" class="card tap" data-go="C11"><div class="between"><h3>Ana</h3><span class="chip caution">Waiting on her</span></div><p class="small muted">Card hold placed. Answer due within 72 hours.</p></button>';
      else body = '<span class="eyebrow">Introductions</span><button type="button" class="card tap" data-go="C12"><div class="between"><h3>Ana</h3><span class="chip positive">Accepted</span></div><p class="small muted">Her number is ready.</p></button>';
      return clientTabs("C9") + '<div class="between"><h1>Hi, Dan</h1><span class="tiny">78 days left</span></div>' + body;
    },
    C10: function () {
      return top(true) + '<span class="eyebrow">A proposal from Maya</span>' + candidateCard() +
        '<div class="well"><span class="eyebrow">Maya\'s note</span><p class="note">“' + NOTE.replace("Dan is", "He is").replace("Ana will draw him out", "she'll draw you out") + '”</p></div>' +
        '<div class="between"><span>Introduction</span><span><b>Included</b> <span class="tiny">in your membership</span></span></div>' +
        '<p class="small muted">She\'ll see your profile and decide. Her contact details are shared only if she says yes.</p>' +
        '<button class="btn" data-act="requestIntro">Request introduction</button><button class="btn quiet" data-go="C9">Pass</button>';
    },
    C11: function () {
      return top(true) + '<h1>Waiting on Ana</h1><p class="muted">Maya has sent her your profile. She has 72 hours to answer.</p>' +
        '<div class="card flat"><div class="between"><span>Answer due</span><b>Sat 9:41 pm</b></div><div class="between"><span>Charge</span><b>Included</b></div></div>' +
        '<p class="small muted">If she declines or doesn\'t answer, nothing is charged and you\'re told only that it didn\'t go ahead.</p>' + hint("her answer will arrive as a text in a moment");
    },
    C12: function () {
      return top(true) + '<h1 class="hero">Ana said yes.</h1><div class="card"><span class="eyebrow">Ana\'s number</span><p class="big">(305) 555-0142</p><button class="btn">Text Ana</button></div>' +
        '<div class="well"><span class="eyebrow">Maya suggests</span><span>Drinks at the Rusty Pelican, Thursday at seven.</span></div>' +
        '<button class="btn secondary">After your date: tell Maya how it went</button>' + hint("this is the end of his side.");
    },

    // Matchmaker
    M3: function () {
      return mmTabs("M3") + '<div class="between"><h1>Hi, Maya</h1></div>' +
        '<div class="grid2"><div class="card flat stat"><span class="tiny">This month</span><b>$1,080</b></div><div class="card flat stat"><span class="tiny">Payable Friday</span><b>$360</b></div></div>' +
        '<span class="eyebrow">Waiting on you</span>' +
        '<button type="button" class="card tap" data-go="M9"><div class="between"><h3>Dan said yes to working with you</h3><span class="chip accent">Propose</span></div><p class="small muted">Wants someone outdoorsy. Not into nightlife.</p></button>' +
        '<div class="card flat"><div class="between"><h3>Interview request</h3><span class="chip caution">New</span></div><p class="small muted">Marco, 37 · Edgewater · verified</p></div>' +
        (S.mm.proposals ? '<div class="card flat"><div class="between"><h3>Ana → Dan</h3><span class="chip caution">With Dan</span></div><p class="small muted">Proposed just now.</p></div>' : "") +
        '<div class="card flat"><div class="between"><h3>Feedback from Sam</h3><span class="chip positive">Met</span></div><p class="small muted">“Lovely evening. Would see her again.”</p></div>';
    },
    M6: function () {
      var rows = [["Ana", "Live", "positive", "1 proposal this month"], ["Camila", "Live", "positive", "None this month"], ["Isabel", "Paused", "", ""]];
      for (var i = 0; i < S.mm.invites; i++) rows.unshift(["Invitation " + (i + 1), "Invited", "caution", "Hasn't opened it yet"]);
      return mmTabs("M6") + '<div class="between"><h1>Roster</h1><button class="btn sm" data-go="M7">Add</button></div>' +
        rows.map(function (r) { return '<div class="card flat"><div class="between"><h3>' + r[0] + '</h3><span class="chip ' + r[2] + '">' + r[1] + '</span></div><p class="tiny">' + r[3] + "</p></div>"; }).join("");
    },
    M7: function () {
      return top(true) + "<h1>Invite someone</h1><p class=\"muted\">Show her the code, or send the link yourself. She types in her own number. Nothing is shown until she approves it.</p>" +
        '<div class="field"><label for="iname">Her first name (optional)</label><input id="iname" value="Lucia"></div>' +
        '<div class="field"><label for="inote">Private note (only you see it)</label><input id="inote" value="Met at the Pérez opening"></div>' +
        '<label class="check"><input type="checkbox" checked><span>I know her or met her in person.</span></label>' +
        '<div class="qr">' + qr() + '</div><p class="code">wingwomen.co/c/8hQx…</p>' +
        '<button class="btn" data-act="invite">Share link</button>';
    },
    M9: function () {
      return top(true) + "<h1>New proposal</h1>" +
        '<div class="field"><label for="pc">Client</label><select id="pc"><option>Dan, 40 · Brickell</option></select></div>' +
        '<div class="field"><label for="pk">From your roster</label><select id="pk"><option>Ana, 33 · Coconut Grove</option><option>Camila, 30 · Brickell</option></select></div>' +
        '<div class="field"><label for="pn">Why they fit</label><textarea id="pn">' + esc(NOTE) + "</textarea></div>" +
        '<div class="field"><label for="pd">First-date idea (optional)</label><input id="pd" value="Drinks at the Rusty Pelican"></div>' +
        '<div class="card flat"><div class="between"><span>Your rate</span><b>$150</b></div><div class="between small muted"><span>You keep (founding terms, 90%)</span><span>$135</span></div></div>' +
        '<button class="btn" data-act="propose">Send to Dan</button>';
    },
    M10: function () {
      var rows = [["Ana → Dan", S.mm.proposals ? "With Dan" : null, "caution"], ["Camila → Sam", "Met", "positive"], ["Isabel → Leo", "Accepted", "positive"], ["Ana → Marco", "Didn't go ahead", ""]];
      return mmTabs("M10") + "<h1>Introductions</h1>" + rows.filter(function (r) { return r[1]; }).map(function (r) {
        return '<div class="card flat"><div class="between"><h3>' + r[0] + '</h3><span class="chip ' + r[2] + '">' + r[1] + "</span></div></div>";
      }).join("");
    },
  };

  function clientTabs(cur) {
    return top() + '<nav class="tabs" aria-label="Sections"><button data-go="C9"' + (cur === "C9" ? ' aria-current="page"' : "") + '>Home</button><button data-go="C6"' + (cur === "C6" ? ' aria-current="page"' : "") + ">Matchmakers</button></nav>";
  }
  function mmTabs(cur) {
    var t = [["M3", "Home"], ["M6", "Roster"], ["M10", "Introductions"]];
    return top() + '<nav class="tabs" aria-label="Sections">' + t.map(function (x) { return '<button data-go="' + x[0] + '"' + (cur === x[0] ? ' aria-current="page"' : "") + ">" + x[1] + "</button>"; }).join("") + "</nav>";
  }
  // A decorative QR-like pattern (the real app renders a working QR code).
  function qr() {
    var n = 25, cells = "", seed = 7;
    var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    var finder = function (x, y) {
      return [[0, 0], [n - 7, 0], [0, n - 7]].some(function (f) {
        var dx = x - f[0], dy = y - f[1];
        if (dx < 0 || dy < 0 || dx > 6 || dy > 6) return false;
        return dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      });
    };
    var inFinderZone = function (x, y) { return (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9); };
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) {
      var on = inFinderZone(x, y) ? finder(x, y) : rnd() > 0.5;
      if (on) cells += '<rect class="on" x="' + x + '" y="' + y + '" width="1" height="1"/>';
    }
    return '<svg viewBox="-1 -1 ' + (n + 2) + " " + (n + 2) + '" role="img" aria-label="Invitation code">' + cells + "</svg>";
  }

  // ── navigation ───────────────────────────────────────────
  function render() {
    app.innerHTML = SCREENS[S.screen]();
    app.scrollTop = 0;
    document.querySelectorAll("[data-role]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.role === S.role)); });
  }
  function go(screen, noHistory) {
    if (!noHistory && S.screen) S.history.push(S.screen);
    S.screen = screen;
    render();
  }
  var timer = null;
  function text(body, target, delay) {
    clearTimeout(timer);
    timer = setTimeout(function () {
      notifBody.textContent = body;
      notif.hidden = false;
      notif.dataset.target = target;
    }, delay || 1800);
  }
  function hideNotif() { notif.hidden = true; clearTimeout(timer); }
  function start(role) {
    hideNotif();
    var keep = S.role === role ? null : role;
    S = fresh();
    S.role = role || keep;
    go({ candidate: "L1", client: "C1", matchmaker: "M3" }[S.role], true);
  }

  var ACTIONS = {
    addPhoto: function () { S.cand.photos = Math.min(4, S.cand.photos + 1); render(); },
    toApprove: function () { if (!S.cand.photos) S.cand.photos = 1; go("L4"); },
    approve: function () { S.cand.approved = true; go("L5"); text("Wingwoman: Maya has an introduction for you. Take a look and answer within 72 hours.", "L6"); },
    join: function () { go("C9"); },
    openMm: function (el) { S.client.viewing = el.dataset.id; go("C7"); },
    requestInterview: function () { S.client.interview = S.client.viewing; render(); },
    fastForward: function () { S.client.matched = true; S.history = []; go("C9", true); text("Wingwoman: Maya has a new proposal for you.", "C10"); },
    requestIntro: function () { S.client.requested = true; go("C11"); text("Wingwoman: Good news — Ana accepted. Her details are waiting.", "C12", 2600); },
    invite: function () { S.mm.invites++; S.history = []; go("M6", true); },
    propose: function () { S.mm.proposals++; S.history = []; go("M3", true); },
  };

  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-go],[data-act],[data-back],[data-role],[data-reset],[data-notif],[data-pick]");
    if (!el) return;
    if (el.dataset.role) return start(el.dataset.role);
    if (el.hasAttribute("data-pick")) { hideNotif(); S = fresh(); return go("PICK", true); }
    if (el.hasAttribute("data-reset")) return start(S.role || "candidate");
    if (el.hasAttribute("data-notif")) {
      var t = notif.dataset.target;
      hideNotif();
      if (t === "C12") S.client.accepted = true;
      return go(t);
    }
    if (el.hasAttribute("data-back")) { var prev = S.history.pop(); if (prev) go(prev, true); return; }
    if (el.dataset.go) return go(el.dataset.go);
    if (el.dataset.act && ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el);
  });

  var clock = document.querySelector("[data-clock]");
  var tick = function () {
    var d = new Date();
    clock.textContent = d.getHours() % 12 + (d.getHours() % 12 === 0 ? 12 : 0) + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  tick();
  setInterval(tick, 30000);

  var HASH = { "#client": "client", "#matchmaker": "matchmaker", "#candidate": "candidate" };
  var narrow = window.matchMedia("(max-width: 520px)").matches;
  if (HASH[location.hash]) start(HASH[location.hash]);
  else if (narrow) go("PICK", true);
  else start("candidate");
  window.addEventListener("hashchange", function () { if (HASH[location.hash]) start(HASH[location.hash]); });
})();
