import { SAMPLE_SIGNS, TYPE_LABELS, TYPE_ORDER } from "./data.js";
import { parseSign } from "./parser.js";
import { buildSemanticLayer } from "./semantic.js";

const input = document.querySelector("#input");
const highlight = document.querySelector("#highlight");
const selectionDetails = document.querySelector("#selection-details");
const semanticOutput = document.querySelector("#semantic");
const diagnostics = document.querySelector("#diagnostics");
const tree = document.querySelector("#tree");
const sequences = document.querySelector("#sequences");
const jsonOutput = document.querySelector("#json-output");
const tokenTable = document.querySelector("#token-table-body");
const stats = document.querySelector("#stats");
const samples = document.querySelector("#samples");
const copyJsonButton = document.querySelector("#copy-json");
const clearButton = document.querySelector("#clear-input");
const analyzeButton = document.querySelector("#analyze-input");
const legend = document.querySelector("#legend");

let lastParsed = null;
let selectedTokenKey = null;

/**
 * Инициализирует интерфейс: примеры, легенду и обработчики ввода.
 */
function init() {
  renderSamples();
  renderLegend();
  input.value = "(ЁЁ)*.Эо";
  input.addEventListener("input", update);
  analyzeButton.addEventListener("click", update);
  copyJsonButton.addEventListener("click", copyJson);
  clearButton.addEventListener("click", () => {
    input.value = "";
    selectedTokenKey = null;
    input.focus();
    update();
  });
  update();
}

/**
 * Пересчитывает разбор и перерисовывает все панели.
 */
function update() {
  lastParsed = parseSign(input.value);
  lastParsed.semanticLayer = buildSemanticLayer(lastParsed);
  if (selectedTokenKey && !findSelectedToken(lastParsed)) {
    selectedTokenKey = null;
  }

  renderStats(lastParsed);
  renderHighlight(lastParsed);
  renderSelection(lastParsed);
  renderSemantic(lastParsed.semanticLayer);
  renderDiagnostics(lastParsed);
  renderTree(lastParsed);
  renderSequences(lastParsed);
  renderTokenTable(lastParsed.tokens);
  jsonOutput.textContent = formatCompactJson(lastParsed);
}

/**
 * Рисует кнопки с демонстрационными примерами.
 */
function renderSamples() {
  samples.replaceChildren();
  Object.entries(SAMPLE_SIGNS).forEach(([sample, label]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sample-button";
    button.textContent = sample;
    button.title = label;
    button.addEventListener("click", () => {
      input.value = sample;
      selectedTokenKey = null;
      update();
      input.focus();
    });
    samples.append(button);
  });
}

/**
 * Рисует легенду типов токенов.
 */
function renderLegend() {
  legend.replaceChildren();
  TYPE_ORDER.forEach((type) => {
    const item = document.createElement("span");
    item.className = `legend-item token-${type}`;
    item.textContent = TYPE_LABELS[type] ?? type;
    legend.append(item);
  });
}

/**
 * Рисует краткую статистику разбора.
 *
 * @param {object} parsed - Полный разбор.
 */
function renderStats(parsed) {
  stats.replaceChildren();
  const rows = [
    ["Токенов", parsed.summary.tokenCount],
    ["Кадров", parsed.summary.frameCount],
    ["Таймлайнов", parsed.summary.timelineCount],
    ["Немануальных", parsed.summary.nonmanualCount],
    ["Вариантов", parsed.possibleSequences.length],
    ["Ошибок", parsed.summary.errorCount],
    ["Предупреждений", parsed.summary.warningCount]
  ];

  if (parsed.exactGloss) {
    rows.unshift(["Словарная подсказка", parsed.exactGloss]);
  }

  rows.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    const valueNode = document.createElement("strong");
    valueNode.textContent = value;
    const labelNode = document.createElement("span");
    labelNode.textContent = label;
    card.append(valueNode, labelNode);
    stats.append(card);
  });
}

/**
 * Рисует подсветку токенов поверх исходного ввода, сохраняя пробелы.
 *
 * @param {object} parsed - Полный разбор.
 */
function renderHighlight(parsed) {
  highlight.replaceChildren();
  if (parsed.tokens.length === 0) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = "Введите запись.";
    highlight.append(empty);
    return;
  }

  const raw = String(parsed.rawInput ?? "").normalize("NFC");
  const positions = normalizedIndexToRawIndex(raw);
  let rawCursor = 0;

  parsed.tokens.forEach((item) => {
    const rawStart = positions[item.start];
    const rawEnd = positions[item.end - 1];

    if (rawStart === undefined || rawEnd === undefined) {
      highlight.append(createTokenChip(item, item.raw));
      return;
    }

    if (rawCursor < rawStart) {
      highlight.append(document.createTextNode(raw.slice(rawCursor, rawStart)));
    }

    highlight.append(createTokenChip(item, raw.slice(rawStart, rawEnd + 1)));
    rawCursor = rawEnd + 1;
  });

  if (rawCursor < raw.length) {
    highlight.append(document.createTextNode(raw.slice(rawCursor)));
  }
}

/**
 * Создаёт массив соответствия индексов нормализованной строки индексам исходной.
 *
 * @param {string} raw - Исходная строка в NFC.
 * @returns {Array<number>} Позиции не-пробельных символов в исходной строке.
 */
function normalizedIndexToRawIndex(raw) {
  const positions = [];
  for (let index = 0; index < raw.length; index += 1) {
    if (!isIgnoredForParsing(raw[index])) {
      positions.push(index);
    }
  }
  return positions;
}

/**
 * Проверяет, удаляется ли символ при нормализации машинного разбора.
 *
 * @param {string} char - Один символ исходного ввода.
 * @returns {boolean} true, если символ не должен занимать индекс токена.
 */
function isIgnoredForParsing(char) {
  return /[\s\u00ad\u200b-\u200d\u2060\ufeff]/u.test(char);
}

/**
 * Создаёт кликабельный токен подсветки.
 *
 * @param {object} item - Токен.
 * @param {string} text - Текст токена в исходной строке.
 * @returns {HTMLElement} HTML-элемент токена.
 */
function createTokenChip(item, text) {
  const span = document.createElement("span");
  span.className = `token-chip token-${item.type}`;
  if (isSelected(item)) {
    span.classList.add("is-selected");
  }
  span.textContent = text;
  span.title = `${item.typeLabel}: ${item.label ?? "без подписи"}`;
  span.role = "button";
  span.tabIndex = 0;
  span.addEventListener("click", () => selectToken(item));
  span.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectToken(item);
    }
  });
  return span;
}

/**
 * Создаёт короткий фрагмент, который должен отображаться шрифтом РЖЯ.
 * Обычный русский текст в соседних узлах остаётся системным шрифтом.
 *
 * @param {string} text - RSL-код, который нужно показать шрифтом РЖЯ.
 * @param {string} extraClass - Дополнительный CSS-класс.
 * @returns {HTMLElement} Элемент с применённым RSL-шрифтом.
 */
function makeRslInline(text, extraClass = "") {
  const code = document.createElement("code");
  code.className = ["rsl-inline", extraClass].filter(Boolean).join(" ");
  code.textContent = String(text ?? "");
  return code;
}

/**
 * Добавляет смешанный текст: обычные слова остаются обычным шрифтом, а
 * короткие RSL-фрагменты внутри кавычек «...» отображаются шрифтом РЖЯ.
 * Русские цитаты вроде «контакт» или «простая запись» не трогаются.
 *
 * @param {HTMLElement} parent - Узел, куда добавляется текст.
 * @param {string} text - Текст с возможными RSL-фрагментами в кавычках.
 */
function appendMixedLabel(parent, text) {
  const source = String(text ?? "");
  const pattern = /«([^»]+)»/gu;
  let cursor = 0;
  let match = pattern.exec(source);

  while (match) {
    const beforeQuote = source.slice(cursor, match.index);
    const quoted = match[1];
    parent.append(document.createTextNode(beforeQuote));

    if (isLikelyRslFragment(quoted)) {
      parent.append(document.createTextNode("«"));
      parent.append(makeRslInline(quoted, "in-text"));
      parent.append(document.createTextNode("»"));
    } else {
      parent.append(document.createTextNode(`«${quoted}»`));
    }

    cursor = pattern.lastIndex;
    match = pattern.exec(source);
  }

  if (cursor < source.length) {
    parent.append(document.createTextNode(source.slice(cursor)));
  }
}

/**
 * Отличает короткий код Шрифта РЖЯ от обычной русской цитаты.
 *
 * @param {string} value - Текст внутри кавычек.
 * @returns {boolean} true, если фрагмент стоит показать RSL-шрифтом.
 */
function isLikelyRslFragment(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return false;
  }

  if (/[0-9._\\/%=":(){};!*+?\-|]/u.test(text)) {
    return true;
  }

  if (text.length <= 4 && /^[ЁЭЖЙЦЬБЮЗЩДЪХ]+$/u.test(text)) {
    return true;
  }

  if (text.length === 1 && /^[А-Яа-яЁё]$/u.test(text)) {
    return true;
  }

  return false;
}

/**
 * Добавляет текстовое объяснение из сегментов semantic layer.
 *
 * @param {HTMLElement} parent - Контейнер для объяснения.
 * @param {Array<object>} segments - Сегменты вида { text } или { rsl }.
 */
function appendExplanationSegments(parent, segments) {
  (segments ?? []).forEach((segment) => {
    if (segment.rsl !== undefined) {
      parent.append(makeRslInline(segment.rsl, "in-text"));
    } else {
      appendMixedLabel(parent, segment.text ?? "");
    }
  });
}

/**
 * Выбирает токен и обновляет панели, где есть подсветка выбранного элемента.
 *
 * @param {object} item - Токен.
 */
function selectToken(item) {
  selectedTokenKey = tokenKey(item);
  renderHighlight(lastParsed);
  renderSelection(lastParsed);
  renderTree(lastParsed);
  renderTokenTable(lastParsed.tokens);
}
