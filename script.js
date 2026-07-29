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

/* ---------- 屏 1 → 2：开机 ---------- */

const bootHint = document.getElementById("boot-hint");
function enterFromBoot() {
  setState("guide");
  const lines = document.querySelectorAll("#guide-lines .line");
  lines.forEach((line, i) => {
    setTimeout(() => line.classList.add("in"), 260 + i * 650);
  });
}
bootHint.addEventListener("click", enterFromBoot);
setTimeout(() => {
  // 若用户没有点击，开机动画结束后仍停留，等待点击；不强制自动跳转，
  // 保留"点一盏烛"作为用户主动的第一次动作。
}, 2600);

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

  const echoLine = document.getElementById("burning-echo");
  echoLine.textContent = lastConfession.length > 60
    ? lastConfession.slice(0, 60) + "……"
    : lastConfession;

  setState("burning");

  setTimeout(() => {
    input.value = "";
    charCount.textContent = "0 / 600";
    submitBtn.disabled = true;

    if (containsCrisisSignal(lastConfession)) {
      goToCareScreen();
    } else {
      goToLots();
    }
  }, 2300);
}

/* ---------- 安全兜底：不做占卜式回应，转为支持性引导 ---------- */

function goToCareScreen() {
  setState("echo");
  const echoText = document.getElementById("echo-text");
  document.getElementById("echo-label").textContent = "先别急";
  typewrite(
    echoText,
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
    document.getElementById("verse-text").textContent = `「${verse.text}」`;
    document.getElementById("verse-theme").textContent = THEME_LABELS[verse.theme];
    lotsScreen.classList.add("drawn");

    setTimeout(goToEcho, 2600);
  }, 1400);
}

/* ---------- 屏 6：回声（占位 AI 回应） ---------- */

function goToEcho() {
  setState("echo");
  document.getElementById("echo-label").textContent = "回声";
  const echoText = document.getElementById("echo-text");
  typewrite(echoText, getReflection(lastConfession));
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

function typewrite(el, text) {
  el.textContent = "";
  let i = 0;
  const speed = 38;
  function step() {
    if (i <= text.length) {
      el.textContent = text.slice(0, i);
      i++;
      setTimeout(step, speed);
    }
  }
  step();
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
