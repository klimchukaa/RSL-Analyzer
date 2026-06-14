/**
 * Справочные данные для анализатора Шрифта РЖЯ.
 *
 * Источник описаний: открытая справка проекта AjnoEO/rslfont. В словаре
 * намеренно хранятся не все возможные жесты, а фонетические компоненты:
 * конфигурации, ориентации, локализации, движения и модификаторы.
 */

export const TYPE_LABELS = Object.freeze({
  handshape: "конфигурация",
  orientation: "ориентация",
  orientation_part: "часть ориентации",
  location: "локализация",
  relative_location: "относительная локализация",
  locus: "локус",
  contact: "контакт",
  movement: "движение",
  circular_movement: "круговое движение",
  non_dominant_movement: "движение неведущей руки",
  movement_modifier: "модификатор движения",
  nonmanual: "немануальный компонент",
  eye_movement: "движение глаз",
  plane: "плоскость движения",
  head_movement: "движение головы",
  shoulder_movement: "движение плеч",
  ambiguous_contact_modifier: "контакт / модификатор",
  group_unknown: "нераспознанная группа",
  unknown: "неизвестный символ"
});

export const TYPE_ORDER = Object.freeze([
  "nonmanual",
  "location",
  "relative_location",
  "locus",
  "orientation",
  "handshape",
  "contact",
  "movement",
  "circular_movement",
  "non_dominant_movement",
  "movement_modifier",
  "plane",
  "eye_movement",
  "head_movement",
  "shoulder_movement",
  "group_unknown",
  "unknown"
]);

// Набор символов конфигураций (форм руки)
export const HANDSHAPE_SYMBOLS = Object.freeze([
  "а", "1", "х", "А",
  "7", "О", "э", "К", "Ч", "о",
  "к", "2", "б", "Л", "я",
  "ш", "3", "П", "8", "М", "ч",
  "В", "4", "Е", "в", "5", "6", "И",
  "е", "с", "Ф", "С",
  "ж", "Ш", "ф", "Т",
  "У", "у", "ю", "ы", "Г", "Ы",
  "и", "н", "р", "Р", "Н",
  // Чисто конфигурации для дактиля
  "г", "д", "ё", "з", "й", "л", "м", "п", "т", "ц", "щ", "ъ", "ь"
]);

export const HANDSHAPES = Object.freeze(Object.fromEntries(
  HANDSHAPE_SYMBOLS.map((symbol) => [
    symbol,
    {
      type: "handshape",
      label: `конфигурация руки «${symbol}»`,
      description: "Форма кисти. В этой версии анализатора точная картинка конфигурации показывается шрифтом, а не текстовым названием."
    }
  ])
));

export const FINGER_ORIENTATION_SYMBOLS = Object.freeze(["Э", "-", "\"", "=", "Ж", "%"]);
export const THUMB_ORIENTATION_SYMBOLS = Object.freeze([".", "Ё"]);

export const FINGER_ORIENTATION_LABELS = Object.freeze({
  "Э": "кисть ребром «Э»",
  "-": "кисть параллельно полу вбок «-»",
  "\"": "кисть вертикально фасадом «\"»",
  "=": "кисть горизонтально фасадом «=»",
  "Ж": "кисть параллельно полу, перпендикулярно корпусу «Ж»",
  "%": "кисть горизонтально, ребром к полу, перпендикулярно корпусу «%»"
});

export const THUMB_ORIENTATION_LABELS = Object.freeze({
  ".": "большой палец под кистью «.»",
  "Ё": "большой палец над «Ё»"
});

export const DIRECTIONS = Object.freeze({
  "Ь": { type: "movement", label: "вверх", axis: "вертикаль" },
  "/": { type: "movement", label: "от себя", axis: "глубина" },
  "Б": { type: "movement", label: "влево от говорящего", axis: "горизонталь" },
  "Ю": { type: "movement", label: "вправо от говорящего", axis: "горизонталь" },
  "З": { type: "movement", label: "к себе", axis: "глубина" },
  "_": { type: "movement", label: "вниз", axis: "вертикаль" },
  "\\": { type: "movement", label: "диагональное направление", axis: "диагональ" },
  "Щ": { type: "movement", label: "диагональное направление", axis: "диагональ" }
});

export const CONTACTS = Object.freeze({
  "!": { type: "contact", label: "ударить", description: "Тип контакта: резкое соприкосновение." },
  ";": { type: "contact", label: "тереть", description: "Тип контакта: трение." },
  "Ц": { type: "contact", label: "смахнуть", description: "Тип контакта: смахивающее движение." },
  "*": { type: "contact", label: "коснуться", description: "Тип контакта: касание." },
  "+": { type: "contact", label: "держать или щипать", description: "Тип контакта: удерживание или щипок." }
});

export const MOVEMENT_MODIFIERS = Object.freeze({
  "??": { type: "movement_modifier", label: "шевелить или тереть пальцами" },
  "?": { type: "movement_modifier", label: "согнуть пальцы" },
  "(!)": { type: "movement_modifier", label: "большая амплитуда" },
  "(;)": { type: "movement_modifier", label: "маленькая амплитуда" },
  "9!0": { type: "movement_modifier", label: "быстрое движение" },
  "9;0": { type: "movement_modifier", label: "медленное движение" },
  "!": { type: "movement_modifier", label: "выразительно" },
  ";": { type: "movement_modifier", label: "пауза" }
});

export const NON_DOMINANT_MOVEMENTS = Object.freeze({
  "ЯЯ": { type: "non_dominant_movement", label: "чередующееся движение неведущей руки" },
  "09": { type: "non_dominant_movement", label: "симметричное движение неведущей руки" },
  ")": { type: "non_dominant_movement", label: "неведущая рука движется вместе с ведущей" },
  "Я": { type: "non_dominant_movement", label: "неведущая рука движется противоположно ведущей" }
});

