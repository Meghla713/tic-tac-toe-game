const boxs = document.querySelectorAll(".box");
const reset = document.querySelector("#resetGame");
const newGameBtn = document.querySelector("#new-btn");
const undoBtn = document.querySelector("#undoBtn");
const msgContainer = document.querySelector("#msgBox");
const msg = document.querySelector("#msg");
const detail = document.querySelector("#detail");
const badge = document.querySelector("#badge");
const turnEl = document.querySelector(".turn");
const winLine = document.querySelector("#winLine");
const winSvg = document.querySelector(".win-line");

const winPattern = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

const MARKS = {
  X: '<svg viewBox="0 0 100 100"><path d="M10 10 L90 90" pathLength="1"/><path d="M90 10 L10 90" pathLength="1"/></svg>',
  O: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" pathLength="1"/></svg>'
};

let board, current, history, over, mode = "pvp";
let timerId = null, seconds = 0, lastWinner = null, streak = 0;
let stats = { X: 0, O: 0, D: 0, rounds: 0 };

try { stats = Object.assign(stats, JSON.parse(localStorage.getItem("ttt-stats"))); } catch (e) {}

const $ = (id) => document.getElementById(id);

function saveStats() {
  try { localStorage.setItem("ttt-stats", JSON.stringify(stats)); } catch (e) {}
}

function renderStats(bumpKey) {
  $("scoreX").textContent = stats.X;
  $("scoreO").textContent = stats.O;
  $("scoreD").textContent = stats.D;
  $("rounds").textContent = stats.rounds;
  $("streak").textContent = streak ? `${lastWinner} x${streak}` : "-";
  if (bumpKey) {
    const el = $("score" + bumpKey);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
  }
}

function fmt(s) { return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; }

function startTimer() {
  clearInterval(timerId);
  timerId = setInterval(() => { seconds++; $("timer").textContent = fmt(seconds); }, 1000);
}

function setTurn() {
  turnEl.dataset.turn = current;
  turnEl.classList.toggle("over", over);
}

function renderHistory() {
  const list = $("history");
  if (!history.length) {
    list.innerHTML = '<li class="empty">No moves yet. Pick a cell to start.</li>';
  } else {
    list.innerHTML = history.map((m, i) => {
      const r = Math.floor(m.i / 3) + 1, c = (m.i % 3) + 1;
      return `<li><span class="dot ${m.p}"></span>${i + 1}. ${m.p} played<span class="pos">row ${r}, col ${c}</span></li>`;
    }).join("");
    list.scrollTop = list.scrollHeight;
  }
  $("moves").textContent = history.length;
  undoBtn.disabled = !history.length || over;
}

function place(i, p) {
  const box = boxs[i];
  board[i] = p;
  box.innerHTML = MARKS[p];
  box.classList.add(p.toLowerCase());
  box.disabled = true;
  box.setAttribute("aria-label", `Cell ${i + 1}, ${p}`);
  history.push({ i, p });
}

function playerName(p) { return p === "O" && mode === "cpu" ? "Computer" : "Player " + p; }

// when the game restarts, enable all cells
const enableBoxes = () => {
  boxs.forEach((box, i) => {
    box.disabled = false;
    box.innerHTML = "";
    box.className = "box";
    box.setAttribute("aria-label", `Cell ${i + 1}`);
  });
};

// when the game is over, disable all cells
const disableBoxes = () => boxs.forEach((b) => (b.disabled = true));

function showResult(winner, pattern) {
  over = true;
  clearInterval(timerId);
  stats.rounds++;
  if (winner) {
    stats[winner]++;
    streak = lastWinner === winner ? streak + 1 : 1;
    lastWinner = winner;
  } else {
    stats.D++;
    streak = 0; lastWinner = null;
  }
  saveStats();
  renderStats(winner || "D");
  setTurn();
  disableBoxes();

  if (pattern) {
    const [a, , c] = pattern;
    const pt = (n) => [(n % 3) + 0.5, Math.floor(n / 3) + 0.5];
    const [x1, y1] = pt(a), [x2, y2] = pt(c);
    winLine.setAttribute("x1", x1); winLine.setAttribute("y1", y1);
    winLine.setAttribute("x2", x2); winLine.setAttribute("y2", y2);
    winLine.style.stroke = winner === "X" ? "var(--x)" : "var(--o)";
    winSvg.classList.add("show");
    boxs.forEach((b, i) => b.classList.add(pattern.includes(i) ? "win" : "dim"));
  }

  msg.textContent = winner ? `${playerName(winner)} wins` : "It's a draw";
  detail.textContent = winner
    ? `Won in ${history.length} moves, ${fmt(seconds)}.`
    : `Board filled after ${history.length} moves.`;
  badge.className = "badge " + (winner || "D");
  badge.textContent = winner || "=";
  renderHistory();
  setTimeout(() => msgContainer.classList.remove("hide"), pattern ? 1000 : 500);
  setTimeout(() => newGameBtn.focus(), pattern ? 1100 : 600);
}

// check the winner or a draw
const checkWinner = () => {
  for (const pattern of winPattern) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      showResult(board[a], pattern);
      return true;
    }
  }
  if (board.every(Boolean)) { showResult(null); return true; }
  return false;
};

function cpuMove() {
  const empty = board.map((v, i) => (v ? null : i)).filter((v) => v !== null);
  const find = (p) => empty.find((i) => {
    board[i] = p;
    const ok = winPattern.some(([a, b, c]) => board[a] === p && board[b] === p && board[c] === p);
    board[i] = null;
    return ok;
  });
  let pick = find("O") ?? find("X") ?? (board[4] ? undefined : 4);
  if (pick === undefined) {
    const corners = [0, 2, 6, 8].filter((i) => !board[i]);
    pick = (corners.length ? corners : empty)[Math.floor(Math.random() * (corners.length || empty.length))];
  }
  return pick;
}

function handleMove(i) {
  if (over || board[i]) return;
  if (!timerId) startTimer();
  place(i, current);
  if (!checkWinner()) {
    current = current === "X" ? "O" : "X";
    setTurn();
    renderHistory();
    if (mode === "cpu" && current === "O") {
      disableBoxes();
      setTimeout(() => {
        if (over) return;
        place(cpuMove(), "O");
        boxs.forEach((b, k) => (b.disabled = !!board[k]));
        if (!checkWinner()) { current = "X"; setTurn(); renderHistory(); }
      }, 550);
    }
  }
}

function undo() {
  if (over || !history.length) return;
  const steps = mode === "cpu" && history.length >= 2 && current === "X" ? 2 : 1;
  for (let s = 0; s < steps; s++) {
    const { i, p } = history.pop();
    board[i] = null;
    boxs[i].innerHTML = "";
    boxs[i].className = "box";
    boxs[i].disabled = false;
    boxs[i].setAttribute("aria-label", `Cell ${i + 1}`);
    current = p;
  }
  setTurn();
  renderHistory();
}

const resetGame = () => {
  board = Array(9).fill(null);
  current = "X";
  history = [];
  over = false;
  seconds = 0;
  clearInterval(timerId); timerId = null;
  $("timer").textContent = "0:00";
  enableBoxes();
  winSvg.classList.remove("show");
  msgContainer.classList.add("hide");
  setTurn();
  renderHistory();
  renderStats();
};

function setMode(m) {
  mode = m;
  document.querySelectorAll(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === m));
  const name = m === "cpu" ? "Computer" : "Player O";
  $("oName").textContent = name;
  $("oLabel").textContent = name;
  resetGame();
}

boxs.forEach((box, i) => box.addEventListener("click", () => handleMove(i)));
document.querySelectorAll(".mode").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
newGameBtn.addEventListener("click", resetGame);
reset.addEventListener("click", resetGame);
undoBtn.addEventListener("click", undo);
$("resetScores").addEventListener("click", () => {
  stats = { X: 0, O: 0, D: 0, rounds: 0 }; streak = 0; lastWinner = null;
  saveStats(); renderStats();
});
document.addEventListener("keydown", (e) => {
  if (e.key >= "1" && e.key <= "9" && msgContainer.classList.contains("hide")) handleMove(+e.key - 1);
  if (e.key.toLowerCase() === "r") resetGame();
});

resetGame();