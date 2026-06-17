import {
  CONTACTS,
  DIAGONAL_MOVEMENTS_BY_PLANE,
  DIRECTIONS,
  LOCATIONS,
  MOVEMENT_MODIFIERS,
  NON_DOMINANT_MOVEMENTS,
  NONMANUALS
} from "./data.js";

/**
 * Бета-слой семантического описания.
 *
 * Парсер ниже остаётся фонетическим: он выделяет токены, кадры и таймлайны.
 * Этот модуль делает следующий, более удобный для человека слой: собирает
 * простые разборы в поля и на их основе строит осторожное словесное описание.
 * Если запись содержит хотя бы один сложный или неуверенный элемент,
 * модуль сообщает, что описание пока не поддерживается.
 */

const LOCATION_PHRASES = Object.freeze({
  "(Ё)": { name: "лоб", where: "у лба", genitive: "лба" },
  "(ЁЁ)": { name: "висок", where: "у виска", genitive: "виска" },
  "(ЁЁ)(ЁЁ)": { name: "виски", where: "у висков", genitive: "висков" },
  "(ЁЁЁ)": { name: "затылок", where: "у затылка", genitive: "затылка" },
  "(Й)": { name: "нос", where: "у носа", genitive: "носа" },
  "(ЙЁ)": { name: "глаз", where: "у глаза", genitive: "глаза" },
  "(ЁЙЁ)": { name: "глаза", where: "у глаз", genitive: "глаз" },
  "(ЙЁЁ)": { name: "ухо", where: "у уха", genitive: "уха" },
  "(ЁЁЙЁЁ)": { name: "уши", where: "у ушей", genitive: "ушей" },
  "(Й.)": { name: "ноздря", where: "у ноздри", genitive: "ноздри" },
  "(Й..)": { name: "щека", where: "у щеки", genitive: "щеки" },
  "(..Й..)": { name: "щеки", where: "у щек", genitive: "щек" },
  "(.)": { name: "подбородок", where: "у подбородка", genitive: "подбородка" },
  "(..)": { name: "уголок рта", where: "у уголка рта", genitive: "уголка рта" },
  "(...)": { name: "челюсть", where: "у челюсти", genitive: "челюсти" },

  "9ЁЙЙ0": { name: "плечо неведущей руки", where: "у плеча неведущей руки", genitive: "плеча неведущей руки" },
  "9Ё0": { name: "плечо ведущей руки", where: "у плеча ведущей руки", genitive: "плеча ведущей руки" },
  "9ЁЙЙЁ0": {name: "оба плеча крест накрест", where: "у обоих плечей крест накрест", genitive: "обоих плечей крест накрест" },
  "9Ё09Ё0": {name: "оба плеча", where: "у обоих плечей", genitive: "обоих плечей" },
  "9Й0": { name: "грудь", where: "у груди", genitive: "груди" },
  "9ЁЙ0": { name: "левая сторона груди", where: "у левой стороны груди", genitive: "левой стороны груди" },
  "9ЙЁ0": { name: "правая сторона груди", where: "у правой стороны груди", genitive: "правой стороны груди" },
  "9ЁЙЁ0": { name: "обе стороны груди", where: "у обеих сторон груди", genitive: "обеих сторон груди" },
  "9ЁЁ0": { name: "бок шеи", where: "у шеи сбоку", genitive: "бока шеи" },
  "9ЁЁЁ0": { name: "горло", where: "у горла", genitive: "горла" },
  "9Й.0": { name: "талия", where: "у талии", genitive: "талии" },
  "9.Й.0": { name: "обе стороны талии", where: "у талии с обеих сторон", genitive: "обеих сторон талии" },
  "9Й.Й0": { name: "живот", where: "у живота", genitive: "живота" },
  "9.ЙЙ0": { name: "локоть", where: "у локтя", genitive: "локтя" },
  "9...0": { name: "предплечье", where: "у предплечья", genitive: "предплечья" },
  "9..0": { name: "запястье", where: "у запястья", genitive: "запястья" },
  "9.0": { name: "тыльная сторона ладони", where: "у тыльной стороны ладони", genitive: "тыльной стороны ладони" },

  "9Ёв0": {
    name: "кончики пальцев неведущей руки",
    where: "у кончиков пальцев неведущей руки",
    genitive: "кончиков пальцев неведущей руки"
  },
  "9вЁ0": {
    name: "кончик большого пальца неведущей руки",
    where: "у кончика большого пальца неведущей руки",
    genitive: "кончика большого пальца неведущей руки"
  },
  "9ЁЁв0": {
    name: "область сбоку или сзади от пальцев неведущей руки",
    where: "у области сбоку или сзади от пальцев неведущей руки",
    genitive: "области сбоку или сзади от пальцев неведущей руки"
  },
  "9вЁЁ0": {
    name: "пространство между большим и остальными пальцами неведущей руки",
    where: "у пространства между большим и остальными пальцами неведущей руки",
    genitive: "пространства между большим и остальными пальцами неведущей руки"
  },
  "9.в0": {
    name: "тыльная сторона ладони неведущей руки",
    where: "у тыльной стороны ладони неведущей руки",
    genitive: "тыльной стороны ладони неведущей руки"
  },
  "9в.0": {
    name: "центр ладони неведущей руки",
    where: "у центра ладони неведущей руки",
    genitive: "центра ладони неведущей руки"
  },
  "9..в0": {
    name: "боковая сторона кисти неведущей руки",
    where: "у боковой стороны кисти неведущей руки",
    genitive: "боковой стороны кисти неведущей руки"
  },
  "9в..0": {
    name: "задняя часть большого пальца неведущей руки",
    where: "у задней части большого пальца неведущей руки",
    genitive: "задней части большого пальца неведущей руки"
  },
  "9Ё10": {
    name: "кончик указательного пальца неведущей руки",
    where: "у кончика указательного пальца неведущей руки",
    genitive: "кончика указательного пальца неведущей руки"
  },
  "91ЁЁ0": {
    name: "сторона указательного пальца неведущей руки",
    where: "у стороны указательного пальца неведущей руки",
    genitive: "стороны указательного пальца неведущей руки"
  },
  "9Ё20": {
    name: "кончик среднего пальца неведущей руки",
    where: "у кончика среднего пальца неведущей руки",
    genitive: "кончика среднего пальца неведущей руки"
  },
  "92ЁЁ0": {
    name: "пространство между указательным и средним пальцами неведущей руки",
    where: "у пространства между указательным и средним пальцами неведущей руки",
    genitive: "пространства между указательным и средним пальцами неведущей руки"
  },
  "9Ё30": {
    name: "кончик безымянного пальца неведущей руки",
    where: "у кончика безымянного пальца неведущей руки",
    genitive: "кончика безымянного пальца неведущей руки"
  },
  "93ЁЁ0": {
    name: "пространство между средним и безымянным пальцами неведущей руки",
    where: "у пространства между средним и безымянным пальцами неведущей руки",
    genitive: "пространства между средним и безымянным пальцами неведущей руки"
  },
  "9ЁУ0": {
    name: "кончик мизинца неведущей руки",
    where: "у кончика мизинца неведущей руки",
    genitive: "кончика мизинца неведущей руки"
  },
  "9иЁЁ0": {
    name: "пространство между безымянным пальцем и мизинцем неведущей руки",
    where: "у пространства между безымянным пальцем и мизинцем неведущей руки",
    genitive: "пространства между безымянным пальцем и мизинцем неведущей руки"
  }
});

const CONTACT_PHRASES = Object.freeze({
  "*": { name: "касание", action: "касается", repeatedAction: "повторно касается", verbPlural: "соприкасаются" },
  ";": { name: "трение", action: "трёт", repeatedAction: "повторно трёт", verbPlural: "трутся" },
  "!": { name: "удар", action: "ударяет по области", repeatedAction: "повторно ударяет по области", verbPlural: "ударяются" },
  "Ц": { name: "смахивание", action: "смахивает с области", repeatedAction: "повторно смахивает с области", verbPlural: "смахивают" },
  "+": { name: "удерживание или щипок", action: "хватает", repeatedAction: "повторно хватает или щипает", verbPlural: "держатся" }
});

const MOVEMENT_PHRASES = Object.freeze({
  "Ь": { direction: "вверх", phrase: "движется вверх" },
  "/": { direction: "от себя", phrase: "движется от себя, в пространство перед говорящим" },
  "Б": { direction: "влево от говорящего", phrase: "движется влево от говорящего" },
  "Ю": { direction: "вправо от говорящего", phrase: "движется вправо от говорящего" },
  "З": { direction: "к себе", phrase: "движется к себе, по направлению к корпусу говорящего" },
  "_": { direction: "вниз", phrase: "движется вниз" }
});

const PLANE_NAMES = Object.freeze({
  "(\")": "плоскости перед говорящим",
  "(~)": "горизонтальной плоскости",
  "(%)": "боковой плоскости"
});

const ORIENTATION_READINGS = Object.freeze({
  ".Э": "кисть в вертикальном положении, пальцы смотрят вверх, тыльная сторона смотрит вправо",
  "Э.": "кисть в вертикальном положении, пальцы смотрят вверх, тыльная сторона смотрит влево",
  "ЁЭ": "кисть в вертикальном положении, пальцы смотрят вниз, тыльная сторона смотрит вправо",
  "ЭЁ": "кисть в вертикальном положении, пальцы смотрят вниз, тыльная сторона смотрит влево",
  ".-": "кисть в горизонтальном положении, пальцы смотрят вправо, тыльная сторона смотрит вверх",
  "-.": "кисть в горизонтальном положении, пальцы смотрят влево, тыльная сторона смотрит вверх",
  "Ё-": "кисть в горизонтальном положении, пальцы смотрят вправо, тыльная сторона смотрит вниз",
  "-Ё": "кисть в горизонтальном положении, пальцы смотрят влево, тыльная сторона смотрит вниз",
  "=Ё": "кисть лежит на ребре, большой палец находится над остальными, пальцы смотрят влево",
  "Ё=": "кисть лежит на ребре, большой палец находится над остальными, пальцы смотрят вправо",
  "=.": "кисть лежит на ребре, большой палец находится под остальными, пальцы смотрят влево",
  ".=": "кисть лежит на ребре, большой палец находится под остальными, пальцы смотрят вправо",
  ".\"": "кисть в вертикальном положении, большой палец находится левее остальных, пальцы смотрят вверх",
  "\".": "кисть в вертикальном положении, большой палец находится правее остальных, пальцы смотрят вверх",
  "Ё\"": "кисть в вертикальном положении, большой палец находится левее остальных, пальцы смотрят вниз",
  "\"Ё": "кисть в вертикальном положении, большой палец находится правее остальных, пальцы смотрят вниз",
  "%Ё": "кисть лежит на ребре, большой палец находится над остальными, тыльная сторона смотрит вправо",
  "Ё%": "кисть лежит на ребре, большой палец находится над остальными, тыльная сторона смотрит влево",
  "%.": "кисть лежит на ребре, большой палец находится под остальными, тыльная сторона смотрит вправо",
  ".%": "кисть лежит на ребре, большой палец находится под остальными, тыльная сторона смотрит влево",
  ".Ж": "кисть в горизонтальном положении, большой палец находится находится правее остальных, тыльная сторона смотрит вверх",
  "Ж.": "кисть в горизонтальном положении, большой палец находится находится левее остальных, тыльная сторона смотрит вверх",
  "ЁЖ": "кисть в горизонтальном положении, большой палец находится находится правее остальных, тыльная сторона смотрит вниз",
  "ЖЁ": "кисть в горизонтальном положении, большой палец находится находится левее остальных, тыльная сторона смотрит вниз"
});

const SIMPLE_TIMELINE_TYPES = new Set([
  "movement",
  "circular_movement",
  "non_dominant_movement",
  "movement_modifier",
  "plane"
]);

/**
 * Строит бета-семантику для простых записей.
 *
 * @param {object} parsed - Результат parseSign().
 * @returns {object} Слой со структурой и текстовым объяснением.
 */
export function buildSemanticLayer(parsed) {
  const reasons = findUnsupportedReasons(parsed);
  if (reasons.length > 0) {
    return {
      beta: true,
      supported: false,
      status: "unsupported",
      title: "Текстовое описание пока не поддерживается",
      unsupportedReasons: [...new Set(reasons)],
      semantic: null,
      explanation: "Смысловое описание пока не построено: " + [...new Set(reasons)].join("; ") + ".",
      explanationSegments: [
        { text: "Смысловое описание пока не построено: " },
        { text: [...new Set(reasons)].join("; ") + "." }
      ]
    };
  }

  const frame = parsed.frames[0] ?? null;
  const timeline = parsed.timelines[0] ?? null;
  const nonmanual = parsed.nonmanualUnits[0] ?? null;
  const semantic = {
    type: "simple-sign",
    raw: parsed.normalized,
    nonmanual: nonmanual ? nonmanualToSemantic(nonmanual) : null,
    frame: frameToSemantic(frame),
    timeline: timeline ? timelineToSemantic(timeline) : null
  };
  const explanationSegments = buildExplanationSegments(semantic);

  return {
    beta: true,
    supported: true,
    status: "supported",
    title: "Текстовое описание простого паттерна",
    unsupportedReasons: [],
    semantic,
    explanation: segmentsToPlainText(explanationSegments),
    explanationSegments
  };
}

function findUnsupportedReasons(parsed) {
  const reasons = [];
  if (!parsed || parsed.normalized.length === 0) {
    reasons.push("нет записи для описания");
    return reasons;
  }
  if (parsed.summary.errorCount > 0) {
    reasons.push("в записи есть ошибки валидатора");
  }
  if (parsed.components.unknown.length > 0) {
    reasons.push("есть неизвестные или не полностью распознанные группы");
  }
  if (parsed.components.orientationParts.length > 0) {
    reasons.push("есть неполная ориентация");
  }
  if (parsed.frames.length !== 1) {
    reasons.push("поддерживается ровно один кадр");
  }
  if (parsed.timelines.length > 1) {
    reasons.push("поддерживается не больше одного таймлайна");
  }
  if (parsed.nonmanualUnits.length > 1) {
    reasons.push("поддерживается не больше одного немануального блока");
  }

  const frame = parsed.frames[0];
  if (frame) {
    if (frame.groups.length > 0 || frame.otherTokens.length > 0) {
      reasons.push("кадр содержит служебные или неразобранные элементы");
    }
    if (frame.locations.length > 1) {
      reasons.push("в кадре больше одной локализации");
    }
    if (frame.contacts.length > 2) {
      reasons.push("в кадре больше двух контактов");
    }
    if (frame.hands.length === 0 && frame.locations.length === 0) {
      reasons.push("в кадре нет руки и локализации");
    }
    if (frame.hands.length > 2) {
      reasons.push("в кадре больше двух рук");
    }
    if (frame.hands.some((hand) => !hand.handshape)) {
      reasons.push("есть рука без конфигурации");
    }
  }

  const timeline = parsed.timelines[0];
  if (timeline) {
    if (timeline.tokens.some((token) => !SIMPLE_TIMELINE_TYPES.has(token.type))) {
      reasons.push("таймлайн содержит сложный тип движения");
    }
    const movementDirections = timeline.movements
      .filter((token) => token.type === "movement")
      .map((token) => token.raw);
    const distinctDirections = new Set(movementDirections);
    if (distinctDirections.size > 1) {
      reasons.push("таймлайн содержит несколько разных направлений движения");
    }
    if (timeline.movements.filter((token) => token.type === "circular_movement").length > 1) {
      reasons.push("таймлайн содержит несколько круговых движений");
    }
  }

  return reasons;
}

function frameToSemantic(frame) {
  const locationToken = frame.locations[0] ?? null;
  const contacts = summarizeContacts(frame.contacts);
  const hands = frame.effectiveHands?.length > 0 ? frame.effectiveHands : frame.hands;
  return {
    type: "frame",
    raw: frame.raw,
    location: locationToken ? locationToSemantic(locationToken) : null,
    contact: contacts,
    dominantHand: hands[0] ? handToSemantic(hands[0], "dominantHand", "ведущая рука") : null,
    nonDominantHand: hands[1] ? handToSemantic(hands[1], "nonDominantHand", "неведущая рука") : null,
    carriedOverHands: frame.carryOver ?? null
  };
}

function locationToSemantic(token) {
  const phrase = LOCATION_PHRASES[token.raw] ?? makeLocationFallback(token);
  return {
    raw: token.raw,
    type: token.type,
    name: phrase.name,
    where: phrase.where,
    genitive: phrase.genitive,
    contactTarget: phrase.genitive ?? phrase.name,
    subtype: token.subtype ?? null
  };
}

function makeLocationFallback(token) {
  const name = token.label ?? LOCATIONS[token.raw]?.label ?? "локализация";
  if (token.subtype?.includes("кисть")) {
    return { name, where: `у области «${token.raw}» на неведущей руке`, genitive: name };
  }
  if (token.type === "relative_location") {
    return { name, where: token.label ?? "относительно неведущей руки", genitive: name };
  }
  if (token.type === "locus") {
    return { name, where: `в пространственной точке: ${name}`, genitive: name };
  }
  return { name, where: `у области: ${name}`, genitive: name };
}

function summarizeContacts(contactTokens) {
  if (contactTokens.length === 0) {
    return null;
  }
  const raw = contactTokens.map((token) => token.raw).join("");
  const first = contactTokens[0].raw;
  const phrase = CONTACT_PHRASES[first] ?? CONTACT_PHRASES["*"];
  const repeated = contactTokens.length > 1;
  return {
    raw,
    primary: first,
    count: contactTokens.length,
    name: repeated ? `${phrase.name}, повтор ${contactTokens.length} раза` : phrase.name,
    verbSingle: repeated ? phrase.repeatedAction : phrase.action,
    verbPlural: phrase.verbPlural,
    tokens: contactTokens.map((token) => ({ raw: token.raw, label: CONTACTS[token.raw]?.label ?? token.label }))
  };
}

function handToSemantic(hand, key, label) {
  return {
    type: key,
    role: label,
    raw: hand.raw,
    inherited: hand.inherited || false,
    inheritedHandshape: hand.inheritedHandshape || false,
    inheritedOrientation: hand.inheritedOrientation || false,
    handshape: hand.handshape
      ? {
        raw: hand.handshape.raw,
        name: `конфигурация «${hand.handshape.raw}»`,
        phrase: "в конфигурации"
      }
      : null,
    orientation: hand.orientation
      ? {
        raw: hand.orientation.raw,
        name: `ориентация «${hand.orientation.raw}»`,
        finger: hand.orientation.finger,
        thumb: hand.orientation.thumb,
        summary: describeOrientationForUser(hand.orientation)
      }
      : null
  };
}

function timelineToSemantic(timeline) {
  const plane = timeline.modifiers.find((token) => token.type === "plane") ?? null;
  const movements = timeline.movements.map((token) => movementToSemantic(token, plane));
  const modifiers = timeline.modifiers.map((token) => ({
    raw: token.raw,
    type: token.type,
    name: MOVEMENT_MODIFIERS[token.raw]?.label ?? token.label
  }));
  const nonDominant = timeline.nonDominant.map((token) => ({
    raw: token.raw,
    name: NON_DOMINANT_MOVEMENTS[token.raw]?.label ?? token.label
  }));
  return {
    type: "timeline",
    raw: timeline.raw,
    plane: plane ? { raw: plane.raw, name: PLANE_NAMES[plane.raw] ?? plane.label } : null,
    movements,
    modifiers,
    nonDominant
  };
}

function movementToSemantic(token, plane = null) {
  if (token.type === "circular_movement") {
    const direction = token.direction ? readMovementDirection(token.direction, plane) : null;
    const directionText = direction?.phrase?.replace(/^движется\s+/u, "") ?? direction?.direction;
    return {
      raw: token.raw,
      type: token.type,
      name: token.label ?? "круговое движение",
      phrase: directionText
        ? `совершает круговое движение; направление уточнено: ${directionText}`
        : "совершает круговое движение"
    };
  }
  const phrase = readMovementDirection(token.raw, plane);
  return {
    raw: token.raw,
    type: token.type,
    name: `движение ${phrase.direction}`,
    direction: phrase.direction,
    phrase: phrase.phrase
  };
}

function readMovementDirection(raw, plane = null) {
  const planeDirections = plane ? DIAGONAL_MOVEMENTS_BY_PLANE[plane.raw] : null;
  if (planeDirections?.[raw]) {
    return {
      direction: planeDirections[raw].label,
      phrase: planeDirections[raw].phrase
    };
  }
  if (MOVEMENT_PHRASES[raw]) {
    return MOVEMENT_PHRASES[raw];
  }
  if (raw === "Щ" || raw === "\\") {
    return {
      direction: "по диагонали; плоскость не уточнена",
      phrase: "движется по диагонали, но без явного указания плоскости"
    };
  }
  return {
    direction: DIRECTIONS[raw]?.label ?? "в указанном направлении",
    phrase: `движется ${DIRECTIONS[raw]?.label ?? "в указанном направлении"}`
  };
}

function describeOrientationForUser(orientation) {
  const reading = ORIENTATION_READINGS[orientation.raw];
  if (reading) {
    return reading;
  }
}

function nonmanualToSemantic(unit) {
  const token = unit.tokens[0];
  return {
    raw: token.raw,
    name: NONMANUALS[token.raw]?.label ?? token.label ?? "немануальный компонент"
  };
}

function buildExplanationSegments(semantic) {
  const segments = [];
  if (semantic.nonmanual) {
    pushText(segments, "Перед жестом указан немануальный компонент ");
    pushRsl(segments, semantic.nonmanual.raw);
    pushText(segments, ` — ${semantic.nonmanual.name}. `);
  }

  const frame = semantic.frame;
  const hand1 = frame.dominantHand;
  const hand2 = frame.nonDominantHand;

  pushText(segments, "В кадре ");
  if (hand1 && hand2) {
    describeHand(segments, hand1, "ведущая рука");
    pushText(segments, ", а ");
    describeHand(segments, hand2, "неведущая рука");
    if (frame.contact) {
      pushText(segments, `; руки ${frame.contact.verbPlural}`);
    }
    if (frame.location) {
      pushText(segments, ` ${frame.location.where}`);
    }
    pushText(segments, ".");
  } else if (hand1) {
    describeHand(segments, hand1, "ведущая рука");
    if (frame.contact && frame.location) {
      pushText(segments, ` ${formatContactWithLocation(frame.contact, frame.location)}`);
    } else if (frame.location) {
      pushText(segments, ` расположена ${frame.location.where}`);
    } else if (frame.contact) {
      pushText(segments, ` выполняет контакт: ${frame.contact.name}`);
    }
    pushText(segments, ".");
  } else if (frame.location) {
    pushText(segments, `указана локализация ${frame.location.where}.`);
  }

  if (semantic.timeline) {
    pushText(segments, " После этого ");
    appendTimelineDescription(segments, semantic.timeline);
    pushText(segments, ".");
  }

  return segments;
}

function formatContactWithLocation(contact, location) {
  const target = location.genitive ?? location.name;
  return `${contact.verbSingle} ${target}`;
}

function describeHand(segments, hand, roleText) {
  pushText(segments, `${roleText} `);
  if (hand.handshape) {
    pushText(segments, "в конфигурации ");
    pushRsl(segments, hand.handshape.raw);
  }
  if (hand.orientation) {
    pushText(segments, " с ориентацией ");
    pushRsl(segments, hand.orientation.raw);
    if (hand.orientation.summary) {
      pushText(segments, ` (${hand.orientation.summary})`);
    }
  }
}

function appendTimelineDescription(segments, timeline) {
  const linearMovements = timeline.movements.filter((item) => item.type === "movement");
  const circularMovements = timeline.movements.filter((item) => item.type === "circular_movement");
  const visibleModifiers = timeline.modifiers.filter((item) => item.type !== "plane");

  if (linearMovements.length > 0) {
    const first = linearMovements[0];
    pushText(segments, `ведущая рука ${first.phrase}`);
    if (linearMovements.length > 1) {
      pushText(segments, ` ${countPhrase(linearMovements.length)}`);
    }
  } else if (circularMovements.length > 0) {
    pushText(segments, `ведущая рука ${circularMovements[0].phrase}`);
  } else {
    pushText(segments, "движение ведущей руки явно не задано");
  }

  if (visibleModifiers.length > 0) {
    pushText(segments, `; модификатор: ${visibleModifiers.map((item) => item.name).join(", ")}`);
  }
  if (timeline.nonDominant.length > 0) {
    pushText(segments, `; ${timeline.nonDominant.map((item) => item.name).join(", ")}`);
  }
}

function countPhrase(count) {
  if (count === 2) {
    return "два раза";
  }
  if (count === 3) {
    return "три раза";
  }
  return `${count} раз(а)`;
}

function pushText(segments, text) {
  if (!text) {
    return;
  }
  const previous = segments[segments.length - 1];
  if (previous?.text !== undefined) {
    previous.text += text;
  } else {
    segments.push({ text });
  }
}

function pushRsl(segments, rsl) {
  if (rsl) {
    segments.push({ rsl });
  }
}

function segmentsToPlainText(segments) {
  return segments.map((segment) => segment.text ?? segment.rsl ?? "").join("");
}
