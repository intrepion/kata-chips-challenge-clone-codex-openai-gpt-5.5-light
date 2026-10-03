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
        "#P.b.W.X.#",
        "#...F....#",
        "#........#",
        "##########",
      ],
    },
    {
      title: "Final Circuit",
      map: [
        "############",
        "#P.C.r.R.SX#",
        "#..b.W.....#",
        "#..f.F.....#",
        "############",
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
    game.chipsCollected = 0;
    game.chipsRequired = level.chipsRequired;
    game.keys = { red: 0, blue: 0, yellow: 0, green: 0 };
    game.boots = { water: false, fire: false };
    game.moves = 0;
    game.mode = "ready";
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
        drawCell(x, y, cellAt(level, x, y));
      }
    }

    drawPlayer(game.player.x, game.player.y);
    syncHud();
  }

  function cellAt(level, x, y) {
    return level.cells[y]?.[x] || "#";
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
    if ("rbyg".includes(code)) drawCircle(px, py, keyColor(code), code.toUpperCase());
    if ("RBYG".includes(code)) drawDoor(px, py, keyColor(code.toLowerCase()), code);
    if (code === "b") drawCircle(px, py, COLORS.water, "B");
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

  function keyColor(code) {
    return { r: "#e95d5d", b: "#5c93f0", y: "#ead45c", g: "#71d26f" }[code];
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
      button.textContent = `${index + 1}. ${level.title}`;
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

  window.__circuitFetchDebug = () => ({
    level: game.currentLevel,
    title: game.levels[game.currentLevel].title,
    player: { ...game.player },
    chips: { collected: game.chipsCollected, required: game.chipsRequired },
    keys: { ...game.keys },
    boots: { ...game.boots },
    moves: game.moves,
    mode: game.mode,
    unlockedLevel: game.unlockedLevel,
  });

  loadProgress();
  startLevel(0);
})();
