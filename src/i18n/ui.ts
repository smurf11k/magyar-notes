export const SUPPORTED_LANGS = ["en", "ua"] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];

export const LANGUAGE_NAMES: Record<Lang, string> = {
  en: "English",
  ua: "Українська",
};

export const DEFAULT_LANG: Lang = "ua";

export type UiDictionary = {
  header: {
    viewOnGithubAria: string;
    toggleThemeAria: string;
    openLessonsMenuAria: string;
    toggleFullWidthViewAria: string;
    languageSwitchAria: string;
  };
  home: {
    subtitle: string;
    fallbackLevelDescription: string;
    levelDescriptions: Record<"A1" | "A2" | "B1" | "B2" | "C1" | "C2", string>;
  };
  footer: {
    noteLabel: string;
    disclaimerBody: string;
    supportViaPayPal: string;
    copyrightSuffix: string;
  };
  callout: {
    warning: string;
    tip: string;
    note: string;
    danger: string;
    info: string;
  };
  lesson: {
    mobileOnThisPage: string;
    noHeadingsFound: string;
    lessons: string;
    currentLevel: string;
    pageContentsTitle: string;
    onThisPage: string;
    navAriaLabel: string;
    previous: string;
    next: string;
  };
};

export const UI_TEXT: Record<Lang, UiDictionary> = {
  en: {
    header: {
      viewOnGithubAria: "View on GitHub",
      toggleThemeAria: "Toggle theme",
      openLessonsMenuAria: "Open lessons menu",
      toggleFullWidthViewAria: "Toggle full-width view",
      languageSwitchAria: "Switch language",
    },
    home: {
      subtitle:
        "Hungarian language lessons and notes, organized by level and topic. Choose a level to start learning.",
      fallbackLevelDescription: "Lessons for {level} level",
      levelDescriptions: {
        A1: "Starting from zero? Learn basic phrases and everyday vocabulary. You will be able to introduce yourself and handle simple conversations.",
        A2: "Building confidence! Understand familiar topics and express yourself in typical situations. Great for basic travel.",
        B1: "Feeling confident! Handle most everyday situations with ease. You can share experiences and explain your opinions.",
        B2: "Almost fluent! Understand complex texts and speak spontaneously. Suitable for professional and academic contexts.",
        C1: "Advanced level! Express yourself fluently across topics. Close to native-level nuance and depth.",
        C2: "Full freedom! Understand almost everything and express yourself with precision and sophistication.",
      },
    },
    footer: {
      noteLabel: "Note:",
      disclaimerBody:
        "these materials were created by a native Hungarian speaker for lessons with a student. These are personal study notes, not certified teaching material. If they were useful for you, you are welcome to support this project.",
      supportViaPayPal: "Support via PayPal",
      copyrightSuffix: "Made with ❤️ for language learners.",
    },
    callout: {
      warning: "Warning",
      tip: "Tip",
      note: "Note",
      danger: "Danger",
      info: "Info",
    },
    lesson: {
      mobileOnThisPage: "On this page",
      noHeadingsFound: "No headings found.",
      lessons: "Lessons",
      currentLevel: "Current level",
      pageContentsTitle: "Page contents",
      onThisPage: "On this page",
      navAriaLabel: "Lesson navigation",
      previous: "Previous",
      next: "Next",
    },
  },
  ua: {
    header: {
      viewOnGithubAria: "Відкрити на GitHub",
      toggleThemeAria: "Перемкнути тему",
      openLessonsMenuAria: "Відкрити меню занять",
      toggleFullWidthViewAria: "Перемкнути повноекранний режим",
      languageSwitchAria: "Змінити мову",
    },
    home: {
      subtitle:
        "Уроки та нотатки з угорської мови, структуровані за рівнями. Оберіть рівень, щоб почати.",
      fallbackLevelDescription: "Уроки для рівня {level}",
      levelDescriptions: {
        A1: "Щойно починаєте? Вивчайте базові фрази та повсякденну лексику. Зможете представитися та вести прості розмови.",
        A2: "Набираєтеся впевненості! Розумійте знайомі теми й висловлюйтеся в типових ситуаціях. Ідеально для базових подорожей.",
        B1: "Почуваєтеся впевнено! Легко справляйтеся з більшістю повсякденних ситуацій. Можете ділитися досвідом і пояснювати свої думки.",
        B2: "Майже вільно! Розумійте складні тексти й говоріть спонтанно. Підходить для професійного та академічного середовища.",
        C1: "Високий рівень! Вільно висловлюйтеся на різні теми. Майже носій мови з глибоким розумінням і нюансами.",
        C2: "Повна свобода! Розумійте майже все та висловлюйтеся точно й витончено.",
      },
    },
    footer: {
      noteLabel: "Примітка:",
      disclaimerBody:
        "матеріали створені носієм угорської мови для занять зі студентом. Це особисті навчальні нотатки, а не матеріал сертифікованого викладача. Якщо вони були вам корисними, підтримка вітається.",
      supportViaPayPal: "Підтримати через PayPal",
      copyrightSuffix: "Зроблено з ❤️ для тих, хто вивчає мови.",
    },
    callout: {
      warning: "Увага",
      tip: "Порада",
      note: "Примітка",
      danger: "Обережно",
      info: "Інформація",
    },
    lesson: {
      mobileOnThisPage: "На цій сторінці",
      noHeadingsFound: "Заголовків не знайдено.",
      lessons: "Заняття",
      currentLevel: "Поточний рівень",
      pageContentsTitle: "Зміст сторінки",
      onThisPage: "На цій сторінці",
      navAriaLabel: "Навігація уроками",
      previous: "Назад",
      next: "Далі",
    },
  },
};

export function normalizeLang(value: string | undefined): Lang {
  if (!value) return DEFAULT_LANG;
  const lower = value.toLowerCase();
  return (SUPPORTED_LANGS as readonly string[]).includes(lower)
    ? (lower as Lang)
    : DEFAULT_LANG;
}

export function getUi(lang: string | undefined): UiDictionary {
  return UI_TEXT[normalizeLang(lang)];
}
