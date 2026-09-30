(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Theme ----------
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (_) { /* storage unavailable */ }
  $(".theme-toggle").addEventListener("click", () => {
    const isDark = root.dataset.theme
      ? root.dataset.theme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = isDark ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (_) {}
  });

  // ---------- Header / nav ----------
  const header = $(".site-header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = $(".nav-toggle");
  const menu = $("#nav-menu");
  toggle.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  $$("#nav-menu a").forEach(a => a.addEventListener("click", () => {
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
  }));

  // ---------- Reveal on scroll ----------
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    $$(".reveal").forEach(el => io.observe(el));
  } else {
    $$(".reveal").forEach(el => el.classList.add("in"));
  }

  // ---------- Hero counter ----------
  const counter = $("[data-count]");
  if (counter) {
    const target = +counter.dataset.count;
    if (reduceMotion) counter.textContent = target + "%";
    else {
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min((now - t0) / 1600, 1);
        counter.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + "%";
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  }

  // ---------- Formatting (Indian numbering) ----------
  const inr = n => {
    if (n >= 1e7) return "₹" + (n / 1e7).toFixed(n >= 1e9 ? 0 : 2) + " Cr";
    if (n >= 1e5) return "₹" + (n / 1e5).toFixed(2) + " L";
    return "₹" + Math.round(n).toLocaleString("en-IN");
  };

  // ---------- Goal planner ----------
  const presets = {
    retirement: { cost: 30000000, years: 25, saved: 1000000 },
    education:  { cost: 2500000,  years: 12, saved: 200000 },
    home:       { cost: 8000000,  years: 7,  saved: 1000000 },
    freedom:    { cost: 60000000, years: 20, saved: 3000000 },
  };
  const ids = ["cost", "years", "saved", "ret", "inf", "step"];
  const el = Object.fromEntries(ids.map(id => [id, $("#" + id)]));
  const out = Object.fromEntries(ids.map(id => [id, $("#" + id + "-out")]));

  // Future value of a monthly SIP that steps up once a year.
  function sipCorpus(monthly, years, annualRet, stepUp) {
    const r = annualRet / 12;
    let value = 0, invested = 0, sip = monthly;
    const series = [{ value: 0, invested: 0 }];
    for (let y = 0; y < years; y++) {
      for (let m = 0; m < 12; m++) {
        value = (value + sip) * (1 + r);
        invested += sip;
      }
      series.push({ value, invested });
      sip *= 1 + stepUp;
    }
    return { value, series };
  }

  function solve() {
    const cost = +el.cost.value, years = +el.years.value, saved = +el.saved.value;
    const ret = +el.ret.value / 100, inf = +el.inf.value / 100, step = +el.step.value / 100;

    out.cost.textContent = inr(cost);
    out.years.textContent = years + (years === 1 ? " yr" : " yrs");
    out.saved.textContent = inr(saved);
    out.ret.textContent = el.ret.value + "%";
    out.inf.textContent = el.inf.value + "%";
    out.step.textContent = el.step.value + "%";

    const future = cost * Math.pow(1 + inf, years);
    const savedFV = saved * Math.pow(1 + ret, years);
    const gap = Math.max(future - savedFV, 0);

    // Corpus is linear in the starting SIP, so solve with one unit run.
    const unitStep = sipCorpus(1, years, ret, step).value;
    const unitFlat = sipCorpus(1, years, ret, 0).value;
    const need = gap / unitStep;
    const flat = gap / unitFlat;

    $("#future-cost").textContent = inr(future);
    $("#sip-need").textContent = gap === 0 ? "₹0 — you're covered" : inr(need) + "/mo";
    $("#sip-flat").textContent = gap === 0 ? "—" : inr(flat) + "/mo";

    const { series } = sipCorpus(need, years, ret, step);
    const full = series.map((p, i) => ({
      value: p.value + saved * Math.pow(1 + ret, i),
      invested: p.invested + saved,
    }));
    drawChart(full);
  }

  function drawChart(pts) {
    const svg = $("#planner-chart");
    const W = 400, H = 160, pad = 6;
    const max = Math.max(...pts.map(p => p.value), 1);
    const x = i => pad + (i / Math.max(pts.length - 1, 1)) * (W - pad * 2);
    const y = v => H - pad - (v / max) * (H - pad * 2);
    const line = key => pts.map((p, i) => (i ? "L" : "M") + x(i).toFixed(1) + " " + y(p[key]).toFixed(1)).join(" ");
    const area = line("value") + ` L${x(pts.length - 1)} ${H} L${x(0)} ${H} Z`;
    svg.innerHTML = `
      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="var(--accent)" stop-opacity=".35"/>
        <stop offset="1" stop-color="var(--accent)" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#pg)"/>
      <path d="${line("value")}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="${line("invested")}" fill="none" stroke="var(--brand-2)" stroke-width="2" stroke-dasharray="5 4"/>`;
  }

  ids.forEach(id => el[id].addEventListener("input", solve));
  $$('input[name="goal"]').forEach(r => r.addEventListener("change", () => {
    const p = presets[r.value];
    el.cost.value = p.cost; el.years.value = p.years; el.saved.value = p.saved;
    solve();
  }));
  solve();

  // ---------- Money health check ----------
  const questions = [
    { q: "How many months of expenses could you cover with an emergency fund?",
      o: [["Less than 1", 0, "Build an emergency fund of 6 months' expenses in a liquid fund before investing aggressively."], ["1–3 months", 1, "Top up your emergency fund to 6 months of expenses."], ["6 months or more", 2]] },
    { q: "Do you have term life insurance of at least 10× your annual income?",
      o: [["No / not sure", 0, "If anyone depends on your income, get pure term cover of 10–15× annual income."], ["Some cover, less than 10×", 1, "Review whether your life cover matches your actual liabilities."], ["Yes", 2]] },
    { q: "Does every family member have health insurance beyond employer cover?",
      o: [["No", 0, "Buy a personal family-floater health policy — employer cover ends when the job does."], ["Partly", 1, "Consider a super top-up to raise health cover cheaply."], ["Yes", 2]] },
    { q: "Do you invest a fixed amount every month (SIP) towards named goals?",
      o: [["No", 0, "Automate a SIP for each goal — consistency beats timing."], ["Yes, but not linked to goals", 1, "Map each SIP to a goal so you know what 'enough' means."], ["Yes, goal-linked", 2]] },
    { q: "Are nominations updated on all your bank, demat and mutual fund accounts?",
      o: [["Not sure", 0, "Check and update nominations everywhere — it's the cheapest estate plan there is."], ["Some of them", 1, "Complete nominations on the remaining accounts."], ["All of them", 2]] },
  ];
  const qBody = $("#quiz-body"), qBar = $("#quiz-bar");
  let qi = 0, score = 0, tips = [];

  function renderQ() {
    qBar.style.width = (qi / questions.length) * 100 + "%";
    if (qi >= questions.length) return renderResult();
    const { q, o } = questions[qi];
    qBody.innerHTML = `
      <p class="muted small">Question ${qi + 1} of ${questions.length}</p>
      <p class="quiz-q">${q}</p>
      <div class="quiz-opts">${o.map((opt, i) => `<button class="quiz-opt" type="button" data-i="${i}">${opt[0]}</button>`).join("")}</div>`;
    $$(".quiz-opt", qBody).forEach(b => b.addEventListener("click", () => {
      const opt = o[+b.dataset.i];
      score += opt[1];
      if (opt[2]) tips.push(opt[2]);
      qi++;
      renderQ();
    }));
  }

  function renderResult() {
    const pct = Math.round((score / (questions.length * 2)) * 100);
    const label = pct >= 80 ? "Strong foundation" : pct >= 50 ? "Good start — a few gaps" : "Let's fix the basics first";
    const C = 2 * Math.PI * 60;
    qBody.innerHTML = `
      <div class="quiz-result">
        <svg class="score-ring" viewBox="0 0 140 140" role="img" aria-label="Score ${pct} out of 100">
          <circle cx="70" cy="70" r="60" fill="none" stroke="var(--bg-tint)" stroke-width="12"/>
          <circle cx="70" cy="70" r="60" fill="none" stroke="var(--accent)" stroke-width="12" stroke-linecap="round"
            stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - pct / 100)}" transform="rotate(-90 70 70)"/>
          <text x="70" y="80" text-anchor="middle" font-family="Fraunces, serif" font-size="34" fill="var(--text)">${pct}</text>
        </svg>
        <h3>${label}</h3>
        ${tips.length ? `<ul>${tips.map(t => `<li>${t}</li>`).join("")}</ul>` : `<p class="muted">You've covered the essentials. Next step: make sure your asset mix still fits your goals.</p>`}
        <a class="btn btn-primary" href="#contact">Discuss my results</a>
        <button class="btn btn-ghost" type="button" id="quiz-restart">Retake</button>
      </div>`;
    $("#quiz-restart").addEventListener("click", () => { qi = 0; score = 0; tips = []; renderQ(); });
  }
  renderQ();

  // ---------- Contact form (front-end only; wire to CRM/WhatsApp API in production) ----------
  const form = $("#contact-form");
  form.addEventListener("submit", e => {
    e.preventDefault();
    const status = $(".form-status", form);
    let ok = true;
    $$("[required]", form).forEach(f => {
      const valid = f.type === "checkbox" ? f.checked : f.checkValidity() && f.value.trim() !== "";
      f.setAttribute("aria-invalid", String(!valid));
      if (!valid) ok = false;
    });
    if (!ok) { status.textContent = "Please complete the highlighted fields."; return; }
    status.textContent = "Thank you — we'll be in touch within one working day.";
    form.reset();
  });

  $("#year").textContent = new Date().getFullYear();
})();
