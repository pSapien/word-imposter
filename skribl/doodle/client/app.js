(() => {
  const $ = sel => document.querySelector(sel);

  // Elements
  const joinScreen = $("#join-screen");
  const game = $("#game");
  const nameInput = $("#name");
  const roomInput = $("#room");
  const genRoomBtn = $("#gen-room");
  const joinBtn = $("#join");

  const startBtn = $("#start");
  const statusEl = $("#status");
  const timerEl = $("#timer");
  const wordMaskEl = $("#word-mask");

  const canvas = $("#canvas");
  const ctx = canvas.getContext("2d");
  const colorInput = $("#color");
  const sizeInput = $("#size");
  const toolPenBtn = $("#tool-pen");
  const toolBucketBtn = $("#tool-bucket");
  const eraserBtn = $("#eraser");
  const clearBtn = $("#clear");
  const undoBtn = $("#undo");
  const choicesBox = $("#word-choices");

  const playersBox = $("#players");
  const chatBox = $("#chat");
  const chatText = $("#chat-text");
  const sendBtn = $("#send");

  // State
  let ws = null;
  let myId = null;
  let isAdmin = false;
  let drawer = false;
  let drawing = false;
  let last = null; // deprecated in stroke preview (we use currentStrokePoints)
  let strokeColor = "#000000";
  let strokeSize = 3;
  let roundEndAt = 0;
  let roomCode = null;
  let wordChoices = [];
  let tool = "pen"; // 'pen' | 'bucket' | 'eraser'

  function randCode() {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random()*chars.length)];
    return s;
  }

  genRoomBtn.addEventListener("click", () => {
    roomInput.value = randCode();
  });

  joinBtn.addEventListener("click", () => {
    const name = (nameInput.value || "").trim() || "Player";
    const room = (roomInput.value || "").trim().toUpperCase() || "LOBBY";
    roomCode = room;
    joinScreen.classList.add("hidden");
    game.classList.remove("hidden");
    statusEl.textContent = `Room ${room}`;
    connectWS(name, room);
  });

  function connectWS(name, room) {
    let proto = location.protocol === "https:" ? "wss" : "ws";
    const url = `${proto}://${location.host}`;
    ws = new WebSocket(url);
    ws.addEventListener("open", () => {
      ws.send(JSON.stringify({ type: "join", name, room }));
    });
    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", () => {
      logSys("Disconnected. Rejoin by refreshing or using the same name.");
    });
  }

  function onMessage(ev) {
    let msg = null;
    try { msg = JSON.parse(ev.data); } catch(e) { return; }

    switch (msg.type) {
      case "joined":
        myId = msg.id;
        isAdmin = !!msg.isAdmin;
        if (isAdmin) startBtn.classList.remove("hidden");
        logSys(msg.rejoin ? "Reconnected." : `Joined ${msg.room}`);
        break;

      case "system":
        logSys(msg.message || "");
        break;

      case "state":
        renderPlayers(msg.players, msg.drawerId);
        if (msg.round) {
          if (msg.round.word) {
            drawer = true;
            statusEl.textContent = `You're drawing: "${msg.round.word}"`;
            wordMaskEl.textContent = "";
          } else {
            drawer = (msg.drawerId === myId);
            if (!drawer) statusEl.textContent = "Guess the word!";
            wordMaskEl.textContent = msg.round.maskedWord || "";
          }
          roundEndAt = msg.round.endAt || 0;
        }
        canvas.style.cursor = drawer ? (tool==="bucket" ? "cell" : "crosshair") : "not-allowed";
        updateControls();
        updateControls();
        break;

      case "chat":
        log(`${msg.from}`, msg.text);
        break;

      case "round":
        if (!msg.started) {
          timerEl.textContent = "";
          wordMaskEl.textContent = "";
          drawer = false;
          canvas.style.cursor = "not-allowed";
          break;
        }
        roundEndAt = msg.endAt || 0;
        wordMaskEl.textContent = msg.maskedWord || "";
        statusEl.textContent = drawer ? statusEl.textContent : "Guess the word!";
        break;

      case "wordChoices":
        showWordChoices(msg.choices || []);
        break;

      case "drawer":
        drawer = !!msg.value;
        canvas.style.cursor = drawer ? (tool==="bucket" ? "cell" : "crosshair") : "not-allowed";
        updateControls();
        break;

      case "strokePath":
        drawPath(msg.points || [], msg.size, msg.color);
        break;

      case "stroke":
        drawSegment(msg.x0, msg.y0, msg.x1, msg.y1, msg.size, msg.color);
        break;

      case "fill":
        applyFill(msg.x, msg.y, msg.color, msg.tol || 24);
        break;

      case "clear":
        clearCanvas();
        break;

      case "canvasSync":
        clearCanvas();
        for (const op of msg.ops) {
          if (op.type === "clear") clearCanvas();
          else if (op.type === "strokePath") drawPath(op.points || [], op.size, op.color);
          else if (op.type === "stroke") drawSegment(op.x0, op.y0, op.x1, op.y1, op.size, op.color);
          else if (op.type === "fill") applyFill(op.x, op.y, op.color, op.tol || 24);
        }
        break;

      case "pong":
        break;
    }
  }

  // UI helpers
  function renderPlayers(players, drawerId) {
    playersBox.innerHTML = "";
    for (const p of players) {
      const div = document.createElement("div");
      div.className = "player";
      const left = document.createElement("span");
      left.textContent = p.name + (p.id === drawerId ? " ✏️" : "") + (p.online ? "" : " (offline)");
      const right = document.createElement("span");
      right.textContent = `${p.score} ${p.guessed ? "✅" : ""}`;
      if (p.guessed) right.classList.add("guessed");
      div.appendChild(left);
      div.appendChild(right);
      playersBox.appendChild(div);
    }
  }

  function logSys(text) {
    const line = document.createElement("div");
    line.className = "line sys";
    line.textContent = text;
    chatBox.appendChild(line);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  function log(from, text) {
    const line = document.createElement("div");
    line.className = "line";
    line.textContent = `${from}: ${text}`;
    chatBox.appendChild(line);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Chat
  sendBtn.addEventListener("click", sendChat);
  chatText.addEventListener("keydown", (e) => { if (e.key === "Enter") sendChat(); });
  function sendChat() {
    const text = chatText.value.trim();
    if (!text || !ws) return;
    ws.send(JSON.stringify({ type: "chat", text }));
    chatText.value = "";
  }

  // Timer
  setInterval(() => {
    if (!roundEndAt) { timerEl.textContent = ""; return; }
    const ms = Math.max(0, roundEndAt - Date.now());
    const s = Math.ceil(ms / 1000);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    timerEl.textContent = `⏱️ ${mm}:${ss}`;
  }, 250);

  // Start button
  startBtn.addEventListener("click", () => { ws && ws.send(JSON.stringify({ type: "startGame" })); });

  // Tools
  function setTool(t) {
    tool = t;
    toolPenBtn.classList.toggle("active", t === "pen");
    toolBucketBtn.classList.toggle("active", t === "bucket");
    eraserBtn.classList.toggle("active", t === "eraser");
    canvas.style.cursor = drawer ? (t === "bucket" ? "cell" : "crosshair") : "not-allowed";
  }
  toolPenBtn.addEventListener("click", () => setTool("pen"));
  toolBucketBtn.addEventListener("click", () => setTool("bucket"));
  eraserBtn.addEventListener("click", () => { setTool("eraser"); strokeColor = "#FFFFFF"; colorInput.value = "#FFFFFF"; });

  colorInput.addEventListener("input", () => { strokeColor = colorInput.value; if (tool==="eraser") setTool("pen"); });
  sizeInput.addEventListener("input", () => { strokeSize = +sizeInput.value; });

  undoBtn.addEventListener("click", () => {
    if (!drawer || !ws) return;
    ws.send(JSON.stringify({ type: "undo" }));
  });

  clearBtn.addEventListener("click", () => {
    if (!drawer || !ws) return;
    clearCanvas();
    ws.send(JSON.stringify({ type: "clear" }));
  });

  function canvasPoint(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    return { x: Math.floor(x), y: Math.floor(y) };
  }

  function dist2(a,b){ const dx=a.x-b.x, dy=a.y-b.y; return dx*dx+dy*dy; }

  function drawPath(points, size, color) {
    if (!Array.isArray(points) || points.length < 2) return;
    for (let i = 1; i < points.length; i++) {
      const a = points[i-1], b = points[i];
      drawSegment(a.x, a.y, b.x, b.y, size, color);
    }
  }

  function drawSegment(x0, y0, x1, y1, size, color) {
    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  clearCanvas();

  // Bucket fill (flood fill with tolerance)
  function applyFill(x, y, color, tol) {
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = img.data;
    const w = img.width, h = img.height;
    const idx = (y * w + x) * 4;
    const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
    const fill = hexToRgba(color);

    if (colorsEqual(target, fill)) return;

    const stack = [[x, y]];
    const visited = new Uint8Array(w * h);

    while (stack.length) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= w || cy >= h) continue;
      const i = (cy * w + cx) * 4;
      if (visited[cy * w + cx]) continue;
      if (!withinTol(data, i, target, tol)) continue;

      // fill pixel
      data[i] = fill[0]; data[i+1] = fill[1]; data[i+2] = fill[2]; data[i+3] = 255;
      visited[cy * w + cx] = 1;

      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }

    ctx.putImageData(img, 0, 0);
  }

  
function colorsEqual(a, b) {
  // Compare RGB only; ignore alpha
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}
  function withinTol(data, i, target, tol) {
    const dr = data[i] - target[0];
    const dg = data[i+1] - target[1];
    const db = data[i+2] - target[2];
    return (dr*dr + dg*dg + db*db) <= (tol*tol);
  }

  function hexToRgba(hex) {
    const s = hex.replace("#","");
    const bigint = parseInt(s.length===3 ? s.split("").map(c=>c+c).join("") : s, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r,g,b,255];
  }

  // Mouse interactions
  canvas.addEventListener("mousedown", (e) => {
    if (!drawer) return;
    const pt = canvasPoint(e);
    if (tool === "bucket") {
      applyFill(pt.x, pt.y, strokeColor, 24);
      ws && ws.send(JSON.stringify({ type: "fill", x: pt.x, y: pt.y, color: strokeColor, tol: 24 }));
      return;
    }
    drawing = true;
    currentStrokePoints = [pt];
    last = pt; // kept for compatibility; preview uses currentStrokePoints
  });
  canvas.addEventListener("mousemove", (e) => {
    if (!drawer || !drawing) return;
    const pt = canvasPoint(e);
    const color = (tool === "eraser") ? "#FFFFFF" : strokeColor;
    const prev = currentStrokePoints[currentStrokePoints.length - 1];
    if (dist2(prev, pt) < 0.5) return; // ignore micro-moves
    drawSegment(prev.x, prev.y, pt.x, pt.y, strokeSize, color);
    currentStrokePoints.push(pt);
  });
  window.addEventListener("mouseup", () => {
    if (drawing && ws && currentStrokePoints && currentStrokePoints.length > 1) {
      const color = (tool === "eraser") ? "#FFFFFF" : strokeColor;
      ws.send(JSON.stringify({ type: "strokePath", points: currentStrokePoints, size: strokeSize, color }));
    }
    drawing = false; currentStrokePoints = []; last = null;
  });
  window.addEventListener("keydown", (e) => {
    const z = e.key === "z" || e.key === "Z";
    if ((e.ctrlKey || e.metaKey) && z) {
      if (drawer && ws) ws.send(JSON.stringify({ type: "undo" }));
    }
  });

  // Word choices UI
  function showWordChoices(choices) {
    wordChoices = choices;
    choicesBox.innerHTML = "";
    const panel = document.createElement("div");
    panel.className = "panel";
    const h3 = document.createElement("h3");
    h3.textContent = "Choose a word";
    panel.appendChild(h3);
    const opts = document.createElement("div");
    opts.className = "opts";
    for (const w of choices) {
      const btn = document.createElement("button");
      btn.textContent = w;
      btn.addEventListener("click", () => {
        ws && ws.send(JSON.stringify({ type: "chooseWord", word: w }));
        choicesBox.classList.add("hidden");
        choicesBox.innerHTML = "";
      });
      opts.appendChild(btn);
    }
    panel.appendChild(opts);
    choicesBox.appendChild(panel);
    choicesBox.classList.remove("hidden");
  }

  
function updateControls() {
  const canDraw = !!drawer;
  toolPenBtn.disabled = !canDraw;
  toolBucketBtn.disabled = !canDraw;
  eraserBtn.disabled = !canDraw;
  clearBtn.disabled = !canDraw;
  undoBtn.disabled = !canDraw;
}

  // Ping
  setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
  }, 10000);
})();
