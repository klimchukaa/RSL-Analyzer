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
