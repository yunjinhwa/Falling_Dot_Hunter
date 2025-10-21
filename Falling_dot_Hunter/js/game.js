const gamefild = document.getElementById("gameCanvas");
const ctx = gamefild.getContext("2d");
const scoreUI = document.querySelector("#score");
const stagePage = document.querySelector("#stageSelect");
const gamePage = document.querySelector("#game");
const target_score_UI = document.querySelector("#GoalPoint");

const KEY = 'falling_dot_Hunter';
let unlockStage = 1;
let stages = [
  {stageNumber: 1, diff: 1, minSize: 20, maxSize: 40, minSpeed: 1.3, maxSpeed: 2.2, target: 1},
  {stageNumber: 2, diff: 2, minSize: 15, maxSize: 35, minSpeed: 1.5, maxSpeed: 2.5, target: 1},
  {stageNumber: 3, diff: 2, minSize: 10, maxSize: 30, minSpeed: 1.3, maxSpeed: 2.2, target: 1},
  {stageNumber: 4, diff: 3, minSize: 10, maxSize: 30, minSpeed: 1.5, maxSpeed: 2.5, target: 2}
];
let stage = null;
let currentStage = null;
let animId = null;           // 루프 ID 저장
let ballcount = 2;
let balls = [];
let score = 0;
let target_score = 0;
let base_target_score = 30;

function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// (선택) 이미 깬 스테이지인지 표기하려면 사용
function isCleared(stageNumber) {
  return stageNumber < unlockStage;
}

function isUnlocked(stageNumber) {
  return stageNumber <= unlockStage;
}

function loadProgress() {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    const n = parseInt(saved, 10);
    if (!Number.isNaN(n) && n >= 1) unlockStage = n;
  }
}

function saveProgress() {
  localStorage.setItem(KEY, String(unlockStage));
}

loadProgress();
renderStageButtons();

gamePage.style.display = "none";
stagePage.style.display = "block";

function renderStageButtons() {
  const grid = document.getElementById("stageGrid") || stagePage; // 새 그리드 또는 기존 컨테이너
  grid.innerHTML = ""; // ← 이 줄 추가 (중복 생성 방지)

  stages.forEach(element => {
    const card = document.createElement("div");
    card.className = "stage-card";

    const h = document.createElement("div");
    h.className = "stage-title";
    h.textContent = `스테이지 ${element.stageNumber}`;

    const sub = document.createElement("div");
    sub.className = "stage-sub";
    sub.textContent = `난이도: ${element.diff}`;

    const btn = document.createElement("button");
    btn.className = "stage-btn";
    btn.textContent = isUnlocked(element.stageNumber) ? "도전하기" : "잠김";

    if (isUnlocked(element.stageNumber)) {
      btn.classList.add(isCleared(element.stageNumber) ? "cleared" : "unlocked");
      btn.disabled = false;
      btn.addEventListener("click", () => startGame(element));
    } else {
      btn.classList.add("locked");
      btn.disabled = true;
      btn.title = "이전 스테이지를 클리어하면 해금됩니다";
    }

    card.appendChild(h);
    card.appendChild(sub);
    card.appendChild(btn);
    grid.appendChild(card);
  });
}

// (B) 상단 툴바 버튼 연동
document.getElementById("goStage")?.addEventListener("click", () => {
  // 게임 화면 → 스테이지 화면으로
  gamePage.style.display = "none";
  stagePage.style.display = "block";
});

document.getElementById("resetProgress")?.addEventListener("click", () => {
  if (confirm("진행도를 초기화할까요?")) {
    unlockStage = 1;
    saveProgress();
    renderStageButtons();
  }
});

function startGame(stage) {
  stagePage.style.display = "none";
  gamePage.style.display = "block";

  currentStage = stage;

  score = 0;
  const range = base_target_score * stage.target;
  target_score = random(-range, range);
  target_score_UI.textContent = target_score;
  scoreUI.textContent = score;
  
  balls = [];
  random_ball();

  // 기존 루프가 있으면 정지 후 시작
  if (animId) cancelAnimationFrame(animId);
  animId = requestAnimationFrame(update);
}

// 공 객체 생성
function ball() {
  const selectStage = currentStage;
  if(!selectStage) {
    throw new Error("currentStage is Null");
  }

    let b_type, b_color;
    let ball_type = random(1,100);
    if (ball_type <= 16) {
        b_type = -5;
        b_color = "red";
    }
    else if(ball_type <= 52) {
        b_type = -1;
        b_color = "#F15B5B";
    }
    else if(ball_type <= 86) {
        b_type = 1;
        b_color = "#6495ED";
    }
    else if(ball_type <= 98){
        b_type = 5;
        b_color = "blue";
    }
    else {
      b_type = 10;
      b_color = '#FFD700';
    }
    return {
        type: b_type,
        x: Math.random() * gamefild.width,
        y: 0,
        radius: random(selectStage.minSize,selectStage.maxSize),
        xSpeed: 0,
        ySpeed: random(selectStage.minSpeed,selectStage.maxSpeed),
        color: b_color
    }
}

function random_ball() {
    for (let i = 0; i < ballcount; i++) {
        balls.push(ball());
    }
}

// 공 업데이트 함수
function update() {
  // 완전 지우기 (트레일 원하면 clearRect 대신 반투명 fillRect)
  ctx.clearRect(0, 0, gamefild.width, gamefild.height);

  // 역순으로 업데이트 & 제거
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];

    // 이동
    b.x += b.xSpeed;
    b.y += b.ySpeed;

    // 화면 아래로 완전히 벗어나면 제거
    if (b.y - b.radius > gamefild.height) {
      balls.splice(i, 1);     // ← 특정 인덱스 제거
      continue;
    }

    // 그리기
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
    ctx.closePath();
  }

  // 부족한 수만큼 즉시 보충
  while (balls.length < ballcount) balls.push(ball());

  // 점수 표시(옵션)
  scoreUI.textContent = score;

  if(score == target_score) {
    alert('게임이 클리어되었습니다.')
    gameEnd();
    return;
  }

  animId = requestAnimationFrame(update); // ID 저장
}

gamefild.addEventListener("pointerdown", (evt) => {
  const p = getCanvasPos(evt);

  // 겹칠 수 있으니 역순으로(마지막 그린 공이 위)
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    const dx = p.x - b.x;
    const dy = p.y - b.y;
    if (dx*dx + dy*dy <= b.radius * b.radius) {
      removeBallAtIndex(i);
      break; // 한 개만 제거
    }
  }
});

// 공 제거 유틸 (인덱스로 정확히 제거)
function removeBallAtIndex(i) {
    const b = balls[i];
    if(b.type == 5) {
        score += 5;
    }
    else if(b.type == 1) {
        score += 1
    }
    else if(b.type == -1) {
        score -= 1;
    }
    else if(b.type == -5) {
        score -= 5;
    }
    else if(b.type == 10) {
      score += 10;
    }
    balls.splice(i, 1);
}

// 캔버스 좌표 변환 (CSS 스케일/레티나 대응)
function getCanvasPos(evt) {
  const rect = gamefild.getBoundingClientRect();
  const scaleX = gamefild.width / rect.width;
  const scaleY = gamefild.height / rect.height;

  // Pointer 이벤트 공통 (마우스/터치)
  const x = (evt.clientX - rect.left) * scaleX;
  const y = (evt.clientY - rect.top) * scaleY;
  return { x, y };
}

function gameEnd() {
  if (animId) {
    cancelAnimationFrame(animId); // 함수가 아니라 ID로 취소
    animId = null;
  }

  gamePage.style.display = "none";
  stagePage.style.display = "block";

  // 현재가 마지막이 아니고, 다음 스테이지가 잠겨 있었다면 해금
  // if (currentStage && currentStage.stageNumber >= unlockStage && currentStage.stageNumber < stages.length) {
  //   unlockStage = currentStage.stageNumber + 1;
  //   saveProgress();
  // }

  if (currentStage) {
    const next = currentStage.stageNumber + 1; // 마지막(4) → 5
    if (next > unlockStage) {
      unlockStage = next;
      saveProgress();
    }
  }

  balls = [];
  currentStage = null;

  renderStageButtons();    // 버튼 상태 갱신
}