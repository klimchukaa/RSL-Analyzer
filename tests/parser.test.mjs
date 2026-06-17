import assert from "node:assert/strict";
import test from "node:test";
import { normalizeInput, parseSign, tokenize } from "../src/parser.js";
import { buildSemanticLayer } from "../src/semantic.js";

test("normalizeInput removes spaces but keeps case-sensitive RSL symbols", () => {
  assert.equal(normalizeInput('."Ч _ Ё=7 _ Ё=Ч'), '."Ч_Ё=7_Ё=Ч');
});

test("normalizeInput removes invisible joiners from copied reference text", () => {
  assert.equal(normalizeInput("(\u2060Й\u2060Ё\u2060)\u2060ч\u2060/"), "(ЙЁ)ч/");
});

test("tokenizer recognizes location, contact, orientation and handshape", () => {
  const tokens = tokenize("(ЁЁ)*.Эо");
  assert.deepEqual(tokens.map((token) => token.type), [
    "location",
    "contact",
    "orientation",
    "handshape"
  ]);
  assert.equal(tokens[0].label, "висок");
  assert.equal(tokens[1].label, "коснуться");
});

test("parser splits frames and timelines", () => {
  const parsed = parseSign('."Ч_Ё=7_Ё=Ч');
  assert.equal(parsed.summary.frameCount, 2);
  assert.equal(parsed.summary.timelineCount, 2);
  assert.deepEqual(parsed.units.map((unit) => unit.kind), [
    "frame",
    "timeline",
    "frame",
    "timeline",
    "frame"
  ]);
});

test("parser recognizes two-hand frame plus circular timeline", () => {
  // 1Э..Э1 = две руки навстречу (конфигурация 1 + ориентации Э./.Э),
  // затем /Д = круговое движение от себя и Я = противоположное движение неведущей.
  const parsed = parseSign("1Э..Э1 / Д Я");
  assert.equal(parsed.units[0].kind, "frame");
  assert.equal(parsed.units[0].hands.length, 2);
  assert.equal(parsed.units[1].kind, "timeline");
  assert.deepEqual(parsed.units[1].tokens.map((token) => token.type), [
    "circular_movement",
    "non_dominant_movement"
  ]);
});

test("validator reports incomplete orientation", () => {
  const parsed = parseSign("(ЁЁ)*.Э");
  assert.equal(parsed.summary.warningCount > 0, true);
  assert.equal(
    parsed.diagnostics.some((item) => item.title === "Рука без конфигурации"),
    true
  );
});

test("Ж and % are orientation finger symbols; a lone one is an incomplete part", () => {
  // Символы пальцев ориентации: Э - " = Ж %, символы большого пальца: . Ё.
  // Ж и % многозначны: отдельно это часть ориентации, но в цепочках у них другая
  // роль: в БЖБ символ Ж это взгляд, в (%) символ % это плоскость.
  assert.equal(parseSign("Ё=").tokens[0].type, "orientation");      // документированный символ пальцев =
  assert.equal(parseSign("БЖБ").nonmanualUnits[0].tokens[0].type, "eye_movement"); // Ж в роли взгляда
  assert.equal(parseSign("(%)").tokens[0].type, "plane");           // % в роли плоскости
  assert.equal(parseSign("Ж").tokens[0].type, "orientation_part"); // одиночный символ Ж это неполная ориентация
});

test("unknown groups are preserved as one token", () => {
  const parsed = parseSign("9abc0");
  assert.equal(parsed.tokens.length, 1);
  assert.equal(parsed.tokens[0].type, "group_unknown");
  assert.equal(parsed.summary.warningCount > 0, true);
});

test("relative location is recognized by pattern", () => {
  const parsed = parseSign("91Ь0");
  assert.equal(parsed.tokens[0].type, "relative_location");
  assert.equal(parsed.tokens[0].label, "над неведущей рукой");
});

test("body and head locations from the reference are recognized", () => {
  const both = parseSign("а9ЁЙЁ0а/");
  assert.equal(both.tokens[1].type, "location");
  assert.equal(both.tokens[1].label, "обе стороны груди");
  assert.equal(both.summary.errorCount, 0);

  const leftChest = parseSign("9ЁЙ0");
  assert.equal(leftChest.tokens[0].type, "location");
  assert.equal(leftChest.tokens[0].label, "грудь слева");

  const waist = parseSign("9Й.0");
  assert.equal(waist.tokens[0].type, "location");
  assert.equal(waist.tokens[0].label, "талия");
});

test("undocumented look-alike codes are not invented but preserved as groups", () => {
  // Эти записи похожи на локализации, но в справочниках Шрифта РЖЯ их нет, поэтому
  // парсер не присваивает им придуманное значение, а помечает нераспознанной группой.
  const fakeChest = parseSign("9ЭЭ0");
  assert.equal(fakeChest.tokens[0].type, "group_unknown");

  const fakeEyes = parseSign("(ЁЁЙ)");
  assert.equal(fakeEyes.tokens[0].type, "group_unknown");
});

test("only documented hand locations are accepted as locations", () => {
  const documented = parseSign("9.в0;5Д");
  assert.equal(documented.tokens[0].type, "location");
  assert.equal(documented.tokens[0].recognizer, "fixed");
  assert.equal(documented.tokens[0].label, "тыльная сторона ладони");

  const invented = parseSign("9.50;5Д");
  assert.equal(invented.tokens[0].type, "group_unknown");
  assert.equal(invented.tokens[0].recognizer, "unknown-curly-group");
  assert.match(invented.tokens[0].label, /не найдена/);
});

test("compressed facial nonmanual patterns are recognized from documented syllables", () => {
  const mi = parseSign(":%ЪХ%ХЪ");
  assert.equal(mi.tokens[0].type, "nonmanual");
  assert.equal(mi.tokens[0].label, "артикуляция МИ");

  const na2 = parseSign(":%ЪЭХ%%(ЪЭ");
  assert.equal(na2.tokens[0].type, "nonmanual");
  assert.equal(na2.tokens[0].label, "артикуляция НА-НА");
  assert.equal(na2.tokens[0].repeatCount, 2);

  const na3 = parseSign(":%ЪЭХ%%%(ЪЭ");
  assert.equal(na3.tokens[0].type, "nonmanual");
  assert.equal(na3.tokens[0].label, "артикуляция НА-НА-НА");
  assert.equal(na3.tokens[0].repeatCount, 3);

  const chu2 = parseSign(":%9ХЪ0%%*");
  assert.equal(chu2.tokens[0].type, "nonmanual");
  assert.equal(chu2.tokens[0].label, "артикуляция ЧУ-ЧУ");

  const unsupported = parseSign(":%()%ЪХ");
  assert.equal(unsupported.tokens[0].raw, ":%()");
  assert.equal(unsupported.tokens[0].label, "открыть рот");
  assert.equal(unsupported.summary.errorCount > 0, true);
});


test("later frame can inherit hands when only location or orientation is written", () => {
  const locationOnly = parseSign("5Ё=_9Й0");
  assert.equal(locationOnly.summary.frameCount, 2);
  assert.equal(locationOnly.frames[1].carryOver.sourceFrame, "Кадр 1");
  assert.equal(locationOnly.frames[1].effectiveHands[0].handshape.raw, "5");
  assert.equal(
    locationOnly.diagnostics.some((item) => item.title === "Сокращённый кадр без новой конфигурации"),
    true
  );

  const orientationOnly = parseSign("5Ё=_Ё=");
  assert.equal(orientationOnly.frames[1].carryOver.sourceFrame, "Кадр 1");
  assert.equal(orientationOnly.frames[1].effectiveHands[0].handshape.raw, "5");
  assert.equal(orientationOnly.frames[1].effectiveHands[0].orientation.raw, "Ё=");
  assert.equal(
    orientationOnly.diagnostics.some((item) => item.title === "Рука без конфигурации"),
    true
  );
});

test("exact mini-glossary is only a hint", () => {
  const parsed = parseSign("(ЁЁ)*.Эо");
  assert.equal(parsed.exactGloss, "вспомнить");
});

test("empty input returns a warning and no crash", () => {
  const parsed = parseSign("");
  assert.equal(parsed.tokens.length, 0);
  assert.equal(parsed.diagnostics[0].title, "Пустой ввод");
});

test("handshape 6 is recognized", () => {
  const parsed = parseSign("6");
  assert.equal(parsed.tokens[0].type, "handshape");
  assert.equal(parsed.components.handshapes[0].raw, "6");
  assert.equal(parsed.summary.errorCount, 0);
});

test("unknown symbols produce errors", () => {
  // Q и # это чужие символы, поэтому ошибки. Ж это символ пальцев ориентации,
  // поэтому одиночный Ж это неполная ориентация (предупреждение), а не ошибка,
  // и в список unknown он не попадает.
  const parsed = parseSign("Q#Ж");
  assert.equal(parsed.summary.errorCount, 2);
  assert.equal(parsed.unknown.map((item) => item.raw).join(""), "Q#");
  assert.equal(parsed.warnings.some((item) => item.title === "Неполная ориентация"), true);
});

test("unclosed and unmatched brackets are reported", () => {
  const unclosed = parseSign("(ЁЁ");
  const unmatched = parseSign("Ё0");
  assert.equal(unclosed.diagnostics.some((item) => item.title === "Неизвестный символ"), true);
  assert.equal(unmatched.errors.some((item) => item.message.includes("закрывающий символ")), true);
});

test("long valid string is parsed without errors", () => {
  const parsed = parseSign("(ЁЁ)*.Эо".repeat(20));
  assert.equal(parsed.summary.errorCount, 0);
  assert.equal(parsed.tokens.length > 40, true);
});

test("Cyrillic keyboard symbols are preserved as font-backed handshapes", () => {
  const parsed = parseSign("Привет");
  assert.equal(parsed.summary.errorCount, 0);
  assert.equal(parsed.components.handshapes.map((item) => item.raw).join(""), "Привет");
});

test("nonmanual movements and parenthesized circular movement are recognized", () => {
  const parsed = parseSign("БЖБ9Б0(Д_)");
  assert.deepEqual(parsed.nonmanualUnits.map((unit) => unit.tokens[0].type), [
    "eye_movement",
    "shoulder_movement"
  ]);
  assert.equal(parsed.timelines[0].tokens[0].type, "circular_movement");
});

test("ambiguous contact/modifier symbols expose possible sequences", () => {
  const parsed = parseSign("1!2");
  assert.equal(parsed.possibleSequences.length, 2);
  assert.equal(parsed.components.contacts[0].raw, "!");
});

test("semantic beta layer describes simple patterns", () => {
  const layer = buildSemanticLayer(parseSign("(ЁЁ)*.Эо"));
  assert.equal(layer.supported, true);
  assert.equal(layer.semantic.frame.location.where, "у виска");
  assert.equal(layer.semantic.frame.dominantHand.handshape.raw, "о");
  assert.match(layer.explanation, /касается виска/);
  // Расшифровка ориентации .Э: описание положения кисти и направления пальцев.
  assert.match(layer.semantic.frame.dominantHand.orientation.summary, /пальцы смотрят вверх/);
  assert.equal(layer.explanationSegments.some((segment) => segment.rsl === "о"), true);
});

test("semantic beta layer explains chest contact and signer-perspective directions", () => {
  const chest = buildSemanticLayer(parseSign("9Й0*=Ёв"));
  assert.equal(chest.supported, true);
  assert.equal(chest.semantic.frame.location.where, "у груди");
  assert.match(chest.explanation, /касается груди/);
  assert.doesNotMatch(chest.explanation, /на груди/);
  // Расшифровка ориентации =Ё: описание положения кисти и большого пальца.
  assert.match(chest.semantic.frame.dominantHand.orientation.summary, /лежит на ребре/);

  const backward = buildSemanticLayer(parseSign("Ё=ЧЗ"));
  assert.equal(backward.supported, true);
  assert.match(backward.explanation, /к себе/);
  assert.doesNotMatch(backward.explanation, /назад/);

  const forwardCircle = buildSemanticLayer(parseSign("1Э..Э1/ДЯ"));
  assert.equal(forwardCircle.supported, true);
  assert.match(forwardCircle.explanation, /от себя/);
  assert.doesNotMatch(forwardCircle.explanation, /вперёд/);
});

test("plane marker retargets diagonal slash and is not repeated as modifier text", () => {
  const parsed = parseSign("1(%)/");
  const movement = parsed.units[1].movements[0];
  assert.equal(movement.raw, "/");
  assert.equal(movement.contextualLabel, "вперёд-вверх");

  const layer = buildSemanticLayer(parsed);
  assert.equal(layer.supported, true);
  assert.match(layer.explanation, /вперёд и вверх/);
  assert.doesNotMatch(layer.explanation, /модификатор:/);
});

test("floor plane reads slash as right-forward diagonal", () => {
  const parsed = parseSign("1(~)/");
  const movement = parsed.units[1].movements[0];
  assert.equal(movement.contextualLabel, "вправо-вперёд");

  const layer = buildSemanticLayer(parsed);
  assert.match(layer.explanation, /вправо и вперёд/);
  assert.doesNotMatch(layer.explanation, /от себя/);
});

test("semantic beta layer refuses complex patterns explicitly", () => {
  const layer = buildSemanticLayer(parseSign('."Ч_Ё=7_Ё=Ч'));
  assert.equal(layer.supported, false);
  assert.equal(layer.unsupportedReasons.includes("поддерживается ровно один кадр"), true);
});
