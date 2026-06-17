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
  "Э": "кисть вертикально ребром «Э»",
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

export const LOCATIONS = Object.freeze({
  "(Ё)": { type: "location", label: "лоб", subtype: "голова" },
  "(ЁЁ)": { type: "location", label: "висок", subtype: "голова" },
  "(ЁЁ)(ЁЁ)": { type: "location", label: "оба виска", subtype: "голова" },
  "(ЁЁЁ)": { type: "location", label: "затылок", subtype: "голова" },
  "(Й)": { type: "location", label: "нос", subtype: "голова" },
  "(ЙЁ)": { type: "location", label: "глаз", subtype: "голова" },
  "(ЁЙЁ)": { type: "location", label: "оба глаза", subtype: "голова" },
  "(ЙЁЁ)": { type: "location", label: "ухо", subtype: "голова" },
  "(ЁЁЙЁЁ)": { type: "location", label: "оба уха", subtype: "голова" },
  "(Й.)": { type: "location", label: "ноздря", subtype: "голова" },
  "(Й..)": { type: "location", label: "щека", subtype: "голова" },
  "(..Й..)": { type: "location", label: "обе щеки", subtype: "голова" },
  "(.)": { type: "location", label: "подбородок", subtype: "голова" },
  "(..)": { type: "location", label: "уголок рта", subtype: "голова" },
  "(...)": { type: "location", label: "челюсть", subtype: "голова" },
  
  "9ЁЙЙ0": { type: "location", label: "плечо неведущей руки", subtype: "тело" },
  "9ЁЙЙЁ0": { type: "location", label: "плечи крест накрест", subtype: "тело" },
  "9ЁЁЁ0": { type: "location", label: "горло", subtype: "тело" },
  "9ЁЁ0": { type: "location", label: "бок шеи", subtype: "тело" },
  "9Ё0": { type: "location", label: "плечо ведущей руки", subtype: "тело" },
  "9Ё09Ё0": { type: "location", label: "плечи", subtype: "тело" },
  "9ЙЙ0": { type: "location", label: "рука", subtype: "тело" },
  "9ЁЙ0": { type: "location", label: "грудь слева", subtype: "тело" },
  "9ЁЙЁ0": { type: "location", label: "обе стороны груди", subtype: "тело" },
  "9Й0": { type: "location", label: "грудь, центр", subtype: "тело" },
  "9ЙЁ0": { type: "location", label: "грудь справа", subtype: "тело" },
  "9.ЙЙ0": { type: "location", label: "локоть", subtype: "тело" },
  "9Й.Й0": { type: "location", label: "живот", subtype: "тело" },
  "9Й.0": { type: "location", label: "талия", subtype: "тело" },
  "9.Й.0": { type: "location", label: "обе стороны талии", subtype: "тело" },
  "9...0": { type: "location", label: "предплечье", subtype: "тело" },
  "9..0": { type: "location", label: "запястье", subtype: "тело" },
  
  "9.0": { type: "location", label: "тыльная сторона ладони", subtype: "кисть неведущей руки" },
  "9Ёв0": { type: "location", label: "кончики пальцев", subtype: "кисть неведущей руки" },
  "9вЁ0": { type: "location", label: "кончик большого пальца", subtype: "кисть неведущей руки" },
  "9ЁЁв0": { type: "location", label: "сбоку / сзади от пальцев", subtype: "кисть неведущей руки" },
  "9вЁЁ0": { type: "location", label: "между большим и остальными пальцами", subtype: "кисть неведущей руки" },
  "9.в0": { type: "location", label: "тыльная сторона ладони", subtype: "кисть неведущей руки" },
  "9в.0": { type: "location", label: "центр ладони", subtype: "кисть неведущей руки" },
  "9..в0": { type: "location", label: "боковая сторона кисти", subtype: "кисть неведущей руки" },
  "9в..0": { type: "location", label: "задняя часть большого пальца", subtype: "кисть неведущей руки" },
  "9Ё10": { type: "location", label: "кончик указательного пальца", subtype: "кисть неведущей руки" },
  "91ЁЁ0": { type: "location", label: "сторона указательного пальца", subtype: "кисть неведущей руки" },
  "9Ё20": { type: "location", label: "кончик среднего пальца", subtype: "кисть неведущей руки" },
  "92ЁЁ0": { type: "location", label: "между указательным и средним пальцами", subtype: "кисть неведущей руки" },
  "9Ё30": { type: "location", label: "кончик безымянного пальца", subtype: "кисть неведущей руки" },
  "93ЁЁ0": { type: "location", label: "между средним и безымянным пальцами", subtype: "кисть неведущей руки" },
  "9ЁУ0": { type: "location", label: "кончик мизинца", subtype: "кисть неведущей руки" },
  "9иЁЁ0": { type: "location", label: "между безымянным пальцем и мизинцем", subtype: "кисть неведущей руки" }
});

export const RELATIVE_LOCATION_DIRECTIONS = Object.freeze({
  "Ь": "над неведущей рукой",
  "_": "под неведущей рукой",
  "Б": "слева от неведущей руки",
  "Ю": "справа от неведущей руки",
  "/": "перед неведущей рукой, дальше от говорящего",
  "З": "за неведущей рукой, ближе к говорящему"
});

export const LOCUS_LABELS = Object.freeze({
  "ЙЩ\"Й": "слева-сверху, плоскость лицевой стены",
  "ЙЬЙ": "сверху",
  "Й\"/Й": "справа-сверху, плоскость лицевой стены",
  "ЙБЙ": "слева",
  "ЙЮЙ": "справа",
  "ЙЗ\"Й": "слева-снизу, плоскость лицевой стены",
  "Й_Й": "снизу",
  "Й\"\\Й": "справа-снизу, плоскость лицевой стены",
  "ЙЩЖЙ": "слева и дальше от говорящего, плоскость пола",
  "Й/Й": "перед говорящим / от себя",
  "ЙЖ/Й": "справа и дальше от говорящего, плоскость пола",
  "ЙЗЖЙ": "слева и ближе к говорящему, плоскость пола",
  "ЙЗЙ": "ближе к говорящему / к себе",
  "ЙЖ\\Й": "справа и ближе к говорящему, плоскость пола",
  "ЙЩ%Й": "к себе и вверх, боковая плоскость",
  "Й%/Й": "от себя и вверх, боковая плоскость",
  "ЙЗ%Й": "к себе и вниз, боковая плоскость",
  "Й%\\Й": "от себя и вниз, боковая плоскость"
});

export const PLANE_MARKERS = Object.freeze({
  "(\")": { type: "plane", label: "плоскость лицевой стены" },
  "(~)": { type: "plane", label: "плоскость пола" },
  "(%)": { type: "plane", label: "плоскость боковой стены" }
});

export const DIAGONAL_MOVEMENTS_BY_PLANE = Object.freeze({
  "(\")": Object.freeze({
    "Щ": Object.freeze({
      label: "влево-вверх",
      phrase: "движется влево и вверх в плоскости перед говорящим"
    }),
    "/": Object.freeze({
      label: "вправо-вверх",
      phrase: "движется вправо и вверх в плоскости перед говорящим"
    }),
    "З": Object.freeze({
      label: "влево-вниз",
      phrase: "движется влево и вниз в плоскости перед говорящим"
    }),
    "\\": Object.freeze({
      label: "вправо-вниз",
      phrase: "движется вправо и вниз в плоскости перед говорящим"
    })
  }),
  "(~)": Object.freeze({
    "Щ": Object.freeze({
      label: "влево-вперёд",
      phrase: "движется влево и вперёд в плоскости пола"
    }),
    "/": Object.freeze({
      label: "вправо-вперёд",
      phrase: "движется вправо и вперёд в плоскости пола"
    }),
    "З": Object.freeze({
      label: "влево-назад",
      phrase: "движется влево и назад в плоскости пола"
    }),
    "\\": Object.freeze({
      label: "вправо-назад",
      phrase: "движется вправо и назад в плоскости пола"
    })
  }),
  "(%)": Object.freeze({
    "Щ": Object.freeze({
      label: "назад-вверх",
      phrase: "движется назад и вверх в боковой плоскости"
    }),
    "/": Object.freeze({
      label: "вперёд-вверх",
      phrase: "движется вперёд и вверх в боковой плоскости"
    }),
    "З": Object.freeze({
      label: "назад-вниз",
      phrase: "движется назад и вниз в боковой плоскости"
    }),
    "\\": Object.freeze({
      label: "вперёд-вниз",
      phrase: "движется вперёд и вниз в боковой плоскости"
    })
  })
});

export const NONMANUALS = Object.freeze({
  ":%Й": { type: "nonmanual", label: "нейтральное выражение лица" },
  "0:9%Й": { type: "nonmanual", label: "неприязнь" },
  "(9:0%()": { type: "nonmanual", label: "удивление" },
  "Ъ:Х%ЪХ": { type: "nonmanual", label: "подозрение" },
  "Ъ:%9ЪХ0": { type: "nonmanual", label: "непринуждённость" },
  "(:%Й": { type: "nonmanual", label: "поднять брови" },
  "9:%Й": { type: "nonmanual", label: "поднять брови грустно" },
  "0:%Й": { type: "nonmanual", label: "опустить брови" },
  "Ъ:Х%Й": { type: "nonmanual", label: "прищуриться" },
  "9:0%Й": { type: "nonmanual", label: "широко раскрыть глаза" },
  ":Х%Й": { type: "nonmanual", label: "напрячь нижние веки" },
  "Ъ:%Й": { type: "nonmanual", label: "опустить веки расслабленно" },
  "0%Й": { type: "nonmanual", label: "закрыть глаза" },
  "09%Й": { type: "nonmanual", label: "сжать веки" },
  "!%Й": { type: "nonmanual", label: "подмигнуть" },
  ":9%Й": { type: "nonmanual", label: "сморщить нос" },
  ":%)": { type: "nonmanual", label: "улыбнуться" },
  ":%(": { type: "nonmanual", label: "схмуриться" },
  ":%ЪХ": { type: "nonmanual", label: "сжать губы" },
  ":%Х0": { type: "nonmanual", label: "выпячить губу" },
  ":%9ЪХ0": { type: "nonmanual", label: "выпячить губы" },
  ":%09": { type: "nonmanual", label: "дрожать губами" },
  ":%()": { type: "nonmanual", label: "открыть рот" },
  ":%(*)": { type: "nonmanual", label: "надуть щёки" },
  ":%*": { type: "nonmanual", label: "губы трубочкой" },
  ":%ХЪ": { type: "nonmanual", label: "показать зубы" },
  ":%Х)": { type: "nonmanual", label: "открытая улыбка" },
  ":%(ЪЭ": { type: "nonmanual", label: "показать язык" },
  ":%ЪЭХ": { type: "nonmanual", label: "артикуляция Л" },
  ":%Ъ(": { type: "nonmanual", label: "артикуляция Ф" },
  ":%9ХЪ0": { type: "nonmanual", label: "артикуляция Ш" },
  ":%ЪХ%ХЪ": { type: "nonmanual", label: "артикуляция МИ" },
  ":%ЪХ%()%Ъ(": { type: "nonmanual", label: "артикуляция ПАФ" },
  ":%ХЪ%()": { type: "nonmanual", label: "артикуляция СТА" },
  ":%9ХЪ0%%%*": { type: "nonmanual", label: "артикуляция ЧУ-ЧУ-ЧУ" },
  ":%ЪЭХ%%%(ЪЭ": { type: "nonmanual", label: "артикуляция НА-НА-НА" },
  ":%Ъ(%%%()": { type: "nonmanual", label: "артикуляция ВА-ВА-ВА" },
  "БЖБ": { type: "eye_movement", label: "посмотреть влево" },
  "ЮЖЮ": { type: "eye_movement", label: "посмотреть вправо" },
  "ЬЖЬ": { type: "eye_movement", label: "посмотреть вверх" },
  "_Ж_": { type: "eye_movement", label: "посмотреть вниз" },
  "(Б)": { type: "head_movement", label: "повернуть голову влево" },
  "(Ю)": { type: "head_movement", label: "повернуть голову вправо" },
  "(Ь)": { type: "head_movement", label: "поднять голову" },
  "(_)": { type: "head_movement", label: "опустить голову" },
  "(/)": { type: "head_movement", label: "выдвинуть голову от корпуса, в пространство перед лицом" },
  "(З)": { type: "head_movement", label: "отвести голову к корпусу" },
  "(БЮ)": { type: "head_movement", label: "помотать головой" },
  "(__)": { type: "head_movement", label: "покивать головой" },
  "9Б0": { type: "shoulder_movement", label: "отклониться корпусом влево" },
  "9Ю0": { type: "shoulder_movement", label: "отклониться корпусом вправо" },
  "9Ь0": { type: "shoulder_movement", label: "пожать плечами" }
});

export const SAMPLE_SIGNS = Object.freeze({
  "(ЁЁ)*.Эо": "Вспомнить: место на виске + касание + ориентация/конфигурация руки",
  "9Й0*=Ёв": "Мой: грудь + касание + рука",
  "1Э.*.Э1": "Встреча: кадр двух рук навстречу + ориентация + контакт",
  "в*в": "Дом: две руки симметрично + контакт",
  ".\"Ч_Ё=7_Ё=Ч": "Пример из нескольких кадров: кадр → движение → кадр → движение → кадр",
  "9Ё10Э.*=Ёв": "Локализация на кончике пальца неведущей руки + ориентация + контакт + ведущая рука",
  "9.в0;5Д": "Локализация на кисти неведущей руки из справки: тыльная сторона ладони",
  "а9ЁЙЁ0а/": "Защищать: пример с локализацией обеих сторон груди (9ЁЙЁ0)",
  ":%ЪХ%ХЪ": "Немануальное повторение артикуляции из справки",
  "6": "Паттерн из одной только конфигурации",
  "9abc0": "Нераспознанная группа: пример предупреждения валидатора",
  "(ЁЁ)*.Э": "Неполная структура: ориентация без конфигурации",
  "Q#Ж": "Неизвестные символы: пример ошибки ввода",
  ":%()9:0%Й(ЁЁ)*о": "Немануальные компоненты + жестовая запись",
  "(.)*к.--.кЗ9Й0*(Ё)*\".а_(.)*": "Спасибо за внимание"
});

// Мини-словарь подсказок
export const EXACT_SIGN_GLOSSARY = Object.freeze({
  "6": "хороший",            // id 91
  "У": "плохой",             // id 1475
  "ж": "давать",             // id 1737
  "(ЁЁ)*о": "вспомнить",     // id 14598
  "(ЁЁ)*.Эо": "вспомнить",   // тот же жест с явной ориентацией .Э
  "(ЁЁ)*.Эж": "намерение",   // id 3933
  "9Й0*в": "мой",            // id 22555
  "9Й0*=Ёв": "мой",          // id 22555, вариант «с ориентацией»
  "9ЁЙ0**=Ёф": "хотеть",     // id 9218
  "а9ЁЙЁ0а/": "защищать",    // id 8160
  "1Э.*.Э1": "встреча",      // id 1744
  "(.)*о/": "сказать",       // id 3916
  "в*в": "дом",              // id 590
  "С+С": "дружба",           // id 12127
  "ЛЦЛ": "сломать",          // id 7826
  "(.)*к.--.кЗ9Й0*(Ё)*\".а_(.)*": "Спасибо за внимание" // спасибо Артёму Бойко
});
