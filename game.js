(() => {
  "use strict";

  const TILE = 44;
  const COLORS = {
    floor: "#263038",
    wall: "#65707a",
    chip: "#68e0cf",
    socket: "#304e5b",
    exit: "#8fe06c",
    water: "#277fc1",
    fire: "#d6623b",
    player: "#f6e27d",
  };
  const DIRECTIONS = {
    ArrowUp: { x: 0, y: -1 },
    KeyW: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    KeyS: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    KeyA: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    KeyD: { x: 1, y: 0 },
  };
  const TOUCH_DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
  };
  const REPEAT_INITIAL_MS = 190;
  const REPEAT_MS = 125;
  const KEY_TILES = { r: "red", u: "blue", y: "yellow", g: "green" };
  const DOOR_TILES = { R: "red", B: "blue", Y: "yellow", G: "green" };

  const RAW_LEVELS = [
    {
      title: "Training Trace",
      map: [
        "##########",
        "#P..C...X#",
        "#........#",
        "#........#",
        "##########",
      ],
    },
    {
      title: "Socket Sample",
      map: [
        "##########",
        "#P.C.S.X.#",
        "#........#",
        "#........#",
        "##########",
      ],
    },
    {
      title: "Key Current",
      map: [
        "##########",
        "#P.r.R.X.#",
        "#........#",
        "#........#",
        "##########",
      ],
    },
    {
      title: "Boot Bridge",
      map: [
        "##########",
        "#P.w.W.X.#",
        "#...F....#",
        "#........#",
        "##########",
      ],
    },
    {
      title: "Final Circuit",
      map: [
        "##############",
        "#P.C.r.R.u.BX#",
        "#..w.W..y.Y..#",
        "#..f.F..g.GS.#",
        "##############",
      ],
    },
  ];

  const game = {
    levels: RAW_LEVELS.map(parseLevel),
    currentLevel: 0,
    unlockedLevel: 0,
    player: { x: 0, y: 0 },
    chipsCollected: 0,
    chipsRequired: 0,
    keys: { red: 0, blue: 0, yellow: 0, green: 0 },
    boots: { water: false, fire: false },
    moves: 0,
    mode: "ready",
    message: "Collect the chips, open the socket, and reach the exit.",
    muted: false,
    cells: [],
    bufferedMove: null,
    audio: null,
    heldMove: null,
    repeatStartTimer: null,
    repeatTimer: null,
  };

  const canvas = document.querySelector("#game-canvas");
  const ctx = canvas.getContext("2d");
  const els = {
    levelTitle: document.querySelector("#level-title"),
    status: document.querySelector("#status-line"),
    levelList: document.querySelector("#level-list"),
    chips: document.querySelector("#chips-count"),
    keys: document.querySelector("#keys-count"),
    boots: document.querySelector("#boots-count"),
    moves: document.querySelector("#moves-count"),
    reset: document.querySelector("#reset-button"),
    resetProgress: document.querySelector("#reset-progress-button"),
    mute: document.querySelector("#mute-button"),
    debug: document.querySelector("#debug-state"),
  };

  function parseLevel(raw, index) {
    const cells = raw.map.map((row) => row.split(""));
    let player = { x: 1, y: 1 };
    let chipsRequired = 0;
    for (let y = 0; y < cells.length; y += 1) {
      for (let x = 0; x < cells[y].length; x += 1) {
        if (cells[y][x] === "P") {
          player = { x, y };
          cells[y][x] = ".";
        }
        if (cells[y][x] === "C") chipsRequired += 1;
      }
    }
    return {
      index,
      title: raw.title,
      width: Math.max(...raw.map.map((row) => row.length)),
      height: raw.map.length,
      cells,
      player,
      chipsRequired,
    };
  }

  function startLevel(index) {
    const level = game.levels[index];
    game.currentLevel = index;
    game.player = { ...level.player };
    game.cells = level.cells.map((row) => [...row]);
    game.chipsCollected = 0;
    game.chipsRequired = level.chipsRequired;
    game.keys = { red: 0, blue: 0, yellow: 0, green: 0 };
    game.boots = { water: false, fire: false };
    game.moves = 0;
    game.mode = "ready";
    game.bufferedMove = null;
    game.message = "Collect the chips, open the socket, and reach the exit.";
    render();
  }

  function render() {
    const level = game.levels[game.currentLevel];
    canvas.width = level.width * TILE;
    canvas.height = level.height * TILE;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < level.height; y += 1) {
      for (let x = 0; x < level.width; x += 1) {
        drawCell(x, y, cellAt(x, y));
      }
    }

    drawPlayer(game.player.x, game.player.y);
    syncHud();
  }

  function cellAt(x, y) {
    return game.cells[y]?.[x] || "#";
  }

  function drawCell(x, y, code) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);

    if (code === "#") {
      ctx.fillStyle = COLORS.wall;
      ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      return;
    }
    if (code === "C") drawCircle(px, py, COLORS.chip, "C");
    if (code === "S") drawSquare(px, py, COLORS.socket, "S");
    if (code === "X") drawSquare(px, py, COLORS.exit, "X");
    if (code === "W") drawSquare(px, py, COLORS.water, "W");
    if (code === "F") drawSquare(px, py, COLORS.fire, "F");
    if (KEY_TILES[code]) drawCircle(px, py, keyColor(KEY_TILES[code]), keyLabel(KEY_TILES[code]));
    if (DOOR_TILES[code]) drawDoor(px, py, keyColor(DOOR_TILES[code]), code);
    if (code === "w") drawCircle(px, py, COLORS.water, "B");
    if (code === "f") drawCircle(px, py, COLORS.fire, "B");
  }

  function drawCircle(px, py, color, label) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px + TILE / 2, py + TILE / 2, TILE * 0.28, 0, Math.PI * 2);
    ctx.fill();
    drawLabel(px, py, label, "#101417");
  }

  function drawSquare(px, py, color, label) {
    ctx.fillStyle = color;
    ctx.fillRect(px + 8, py + 8, TILE - 16, TILE - 16);
    drawLabel(px, py, label, "#f7fbf5");
  }

  function drawDoor(px, py, color, label) {
    ctx.fillStyle = color;
    ctx.fillRect(px + 6, py + 4, TILE - 12, TILE - 8);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 3;
    ctx.strokeRect(px + 10, py + 8, TILE - 20, TILE - 16);
    drawLabel(px, py, label, "#101417");
  }

  function drawLabel(px, py, label, color) {
    ctx.fillStyle = color;
    ctx.font = "700 16px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, px + TILE / 2, py + TILE / 2 + 1);
  }

  function drawPlayer(x, y) {
    const px = x * TILE;
    const py = y * TILE;
    ctx.fillStyle = COLORS.player;
    ctx.beginPath();
    ctx.roundRect(px + 9, py + 7, TILE - 18, TILE - 14, 8);
    ctx.fill();
    drawLabel(px, py, "P", "#15170c");
  }

  function keyColor(color) {
    return {
      red: "#e95d5d",
      blue: "#5c93f0",
      yellow: "#ead45c",
      green: "#71d26f",
    }[color];
  }

  function keyLabel(color) {
    return { red: "R", blue: "B", yellow: "Y", green: "G" }[color];
  }

  function requestMove(direction) {
    if (game.mode === "complete") {
      advanceLevel();
      return;
    }
    if (game.mode === "failed") {
      startLevel(game.currentLevel);
      return;
    }
    if (game.mode !== "ready") {
      game.bufferedMove = direction;
      return;
    }
    applyMove(direction);
  }

  function applyMove(direction) {
    const target = {
      x: game.player.x + direction.x,
      y: game.player.y + direction.y,
    };
    const tile = cellAt(target.x, target.y);
    game.moves += 1;

    if (!canEnter(tile)) {
      game.message = blockedMessage(tile);
      playSound("blocked");
      render();
      return;
    }

    game.player = target;
    resolveTile(tile, target);
    render();
  }

  function canEnter(tile) {
    if (tile === "#") return false;
    if (tile === "S" && game.chipsCollected < game.chipsRequired) return false;
    if (DOOR_TILES[tile]) return game.keys[DOOR_TILES[tile]] > 0;
    return true;
  }

  function blockedMessage(tile) {
    if (tile === "S") return `The chip socket needs ${game.chipsRequired - game.chipsCollected} more chip${game.chipsRequired - game.chipsCollected === 1 ? "" : "s"}.`;
    if (DOOR_TILES[tile]) return `That ${DOOR_TILES[tile]} door needs a matching key.`;
    return "Blocked.";
  }

  function resolveTile(tile, target) {
    if (tile === "C") {
      game.chipsCollected += 1;
      clearCell(target);
      game.message = "Chip collected.";
      playSound("collect");
    } else if (KEY_TILES[tile]) {
      const color = KEY_TILES[tile];
      game.keys[color] += 1;
      clearCell(target);
      game.message = `${capitalize(color)} key collected.`;
      playSound("collect");
    } else if (DOOR_TILES[tile]) {
      const color = DOOR_TILES[tile];
      game.keys[color] -= 1;
      clearCell(target);
      game.message = `${capitalize(color)} door opened.`;
      playSound("unlock");
    } else if (tile === "w") {
      game.boots.water = true;
      clearCell(target);
      game.message = "Water boots collected.";
      playSound("collect");
    } else if (tile === "f") {
      game.boots.fire = true;
      clearCell(target);
      game.message = "Fire boots collected.";
      playSound("collect");
    } else if (tile === "W" && !game.boots.water) {
      fail("Water shorted the circuit.");
    } else if (tile === "F" && !game.boots.fire) {
      fail("Fire melted the circuit.");
    } else if (tile === "X") {
      completeLevel();
    } else {
      game.message = "Keep routing the circuit.";
    }
  }

  function clearCell(point) {
    game.cells[point.y][point.x] = ".";
  }

  function fail(message) {
    game.mode = "failed";
    game.message = `${message} Press any move or Reset to retry.`;
    playSound("death");
  }

  function completeLevel() {
    game.mode = "complete";
    game.message = "Level complete. Press any move or click to continue.";
    game.unlockedLevel = Math.max(game.unlockedLevel, Math.min(game.currentLevel + 1, game.levels.length - 1));
    localStorage.setItem("circuitFetchUnlocked", String(game.unlockedLevel));
    playSound("win");
  }

  function advanceLevel() {
    if (game.currentLevel < game.levels.length - 1) {
      startLevel(game.currentLevel + 1);
    } else {
      game.message = "Circuit Fetch complete. Reset progress to replay from the start.";
      render();
    }
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function playSound(kind) {
    if (game.muted) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!game.audio) game.audio = new AudioContext();
    const ctxAudio = game.audio;
    const now = ctxAudio.currentTime;
    const osc = ctxAudio.createOscillator();
    const gain = ctxAudio.createGain();
    const tones = {
      collect: [660, 0.07],
      unlock: [440, 0.09],
      blocked: [180, 0.05],
      death: [110, 0.16],
      win: [880, 0.14],
    };
    const [frequency, duration] = tones[kind] || tones.collect;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(gain).connect(ctxAudio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  function syncHud() {
    const level = game.levels[game.currentLevel];
    els.levelTitle.textContent = `${game.currentLevel + 1}. ${level.title}`;
    els.status.textContent = game.message;
    els.chips.textContent = `${game.chipsCollected} / ${game.chipsRequired}`;
    els.keys.textContent = formatCounts(game.keys);
    els.boots.textContent = Object.entries(game.boots).filter((entry) => entry[1]).map((entry) => entry[0]).join(", ") || "None";
    els.moves.textContent = String(game.moves);
    renderLevelList();
    els.mute.textContent = game.muted ? "Muted" : "Sound";
    els.mute.setAttribute("aria-pressed", String(game.muted));
    els.debug.textContent = JSON.stringify(debugSnapshot());
  }

  function formatCounts(counts) {
    return Object.entries(counts)
      .filter((entry) => entry[1] > 0)
      .map((entry) => `${entry[0]} ${entry[1]}`)
      .join(", ") || "None";
  }

  function renderLevelList() {
    els.levelList.replaceChildren();
    game.levels.forEach((level, index) => {
      const button = document.createElement("button");
      button.type = "button";
      const state = index <= game.unlockedLevel ? "Unlocked" : "Locked";
      button.textContent = `${index + 1}. ${level.title} - ${state}`;
      button.disabled = index > game.unlockedLevel;
      button.className = index === game.currentLevel ? "active" : "";
      button.addEventListener("click", () => startLevel(index));
      els.levelList.append(button);
    });
  }

  function loadProgress() {
    const saved = Number(localStorage.getItem("circuitFetchUnlocked") || "0");
    game.unlockedLevel = Math.min(Math.max(saved, 0), game.levels.length - 1);
  }

  els.reset.addEventListener("click", () => startLevel(game.currentLevel));
  els.resetProgress.addEventListener("click", () => {
    localStorage.removeItem("circuitFetchUnlocked");
    game.unlockedLevel = 0;
    startLevel(0);
  });
  els.mute.addEventListener("click", () => {
    game.muted = !game.muted;
    syncHud();
  });
  document.addEventListener("keydown", (event) => {
    if (event.code === "KeyR") {
      startLevel(game.currentLevel);
      return;
    }
    const direction = DIRECTIONS[event.code];
    if (!direction) return;
    event.preventDefault();
    if (event.repeat) return;
    requestMove(direction);
    startRepeat(direction);
  });
  document.addEventListener("keyup", (event) => {
    if (DIRECTIONS[event.code]) stopRepeat();
  });
  document.addEventListener("click", () => {
    if (game.mode === "complete") advanceLevel();
  });
  document.querySelectorAll("[data-dir]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      if (button.dataset.skipClick === "true") {
        delete button.dataset.skipClick;
        return;
      }
      requestMove(TOUCH_DIRECTIONS[button.dataset.dir]);
    });
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const direction = TOUCH_DIRECTIONS[button.dataset.dir];
      requestMove(direction);
      startRepeat(direction);
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener("pointerup", () => {
      button.dataset.skipClick = "true";
      stopRepeat();
    });
    button.addEventListener("pointercancel", stopRepeat);
    button.addEventListener("pointerleave", stopRepeat);
  });

  function startRepeat(direction) {
    stopRepeat();
    game.heldMove = direction;
    game.repeatStartTimer = window.setTimeout(() => {
      game.repeatTimer = window.setInterval(() => requestMove(direction), REPEAT_MS);
    }, REPEAT_INITIAL_MS);
  }

  function stopRepeat() {
    game.heldMove = null;
    if (game.repeatStartTimer) window.clearTimeout(game.repeatStartTimer);
    if (game.repeatTimer) window.clearInterval(game.repeatTimer);
    game.repeatStartTimer = null;
    game.repeatTimer = null;
  }

  function debugSnapshot() {
    return {
    level: game.currentLevel,
    title: game.levels[game.currentLevel].title,
    player: { ...game.player },
    chips: { collected: game.chipsCollected, required: game.chipsRequired },
    keys: { ...game.keys },
    boots: { ...game.boots },
    moves: game.moves,
    mode: game.mode,
    unlockedLevel: game.unlockedLevel,
    bufferedMove: game.bufferedMove,
    heldMove: game.heldMove,
    message: game.message,
    };
  }

  window.__circuitFetchDebug = debugSnapshot;

  loadProgress();
  startLevel(0);
})();
