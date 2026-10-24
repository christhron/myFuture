/*
 * myFuture Nigeria — prompt builder
 * ------------------------------------------------------------
 * Turns the student's answers into one prompt they can paste into any AI.
 * The fixed wording lives in PROMPT_TEXT below; edit it freely.
 */

(function () {
  const PROMPT_TEXT = {
    role:
`You are an experienced, honest career and university-admissions counsellor who knows the Nigerian education system and job market well. A Nigerian secondary-school leaver filled in a questionnaire. Their answers are below. Help them choose a course of study and a career direction.`,

    context:
`## Background on Nigerian admissions (use this; don't lecture the student about it)
- Admission into universities, polytechnics and colleges of education goes through JAMB: the UTME (Use of English plus three subjects, scored out of 400), the institution's post-UTME screening, and acceptance on JAMB CAPS.
- Each course requires specific UTME subjects and five O'level credits (C6 or better) in WAEC/NECO/NABTEB, usually including English Language and Mathematics, normally in no more than two sittings.
- Other routes exist: Direct Entry (JUPEB, IJMB, A-Levels, OND, NCE), polytechnic ND then HND, colleges of education (NCE), specialised colleges, and study abroad.
- Federal and state institutions are usually far cheaper than private ones. The Nigerian Education Loan Fund (NELFUND) offers student loans for some students in public institutions.`,

    tasks:
`## What to do
1. First check the facts that limit the student's options: their O'level grades, their UTME subjects, and their UTME score if given. If a course needs a subject or grade they don't have, say so plainly and suggest a fix (resit, change of UTME subjects next year, a related course, or another route).
2. Recommend {{COUNT}} courses, grouped as "Strong match", "Good match" and "Worth considering". For each course give:
   - The course name as Nigerian institutions list it, and which types of institution offer it.
   - Why it fits THIS student, pointing to their specific answers.
   - The usual UTME subject combination and key O'level subjects, and whether the student currently meets them (meets / partly / not yet).
   - How long it takes and a rough cost level (low / medium / high) for the institution types they chose.
   - 2–3 realistic careers in Nigeria it leads to, typical employers, and an honest view of the job market (say so if the field is crowded or underpaid, and what makes graduates stand out).
   - Opportunities abroad or in remote work, if the student cares about that.
3. If the student's family wants a different course, address it respectfully: compare the two honestly and suggest how the student could discuss it with their parents.
4. Give a Plan B in case they don't get admission this year.
5. List 5 concrete next steps for the next three months (free online courses, people to talk to, things to try, requirements to check).
6. End with 3 questions the student should think about or discuss with a parent, teacher or counsellor.`,

    rules:
`## Rules
- Be honest and specific. Don't flatter. If a goal is hard with their results, say so kindly and show a path.
- Do not invent cut-off marks, fees, or exact admission requirements. Give typical figures only if you are confident, label them as approximate, and tell the student to confirm in the official JAMB brochure (on the JAMB website or e-Facility) and on each institution's website, because requirements change every year.
- Consider Nigerian realities: cost, distance, security, the job market, and the value of practical skills alongside a certificate.
- Treat the interest and skills ratings as rough self-reports, not a scientific test.
- Address the student directly as "you".`
  };

  const COUNTS = { "Short and to the point": "3", "Detailed": "5 to 6" };

  // ---------- helpers ----------
  const isEmpty = v => v == null || v === "" || (Array.isArray(v) && v.length === 0) ||
    (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0);

  function visible(q, answers) {
    const c = q.showIf;
    if (!c) return true;
    const v = answers[c.id];
    const arr = Array.isArray(v) ? v : (v == null || v === "" ? [] : [v]);
    if (c.notEmpty && arr.length === 0) return false;
    if (c.in && !arr.some(x => c.in.includes(x))) return false;
    if (c.notIn && arr.some(x => c.notIn.includes(x))) return false;
    return true;
  }

  function riasecScores(ratings, q) {
    const names = { R: "Realistic (hands-on, practical)", I: "Investigative (analytical, scientific)", A: "Artistic (creative, expressive)", S: "Social (helping, teaching)", E: "Enterprising (leading, business)", C: "Conventional (organising, detail)" };
    const sums = {}, counts = {};
    q.items.forEach(it => {
      const n = Number(ratings[it.id]);
      if (!n) return;
      sums[it.tag] = (sums[it.tag] || 0) + n;
      counts[it.tag] = (counts[it.tag] || 0) + 1;
    });
    const list = Object.keys(names)
      .filter(k => counts[k])
      .map(k => ({ code: k, name: names[k], avg: sums[k] / counts[k] }))
      .sort((a, b) => b.avg - a.avg);
    return list;
  }

  function formatValue(q, v, answers) {
    switch (q.type) {
      case "checkbox": return v.join(", ");
      case "grades": {
        const rows = v.filter(r => r.subject && r.grade);
        return rows.length ? "\n" + rows.map(r => `  - ${r.subject}: ${r.grade}`).join("\n") : "";
      }
      case "likert": {
        const lines = q.items.filter(it => v[it.id]).map(it => `  - ${it.text}: ${v[it.id]}`);
        return lines.length ? "\n" + lines.join("\n") : "";
      }
      case "textarea": return String(v).trim().replace(/\s*\n\s*/g, " / ");
      default: return String(v).trim();
    }
  }

  function buildProfile(answers, config) {
    const out = [];
    config.sections.forEach(sec => {
      if (sec.id === "settings") return;
      const lines = [];
      sec.questions.forEach(q => {
        if (!visible(q, answers)) return;
        const v = answers[q.id];
        if (isEmpty(v)) return;
        if (q.id === "riasec") {
          const scores = riasecScores(v, q);
          if (scores.length) {
            lines.push(`- Interest profile (Holland/RIASEC averages out of 5, highest first): ` +
              scores.map(s => `${s.name} ${s.avg.toFixed(1)}`).join("; "));
            lines.push(`- Top interest code: ${scores.slice(0, 3).map(s => s.code).join("")}`);
          }
          const txt = formatValue(q, v, answers);
          if (txt) lines.push(`- ${q.promptLabel || q.label}:${txt}`);
          return;
        }
        let label = q.promptLabel || q.label;
        if (q.id === "utme_subjects") label = "UTME subjects (with Use of English)";
        const txt = formatValue(q, v, answers);
        if (txt) lines.push(`- ${label.replace(/[?…]$/, "")}: ${txt}`.replace(/: \n/, ":\n"));
      });
      if (lines.length) out.push(`### ${sec.title}\n${lines.join("\n")}`);
    });
    return out.join("\n\n");
  }

  function buildPrompt(answers, config) {
    const lang = answers.answer_lang || "English";
    const detail = answers.detail || "Detailed";
    const askFirst = (answers.followup || "").startsWith("Yes");

    const langLine = {
      "English": "Write in clear English.",
      "Simple English": "Write in simple, plain English that a 16-year-old reads easily. Avoid jargon.",
      "Nigerian Pidgin": "Write in Nigerian Pidgin, but keep course names, subject names and official terms in English.",
      "Yoruba": "Write in Yoruba, but keep course names, subject names and official terms in English.",
      "Igbo": "Write in Igbo, but keep course names, subject names and official terms in English.",
      "Hausa": "Write in Hausa, but keep course names, subject names and official terms in English."
    }[lang] || "Write in clear English.";

    const lengthLine = detail === "Detailed"
      ? "Be thorough but well organised, with headings and bullet points."
      : "Keep it short: about one screen per course, with bullet points.";

    const startLine = askFirst
      ? "## Before you answer\nFirst ask me up to 5 short questions about anything important that is missing or unclear in my answers. Ask them all in one message, then wait for my reply before giving recommendations."
      : "## Start\nGive your recommendations now. At the end, invite me to ask follow-up questions.";

    const name = (answers.first_name || "").trim();
    const intro = name ? `The student's name is ${name}.` : "";

    return [
      PROMPT_TEXT.role + (intro ? " " + intro : ""),
      PROMPT_TEXT.context,
      "## The student's answers\n\n" + buildProfile(answers, config),
      PROMPT_TEXT.tasks.replace("{{COUNT}}", COUNTS[detail] || "5"),
      PROMPT_TEXT.rules + `\n- ${langLine}\n- ${lengthLine}`,
      startLine
    ].join("\n\n").trim() + "\n";
  }

  window.CourseCompassPrompt = { buildPrompt, visible, isEmpty, riasecScores };
})();
