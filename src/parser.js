import {
  CONTACTS,
  DIAGONAL_MOVEMENTS_BY_PLANE,
  DIRECTIONS,
  EXACT_SIGN_GLOSSARY,
  FINGER_ORIENTATION_LABELS,
  FINGER_ORIENTATION_SYMBOLS,
  HANDSHAPES,
  HANDSHAPE_SYMBOLS,
  LOCATIONS,
  LOCUS_LABELS,
  MOVEMENT_MODIFIERS,
  NON_DOMINANT_MOVEMENTS,
  NONMANUALS,
  PLANE_MARKERS,
  RELATIVE_LOCATION_DIRECTIONS,
  THUMB_ORIENTATION_LABELS,
  THUMB_ORIENTATION_SYMBOLS,
  TYPE_LABELS
} from "./data.js";

const handshapeSet = new Set(HANDSHAPE_SYMBOLS);
const fingerSet = new Set(FINGER_ORIENTATION_SYMBOLS);
const thumbSet = new Set(THUMB_ORIENTATION_SYMBOLS);
const directionSet = new Set(Object.keys(DIRECTIONS));
const baseDirectionSet = new Set(["Ь", "/", "Б", "Ю", "З", "_"]);
const locusInnerSet = new Set(["Ь", "/", "Б", "Ю", "З", "_", "Щ", "\\", "\"", "Ж", "%"]);
const ambiguousSingleSymbols = new Set(["!", ";"]);
const timelineTypes = new Set([
  "movement",
  "circular_movement",
  "non_dominant_movement",
  "movement_modifier",
  "plane"
]);
const nonManualUnitTypes = new Set([
  "nonmanual",
  "eye_movement",
  "head_movement",
  "shoulder_movement"
]);
const fixedMatches = buildFixedMatches();

const NONMANUAL_SYLLABLES = Object.freeze([
  { name: "МИ", parts: ["ЪХ", "ХЪ"] },
  { name: "ПАФ", parts: ["ЪХ", "()", "Ъ("] },
  { name: "СТА", parts: ["ХЪ", "()"] },
  { name: "ЧУ", parts: ["9ХЪ0", "*"] },
  { name: "НА", parts: ["ЪЭХ", "(ЪЭ"] },
  { name: "ВА", parts: ["Ъ(", "()"] }
]);
const MAX_NONMANUAL_REPEAT = 12;

/**
 * Нормализует ввод: приводит Unicode к NFC и убирает пробелы.
 *
 * В Шрифте РЖЯ пробелы часто используются как визуальная подсказка между
 * кадром и таймлайном, поэтому для разбора одного жеста они не считаются
 * отдельными токенами.
 *
 * @param {string} input - Строка пользователя.
 * @returns {string} Нормализованная запись одного жеста.
 */
export function normalizeInput(input) {
  return String(input ?? "")
    .normalize("NFC")
    .replace(/[\s\u00ad\u200b-\u200d\u2060\ufeff]+/gu, "")
    .trim();
}

/**
 * Строит полный разбор записи: токены, кадры, таймлайны и диагностику.
 *
 * @param {string} input - Строка в системе Шрифт РЖЯ.
 * @returns {object} Иерархический разбор жестовой записи.
 */
export function parseSign(input) {
  const normalized = normalizeInput(input);
  const tokens = tokenizeNormalized(normalized);
  const units = buildUnits(tokens);
  const diagnostics = validateParse(normalized, tokens, units);
  const exactGloss = EXACT_SIGN_GLOSSARY[normalized] ?? null;
  const frames = units.filter((unit) => unit.kind === "frame");
  const timelines = units.filter((unit) => unit.kind === "timeline");
  const nonmanualUnits = units.filter((unit) => unit.kind === "nonmanual");
  const components = collectComponents(tokens, units);
  const possibleSequences = buildPossibleSequences(tokens);

  return {
    rawInput: String(input ?? ""),
    normalized,
    exactGloss,
    tokens,
    units,
    frames,
    timelines,
    nonmanualUnits,
    components,
    unknown: components.unknown,
    warnings: diagnostics.filter((item) => item.severity === "warning"),
    errors: diagnostics.filter((item) => item.severity === "error"),
    diagnostics,
    possibleSequences,
    summary: summarize(tokens, units, diagnostics)
  };
}

/**
 * Выполняет лексический анализ строки.
 *
 * Алгоритм использует правило longest match first: сначала пробуются длинные
 * известные цепочки, затем динамические конструкции, затем одиночные символы.
 *
 * @param {string} input - Строка пользователя.
 * @returns {Array<object>} Массив токенов.
 */
export function tokenize(input) {
  return tokenizeNormalized(normalizeInput(input));
}

/**
 * Создаёт токен с единым набором полей.
 *
 * @param {string} type - Машинный тип токена.
 * @param {string} raw - Исходная цепочка символов.
 * @param {number} start - Начальный индекс в нормализованной строке.
 * @param {number} end - Конечный индекс в нормализованной строке.
 * @param {object} extra - Дополнительные поля.
 * @returns {object} Токен.
 */
function token(type, raw, start, end, extra = {}) {
  return {
    type,
    typeLabel: TYPE_LABELS[type] ?? type,
    raw,
    start,
    end,
    length: end - start,
    ...extra
  };
}

/**
 * Подготавливает список фиксированных многосимвольных токенов.
 *
 * @returns {Array<object>} Список токенов для longest-match поиска.
 */
function buildFixedMatches() {
  const rows = [];
  const addDictionary = (dictionary, defaultType) => {
    Object.entries(dictionary).forEach(([raw, meta]) => {
      if (ambiguousSingleSymbols.has(raw)) {
        return;
      }
      rows.push({
        raw,
        type: meta.type ?? defaultType,
        label: meta.label,
        subtype: meta.subtype,
        description: meta.description
      });
    });
  };

  addDictionary(NONMANUALS, "nonmanual");
  addDictionary(PLANE_MARKERS, "plane");
  addDictionary(MOVEMENT_MODIFIERS, "movement_modifier");
  addDictionary(NON_DOMINANT_MOVEMENTS, "non_dominant_movement");
  addDictionary(LOCATIONS, "location");

  return rows.sort((left, right) => right.raw.length - left.raw.length);
}

/**
 * Токенизирует уже нормализованную строку.
 *
 * @param {string} normalized - Нормализованная запись.
 * @returns {Array<object>} Массив токенов.
 */
function tokenizeNormalized(normalized) {
  const tokens = [];
  let index = 0;

  while (index < normalized.length) {
    const dynamicNonmanual = tryFacialNonmanual(normalized, index);
    if (dynamicNonmanual) {
      tokens.push(dynamicNonmanual);
      index = dynamicNonmanual.end;
      continue;
    }

    const fixed = tryFixedMatch(normalized, index);
    if (fixed) {
      tokens.push(fixed);
      index = fixed.end;
      continue;
    }

    const relativeLocation = tryRelativeLocation(normalized, index);
    if (relativeLocation) {
      tokens.push(relativeLocation);
      index = relativeLocation.end;
      continue;
    }

    const unknownCurlyGroup = tryUnknownCurlyGroup(normalized, index);
    if (unknownCurlyGroup) {
      tokens.push(unknownCurlyGroup);
      index = unknownCurlyGroup.end;
      continue;
    }

    const locus = tryLocus(normalized, index);
    if (locus) {
      tokens.push(locus);
      index = locus.end;
      continue;
    }

    const orientation = tryOrientation(normalized, index);
    if (orientation) {
      tokens.push(orientation);
      index = orientation.end;
      continue;
    }

    const parenthesizedCircularMovement = tryParenthesizedCircularMovement(normalized, index);
    if (parenthesizedCircularMovement) {
      tokens.push(parenthesizedCircularMovement);
      index = parenthesizedCircularMovement.end;
      continue;
    }

    const unknownRoundOrBraceGroup = tryUnknownRoundOrBraceGroup(normalized, index);
    if (unknownRoundOrBraceGroup) {
      tokens.push(unknownRoundOrBraceGroup);
      index = unknownRoundOrBraceGroup.end;
      continue;
    }

    const circularMovement = tryCircularMovement(normalized, index);
    if (circularMovement) {
      tokens.push(circularMovement);
      index = circularMovement.end;
      continue;
    }

    const single = trySingleSymbol(normalized, index);
    tokens.push(single);
    index = single.end;
  }

  return tokens;
}

/**
 * Ищет фиксированную цепочку из справочника.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryFixedMatch(source, index) {
  for (const item of fixedMatches) {
    if (source.startsWith(item.raw, index)) {
      return token(item.type, item.raw, index, index + item.raw.length, {
        label: item.label,
        subtype: item.subtype,
        description: item.description,
        recognizer: "fixed"
      });
    }
  }
  return null;
}

/**
 * Распознаёт сжатые немануальные артикуляции из справки.
 *
 * В справке слоги вроде НА, ВА, ЧУ задаются как последовательность базовых
 * положений рта. В сокращённой записи повторяются только символы носа %, а
 * неизменные части лица не дублируются. Здесь это разбирается алгоритмически:
 * берётся список исходных слогов из справки и по числу повторённых носов
 * вычисляется подпись НА-НА, НА-НА-НА и т. п. Никакие новые слоги не
 * добавляются: если цепочка не собирается из справочных слогов, она не
 * получает придуманной подписи.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryFacialNonmanual(source, index) {
  if (!source.startsWith(":%", index)) {
    return null;
  }

  const candidates = [];
  NONMANUAL_SYLLABLES.forEach((syllable) => {
    const full = buildFullFacialSyllable(syllable.parts);
    if (source.startsWith(full, index)) {
      candidates.push(makeFacialSyllableCandidate(source, index, full.length, syllable, 1, "facial-syllable-full"));
    }

    const compressed = buildCompressedFacialSyllable(syllable.parts);
    if (source.startsWith(compressed, index)) {
      candidates.push(makeFacialSyllableCandidate(source, index, compressed.length, syllable, 1, "facial-syllable-compressed"));
    }

    const repeated = tryRepeatedTwoPartSyllable(source, index, syllable);
    if (repeated) {
      candidates.push(repeated);
    }
  });

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((left, right) => right.length - left.length || right.repeatCount - left.repeatCount);
  const best = candidates[0];
  const raw = source.slice(index, index + best.length);
  const exact = NONMANUALS[raw];
  return token("nonmanual", raw, index, index + best.length, {
    label: exact?.label ?? buildArticulationLabel(best.syllable.name, best.repeatCount),
    description: best.repeatCount > 1
      ? `Сжатая немануальная артикуляция: слог ${best.syllable.name} повторён ${best.repeatCount} раза по числу символов носа %.`
      : `Немануальная артикуляция ${best.syllable.name}, собранная из справочного сочетания частей рта.`,
    recognizer: exact ? "fixed-nonmanual-through-syllable" : best.recognizer,
    syllable: best.syllable.name,
    repeatCount: best.repeatCount,
    parts: [...best.syllable.parts]
  });
}

/**
 * Строит полную запись слога с повторением лица перед каждой частью.
 *
 * @param {Array<string>} parts - Части рта из справки.
 * @returns {string} Полная запись, например :%ЪЭХ:%(ЪЭ.
 */
function buildFullFacialSyllable(parts) {
  return parts.map((part) => `:%${part}`).join("");
}

/**
 * Строит сокращённую запись одного слога через один символ носа между частями.
 *
 * @param {Array<string>} parts - Части рта из справки.
 * @returns {string} Сжатая запись, например :%ЪЭХ%(ЪЭ.
 */
function buildCompressedFacialSyllable(parts) {
  return `:%${parts.join("%")}`;
}

/**
 * Распознаёт повторение двухчастного слога: :%НАЧАЛО + %%... + КОНЕЦ.
 * Количество повторов равно количеству символов % между частями.
 *
 * @param {string} source - Нормализованная строка.
 * @param {number} index - Текущая позиция.
 * @param {object} syllable - Слог из NONMANUAL_SYLLABLES.
 * @returns {object|null} Кандидат или null.
 */
function tryRepeatedTwoPartSyllable(source, index, syllable) {
  if (syllable.parts.length !== 2) {
    return null;
  }

  const [firstPart, secondPart] = syllable.parts;
  const prefix = `:%${firstPart}`;
  if (!source.startsWith(prefix, index)) {
    return null;
  }

  let cursor = index + prefix.length;
  let repeatCount = 0;
  while (source[cursor] === "%" && repeatCount < MAX_NONMANUAL_REPEAT) {
    repeatCount += 1;
    cursor += 1;
  }

  if (repeatCount === 0 || repeatCount > MAX_NONMANUAL_REPEAT) {
    return null;
  }

  if (!source.startsWith(secondPart, cursor)) {
    return null;
  }

  return makeFacialSyllableCandidate(
    source,
    index,
    prefix.length + repeatCount + secondPart.length,
    syllable,
    repeatCount,
    repeatCount === 1 ? "facial-syllable-compressed" : "facial-syllable-repetition"
  );
}

/**
 * Создаёт технический кандидат немануального слога.
 *
 * @param {string} source - Нормализованная строка.
 * @param {number} index - Текущая позиция.
 * @param {number} length - Длина совпадения.
 * @param {object} syllable - Слог из справочного списка.
 * @param {number} repeatCount - Число повторов слога.
 * @param {string} recognizer - Название распознавателя.
 * @returns {object} Кандидат.
 */
function makeFacialSyllableCandidate(source, index, length, syllable, repeatCount, recognizer) {
  return {
    raw: source.slice(index, index + length),
    length,
    syllable,
    repeatCount,
    recognizer
  };
}

/**
 * Формирует подпись артикуляции с нужным числом повторов.
 *
 * @param {string} syllable - Название слога.
 * @param {number} repeatCount - Число повторов.
 * @returns {string} Подпись для токена.
 */
function buildArticulationLabel(syllable, repeatCount) {
  return `артикуляция ${Array.from({ length: repeatCount }, () => syllable).join("-")}`;
}

/**
 * Распознаёт относительную локализацию вида 9 + конфигурация + стрелка + 0.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryRelativeLocation(source, index) {
  if (source[index] !== "9") {
    return null;
  }

  const handshape = source[index + 1];
  const direction = source[index + 2];
  const closing = source[index + 3];

  if (handshapeSet.has(handshape) && RELATIVE_LOCATION_DIRECTIONS[direction] && closing === "0") {
    const raw = source.slice(index, index + 4);
    return token("relative_location", raw, index, index + 4, {
      label: RELATIVE_LOCATION_DIRECTIONS[direction],
      handshape,
      direction,
      description: `Место в пространстве относительно неведущей руки в конфигурации «${handshape}».`,
      recognizer: "relative-location-pattern"
    });
  }
  return null;
}

/**
 * Распознаёт неизвестную группу 9...0, чтобы не рассыпать её посимвольно.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryUnknownCurlyGroup(source, index) {
  if (source[index] !== "9") {
    return null;
  }
  const closing = source.indexOf("0", index + 1);
  if (closing === -1) {
    return token("unknown", source[index], index, index + 1, {
      label: "открыта группа 9, но закрывающий 0 не найден",
      severity: "error"
    });
  }
  const raw = source.slice(index, closing + 1);
  return token("group_unknown", raw, index, closing + 1, {
    label: "группа 9...0 не найдена в словаре локализаций",
    description: "Это похоже на локализацию или модификатор, но точное значение не занесено в базовый словарь.",
    recognizer: "unknown-curly-group"
  });
}

/**
 * Распознаёт локус вида Й...Й.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryLocus(source, index) {
  const boundary = source[index];
  if (boundary !== "Й") {
    return null;
  }
  const closing = source.indexOf(boundary, index + 1);
  if (closing === -1) {
    return null;
  }
  const raw = source.slice(index, closing + 1);
  const canonicalRaw = raw;
  const inner = raw.slice(1, -1);
  const hasLocusLikeContent = inner.length > 0
    && inner.length <= 2
    && [...inner].every((char) => locusInnerSet.has(char))
    && [...inner].some((char) => directionSet.has(char));

  if (!hasLocusLikeContent) {
    return null;
  }

  return token("locus", raw, index, closing + 1, {
    label: LOCUS_LABELS[canonicalRaw] ?? "точка в пространстве",
    description: "Локус: условная точка в пространстве, к которой можно отсылать в жестовом высказывании.",
    recognizer: "locus-pattern"
  });
}

/**
 * Распознаёт ориентацию как пару «палец + большой палец» в любом порядке.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryOrientation(source, index) {
  const first = source[index];
  const second = source[index + 1];
  if (!second) {
    return null;
  }

  const firstIsThumb = thumbSet.has(first);
  const secondIsThumb = thumbSet.has(second);
  const firstIsFinger = fingerSet.has(first);
  const secondIsFinger = fingerSet.has(second);

  if ((firstIsThumb && secondIsFinger) || (firstIsFinger && secondIsThumb)) {
    const raw = source.slice(index, index + 2);
    const finger = firstIsFinger ? first : second;
    const thumb = firstIsThumb ? first : second;
    return token("orientation", raw, index, index + 2, {
      label: describeOrientation(raw, finger, thumb),
      finger,
      thumb,
      order: firstIsThumb ? "thumb-finger" : "finger-thumb",
      description: "Ориентация кисти задаётся двумя символами: символом пальцев и символом большого пальца.",
      recognizer: "orientation-pair"
    });
  }
  return null;
}

/**
 * Распознаёт уточнённое круговое движение вида (ДЮ) / (@Ю).
 *
 * В справке такое уточнение используется, когда нужно явно указать
 * направление и плоскость кругового движения. В шрифте символ спирали
 * соответствует заглавной Д, но на старых страницах может встретиться @.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryParenthesizedCircularMovement(source, index) {
  if (source[index] !== "(") {
    return null;
  }

  const spiral = source[index + 1];
  const direction = source[index + 2];
  const closing = source[index + 3];

  if ((spiral === "Д" || spiral === "@") && baseDirectionSet.has(direction) && closing === ")") {
    const raw = source.slice(index, index + 4);
    return token("circular_movement", raw, index, index + 4, {
      label: `уточнённое круговое движение: ${DIRECTIONS[direction].label}`,
      direction,
      description: "Круговое движение с явным указанием направления/плоскости в круглых скобках.",
      recognizer: "parenthesized-spiral-direction"
    });
  }

  return null;
}

/**
 * Распознаёт круглые или фигурные группы, которые не попали в словари.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryUnknownRoundOrBraceGroup(source, index) {
  const open = source[index];
  const close = open === "(" ? ")" : open === "{" ? "}" : null;
  if (!close) {
    return null;
  }

  const closing = source.indexOf(close, index + 1);
  if (closing === -1) {
    return token("unknown", open, index, index + 1, {
      label: `открыта группа ${open}, но закрывающий ${close} не найден`,
      severity: "error"
    });
  }

  const raw = source.slice(index, closing + 1);
  return token("group_unknown", raw, index, closing + 1, {
    label: "группа не найдена в базовом словаре",
    description: "Это может быть редкая локализация, движение головы/плеч или авторское сокращение.",
    recognizer: "unknown-bracket-group"
  });
}

/**
 * Распознаёт круговое движение: Д или направление + Д.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object|null} Токен или null.
 */
function tryCircularMovement(source, index) {
  const first = source[index];
  const second = source[index + 1];
  const firstIsSpiral = first === "Д" || first === "@";

  if (baseDirectionSet.has(first) && (second === "Д" || second === "@")) {
    return token("circular_movement", source.slice(index, index + 2), index, index + 2, {
      label: `круговое движение, начало: ${DIRECTIONS[first].label}`,
      direction: first,
      description: "Стрелка перед символом спирали уточняет, с какого направления начинается круговое движение.",
      recognizer: "direction-plus-spiral"
    });
  }

  if (firstIsSpiral && baseDirectionSet.has(second)) {
    return token("circular_movement", source.slice(index, index + 2), index, index + 2, {
      label: `круговое движение, уточнение: ${DIRECTIONS[second].label}`,
      direction: second,
      description: "Символ после спирали уточняет направление кругового движения.",
      recognizer: "spiral-plus-direction"
    });
  }

  if (firstIsSpiral) {
    return token("circular_movement", first, index, index + 1, {
      label: "круговое движение",
      description: "Символ Д обозначает спираль / круговое движение.",
      recognizer: "spiral"
    });
  }
  return null;
}

/**
 * Распознаёт одиночный символ.
 *
 * @param {string} source - Строка после удаления пробелов и невидимых символов.
 * @param {number} index - Текущая позиция.
 * @returns {object} Токен.
 */
function trySingleSymbol(source, index) {
  const raw = source[index];

  if (ambiguousSingleSymbols.has(raw)) {
    return token("ambiguous_contact_modifier", raw, index, index + 1, {
      label: `${CONTACTS[raw].label} / ${MOVEMENT_MODIFIERS[raw].label}`,
      candidates: [
        { type: "contact", label: CONTACTS[raw].label },
        { type: "movement_modifier", label: MOVEMENT_MODIFIERS[raw].label }
      ],
      description: "Символ неоднозначен: в кадре чаще читается как контакт, в таймлайне — как модификатор."
    });
  }

  if (CONTACTS[raw]) {
    return token("contact", raw, index, index + 1, {
      label: CONTACTS[raw].label,
      description: CONTACTS[raw].description
    });
  }

  if (DIRECTIONS[raw]) {
    return token("movement", raw, index, index + 1, {
      label: DIRECTIONS[raw].label,
      axis: DIRECTIONS[raw].axis,
      description: "Направление движения ведущей руки."
    });
  }

  if (HANDSHAPES[raw]) {
    return token("handshape", raw, index, index + 1, {
      label: HANDSHAPES[raw].label,
      description: HANDSHAPES[raw].description
    });
  }

  if (fingerSet.has(raw) || thumbSet.has(raw)) {
    return token("orientation_part", raw, index, index + 1, {
      label: fingerSet.has(raw)
        ? FINGER_ORIENTATION_LABELS[raw]
        : THUMB_ORIENTATION_LABELS[raw],
      description: "Одиночная часть ориентации. Для полной ориентации нужен второй символ."
    });
  }

  if (raw === ")" || raw === "}" || raw === "0") {
    return token("unknown", raw, index, index + 1, {
      label: `закрывающий символ ${raw} без соответствующего открывающего символа`,
      severity: "error"
    });
  }

  return token("unknown", raw, index, index + 1, {
    label: "символ не найден в базовом словаре",
    severity: "error"
  });
}

/**
 * Формирует краткое описание ориентации из подписей символа пальцев
 * и символа большого пальца.
 *
 * @param {string} raw - Пара символов ориентации.
 * @param {string} finger - Символ пальцев.
 * @param {string} thumb - Символ большого пальца.
 * @returns {string} Человекочитаемая подпись.
 */
function describeOrientation(raw, finger, thumb) {
  const fingerLabel = FINGER_ORIENTATION_LABELS[finger] ?? `символ пальцев ${finger}`;
  const thumbLabel = THUMB_ORIENTATION_LABELS[thumb] ?? `символ большого пальца ${thumb}`;
  return `ориентация «${raw}»: ${fingerLabel} + ${thumbLabel}`;
}

