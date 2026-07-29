/**
 * 忏悔室 · 箴言库
 * 全部为原创短句，未引用任何宗教经典或他人作品，避免版权与准确性风险。
 * 每条归入一个主题 theme，用于和用户输入的情绪关键词做简单匹配抽签。
 * 如果你想替换成公有领域文本（如已故超过版权年限的诗人作品），
 * 请先核实原文与公有领域状态，并在 verse-theme 处标注出处。
 */

const VERSES = [
  // 认罪 / confess
  { theme: "confess", text: "你说出来的那一刻，它就已经开始变轻了。" },
  { theme: "confess", text: "承认不是软弱，是你终于愿意看向自己。" },
  { theme: "confess", text: "没有人的心是完全干净的，这不是缺陷，是共同点。" },
  { theme: "confess", text: "藏起来的事情不会消失，只会变重。" },
  { theme: "confess", text: "你不是来被审判的，你是来卸货的。" },
  { theme: "confess", text: "说出口，是把它从心里搬到了空气里。" },

  // 宽恕 / forgive
  { theme: "forgive", text: "原谅别人，有时候是把自己先放下来。" },
  { theme: "forgive", text: "你可以恨一件事，同时依然是个善良的人。" },
  { theme: "forgive", text: "宽恕不是说这没关系，是说你不想再被它拖着走。" },
  { theme: "forgive", text: "有些账，不必算清，只需要放下秤。" },
  { theme: "forgive", text: "你欠自己的，比你欠别人的更该先还。" },
  { theme: "forgive", text: "恨一个人太久，最先累的是自己的心。" },

  // 释怀 / release
  { theme: "release", text: "过去不会消失，但它可以不再追着你跑。" },
  { theme: "release", text: "有的事情，不是解决了，是你不再天天举着它。" },
  { theme: "release", text: "你可以把它放下，不代表它不重要。" },
  { theme: "release", text: "紧握的手，才会一直疼。" },
  { theme: "release", text: "有些门，不必关上，只是不必天天推开。" },
  { theme: "release", text: "它曾经很重要，现在可以只是曾经。" },

  // 安慰 / comfort
  { theme: "comfort", text: "你现在的难过，是真的，不需要理由才成立。" },
  { theme: "comfort", text: "撑不住的时候，先别急着变好，先别垮就够了。" },
  { theme: "comfort", text: "没关系，今天允许自己只是撑着。" },
  { theme: "comfort", text: "你不是一个人在扛，只是这一刻看起来像。" },
  { theme: "comfort", text: "疲惫也是一种诚实，它说明你一直在尽力。" },
  { theme: "comfort", text: "你不需要马上好起来，你只需要先喘口气。" },

  // 重新开始 / renew
  { theme: "renew", text: "每一个天亮，都不欠昨天一个解释。" },
  { theme: "renew", text: "你不必是从前那个自己，才配拥有今天。" },
  { theme: "renew", text: "重新开始，不是忘记，是决定不再被困住。" },
  { theme: "renew", text: "旧的部分留下了痕迹，新的部分依然可以生长。" },
  { theme: "renew", text: "你走过的弯路，也是你现在站的地方。" },
  { theme: "renew", text: "明天不需要完美，它只需要是新的一天。" },
];

// 简单的情绪关键词 → 主题映射，用于让"随机抽签"带一点回应感
const THEME_KEYWORDS = {
  confess: ["对不起", "后悔", "错了", "犯错", "愧疚", "骗", "隐瞒", "撒谎"],
  forgive: ["恨", "怨", "原谅", "背叛", "伤害我", "生气", "怒"],
  release: ["放不下", "忘不掉", "执念", "纠结", "想不通", "过不去"],
  comfort: ["累", "难过", "撑不住", "痛苦", "孤独", "崩溃", "哭", "压力"],
  renew: ["重新", "开始", "改变", "希望", "以后", "未来"],
};

// 主题的中文标签（展示用）
const THEME_LABELS = {
  confess: "认罪",
  forgive: "宽恕",
  release: "释怀",
  comfort: "安慰",
  renew: "新生",
};

/**
 * 安全关键词：若命中，跳过占卜式流程，转为提供支持性引导。
 * 这里只做粗略的模式匹配，不做医学或心理判断。
 */
const CRISIS_KEYWORDS = [
  "自杀", "想死", "不想活", "自残", "伤害自己", "结束生命", "活不下去",
];

function pickVerse(inputText) {
  const text = (inputText || "").trim();
  let matchedTheme = null;

  for (const theme in THEME_KEYWORDS) {
    const words = THEME_KEYWORDS[theme];
    if (words.some((w) => text.includes(w))) {
      matchedTheme = theme;
      break;
    }
  }

  const pool = matchedTheme
    ? VERSES.filter((v) => v.theme === matchedTheme)
    : VERSES;

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return chosen;
}

function containsCrisisSignal(inputText) {
  const text = (inputText || "").trim();
  return CRISIS_KEYWORDS.some((w) => text.includes(w));
}
