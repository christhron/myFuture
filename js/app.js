/*
 * myFuture Nigeria — app logic
 * Renders the questionnaire from js/questions.js, saves progress in the
 * browser, and builds the prompt with js/prompt.js. Nothing is sent anywhere.
 */
(function () {
  const CFG = window.MYFUTURE_NIGERIA;
  const P = window.MyFutureNigeriaPrompt;
  const SECTIONS = CFG.sections;
  const root = document.getElementById("app");

  const AI_LINKS = [
    { name: "ChatGPT", url: "https://chatgpt.com/" },
    { name: "Claude", url: "https://claude.ai/new" },
    { name: "Gemini", url: "https://gemini.google.com/app" },
    { name: "Meta AI", url: "https://www.meta.ai/" },
    { name: "Copilot", url: "https://copilot.microsoft.com/" }
  ];

  // ---------------- state ----------------
  let state = { answers: {}, step: -1 }; // -1 welcome, 0..n-1 sections, n review, n+1 result

  function load() {
    try {
      const raw = localStorage.getItem(CFG.storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* storage unavailable */ }
    return null;
  }
  function save() {
    if (state.sample) return; // never overwrite real progress with the example
    try { localStorage.setItem(CFG.storageKey, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }
  function clearSaved() {
    try { localStorage.removeItem(CFG.storageKey); } catch (e) { /* ignore */ }
  }

  // ---------------- tiny DOM helper ----------------
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v === true) el.setAttribute(k, "");
      else el.setAttribute(k, v);
    }
    kids.flat(Infinity).forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }

  const ans = () => state.answers;
  const setAns = (id, v) => { state.answers[id] = v; save(); };

  // ---------------- question renderers ----------------
  function field(q) {
    const wrap = h("div", { class: "q", id: "wrap_" + q.id, "data-qid": q.id });
    const labelId = "lbl_" + q.id;
    const grouped = ["radio", "checkbox", "likert", "grades"].includes(q.type);
    const label = grouped
      ? h("div", { class: "q-label", id: labelId }, q.label, q.required ? h("span", { class: "req", "aria-hidden": "true" }, " *") : null)
      : h("label", { class: "q-label", id: labelId, for: "q_" + q.id }, q.label, q.required ? h("span", { class: "req", "aria-hidden": "true" }, " *") : null);
    wrap.append(label);
    if (q.help) wrap.append(h("p", { class: "q-help", id: "help_" + q.id }, q.help));
    wrap.append(renderInput(q, labelId));
    wrap.append(h("p", { class: "q-error", id: "err_" + q.id, role: "alert", hidden: true }));
    return wrap;
  }

  function renderInput(q, labelId) {
    const v = ans()[q.id];
    const describedBy = q.help ? "help_" + q.id : null;
    switch (q.type) {
      case "text":
        return h("input", { type: "text", id: "q_" + q.id, value: v || "", placeholder: q.placeholder, "aria-describedby": describedBy, autocomplete: "off",
          oninput: e => setAns(q.id, e.target.value) });
      case "number":
        return h("input", { type: "number", inputmode: "numeric", id: "q_" + q.id, value: v ?? "", min: q.min, max: q.max, class: "short", "aria-describedby": describedBy,
          oninput: e => setAns(q.id, e.target.value === "" ? "" : Number(e.target.value)) });
      case "textarea":
        return h("textarea", { id: "q_" + q.id, rows: 3, placeholder: q.placeholder, "aria-describedby": describedBy,
          oninput: e => setAns(q.id, e.target.value) }, v || "");
      case "select": {
        const sel = h("select", { id: "q_" + q.id, "aria-describedby": describedBy, onchange: e => { setAns(q.id, e.target.value); refresh(); } },
          h("option", { value: "" }, "Choose…"),
          q.options.map(o => h("option", { value: o, selected: v === o }, o)));
        return sel;
      }
      case "radio":
        return h("div", { class: "choices", role: "radiogroup", "aria-labelledby": labelId },
          q.options.map((o, i) => h("label", { class: "choice" },
            h("input", { type: "radio", name: "q_" + q.id, id: `q_${q.id}_${i}`, value: o, checked: v === o,
              onchange: () => { setAns(q.id, o); refresh(); } }),
            h("span", null, o))));
      case "checkbox": {
        const box = h("div", { class: "choices" + (q.columns ? " cols" : ""), role: "group", "aria-labelledby": labelId });
        const chosen = new Set(v || []);
        q.options.forEach((o, i) => {
          box.append(h("label", { class: "choice" },
            h("input", { type: "checkbox", id: `q_${q.id}_${i}`, value: o, checked: chosen.has(o),
              onchange: e => onCheck(q, o, e.target.checked) }),
            h("span", null, o)));
        });
        const wrap = h("div", null, box);
        if (q.max) wrap.prepend(h("p", { class: "counter", id: "count_" + q.id, "aria-live": "polite" }));
        return wrap;
      }
      case "likert": return renderLikert(q, labelId);
      case "grades": return renderGrades(q);
    }
    return h("p", null, "Unknown question type: " + q.type);
  }

  function onCheck(q, option, checked) {
    let list = (ans()[q.id] || []).slice();
    const isNone = /^None/.test(option);
    if (checked) {
      if (isNone) list = [option];
      else list = list.filter(x => !/^None/.test(x)).concat(option);
    } else list = list.filter(x => x !== option);
    setAns(q.id, list);
    // sync checkboxes (for the exclusive "None" behaviour)
    document.querySelectorAll(`#wrap_${q.id} input[type=checkbox]`).forEach(cb => { cb.checked = list.includes(cb.value); });
    refresh();
  }

  function renderLikert(q, labelId) {
    const v = ans()[q.id] || {};
    const list = h("div", { class: "likert", role: "group", "aria-labelledby": labelId });
    list.append(h("div", { class: "likert-key", "aria-hidden": "true" },
      h("span", null, "1 = " + q.scale[0]), h("span", null, "5 = " + q.scale[q.scale.length - 1])));
    q.items.forEach(it => {
      const name = `q_${q.id}_${it.id}`;
      const row = h("div", { class: "likert-row", role: "radiogroup", "aria-label": it.text, id: "row_" + name });
      row.append(h("div", { class: "likert-text" }, it.text));
      const scale = h("div", { class: "likert-scale" });
      q.scale.forEach((lab, i) => {
        const n = i + 1;
        scale.append(h("label", { class: "pip", title: lab },
          h("input", { type: "radio", name, value: n, checked: Number(v[it.id]) === n, "aria-label": `${n}, ${lab}`,
            onchange: () => {
              const cur = Object.assign({}, ans()[q.id] || {});
              cur[it.id] = n; setAns(q.id, cur);
              row.classList.remove("missing");
            } }),
          h("span", null, String(n))));
      });
      row.append(scale);
      list.append(row);
    });
    return list;
  }

  function renderGrades(q) {
    if (!Array.isArray(ans()[q.id])) setAns(q.id, (q.defaultRows || []).map(s => ({ subject: s, grade: "" })));
    const box = h("div", { class: "grades" });
    const draw = () => {
      box.innerHTML = "";
      const rows = ans()[q.id];
      rows.forEach((r, idx) => {
        const subjSel = h("select", { "aria-label": `Subject ${idx + 1}`, id: `q_${q.id}_s${idx}`, onchange: e => { rows[idx].subject = e.target.value; setAns(q.id, rows); } },
          h("option", { value: "" }, "Subject…"),
          q.subjects.map(s => h("option", { value: s, selected: r.subject === s }, s)));
        const gradeSel = h("select", { "aria-label": `Grade for subject ${idx + 1}`, id: `q_${q.id}_g${idx}`, class: "grade", onchange: e => { rows[idx].grade = e.target.value; setAns(q.id, rows); } },
          h("option", { value: "" }, "Grade"),
          q.grades.map(g => h("option", { value: g, selected: r.grade === g }, g)));
        const del = h("button", { type: "button", class: "icon-btn", "aria-label": `Remove subject ${idx + 1}`,
          onclick: () => { rows.splice(idx, 1); setAns(q.id, rows); draw(); } }, "×");
        box.append(h("div", { class: "grade-row" }, subjSel, gradeSel, del));
      });
      box.append(h("button", { type: "button", class: "btn ghost small", onclick: () => {
        rows.push({ subject: "", grade: "" }); setAns(q.id, rows); draw();
        const sel = document.getElementById(`q_${q.id}_s${rows.length - 1}`); if (sel) sel.focus();
      } }, "+ Add subject"));
      const credits = rows.filter(r => /^(A1|B2|B3|C4|C5|C6)$/.test(r.grade)).length;
      box.append(h("p", { class: "counter" }, `${credits} credit${credits === 1 ? "" : "s"} (C6 or better) entered`));
    };
    draw();
    return box;
  }

  // ---------------- visibility & counters ----------------
  function refresh() {
    const sec = SECTIONS[state.step];
    if (!sec) return;
    sec.questions.forEach(q => {
      const w = document.getElementById("wrap_" + q.id);
      if (w) w.hidden = !P.visible(q, ans());
      if (q.type === "checkbox" && q.max) {
        const n = (ans()[q.id] || []).length;
        const c = document.getElementById("count_" + q.id);
        if (c) c.textContent = `${n} of ${q.max} chosen`;
        document.querySelectorAll(`#wrap_${q.id} input[type=checkbox]`).forEach(cb => {
          cb.disabled = !cb.checked && n >= q.max;
          cb.closest(".choice").classList.toggle("disabled", cb.disabled);
        });
      }
    });
  }

  // ---------------- validation ----------------
  function validate(sec) {
    let first = null;
    sec.questions.forEach(q => {
      const err = document.getElementById("err_" + q.id);
      const wrap = document.getElementById("wrap_" + q.id);
      if (!err) return;
      err.hidden = true; wrap.classList.remove("invalid");
      if (!P.visible(q, ans())) return;
      const v = ans()[q.id];
      let msg = "";
      if (q.type === "likert") {
        const missing = q.items.filter(it => !(v || {})[it.id]);
        document.querySelectorAll(`#wrap_${q.id} .likert-row`).forEach(r => r.classList.remove("missing"));
        if (q.required && missing.length) {
          msg = `Rate every line to continue. ${missing.length} still empty.`;
          missing.forEach(it => { const r = document.getElementById(`row_q_${q.id}_${it.id}`); if (r) r.classList.add("missing"); });
        }
      } else if (q.required && P.isEmpty(v)) {
        msg = q.type === "checkbox" ? "Choose at least one option." : q.type === "radio" || q.type === "select" ? "Choose an option." : "Please answer this question.";
      } else if (q.type === "number" && v !== "" && v != null) {
        if ((q.min != null && v < q.min) || (q.max != null && v > q.max)) msg = `Enter a number between ${q.min} and ${q.max}.`;
      } else if (q.id === "utme_subjects" && Array.isArray(v) && v.length && v.length !== 3) {
        msg = "UTME needs exactly three subjects besides Use of English.";
      }
      if (msg) {
        err.textContent = msg; err.hidden = false; wrap.classList.add("invalid");
        if (!first) first = wrap;
      }
    });
    if (first) {
      first.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
      const focusable = first.querySelector("input, select, textarea");
      if (focusable) focusable.focus({ preventScroll: true });
      return false;
    }
    return true;
  }

  // ---------------- screens ----------------
  function go(step) {
    state.step = step; save(); render();
    window.scrollTo(0, 0);
    const hd = root.querySelector("h1, h2");
    if (hd) { hd.setAttribute("tabindex", "-1"); hd.focus({ preventScroll: true }); }
  }

  function progress() {
    const total = SECTIONS.length;
    const i = Math.min(state.step, total);
    const label = state.step < total ? `Step ${i + 1} of ${total}` : state.step === total ? "Review" : "Your prompt";
    return h("div", { class: "progress" },
      h("div", { class: "progress-meta" }, h("span", null, label), h("span", null, `${Math.round((i / total) * 100)}%`)),
      h("div", { class: "track", role: "progressbar", "aria-valuemin": 0, "aria-valuemax": total, "aria-valuenow": i, "aria-label": "Progress" },
        h("div", { class: "fill", style: `width:${(i / total) * 100}%` })),
      h("ol", { class: "steps", "aria-hidden": "true" },
        SECTIONS.map((s, k) => h("li", { class: k < state.step ? "done" : k === state.step ? "now" : "" }))));
  }

  function renderWelcome() {
    const saved = load();
    const hasSaved = saved && saved.answers && Object.keys(saved.answers).length > 0;
    return h("section", { class: "welcome" },
      h("p", { class: "eyebrow" }, "For Nigerian secondary-school leavers"),
      h("h1", null, "Find a course that fits you, then ask AI to help you decide."),
      h("p", { class: "lede" }, "Answer questions about your results, interests and situation. We turn your answers into a ready-made prompt. Paste it into ChatGPT, Claude, Gemini or Meta AI to get personal course and career advice."),
      h("ul", { class: "facts" },
        h("li", null, h("strong", null, "About 15 minutes."), " Your answers save as you go, so you can stop and come back."),
        h("li", null, h("strong", null, "Private."), " Your answers stay on this phone or computer. Nothing is sent to us."),
        h("li", null, h("strong", null, "Free."), " You only need a free account with any AI chat app.")),
      h("div", { class: "actions" },
        hasSaved
          ? [h("button", { class: "btn primary", onclick: () => { state = saved; go(Math.max(0, Math.min(saved.step, SECTIONS.length))); } }, "Continue where I stopped"),
             h("button", { class: "btn ghost", onclick: () => { state = { answers: {}, step: 0 }; clearSaved(); go(0); } }, "Start again")]
          : h("button", { class: "btn primary", onclick: () => { state = { answers: {}, step: 0 }; go(0); } }, "Start the questions"),
        h("button", { class: "btn link", onclick: () => { state = { answers: JSON.parse(JSON.stringify(CFG.sample)), step: SECTIONS.length, sample: true }; go(SECTIONS.length); } }, "See an example with sample answers")),
      h("div", { class: "how" },
        h("h2", null, "How it works"),
        h("ol", null,
          h("li", null, h("strong", null, "Answer"), h("span", null, "8 short sections about your WAEC/NECO grades, UTME subjects, strengths, interests, budget and family.")),
          h("li", null, h("strong", null, "Copy"), h("span", null, "We build one prompt from your answers. Copy it with one tap.")),
          h("li", null, h("strong", null, "Ask AI"), h("span", null, "Paste it into an AI chat. Ask follow-up questions, then check requirements with JAMB and the schools.")))));
  }

  function renderSection() {
    const sec = SECTIONS[state.step];
    const form = h("form", { novalidate: true, onsubmit: e => { e.preventDefault(); if (validate(sec)) go(state.step + 1); } },
      sec.questions.map(field),
      h("div", { class: "nav" },
        h("button", { type: "button", class: "btn ghost", onclick: () => go(state.step - 1) }, "Back"),
        h("button", { type: "submit", class: "btn primary" }, state.step === SECTIONS.length - 1 ? "Review answers" : "Next")));
    const out = h("section", null, progress(),
      state.sample ? h("p", { class: "notice" }, "Example: these answers belong to a made-up student. Changes here aren't saved. Refresh the browser to go back to the start and fill out your own questionnaire.") : null,
      h("h2", { class: "sec-title" }, sec.title),
      sec.intro ? h("p", { class: "sec-intro" }, sec.intro) : null,
      form);
    setTimeout(refresh, 0);
    return out;
  }

  function summaryValue(q, v) {
    if (q.type === "checkbox") return v.join(", ");
    if (q.type === "grades") return v.filter(r => r.subject && r.grade).map(r => `${r.subject} ${r.grade}`).join(", ");
    if (q.type === "likert") {
      const n = q.items.filter(it => v[it.id]).length;
      if (q.id === "riasec") {
        const s = P.riasecScores(v, q).slice(0, 3);
        return s.length ? `Strongest: ${s.map(x => x.name.split(" (")[0]).join(", ")}` : "";
      }
      const top = q.items.filter(it => Number(v[it.id]) >= 4).map(it => it.text);
      return top.length ? `Best at: ${top.slice(0, 4).join("; ")}` : `${n} rated`;
    }
    return String(v);
  }

  function renderReview() {
    const a = ans();
    const blocks = SECTIONS.map((sec, k) => {
      const rows = sec.questions.filter(q => P.visible(q, a) && !P.isEmpty(a[q.id]))
        .map(q => [q.promptLabel ? q.label : q.label, summaryValue(q, a[q.id])]).filter(r => r[1]);
      return h("div", { class: "review-block" },
        h("div", { class: "review-head" }, h("h3", null, sec.title),
          h("button", { class: "btn link small", onclick: () => go(k) }, "Edit")),
        rows.length
          ? h("dl", null, rows.map(([l, v]) => [h("dt", null, l), h("dd", null, v)]))
          : h("p", { class: "muted" }, "Nothing entered."));
    });
    const isSample = !!state.sample;
    return h("section", null, progress(),
      h("h2", { class: "sec-title" }, "Check your answers"),
      isSample
        ? h("div", { class: "notice" },
            h("p", null, "These are sample answers for a made-up student."),
            h("ul", null,
              h("li", null, "Click the ", h("strong", null, "Create my AI prompt"), " button at the bottom to create the AI prompt."),
              h("li", null, "Refresh the browser to go back to the start and fill out your own questionnaire.")))
        : h("p", { class: "sec-intro" }, "Fix anything that's wrong, then create your prompt."),
      blocks,
      h("div", { class: "nav" },
        h("button", { class: "btn ghost", onclick: () => go(SECTIONS.length - 1) }, "Back"),
        h("button", { class: "btn primary", onclick: () => go(SECTIONS.length + 1) }, "Create my AI prompt")));
  }

  function renderResult() {
    const text = P.buildPrompt(ans(), CFG);
    const ta = h("textarea", { class: "prompt", id: "prompt_text", readonly: true, rows: 14, "aria-label": "Your AI prompt" }, text);
    const status = h("p", { class: "status", role: "status", "aria-live": "polite" });
    const chosen = ans().ai_tool || "";

    async function copy() {
      try {
        await navigator.clipboard.writeText(text);
        status.textContent = "Copied. Now open your AI app and paste it.";
      } catch (e) {
        ta.focus(); ta.select();
        try { document.execCommand("copy"); status.textContent = "Copied. Now open your AI app and paste it."; }
        catch (e2) { status.textContent = "Couldn't copy automatically. The text is selected: use your phone's Copy option."; }
      }
      copyBtn.textContent = "Copied ✓";
      setTimeout(() => { copyBtn.textContent = "Copy prompt"; }, 2500);
    }
    function download() {
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = h("a", { href: URL.createObjectURL(blob), download: "my-career-prompt.txt" });
      document.body.append(a); a.click(); a.remove();
      status.textContent = "Saved as my-career-prompt.txt.";
    }
    const copyBtn = h("button", { class: "btn primary big", onclick: copy }, "Copy prompt");

    const links = AI_LINKS.map(l => h("a", { class: "ai-link" + (chosen.startsWith(l.name) || (l.name === "Copilot" && chosen.includes("Copilot")) ? " chosen" : ""), href: l.url, target: "_blank", rel: "noopener" }, l.name));

    return h("section", null, progress(),
      h("h2", { class: "sec-title" }, "Your prompt is ready"),
      h("ol", { class: "steps-list" },
        h("li", null, h("strong", null, "Copy"), " the prompt below."),
        h("li", null, h("strong", null, "Open"), " your AI app and start a new chat."),
        h("li", null, h("strong", null, "Paste"), " and send. Then keep the conversation going.")),
      h("div", { class: "result-actions" }, copyBtn,
        window.MYFUTURE_NIGERIA_PREVIEW ? null : h("button", { class: "btn ghost", onclick: download }, "Download as .txt")),
      status,
      h("div", { class: "ai-links" }, h("span", { class: "muted" }, "Open:"), links),
      ta,
      h("p", { class: "muted small" }, `${text.length.toLocaleString()} characters. You can edit the text after pasting it, before you send.`),
      h("div", { class: "tips" },
        h("h3", null, "Good follow-up questions"),
        h("ul", null,
          h("li", null, "“What does a normal working day look like for someone in option 2?”"),
          h("li", null, "“Compare options 1 and 3 on cost, years of study and job prospects in Nigeria.”"),
          h("li", null, "“Which free online courses can I start this month to test my interest?”"),
          h("li", null, "“Help me explain my choice to my parents.”"))),
      h("div", { class: "caution" },
        h("h3", null, "Before you decide"),
        h("p", null, "AI can be wrong about cut-off marks, fees and subject requirements, and these change every year. Confirm each course in the official JAMB brochure and on the school's website, and talk it over with a teacher, counsellor or someone working in that field.")),
      h("div", { class: "nav" },
        h("button", { class: "btn ghost", onclick: () => go(SECTIONS.length) }, "Back to answers"),
        h("button", { class: "btn link", onclick: () => { state = { answers: {}, step: -1 }; clearSaved(); go(-1); } }, "Clear my answers")));
  }

  function render() {
    root.innerHTML = "";
    const n = SECTIONS.length;
    let view;
    if (state.step < 0) view = renderWelcome();
    else if (state.step < n) view = renderSection();
    else if (state.step === n) view = renderReview();
    else view = renderResult();
    root.append(view);
  }

  // Start on the welcome screen; it offers to resume saved progress.
  render();
})();
