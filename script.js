/**
 * 忏悔室 · 交互逻辑
 *
 * 状态流转：
 * boot → guide → confess → burning → lots → echo → end → (again | farewell)
 *
 * 关于接入真实 AI：
 * 当前 getReflection() 是本地模板生成的占位回应，不调用任何外部 API，不产生费用。
 * 正式上线时，把 getReflection() 换成对你自己后端（建议用 Cloudflare Workers /
 * Vercel Serverless Function 做代理）的 fetch 调用，绝不要把 API key 写在这个前端文件里。
 */

const body = document.body;
let lastConfession = "";

function setState(state) {
  body.dataset.state = state;
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(`screen-${state}`);
  if (target) target.classList.add("active");
}

/**
 * 打字机效果：逐字敲出文字，末尾带一个闪烁的光标。
 * 完成后调用 onDone（如果传入）。
 */
function typewrite(el, text, onDone) {
  el.textContent = "";
  const caret = document.createElement("span");
  caret.className = "caret";
  el.appendChild(caret);

  let i = 0;
  const speed = 34;
  function step() {
    if (i < text.length) {
      caret.insertAdjacentText("beforebegin", text[i]);
      i++;
      setTimeout(step, speed);
    } else {
      caret.remove();
      if (onDone) onDone();
    }
  }
  step();
}

/* ---------- 屏 1 → 2：开机 ---------- */

// 初始状态必须显式激活，否则 screen-boot 停留在 opacity:0 / pointer-events:none。
setState("boot");

let bootEntered = false;
function enterFromBoot() {
  if (bootEntered) return;
  bootEntered = true;
  setState("guide");
  typeGuideLines();
}
document.getElementById("screen-boot").addEventListener("click", enterFromBoot);

function typeGuideLines() {
  const lines = Array.from(document.querySelectorAll("#guide-lines .line"));
  let idx = 0;
  function next() {
    if (idx >= lines.length) return;
    const el = lines[idx];
    const text = el.dataset.text || "";
    idx++;
    setTimeout(() => typewrite(el, text, next), idx === 1 ? 300 : 260);
  }
  next();
}

/* ---------- 屏 2 → 3 ---------- */

document.getElementById("btn-enter").addEventListener("click", () => {
  setState("confess");
  document.getElementById("confess-input").focus();
});

/* ---------- 屏 3：输入 ---------- */

const input = document.getElementById("confess-input");
const charCount = document.getElementById("char-count");
const submitBtn = document.getElementById("btn-submit");
let typingTimer = null;

input.addEventListener("input", () => {
  const len = input.value.length;
  charCount.textContent = `${len} / 600`;
  submitBtn.disabled = len === 0;

  body.classList.add("typing");
  clearTimeout(typingTimer);
  typingTimer = setTimeout(() => body.classList.remove("typing"), 900);
});

submitBtn.addEventListener("click", submitConfession);
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !submitBtn.disabled) {
    submitConfession();
  }
});

/* ---------- 屏 3 → 4：焚去 ---------- */

function submitConfession() {
  lastConfession = input.value.trim();
  if (!lastConfession) return;

  setState("burning");

  const stage = document.getElementById("burn-stage");
  const textEl = document.getElementById("burning-echo");
  const emberLayer = document.getElementById("ember-layer");
  emberLayer.innerHTML = "";

  input.value = "";
  charCount.textContent = "0 / 600";
  submitBtn.disabled = true;

  burnText(textEl, emberLayer, lastConfession, () => {
    if (containsCrisisSignal(lastConfession)) {
      goToCareScreen();
    } else {
      goToLots();
    }
  });
}

/**
 * 把文字拆成逐字的 span，用 animation-delay 错开，形成从头到尾被"点燃"
 * 后化为灰烬消失的效果，同时在文字四周随机撒一些飘起的火星。
 */
function burnText(textEl, emberLayer, text, onDone) {
  textEl.innerHTML = "";
  const chars = Array.from(text);
  const maxSweep = 1800; // 无论文字多长，扫过的总时间都不超过这个上限
  const burnDur = 1200;  // 需与 CSS 中 .burn-char 的 animation-duration 保持一致
  const stagger = chars.length > 1 ? Math.min(30, maxSweep / (chars.length - 1)) : 0;

  chars.forEach((ch, i) => {
    const span = document.createElement("span");
    span.className = "burn-char";
    span.textContent = ch === " " ? "\u00A0" : ch;
    span.style.animationDelay = `${i * stagger}ms`;
    textEl.appendChild(span);
  });

  const totalDuration = stagger * Math.max(chars.length - 1, 0) + burnDur;
  spawnEmbers(emberLayer, chars.length, totalDuration);

  setTimeout(onDone, totalDuration + 400);
}

function spawnEmbers(emberLayer, charCount, totalDuration) {
  const sparkCount = Math.min(20, Math.max(8, Math.round(charCount / 2)));
  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement("div");
    spark.className = "ember-spark";
    const leftPct = Math.random() * 100;
    const topPct = 25 + Math.random() * 55;
    const drift = `${Math.round(Math.random() * 34 - 17)}px`;
    const delay = Math.random() * totalDuration * 0.85;
    const dur = 850 + Math.random() * 650;

    spark.style.left = `${leftPct}%`;
    spark.style.top = `${topPct}%`;
    spark.style.setProperty("--drift", drift);
    spark.style.animationDelay = `${delay}ms`;
    spark.style.animationDuration = `${dur}ms`;

    emberLayer.appendChild(spark);
    setTimeout(() => spark.remove(), delay + dur + 80);
  }
}

/* ---------- 安全兜底：不做占卜式回应，转为支持性引导 ---------- */

function goToCareScreen() {
  setState("echo");
  document.getElementById("echo-label").textContent = "先别急";
  typewrite(
    document.getElementById("echo-text"),
    "你说的这些，听起来很重，也很痛。\n这间小屋能听，但接不住这么重的事。\n如果可以，请现在联系身边你信任的人，或当地的心理援助 / 24 小时危机热线。\n你不需要一个人扛。"
  );
}

/* ---------- 屏 5：抽签 ---------- */

function goToLots() {
  setState("lots");
  const lotsScreen = document.getElementById("screen-lots");
  lotsScreen.classList.remove("drawn");

  setTimeout(() => {
    const verse = pickVerse(lastConfession);
    lotsScreen.classList.add("drawn");
    document.getElementById("verse-theme").textContent = THEME_LABELS[verse.theme];
    typewrite(document.getElementById("verse-text"), `「${verse.text}」`, () => {
      setTimeout(goToEcho, 1800);
    });
  }, 1400);
}

/* ---------- 屏 6：回声（占位 AI 回应） ---------- */

function goToEcho() {
  setState("echo");
  document.getElementById("echo-label").textContent = "回声";
  typewrite(document.getElementById("echo-text"), getReflection(lastConfession));
}

/**
 * 占位的"AI 回应"：基于关键词的模板拼接，完全在本地运行，不产生任何调用费用。
 * 接入真实模型时，用一次 fetch 请求替换本函数体即可，
 * 建议返回结构与这里一致（一段纯文本）。
 */
function getReflection(text) {
  const templates = [
    "谢谢你愿意说出来。这件事你已经背了一阵子了吧。",
    "听起来这件事一直压在你心里，现在它至少被说出来了。",
    "你说这些的时候，我没有听到你在找借口，只听到你在诚实地面对自己。",
    "这不是一件小事，但你已经把它放到了光里。",
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

/* ---------- 屏 6 → 7 ---------- */

document.getElementById("btn-continue").addEventListener("click", () => {
  setState("end");
});

/* ---------- 屏 7：再说一次 / 离开 ---------- */

document.getElementById("btn-again").addEventListener("click", () => {
  setState("confess");
  document.getElementById("confess-input").focus();
});

document.getElementById("btn-leave").addEventListener("click", () => {
  setState("farewell");
});
