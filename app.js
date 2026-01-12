// Asespert Step-by-step (Efficient UI + scoring) — no API keys here.

const screens = {
  intro: document.getElementById("screenIntro"),
  quiz: document.getElementById("screenQuiz"),
  results: document.getElementById("screenResults"),
};

const el = {
  teacherName: document.getElementById("teacherName"),
  assessmentType: document.getElementById("assessmentType"),

  btnStart: document.getElementById("btnStart"),
  btnPrev: document.getElementById("btnPrev"),
  btnNext: document.getElementById("btnNext"),
  btnAgain: document.getElementById("btnAgain"),
  btnExport: document.getElementById("btnExport"),
  btnReset: document.getElementById("btnReset"),

  areaIndex: document.getElementById("areaIndex"),
  areaTitle: document.getElementById("areaTitle"),
  areaDesc: document.getElementById("areaDesc"),
  items: document.getElementById("items"),
  areaComment: document.getElementById("areaComment"),
  commentLabel: document.getElementById("commentLabel"),

  progressBar: document.getElementById("progressBar"),
  progressText: document.getElementById("progressText"),

  resultsMeta: document.getElementById("resultsMeta"),
  resultsGrid: document.getElementById("resultsGrid"),
  profileBox: document.getElementById("profileBox"),
  toast: document.getElementById("toast"),
};

const LIKERT_LABELS = {
  1: "Never / not yet",
  2: "Rarely",
  3: "Sometimes",
  4: "Often",
  5: "Always / consistently",
};

const AREAS = [
  {
    key: "learning_and_learner",
    title: "Learning and the learner",
    desc: "Understanding how learners learn language and applying this understanding in planning and teaching.",
    commentLabel: "What is one thing you do well in understanding your learners, and one thing you want to improve?",
    items: [
      "I can explain basic language-learning concepts and apply them in lesson planning.",
      "I deliberately link activities to how learners learn language (not just finishing pages).",
      "I adapt my teaching decisions based on how learners respond during the lesson.",
      "I consider learner differences (needs, context, affect) when choosing tasks and interaction patterns.",
      "I can discuss language-learning theories/approaches with colleagues and relate them to classroom choices."
    ]
  },
  {
    key: "teaching_learning_assessment",
    title: "Teaching, learning and assessment",
    desc: "Planning, delivering, adapting materials, and using assessment evidence to improve learning.",
    commentLabel: "Which part of teaching/assessment feels easiest for you, and which part needs the most support?",
    items: [
      "I plan lessons with clear links between aims, tasks, and outcomes.",
      "I can respond to unforeseen classroom events and adjust the plan effectively.",
      "I select coursebook materials critically and adapt/supplement when needed.",
      "I use a range of teaching techniques rather than repeating the same routine.",
      "I choose/design assessment tasks that match learning objectives.",
      "I give feedback that helps learners improve, not only right/wrong.",
      "I use assessment evidence to adjust upcoming lessons."
    ]
  },
  {
    key: "language_ability",
    title: "Language ability",
    desc: "Classroom English accuracy, modelling language, and grading language to suit learner levels.",
    commentLabel: "Which aspect of your classroom English do you want to strengthen most (accuracy, fluency, grading, instructions, feedback language)?",
    items: [
      "My classroom English is accurate and clear throughout the lesson.",
      "I provide accurate models of language at the levels I teach.",
      "I adjust my language (speed, grading, paraphrasing) to suit different levels.",
      "I identify learner errors accurately and decide which to address.",
      "I communicate effectively in professional contexts with colleagues."
    ]
  },
  {
    key: "language_knowledge_awareness",
    title: "Language knowledge and awareness",
    desc: "Analysing language and anticipating learner problems; using terminology and references appropriately.",
    commentLabel: "What’s one language point learners often struggle with in your context, and how do you usually handle it?",
    items: [
      "I know and can explain key grammar, vocabulary and pronunciation terms.",
      "I can answer most learner questions without needing to check references.",
      "I can anticipate common language problems learners will have with a new item.",
      "I provide accurate examples and clarify meaning/form/pronunciation when teaching new items.",
      "I use reference resources effectively when necessary."
    ]
  },
  {
    key: "professional_development_values",
    title: "Professional development and values",
    desc: "Reflection, collaboration, feedback-seeking, and purposeful professional growth.",
    commentLabel: "What is one professional goal you want to achieve next term, and what support would help?",
    items: [
      "I reflect on my lessons and make specific notes on what to change next time.",
      "I actively seek feedback from colleagues or supervisors.",
      "I can clearly identify my strengths and weaknesses as a teacher.",
      "I support other teachers, e.g. by sharing ideas or mentoring.",
      "I take part in professional development and apply learning in my teaching."
    ]
  },
  {
    key: "ai_technology_integration",
    title: "AI and Technology Integration in Teaching, Learning and Assessment",
    desc: "Using AI and digital technologies effectively, critically, and creatively to plan lessons, design materials, assess learning, provide feedback, and create digital products.",
    commentLabel: "What is one way you currently use AI/technology well, and one way you want to improve next term?",
    items: [
      "I use AI and digital tools to support lesson planning (e.g., aims, stages, timing, differentiation).",
      "I use AI to create teaching materials (presentations, worksheets, texts) and I edit them to fit my objectives.",
      "I adapt AI-generated content to learner needs (level, interests, context) rather than using default outputs.",
      "I use AI/technology to design or adapt assessment tasks that match learning objectives.",
      "I use AI to generate feedback (e.g., comments, success criteria, improvement steps) and I check it for accuracy and tone.",
      "I create digital learning products using AI (interactive worksheets, digital books, simple learning apps) with clear instructional value.",
      "I evaluate AI outputs critically for quality, coherence, bias, and appropriacy before using them.",
      "I use AI ethically and responsibly (privacy, transparency, academic integrity) and model safe practice for learners/colleagues."
    ]
  }
];

let currentArea = 0;

const state = {
  teacher_name: "",
  assessment_type: "pre",
  areas: {}
};

function showToast(msg, isError=false){
  el.toast.textContent = msg;
  el.toast.classList.remove("hidden");
  el.toast.style.borderColor = isError ? "rgba(227,93,93,0.5)" : "rgba(47,107,87,0.55)";
  setTimeout(()=> el.toast.classList.add("hidden"), 2400);
}

function switchScreen(name){
  Object.values(screens).forEach(s => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));
}

function renderArea(idx){
  currentArea = clamp(idx, 0, AREAS.length - 1);
  const area = AREAS[currentArea];

  el.areaIndex.textContent = String(currentArea + 1);
  el.areaTitle.textContent = area.title;
  el.areaDesc.textContent = area.desc;

  const pct = Math.round((currentArea / AREAS.length) * 100);
  el.progressBar.style.width = `${pct}%`;
  el.progressText.textContent = `${pct}%`;

  if (!state.areas[area.key]) {
    state.areas[area.key] = { scores: new Array(area.items.length).fill(null), comments: "" };
  }
  const saved = state.areas[area.key];

  el.items.innerHTML = "";
  area.items.forEach((text, i) => {
    const wrap = document.createElement("div");
    wrap.className = "item";
    wrap.innerHTML = `
      <div class="item-title">Q${i+1}. ${escapeHtml(text)}</div>
      <div class="likert" role="radiogroup" aria-label="Likert question ${i+1}">
        ${[1,2,3,4,5].map(v => {
          const checked = saved.scores[i] === v ? "checked" : "";
          return `
            <label>
              <input type="radio" name="${area.key}_q${i}" value="${v}" ${checked} />
              <span>
                <div class="num">${v}</div>
                <div class="lbl">${escapeHtml(LIKERT_LABELS[v])}</div>
              </span>
            </label>
          `;
        }).join("")}
      </div>
    `;

    wrap.querySelectorAll(`input[name="${area.key}_q${i}"]`).forEach(inp => {
      inp.addEventListener("change", () => {
        saved.scores[i] = Number(inp.value);
      });
    });

    el.items.appendChild(wrap);
  });

  el.commentLabel.textContent = area.commentLabel;
  el.areaComment.value = saved.comments || "";
  el.btnPrev.disabled = (currentArea === 0);
  el.btnNext.textContent = (currentArea === AREAS.length - 1) ? "Finish" : "Next";
}

function validateArea(){
  const area = AREAS[currentArea];
  const saved = state.areas[area.key];
  saved.comments = (el.areaComment.value || "").trim();

  const missing = saved.scores.findIndex(v => !Number.isFinite(v));
  if (missing !== -1) {
    showToast(`Please answer Q${missing+1} in this area.`, true);
    return false;
  }
  return true;
}

function avg(arr){
  const s = arr.reduce((a,b)=>a+b,0);
  return Number((s / arr.length).toFixed(2));
}

function stageFromAverage(a){
  if (a >= 1.0 && a <= 1.9) return "Foundation";
  if (a >= 2.0 && a <= 2.9) return "Developing";
  if (a >= 3.0 && a <= 3.9) return "Proficient";
  if (a >= 4.0 && a <= 5.0) return "Expert";
  return "N/A";
}

function borderlineFlag(a){
  const boundaries = [2.0, 3.0, 4.0];
  const near = boundaries.find(b => Math.abs(a - b) <= 0.15);
  return near ? `Borderline near ${near.toFixed(1)}` : "";
}

function buildResults(){
  const results = {};
  for (const area of AREAS){
    const data = state.areas[area.key];
    const a = avg(data.scores);
    results[area.key] = {
      average: a,
      stage: stageFromAverage(a),
      borderline: borderlineFlag(a),
      comments: data.comments || ""
    };
  }
  return results;
}

function stageBadgeClass(stage){
  return ["Expert","Proficient"].includes(stage) ? "ok" : "";
}

function generateSimpleProfile(results){
  const parts = Object.entries(results).map(([k,v]) => `${AREAS.find(a=>a.key===k)?.title || k}: ${v.stage}`);
  const sorted = Object.entries(results).sort((a,b)=>a[1].average - b[1].average);
  const focus = sorted.slice(0,2).map(x=>AREAS.find(a=>a.key===x[0])?.title || x[0]).join(" & ");

  return `PROFILE (auto)\n` +
    `- ${state.teacher_name} (${state.assessment_type.toUpperCase()})\n` +
    `${parts.map(p=>`- ${p}`).join("\n")}\n\n` +
    `NEXT-TERM FOCUS\n- Prioritise: ${focus}\n` +
    `- Choose 2 small routines (weekly) and track impact.\n` +
    `- Re-assess after one term to see growth.`;
}

function renderResults(){
  const results = buildResults();

  el.resultsMeta.textContent = `${state.teacher_name} • ${state.assessment_type.toUpperCase()} • ${AREAS.length} areas`;
  el.resultsGrid.innerHTML = "";

  for (const [areaKey, r] of Object.entries(results)){
    const areaTitle = AREAS.find(a=>a.key===areaKey)?.title || areaKey;
    const card = document.createElement("div");
    card.className = "result-card";
    card.innerHTML = `
      <div class="result-title">
        <div>
          <div style="font-weight:900">${escapeHtml(areaTitle)}</div>
          <div class="small">Average: <b>${r.average}</b>${r.borderline ? ` • ${escapeHtml(r.borderline)}` : ""}</div>
        </div>
        <div class="badge ${stageBadgeClass(r.stage)}">${escapeHtml(r.stage)}</div>
      </div>
      <div class="small">Comment: ${escapeHtml(r.comments || "—")}</div>
    `;
    el.resultsGrid.appendChild(card);
  }

  el.profileBox.textContent = generateSimpleProfile(results);

  window.__ASESPERT_EXPORT__ = {
    teacher_name: state.teacher_name,
    assessment_type: state.assessment_type,
    areas: state.areas,
    results
  };
}

// EVENTS
el.btnStart.addEventListener("click", () => {
  const name = (el.teacherName.value || "").trim();
  if (!name) return showToast("Please enter Teacher Name.", true);

  state.teacher_name = name;
  state.assessment_type = el.assessmentType.value || "pre";

  switchScreen("quiz");
  renderArea(0);
});

el.areaComment.addEventListener("input", () => {
  const area = AREAS[currentArea];
  state.areas[area.key].comments = (el.areaComment.value || "").trim();
});

el.btnPrev.addEventListener("click", () => {
  if (currentArea > 0) renderArea(currentArea - 1);
});

el.btnNext.addEventListener("click", () => {
  if (!validateArea()) return;

  if (currentArea < AREAS.length - 1) {
    renderArea(currentArea + 1);
    return;
  }

  el.progressBar.style.width = "100%";
  el.progressText.textContent = "100%";
  switchScreen("results");
  renderResults();
  showToast("Assessment complete!");
});

el.btnAgain.addEventListener("click", () => {
  resetAll();
  switchScreen("intro");
});

el.btnReset.addEventListener("click", () => {
  resetAll();
  switchScreen("intro");
  showToast("Reset complete.");
});

el.btnExport.addEventListener("click", () => {
  const data = window.__ASESPERT_EXPORT__ || {};
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `asespert_${state.teacher_name || "teacher"}_${state.assessment_type}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

function resetAll(){
  state.teacher_name = "";
  state.assessment_type = "pre";
  state.areas = {};
  currentArea = 0;
  el.teacherName.value = "";
  el.assessmentType.value = "pre";
  window.__ASESPERT_EXPORT__ = null;
}

// INIT
switchScreen("intro");
