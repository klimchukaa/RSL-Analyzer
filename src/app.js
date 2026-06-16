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

/**
 * Рисует карточку выбранного токена.
 *
 * @param {object} parsed - Полный разбор.
 */
function renderSelection(parsed) {
  selectionDetails.replaceChildren();
  const selected = findSelectedToken(parsed);

  if (!selected) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Нажмите на токен в подсветке, дереве или таблице, чтобы увидеть объяснение.";
    selectionDetails.append(empty);
    return;
  }

  const title = document.createElement("strong");
  title.textContent = selected.typeLabel;

  const raw = makeRslInline(selected.raw, "selection-raw");

  const description = document.createElement("p");
  appendMixedLabel(description, selected.description ?? getDisplayedTokenLabel(selected) ?? "Для этого элемента пока нет подробного описания.");

  const meta = document.createElement("dl");
  appendDefinition(meta, "Символы", selected.raw, true);
  appendDefinition(meta, "Значение", getDisplayedTokenLabel(selected) ?? "неизвестно / требуется уточнение");
  appendDefinition(meta, "Распознаватель", selected.recognizer ?? "одиночный символ / контекст");

  selectionDetails.append(title, raw, description, meta);

  if (selected.candidates?.length > 0) {
    const candidatesTitle = document.createElement("strong");
    candidatesTitle.textContent = "Возможные чтения";
    const list = document.createElement("ul");
    selected.candidates.forEach((candidate) => {
      const item = document.createElement("li");
      item.append(document.createTextNode(`${TYPE_LABELS[candidate.type] ?? candidate.type}: `));
      appendMixedLabel(item, candidate.label);
      list.append(item);
    });
    selectionDetails.append(candidatesTitle, list);
  }
}

/**
 * Добавляет строку в список определений.
 *
 * @param {HTMLElement} list - DL-элемент.
 * @param {string} term - Термин.
 * @param {string} value - Значение.
 * @param {boolean} rsl - Нужно ли показывать значение шрифтом РЖЯ.
 */
function appendDefinition(list, term, value, rsl = false) {
  const dt = document.createElement("dt");
  dt.textContent = term;
  const dd = document.createElement("dd");
  if (rsl) {
    dd.append(makeRslInline(value));
  } else {
    appendMixedLabel(dd, value);
  }
  list.append(dt, dd);
}

/**
 * Рисует бета-описание простого паттерна на естественном русском языке.
 *
 * @param {object} layer - Результат buildSemanticLayer().
 */
function renderSemantic(layer) {
  semanticOutput.replaceChildren();

  const status = document.createElement("p");
  status.className = `semantic-status semantic-${layer.supported ? "supported" : "unsupported"}`;
  status.textContent = layer.title;
  semanticOutput.append(status);

  const explanation = document.createElement("p");
  explanation.className = "semantic-explanation";
  appendExplanationSegments(explanation, layer.explanationSegments);
  semanticOutput.append(explanation);

  if (!layer.supported && layer.unsupportedReasons.length > 0) {
    const list = document.createElement("ul");
    list.className = "semantic-reasons";
    layer.unsupportedReasons.forEach((reason) => {
      const item = document.createElement("li");
      item.textContent = reason;
      list.append(item);
    });
    semanticOutput.append(list);
    return;
  }

  if (layer.semantic) {
    const meta = document.createElement("dl");
    appendDefinition(meta, "Статус", "простая запись поддержана бета-модулем");
    if (layer.semantic.frame?.location) {
      appendDefinition(meta, "Локализация", layer.semantic.frame.location.where);
    }
    if (layer.semantic.timeline?.movements?.length) {
      appendDefinition(meta, "Движение", layer.semantic.timeline.movements.map((item) => item.phrase).join(", "));
    }
    semanticOutput.append(meta);
  }
}

/**
 * Рисует список ошибок, предупреждений и информационных заметок.
 *
 * @param {object} parsed - Полный разбор.
 */
function renderDiagnostics(parsed) {
  diagnostics.replaceChildren();
  parsed.diagnostics.forEach((item) => {
    const row = document.createElement("article");
    row.className = `diagnostic diagnostic-${item.severity}`;

    const title = document.createElement("strong");
    title.textContent = item.title;
    const message = document.createElement("p");
    appendDiagnosticMessage(message, item);

    row.append(title, message);
    diagnostics.append(row);
  });
}

/**
 * Добавляет сообщение валидатора, отделяя RSL-фрагмент от обычного текста.
 *
 * @param {HTMLElement} parent - Контейнер сообщения.
 * @param {object} item - Диагностическое сообщение.
 */
function appendDiagnosticMessage(parent, item) {
  const message = String(item.message ?? "");
  const raw = item.token?.raw ?? item.unit?.raw ?? "";
  if (raw && message.startsWith(raw)) {
    parent.append(makeRslInline(raw, "in-text"));
    parent.append(document.createTextNode(message.slice(raw.length)));
    return;
  }
  appendMixedLabel(parent, message);
}

/**
 * Рисует иерархическое дерево разбора.
 *
 * @param {object} parsed - Полный разбор.
 */
function renderTree(parsed) {
  tree.replaceChildren();
  const root = document.createElement("ul");
  root.className = "parse-tree";

  const rootItem = document.createElement("li");
  const title = document.createElement("strong");
  title.textContent = "Жестовая запись";
  if (parsed.normalized) {
    title.append(document.createTextNode(": "), makeRslInline(parsed.normalized, "in-text"));
  }
  rootItem.append(title);

  if (parsed.exactGloss) {
    const gloss = document.createElement("div");
    gloss.className = "tree-note";
    gloss.textContent = `Словарная подсказка: «${parsed.exactGloss}». Это не машинный перевод, а совпадение с мини-словарём примеров.`;
    rootItem.append(gloss);
  }

  const unitsList = document.createElement("ul");
  if (parsed.units.length === 0) {
    const empty = document.createElement("li");
    empty.className = "muted";
    empty.textContent = "Единицы разбора появятся после ввода.";
    unitsList.append(empty);
  } else {
    parsed.units.forEach((unit) => unitsList.append(renderUnit(unit)));
  }
  rootItem.append(unitsList);
  root.append(rootItem);
  tree.append(root);
}

/**
 * Рисует одну единицу разбора: кадр, таймлайн или немануальный компонент.
 *
 * @param {object} unit - Единица разбора.
 * @returns {HTMLElement} Узел списка.
 */
function renderUnit(unit) {
  const li = document.createElement("li");
  const heading = document.createElement("strong");
  heading.textContent = `${unit.title}: `;
  heading.append(makeRslInline(unit.raw, "in-text"));
  li.append(heading);

  if (unit.components.length > 0) {
    const componentList = document.createElement("ul");
    unit.components.forEach((component) => {
      componentList.append(renderComponent(component));
    });
    li.append(componentList);
  }

  return li;
}

/**
 * Рисует компонент внутри кадра или таймлайна.
 *
 * @param {object} component - Компонент.
 * @returns {HTMLElement} Узел списка.
 */
function renderComponent(component) {
  const li = document.createElement("li");
  const text = document.createElement("span");
  const subtype = component.subtype ? `, ${component.subtype}` : "";

  if (component.raw) {
    const raw = document.createElement("code");
    raw.className = `rsl-inline rsl-selectable token-${component.token?.type ?? "unknown"}`;
    if (component.token && isSelected(component.token)) {
      raw.classList.add("is-selected");
    }
    raw.textContent = component.raw;

    if (component.token) {
      raw.role = "button";
      raw.tabIndex = 0;
      raw.title = "Выбрать элемент";
      raw.addEventListener("click", () => selectToken(component.token));
      raw.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectToken(component.token);
        }
      });
    }

    text.append(document.createTextNode(` ${component.role}${subtype}: `));
    li.append(raw, text);
  } else {
    text.append(document.createTextNode(`${component.role}${subtype}: `));
    li.append(text);
  }

  appendMixedLabel(text, component.label ?? "без подписи");

  if (component.children?.length > 0) {
    const children = document.createElement("ul");
    component.children.forEach((child) => children.append(renderComponent(child)));
    li.append(children);
  }

  return li;
}

/**
 * Рисует компактные варианты последовательности кадр/таймлайн.
 *
 * @param {object} parsed - Полный разбор.
 */
function renderSequences(parsed) {
  sequences.replaceChildren();
  if (parsed.possibleSequences.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Нет вариантов.";
    sequences.append(empty);
    return;
  }

  parsed.possibleSequences.forEach((sequence, index) => {
    const details = document.createElement("details");
    details.open = index === 0;
    const summary = document.createElement("summary");
    summary.textContent = `${sequence.label}: ${sequence.units?.length ?? 0} ед.`;
    details.append(summary);

    if (sequence.note) {
      const note = document.createElement("p");
      note.className = "muted";
      note.textContent = sequence.note;
      details.append(note);
    }

    const list = document.createElement("ol");
    (sequence.units ?? []).forEach((unit) => {
      const item = document.createElement("li");
      item.append(document.createTextNode(`${unit.title}: `), makeRslInline(unit.raw, "in-text"));
      list.append(item);
    });
    details.append(list);
    sequences.append(details);
  });
}

/**
