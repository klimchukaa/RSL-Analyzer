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

