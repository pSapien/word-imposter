/* eslint-disable no-console */
const path = require("path");
const express = require("express");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.static(path.join(__dirname, "..", "client")));
const server = app.listen(PORT, () => {
  console.log(`[skribl] http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

// room model:
// {
//   players: Map<id, player> where player={id,name,nameKey,ws,score,guessed,isAdmin,isOnline}
//   nameIndex: Map<nameKey, playerId> (unique per room)
//   drawerOrder: [playerId,...]
//   drawerIndex: number
//   round: { word, endAt, started, drawerId, choices, ops: [] }
// }
const rooms = new Map();
const WORDS = require("./words");

function nameKey(name) { return String(name||"").trim().toLowerCase(); }

function getRoom(code) {
  if (!rooms.has(code)) {
    rooms.set(code, {
      players: new Map(),
      nameIndex: new Map(),
      drawerOrder: [],
      drawerIndex: -1,
      round: { word: null, endAt: 0, started: false, drawerId: null, choices: null, ops: [] }
    });
  }
  return rooms.get(code);
}

function broadcast(room, payload, exceptId = null) {
  for (const p of room.players.values()) {
    if (exceptId && p.id === exceptId) continue;
    if (p.ws && p.ws.readyState === 1) {
      p.ws.send(JSON.stringify(payload));
    }
  }
}

function safeName(name) {
  const n = String(name || "").trim();
  return n.slice(0, 18) || "Player";
}

function maskWord(word) {
  if (!word) return "";
  return word.replace(/[A-Za-z0-9]/g, "_");
}

function chooseThreeWords() {
  const picks = new Set();
  while (picks.size < 3) {
    picks.add(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return [...picks];
}

function ensureDrawerOrder(room) {
  room.drawerOrder = room.drawerOrder.filter(id => room.players.has(id));
  for (const id of room.players.keys()) {
    if (!room.drawerOrder.includes(id)) room.drawerOrder.push(id);
  }
  if (room.drawerIndex >= room.drawerOrder.length) room.drawerIndex = -1;
}

function nextDrawer(room) {
  if (room.drawerOrder.length === 0) return null;
  room.drawerIndex = (room.drawerIndex + 1) % room.drawerOrder.length;
  const id = room.drawerOrder[room.drawerIndex];
  return room.players.get(id) || null;
}

function currentDrawer(room) {
  if (room.drawerIndex < 0) return null;
  const id = room.drawerOrder[room.drawerIndex];
  return room.players.get(id) || null;
}

function roomState(room, requesterId = null) {
  const drawer = currentDrawer(room);
  const forDrawer = requesterId && drawer && requesterId === drawer.id;
  return {
    type: "state",
    players: [...room.players.values()].map(p => ({
      id: p.id, name: p.name, score: p.score, guessed: !!p.guessed, online: !!p.isOnline
    })),
    drawerId: drawer ? drawer.id : null,
    round: {
      started: room.round.started,
      word: forDrawer ? room.round.word : null,
      maskedWord: room.round.started ? maskWord(room.round.word) : "",
      endAt: room.round.endAt
    }
  };
}

function startRound(room) {
  ensureDrawerOrder(room);
  const drawer = nextDrawer(room);
  if (!drawer) return;
  // reset guesses
  for (const p of room.players.values()) p.guessed = false;
  // reset round
  room.round = { word: null, endAt: 0, started: false, drawerId: drawer.id, choices: chooseThreeWords(), ops: [] };

  // notify
  broadcast(room, { type: "system", message: `${drawer.name} is choosing a word…` });
  broadcast(room, roomState(room));

  // send choices to drawer (and only drawer)
  if (drawer.ws && drawer.ws.readyState === 1) {
    drawer.ws.send(JSON.stringify({ type: "wordChoices", choices: room.round.choices }));
  }
}

function beginDrawingPhase(room, word) {
  const ROUND_SECONDS = 90;
  room.round.word = word;
  room.round.started = true;
  room.round.endAt = Date.now() + ROUND_SECONDS * 1000;
  room.round.choices = null;
  // new turn: clear canvas for everyone & ops
  room.round.ops = [{ type: "clear" }];
  broadcast(room, { type: "clear" });
  const drawer = currentDrawer(room);
  if (drawer) drawer.ws?.send(JSON.stringify({ type: "drawer", value: true }));
  broadcast(room, { type: "round", started: true, endAt: room.round.endAt, maskedWord: maskWord(word) });
  broadcast(room, roomState(room));
}

function endRound(room, reason = "Time up!") {
  const word = room.round.word;
  room.round.started = false;
  broadcast(room, { type: "system", message: `Round over! The word was: "${word || "?"}" (${reason})` });
  broadcast(room, { type: "round", started: false });
  const dr = currentDrawer(room);
  if (dr) dr.ws?.send(JSON.stringify({ type: "drawer", value: false }));
  broadcast(room, roomState(room));
  setTimeout(() => {
    if (room.players.size >= 2) startRound(room);
  }, 1500);
}


function removeLastOp(room) {
  const ops = room.round.ops || [];
  if (ops.length === 0) return false;
  if (ops.length === 1 && ops[0].type === "clear") return false; // keep initial clear

  const last = ops[ops.length - 1];
  if (last.type === "strokePath") {
    ops.pop();
    return true;
  }
  if (last.type === "stroke" && last.strokeId) {
    const sid = last.strokeId;
    while (ops.length > 0) {
      const top = ops[ops.length - 1];
      if (top.type === "stroke" && top.strokeId === sid) ops.pop();
      else break;
    }
    return true;
  }
  ops.pop();
  return true;
}
function scoreForGuess(room) {
  const remain = Math.max(0, room.round.endAt - Date.now());
  const pct = Math.min(1, remain / 90000);
  return Math.max(20, Math.round(20 + 80 * pct));
}

wss.on("connection", (ws) => {
  let room = null;
  let player = null;

  ws.on("message", (buf) => {
    let msg = null;
    try { msg = JSON.parse(buf.toString()); } catch(e) { return; }

    if (msg.type === "join") {
      const code = String(msg.room || "").trim().toUpperCase() || "LOBBY";
      const nm = safeName(msg.name);
      const nk = nameKey(nm);
      room = getRoom(code);

      // Reconnect by username if present
      const existingId = room.nameIndex.get(nk);
      if (existingId && room.players.has(existingId)) {
        player = room.players.get(existingId);
        try {
          if (player.ws && player.ws !== ws && player.ws.readyState === 1) {
            player.ws.close(4000, "Replaced by reconnect");
          }
        } catch {}
        player.ws = ws;
        player.isOnline = true;
        ws.send(JSON.stringify({ type: "joined", id: player.id, room: code, isAdmin: player.isAdmin, rejoin: true }));
        broadcast(room, { type: "system", message: `${player.name} reconnected` }, player.id);
      } else {
        // New player
        const id = uuidv4();
        player = { id, name: nm, nameKey: nk, ws, roomCode: code, score: 0, guessed: false, isAdmin: room.players.size === 0, isOnline: true };
        room.players.set(id, player);
        room.nameIndex.set(nk, id);
        ensureDrawerOrder(room);
        ws.send(JSON.stringify({ type: "joined", id, room: code, isAdmin: player.isAdmin, rejoin: false }));
        broadcast(room, { type: "system", message: `${player.name} joined ${code}` }, player.id);
      }

      // Send full state to requester
      ws.send(JSON.stringify(roomState(room, player.id)));
      // Send canvas ops to sync
      if (room.round.ops && room.round.ops.length) {
        ws.send(JSON.stringify({ type: "canvasSync", ops: room.round.ops }));
      }
      // If player is the drawer:
      const drawer = currentDrawer(room);
      if (drawer && drawer.id === player.id) {
        if (!room.round.started && room.round.choices) {
          ws.send(JSON.stringify({ type: "wordChoices", choices: room.round.choices }));
        } else if (room.round.started) {
          ws.send(JSON.stringify({ type: "drawer", value: true }));
        }
      }
      // Update everyone
      broadcast(room, roomState(room));
      return;
    }

    if (!room || !player) return;

    switch (msg.type) {
      case "chat": {
        const text = String(msg.text || "").slice(0, 200);
        if (!text) break;
        const drawer = currentDrawer(room);
        const isDrawer = drawer && drawer.id === player.id;
        if (room.round.started && !isDrawer && !player.guessed) {
          if (room.round.word && text.toLowerCase().trim() === room.round.word.toLowerCase().trim()) {
            player.guessed = true;
            const pts = scoreForGuess(room);
            player.score += pts;
            if (drawer) drawer.score += Math.round(pts * 0.3);
            broadcast(room, { type: "system", message: `${player.name} guessed the word! (+${pts})` });
            broadcast(room, roomState(room));
            // Check if all guessers have guessed
            const guessers = [...room.players.values()].filter(p => drawer && p.id !== drawer.id);
            const allGuessed = guessers.length > 0 && guessers.every(p => p.guessed);
            if (allGuessed) endRound(room, "Everyone guessed!");
            break;
          }
        }
        broadcast(room, { type: "chat", from: player.name, text });
        break;
      }

      case "startGame": {
        if (player.isAdmin && room.players.size >= 2) {
          if (!room.round.started && !room.round.choices) startRound(room);
          else ws.send(JSON.stringify({ type: "system", message: "Round already in progress or choosing." }));
        } else {
          ws.send(JSON.stringify({ type: "system", message: "Need 2+ players; only admin can start." }));
        }
        break;
      }

      case "chooseWord": {
        const drawer = currentDrawer(room);
        if (!drawer || drawer.id !== player.id) break;
        const word = String(msg.word || "").toLowerCase();
        if (!word) break;
        if (!room.round.choices || !room.round.choices.includes(word)) break;
        if (room.round.started) break;
        beginDrawingPhase(room, word);
        break;
      }

      case "strokePath": {
        const drawer = currentDrawer(room);
        if (!drawer || drawer.id !== player.id) break;
        if (!room.round.started) break;
        const pts = Array.isArray(msg.points) ? msg.points : [];
        if (pts.length < 2) break;
        const op = {
          type: "strokePath",
          points: pts.map(p => ({ x: Math.floor(+p.x||0), y: Math.floor(+p.y||0) })),
          size: Math.max(1, Math.min(50, +msg.size || 3)),
          color: String(msg.color || "#000000")
        };
        room.round.ops.push(op);
        broadcast(room, op, player.id);
        break;
      }

      case "stroke": {
        const drawer = currentDrawer(room);
        if (!drawer || drawer.id !== player.id) break;
        if (!room.round.started) break;
        const seg = {
          type: "stroke",
          strokeId: String(msg.strokeId || ""),
          x0: +msg.x0, y0: +msg.y0, x1: +msg.x1, y1: +msg.y1,
          size: Math.max(1, Math.min(50, +msg.size || 3)),
          color: String(msg.color || "#000000")
        };
        room.round.ops.push(seg);
        for (const p of room.players.values()) {
          if (p.id === player.id) continue;
          if (p.ws?.readyState === 1) p.ws.send(JSON.stringify(seg));
        }
        break;
      }

      case "fill": {
        const drawer = currentDrawer(room);
        if (!drawer || drawer.id !== player.id) break;
        if (!room.round.started) break;
        const op = {
          type: "fill",
          x: +msg.x, y: +msg.y,
          color: String(msg.color || "#000000"),
          tol: Math.max(0, Math.min(128, +msg.tol || 24))
        };
        room.round.ops.push(op);
        for (const p of room.players.values()) {
          if (p.id === player.id) continue;
          if (p.ws?.readyState === 1) p.ws.send(JSON.stringify(op));
        }
        break;
      }

      case "undo": {
        const drawer = currentDrawer(room);
        if (!drawer || drawer.id !== player.id) break;
        if (!room.round.started) break;
        if (removeLastOp(room)) {
          // Re-sync entire canvas to all
          broadcast(room, { type: "canvasSync", ops: room.round.ops });
        }
        break;
      }

      case "clear": {
        const drawer = currentDrawer(room);
        if (!drawer || drawer.id !== player.id) break;
        room.round.ops.push({ type: "clear" });
        broadcast(room, { type: "clear" });
        break;
      }

      case "ping":
        ws.send(JSON.stringify({ type: "pong", t: Date.now() }));
        break;
    }
  });

  ws.on("close", () => {
    if (!room || !player) return;
    player.isOnline = false;
    // No immediate removal; keep for reconnection by username
    // If drawer disconnected mid-round, we let timer end, or next guess end the round.
    broadcast(room, roomState(room));
  });
});

// Timer for rounds
setInterval(() => {
  for (const room of rooms.values()) {
    if (room.round.started && Date.now() >= room.round.endAt) {
      endRound(room, "Time up!");
    }
  }
}, 1000);
