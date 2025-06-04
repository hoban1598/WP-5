// ======= 캔버스 게임 글로벌 변수 선언 =======
let canvas, ctx;
let ball, paddle;
let bricks = [];
let currentStage = 1;
let lives = 3;
let score = 0;
let animationId;
let selectedQuizLabels = [];
let isGamePaused = false;
let currentQuiz = null;
let timeLimit = 0;
let remainingTime = 0;
let timerInterval = null;
const STAGE_TIME_LIMITS = { 1: 600, 2: 420, 3: 300 };
const QUIZ_LABELS_BY_STAGE = { 1: ['HTML', 'CSS'], 2: ['JS'], 3: ['jQuery'] };
const STAGE_TO_CATEGORY = { 1: ['html', 'css'], 2: ['javascript'], 3: ['jquery'] };

// ======= 퀴즈 출제 관리 변수 추가 =======
let usedQuizzes = {
  html: [],
  css: [],
  javascript: [],
  jquery: []
};

// ======= 엔딩 상태 변수 전역 선언 =======
let endingMessageIndex = 0;
let dragonPhase = false;
const beforeDragonMessages = [
  "마왕: …후후, 결국 여기까지 왔구나.",
  "마왕: 네가 모은 HTML, CSS, JS, jQuery… 그 모든 스킬은 내 시험을 무너뜨리기엔 부족하다!",
  "주인공: 이 목소리… 설마…",
  "마왕: 그래. 내가 바로 네 교수이자… 이 세계의 마왕이다.",
  "주인공: 그럴 줄 알았어요. 수업마다 숨겨진 의도가 있었군요.",
  "마왕: 네가 배운 모든 건 사실… 기말고사를 강화하기 위한 장치였지.",
  "주인공: 하지만 전부 익혔어요. 태그, 스타일, 로직, 이벤트… 이젠 저만의 웹이 있어요.",
  "마왕: 하찮은 실습 몇 번으론 날 이길 수 없다!",
  "주인공: 그 실습들이 지금의 저를 만들었어요. 자, 마지막 도전… 웹의 힘으로 끝내드릴게요.",
  "주인공: 용, 준비됐지?"
];
const afterDragonMessages = [
   "마왕: 그래, 그렇게 하자. 이제 너의 웹 실력을 테스트해보자.",
  "주인공: 네, 교수님. 저는 준비됐어요. 언제든지 들어오시죠",
  "마왕: 으갸악....100점이라니?!",
  "주인공: 훗....기말고사도 별거 없군요. 이제 모든 수업은 끝났어요. 작별입니다, 교수님.",
  "…그리고 웹의 전설은 그렇게 막을 내렸다."
];

// ======= 전역 BGM 오디오 객체 단일화 =======
window.globalBgmAudio = null;

// ======= BGM 파일명 상수화 =======
const BGM_BOSS = 'sound/배경음악/마왕조우.mp3';
const BGM_ENDING1 = 'sound/배경음악/엔딩1.mp3';
const BGM_ENDING2 = 'sound/배경음악/엔딩2.mp3';

// ======= BGM 재생 함수 =======
function playBgm(src, loop = false) {
  // 기존 BGM 완전 정지 및 해제
  if (window.globalBgmAudio) {
    try {
      window.globalBgmAudio.pause();
      window.globalBgmAudio.currentTime = 0;
    } catch (e) {
      // 에러 무시
    }
    window.globalBgmAudio = null;
  }
  
  // 새로운 BGM 재생 시도
  try {
    window.globalBgmAudio = new Audio(src);
    window.globalBgmAudio.loop = loop;
    window.globalBgmAudio.volume = 0;
    
    // 재생 시도 (실패해도 조용히 넘어감)
    window.globalBgmAudio.play().catch(() => {
      // BGM 재생 실패 시 조용히 넘어감
    });
    
  } catch (error) {
    // 오디오 객체 생성 실패 시 조용히 넘어감
  }
}

function playSelectedBGM() {
  const bgmSrc = getSelectedBGM();
  if (!bgmSrc) return;
  playBgm(bgmSrc, true);
}

function playEndingSound() {
  playBgm('sound/배경음악/엔딩1.mp3', false);
}
function playCreditSound() {
  playBgm('sound/배경음악/엔딩2.mp3', false); // 엔딩크레딧.mp3 대신 엔딩2.mp3 사용
}

// ======= 전역 함수 선언 =======
/** 퀴즈 모달을 닫고 게임을 재개 */
function closeQuiz() {
  $('#quizModal').fadeOut(300, function () {
    resumeGame();
  });
}
/** HUD에 장비 획득 현황을 표시 */
function updateEquipmentDisplay() {
  const equipmentCount = currentStage - 1;
  $('.hud-box.equipment .hud-label').text(`장비 : ${equipmentCount}/3`);
}
/** 설정화면에서 선택된 스테이지 번호 반환 */
function getSelectedStage() {
  const selectedStage = $('.stage-button.selected').data('stage');
  return selectedStage || 1;
}
/** 선택된 캐릭터 이미지 경로 반환 */
function getSelectedCharacterImage() {
  const selectedCharacter = $('.character-card.selected img').attr('src');
  return selectedCharacter || 'img/male.png';
}
/** 선택된 펫 이미지 경로 반환 */
function getSelectedPetImage() {
  const selectedPet = $('.pet-option.selected img').attr('src');
  return selectedPet || 'img/blue.png';
}
/** 선택된 배경음악 경로 반환 */
function getSelectedBGM() {
  const selectedBGM = $('.bgm-option.selected').data('bgm');
  return selectedBGM;
}
/** 사운드 파일 재생 */
function playSound(soundFile) {
  if (!soundFile) return;
  try {
    const audio = new Audio(soundFile);
    audio.volume = 0.3;
    audio.play().catch(() => {
      // 사운드 재생 실패 시 조용히 넘어감
    });
  } catch (error) {
    // 오디오 객체 생성 실패 시 조용히 넘어감
  }
}
/** 벽돌 히트 사운드(임시) */
function playBrickHitSound() {
  playSound('sound/효과음/일반벽돌깨지는소리.wav');
}
/** 퀴즈 정답 사운드(임시) */
function playQuizCorrectSound() {
  playSound('sound/효과음/퀴즈정답-수정.wav');
}
/** 퀴즈 오답 사운드(임시) */
function playQuizWrongSound() {
  playSound('sound/효과음/퀴즈오답.wav');
}
/** 퀴즈 벽돌 깨지는 사운드 */
function playQuizBrickHitSound() {
  playSound('sound/효과음/퀴즈벽돌깨지는소리.wav');
}
/** 장비 획득 사운드 */
function playItemGetSound() {
  playSound('sound/효과음/장비획득1.wav');
}
/** 생명 잃는 사운드 */
function playLifeLossSound() {
  playSound('sound/효과음/목숨 잃었을때.wav');
}
/** 게임 실패 사운드 */
function playGameOverSound() {
  playSound('sound/효과음/게임실패1.wav');
}
/** 공 튕기는 사운드 */
function playBallBounceSound() {
  playSound('sound/효과음/공튕기는소리.wav');
}
/** UI 클릭 사운드 */
function playClickSound() {
  playSound('sound/효과음/클릭_사용자클릭.wav');
}
/** UI 설정 버튼 클릭 사운드 */
function playSettingClickSound() {
  playSound('sound/효과음/클릭_설정버튼.wav');
}
/** 마왕 조우 사운드 재생 */
function playBossSound() { playSound('sound/배경음악/마왕조우.mp3'); }
/** 현재 스테이지의 퀴즈 라벨 랜덤 반환 */
function getQuizLabelForStage() {
  return selectedQuizLabels[Math.floor(Math.random() * selectedQuizLabels.length)];
}
/** 캔버스 크기 고정 */
function resizeCanvas() {
  canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  canvas.width = 720;
  canvas.height = 580;
}
/** 게임(캔버스) 상태 초기화 및 시작 */
function initCanvasGame() {
  selectedQuizLabels = QUIZ_LABELS_BY_STAGE[currentStage] || ['???'];
  timeLimit = STAGE_TIME_LIMITS[currentStage];
  remainingTime = timeLimit;
  const initialMinutes = Math.floor(timeLimit / 60);
  const initialSeconds = timeLimit % 60;
  $('.hud-box.time .time-text').text(`${initialMinutes}:${initialSeconds.toString().padStart(2, '0')}`);
  updateEquipmentDisplay();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  $('#stage-label').text(`Stage${currentStage}`);
  bricks = [];
  let quizData = [];
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  updateLivesDisplay();
  ball = { x: canvas.width / 2, y: canvas.height - 100, radius: 15, dx: 3, dy: -3, image: new Image() };
  ball.image.src = getSelectedPetImage();
  paddle = { width: 156, height: 19, x: (canvas.width - 156) / 2, y: canvas.height - 64, speed: 7, movingLeft: false, movingRight: false, image: new Image() };
  paddle.image.src = getSelectedCharacterImage();
  let rowCount;
  let colCount = 7;
  if (currentStage === 1) rowCount = 3; else rowCount = 4;
  const brickWidth = 89, brickHeight = 24, brickPadding = 0, offsetTop = 50;
  const totalBrickWidth = colCount * brickWidth + (colCount - 1) * brickPadding;
  const offsetLeft = (canvas.width - totalBrickWidth) / 2;
  
  // 퀴즈 벽돌 개수 고정
  const totalBricks = colCount * rowCount;
  let quizBrickCount;
  if (currentStage === 1) {
    quizBrickCount = 6; // Stage 1: 21개 중 6개
  } else {
    quizBrickCount = 9; // Stage 2,3: 28개 중 9개
  }
  
  // 랜덤한 위치에 퀴즈 벽돌 배치를 위한 인덱스 배열 생성
  const allPositions = [];
  for (let i = 0; i < totalBricks; i++) {
    allPositions.push(i);
  }
  
  // 퀴즈 벽돌이 들어갈 위치를 랜덤하게 선택
  const quizPositions = [];
  for (let i = 0; i < quizBrickCount; i++) {
    const randomIndex = Math.floor(Math.random() * allPositions.length);
    quizPositions.push(allPositions[randomIndex]);
    allPositions.splice(randomIndex, 1); // 선택된 위치 제거
  }
  
  let brickIndex = 0;
  for (let c = 0; c < colCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < rowCount; r++) {
      const brickX = c * (brickWidth + brickPadding) + offsetLeft;
      const brickY = r * (brickHeight + brickPadding) + offsetTop;
      const isQuizBrick = quizPositions.includes(brickIndex);
      const label = getQuizLabelForStage();
      bricks[c][r] = { x: brickX, y: brickY, width: brickWidth, height: brickHeight, status: isQuizBrick ? 2 : 1, label: label };
      brickIndex++;
    }
  }
  loadQuizData();
  // 기존 mousemove 이벤트 제거 후 재등록
  if (canvas._mousemoveHandler) {
    canvas.removeEventListener('mousemove', canvas._mousemoveHandler);
  }
  canvas._mousemoveHandler = function (e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    let newX = mouseX - paddle.width / 2;
    if (newX < 0) newX = 0;
    if (newX > canvas.width - paddle.width - 0.5) newX = canvas.width - paddle.width;
    paddle.x = newX;
  };
  canvas.addEventListener('mousemove', canvas._mousemoveHandler);
  animationId = requestAnimationFrame(draw);
}
/** 퀴즈 데이터 로드(내부 데이터 사용) */
let quizData = [
  {
    "id": 1,
    "category": "html",
    "question": "HTML에서 줄바꿈을 나타내는 태그는?",
    "options": ["<br>", "<lb>", "<break>", "<newline>"],
    "correct": 0,
    "explanation": "HTML에서 <br>은 줄바꿈(line break) 태그입니다."
  },
  {
    "id": 2,
    "category": "html",
    "question": "HTML 문서의 제목을 설정하는 태그는?",
    "options": ["<header>", "<title>", "<name>", "<caption>"],
    "correct": 1,
    "explanation": "<title> 태그는 HTML 문서의 제목을 설정하며, 브라우저 탭에 표시됩니다."
  },
  {
    "id": 3,
    "category": "html",
    "question": "HTML 문서의 시작을 나타내는 선언은?",
    "options": ["<html>", "<start>", "<!DOCTYPE html>", "<head>"],
    "correct": 2,
    "explanation": "<!DOCTYPE html>은 HTML5 문서의 시작을 선언하는 태그입니다."
  },
  {
    "id": 4,
    "category": "css",
    "question": "CSS에서 텍스트 색상을 변경하는 속성은?",
    "options": ["background-color", "color", "text-color", "font-color"],
    "correct": 1,
    "explanation": "CSS에서 color 속성은 텍스트의 색상을 변경합니다."
  },
  {
    "id": 5,
    "category": "css",
    "question": "CSS에서 요소를 가운데 정렬하는 속성은?",
    "options": ["align: center", "text-align: center", "center: true", "position: center"],
    "correct": 1,
    "explanation": "text-align: center는 텍스트나 인라인 요소를 가운데 정렬합니다."
  },
  {
    "id": 6,
    "category": "css",
    "question": "CSS에서 글꼴을 지정하는 속성은?",
    "options": ["font-style", "font-family", "text-font", "font-set"],
    "correct": 1,
    "explanation": "font-family는 텍스트의 글꼴을 설정할 때 사용하는 CSS 속성입니다."
  },
  {
    "id": 7,
    "category": "javascript",
    "question": "JavaScript에서 변수를 선언하는 키워드는?",
    "options": ["variable", "var", "define", "set"],
    "correct": 1,
    "explanation": "var, let, const 등이 JavaScript에서 변수를 선언하는 키워드입니다."
  },
  {
    "id": 8,
    "category": "javascript",
    "question": "JavaScript에서 함수를 정의하는 키워드는?",
    "options": ["function", "def", "func", "method"],
    "correct": 0,
    "explanation": "function 키워드는 JavaScript에서 함수를 정의할 때 사용합니다."
  },
  {
    "id": 9,
    "category": "javascript",
    "question": "JavaScript에서 배열의 길이를 구하는 속성은?",
    "options": ["size", "length", "count", "total"],
    "correct": 1,
    "explanation": "length 속성은 JavaScript 배열의 길이를 반환합니다."
  },
  {
    "id": 10,
    "category": "javascript",
    "question": "JavaScript에서 문자열을 숫자로 변환하는 함수는?",
    "options": ["parseInt()", "toNumber()", "convert()", "number()"],
    "correct": 0,
    "explanation": "parseInt() 함수는 문자열을 정수로 변환합니다."
  },
  {
    "id": 11,
    "category": "javascript",
    "question": "JavaScript에서 요소를 선택하는 메서드는?",
    "options": ["selectElement()", "getElementById()", "getElement()", "findElement()"],
    "correct": 1,
    "explanation": "getElementById()는 특정 ID를 가진 요소를 선택하는 메서드입니다."
  },
  {
    "id": 12,
    "category": "javascript",
    "question": "JavaScript에서 콘솔에 출력하는 함수는?",
    "options": ["console.log()", "print()", "output()", "show()"],
    "correct": 0,
    "explanation": "console.log()는 디버깅을 위해 콘솔에 출력하는 함수입니다."
  },
  {
    "id": 13,
    "category": "javascript",
    "question": "JavaScript에서 조건문을 만드는 키워드는?",
    "options": ["case", "if", "check", "switch"],
    "correct": 1,
    "explanation": "if 키워드는 조건이 참일 때 특정 코드를 실행하는 조건문입니다."
  },
  {
    "id": 14,
    "category": "javascript",
    "question": "JavaScript에서 반복문을 나타내는 키워드는?",
    "options": ["for", "repeat", "loop", "iterate"],
    "correct": 0,
    "explanation": "for 키워드는 JavaScript에서 반복문을 생성할 때 사용합니다."
  },
  {
    "id": 15,
    "category": "javascript",
    "question": "JavaScript에서 브라우저에 경고창을 띄우는 함수는?",
    "options": ["warn()", "alert()", "message()", "popup()"],
    "correct": 1,
    "explanation": "alert() 함수는 사용자에게 경고창을 띄우는 함수입니다."
  },
  {
    "id": 16,
    "category": "jquery",
    "question": "jQuery에서 요소를 선택하는 기본 문법은?",
    "options": ["jQuery()", "$()", "select()", "find()"],
    "correct": 1,
    "explanation": "$()는 jQuery에서 요소를 선택하는 기본 문법입니다."
  },
  {
    "id": 17,
    "category": "jquery",
    "question": "jQuery에서 요소를 숨기는 메서드는?",
    "options": ["hide()", "invisible()", "remove()", "delete()"],
    "correct": 0,
    "explanation": "hide() 메서드는 jQuery에서 요소를 숨길 때 사용합니다."
  },
  {
    "id": 18,
    "category": "jquery",
    "question": "jQuery에서 클릭 이벤트를 처리하는 메서드는?",
    "options": ["onclick()", "click()", "tap()", "press()"],
    "correct": 1,
    "explanation": "click() 메서드는 jQuery에서 클릭 이벤트를 처리합니다."
  },
  {
    "id": 19,
    "category": "jquery",
    "question": "jQuery에서 CSS 속성을 변경하는 메서드는?",
    "options": ["style()", "css()", "property()", "attr()"],
    "correct": 1,
    "explanation": "css() 메서드는 jQuery에서 CSS 속성을 변경할 때 사용합니다."
  },
  {
    "id": 20,
    "category": "jquery",
    "question": "jQuery에서 텍스트 내용을 변경하는 메서드는?",
    "options": ["content()", "text()", "innerHTML()", "value()"],
    "correct": 1,
    "explanation": "text() 메서드는 jQuery에서 요소의 텍스트 내용을 변경합니다."
  },
  {
    "id": 21,
    "category": "jquery",
    "question": "jQuery에서 문서 로드 완료 후 실행되는 함수는?",
    "options": ["$(window).load()", "$(document).ready()", "$.load()", "$(body).start()"],
    "correct": 1,
    "explanation": "$(document).ready()는 문서가 준비되었을 때 실행되는 함수입니다."
  },
  {
    "id": 22,
    "category": "jquery",
    "question": "jQuery에서 요소를 제거하는 메서드는?",
    "options": ["delete()", "remove()", "detach()", "clear()"],
    "correct": 1,
    "explanation": "remove() 메서드는 선택한 요소와 그 하위 요소를 DOM에서 제거합니다."
  },
  {
    "id": 23,
    "category": "jquery",
    "question": "jQuery에서 AJAX 요청을 보내는 기본 메서드는?",
    "options": ["ajax()", "$.ajax()", "post()", "loadData()"],
    "correct": 1,
    "explanation": "$.ajax()는 jQuery에서 AJAX 요청을 전송할 때 사용하는 메서드입니다."
  },
  {
    "id": 24,
    "category": "jquery",
    "question": "jQuery에서 서버 응답 성공 시 콜백 함수를 지정하는 메서드는?",
    "options": ["success()", "done()", "callback()", "after()"],
    "correct": 1,
    "explanation": "done() 메서드는 AJAX 요청이 성공했을 때 실행되는 콜백 함수를 정의합니다."
  }
];

function loadQuizData() {
  console.log('퀴즈 데이터 로드 완료:', quizData.length + '개 문제');
  console.log('카테고리별 문제 수:');
  const categories = {};
  quizData.forEach(quiz => {
    categories[quiz.category] = (categories[quiz.category] || 0) + 1;
  });
  console.log(categories);
}
/** 게임 루프(프레임마다 그리기) */
function draw() {
  moveBall();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  detectCollision();
  if (!isGamePaused) {
    animationId = requestAnimationFrame(draw);
  }
}
/** 공 위치 이동 */
function moveBall() { ball.x += ball.dx; ball.y += ball.dy; }
/** 공 그리기 */
function drawBall() {
  if (ball && ball.image.complete) {
    ctx.drawImage(ball.image, ball.x - 15, ball.y - 15, 30, 30);
  } else {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = '#0095DD';
    ctx.fill();
    ctx.closePath();
  }
}
/** 패들 그리기 */
function drawPaddle() {
  if (paddle) {
    ctx.fillStyle = "#1D2930";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    if (paddle.image && paddle.image.complete) {
      const characterX = paddle.x + (paddle.width - 48) / 2;
      const characterY = paddle.y - 48;
      ctx.drawImage(paddle.image, characterX, characterY, 48, 48);
    }
  }
}
/** 벽돌 그리기 */
function drawBricks() {
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const brick = bricks[c][r];
      if (brick.status > 0) {
        const color = getBrickColor(brick.status, currentStage);
        ctx.fillStyle = color;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        ctx.strokeStyle = "#222";
        ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);
        if (brick.status === 2 && brick.label) {
          ctx.fillStyle = 'white';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            brick.label,
            brick.x + brick.width / 2,
            brick.y + brick.height / 2 + 4
          );
        }
      }
    }
  }
}
/** 벽돌 색상 반환 */
function getBrickColor(status, stage) {
  if (status === 2) {
    if (stage === 1) return "#FBBF24";
    if (stage === 2) return "#60A5FA";
    return "#A52B2B";
  }
  return "#84C669";
}
/** 충돌 감지 및 처리 */
function detectCollision() {
  const leftWall = 0;
  const rightWall = canvas.width;
  const ballNextX = ball.x + ball.dx;
  
  // 좌우 벽 충돌
  if (ballNextX - 15 < leftWall || ballNextX + 15 > rightWall) {
    ball.dx = -ball.dx;
    playBallBounceSound();
  }
  
  // 천장 충돌
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
    playBallBounceSound();
  }
  
  // 바닥 충돌 - 패들 충돌보다 먼저 확인
  if (ball.y + ball.dy > canvas.height - ball.radius) {
    decreaseLife();
    resetBallAndPaddle();
    return; // 바닥에 닿으면 즉시 리턴하여 다른 충돌 처리 방지
  }
  
  // 패들 충돌 - 더 안전한 충돌 감지
  if (
    ball.dy > 0 && // 공이 아래로 움직일 때만
    ball.x >= paddle.x - ball.radius && // 공이 패들 범위에 있고 (여유값 추가)
    ball.x <= paddle.x + paddle.width + ball.radius &&
    ball.y + ball.radius >= paddle.y && // 공이 패들과 겹치거나
    ball.y + ball.radius <= paddle.y + paddle.height && // 패들 영역 안에 있을 때
    ball.y < paddle.y // 공의 중심이 패들 위쪽에 있을 때
  ) {
    // 공을 패들 위쪽으로 정확히 위치시키기
    ball.y = paddle.y - ball.radius;
    ball.dy = -Math.abs(ball.dy); // 반드시 위쪽으로 튕기도록
    playBallBounceSound();
  }
  
  // 벽돌 충돌
  for (let c = 0; c < bricks.length; c++) {
    for (let r = 0; r < bricks[c].length; r++) {
      const brick = bricks[c][r];
      if (brick.status > 0) {
        if (
          ball.x > brick.x &&
          ball.x < brick.x + brick.width &&
          ball.y > brick.y &&
          ball.y < brick.y + brick.height
        ) {
          ball.dy = -ball.dy;
          if (brick.status === 2) {
            pauseGame();
            // 퀴즈 벽돌 깨지는 사운드
            playQuizBrickHitSound();
            // 벽돌 라벨에 따른 퀴즈 선택
            const quiz = getQuizByBrickLabel(brick.label);
            showQuizModal(quiz);
            window._currentQuizBrick = brick;
            return;
          } else {
            updateScore(100);
            playBrickHitSound();
            brick.status = 0;
            checkGameOverOrClear();
          }
        }
      }
    }
  }
}
/** 퀴즈 모달 표시 */
function showQuizModal(quizObj) {
  if (!quizObj) return;
  currentQuiz = quizObj;
  $('.quiz-box').css('height', '320px');
  $('#quizTitle').text(`Stage ${currentStage} 퀴즈`);
  $('#quizQuestion').text(quizObj.question).css('color', 'white'); // 퀴즈 문제 글자색을 흰색으로 설정
  const options = $('.quiz-option');
  options.each(function(index) {
    if (index < quizObj.options.length) {
      const optionLetter = String.fromCharCode(65 + index);
      $(this).find('.quiz-option-text').text(`${optionLetter}. ${quizObj.options[index]}`);
      $(this).attr('data-answer', index);
      $(this).removeClass('selected');
      // 퀴즈 옵션과 텍스트 색상을 모두 초기화
      $(this).css({'pointer-events': 'auto', 'color': ''});
      $(this).find('.quiz-option-text').css('color', ''); // 텍스트 색상도 명시적으로 초기화
      $(this).off('click').on('click', function() {
        $('.quiz-option').removeClass('selected');
        $(this).addClass('selected');
        checkAnswer(index);
      });
    }
  });
  $('#quizResult').hide();
  $('#quizModal').css('display', 'flex').hide().fadeIn(300);
}
/** 퀴즈 정답/오답 체크 및 결과 처리 */
function checkAnswer(userAnswer) {
  if (!currentQuiz) return;
  const isCorrect = userAnswer === currentQuiz.correct;
  $('.quiz-option').off('click').css('pointer-events', 'none');
  
  // 틀렸을 때 선택한 옵션의 텍스트 색을 빨간색으로 변경
  if (!isCorrect) {
    $('.quiz-option').eq(userAnswer).find('.quiz-option-text').css('color', '#EF4444');
  }
  
  $('.quiz-box').animate({
    height: '580px'
  }, 300);
  
  const resultText = isCorrect ? '정답 !' : '틀렸습니다 !';
  
  // 새로운 CSS 클래스 사용
  $('#quizResult').removeClass('incorrect');
  if (!isCorrect) {
    $('#quizResult').addClass('incorrect');
  }
  
  $('#resultText').text(resultText);
  $('#resultExplanation').text(`해설 : ${currentQuiz.explanation}`);
  $('#quizResult').fadeIn(300);
  
  if (isCorrect) {
    updateScore(200);
    playQuizCorrectSound();
  } else {
    // 퀴즈 오답 시 생명 감소 제거 - 단순히 사운드만 재생
    playQuizWrongSound();
  }
  
  if (window._currentQuizBrick) {
    // 마지막 벽돌이 퀴즈 벽돌인지 체크
    window._currentQuizBrick.status = 0;
    let bricksLeft = 0;
    for (let cc = 0; cc < bricks.length; cc++) {
      for (let rr = 0; rr < bricks[cc].length; rr++) {
        if (bricks[cc][rr].status > 0) bricksLeft++;
      }
    }
    if (bricksLeft === 0) {
      // 퀴즈 팝업 fadeOut 후 장비획득 팝업 호출
      $('#quizModal').fadeOut(300, function() {
        window._currentQuizBrick = null;
        checkGameOverOrClear();
      });
      return;
    } else {
      window._currentQuizBrick = null;
      checkGameOverOrClear();
    }
  }
}
/** 게임 일시정지 */
function pauseGame() { isGamePaused = true; cancelAnimationFrame(animationId); clearInterval(timerInterval); }
/** 게임 재개 */
function resumeGame() { isGamePaused = false; animationId = requestAnimationFrame(draw); timerInterval = setInterval(updateTimer, 1000); }
/** 공과 패들 위치 초기화 */
function resetBallAndPaddle() { ball.x = canvas.width / 2; ball.y = canvas.height - 100; ball.dx = 3; ball.dy = -3; paddle.x = (canvas.width - paddle.width) / 2; }
/** 게임오버 처리 */
function gameOver() { 
  cancelAnimationFrame(animationId); 
  clearInterval(timerInterval); 
  playGameOverSound();
  showGameOverModal(); 
}
/** 게임오버/스테이지 클리어 체크 */
function checkGameOverOrClear() {
  if (lives <= 0) {
    showGameOverModal();
  } else {
    let bricksLeft = 0;
    for (let c = 0; c < bricks.length; c++) {
      for (let r = 0; r < bricks[c].length; r++) {
        if (bricks[c][r].status > 0) bricksLeft++;
      }
    }
    if (bricksLeft === 0) {
      showItemPopup(currentStage);
    }
  }
}
/** 게임오버 모달 표시 */
function showGameOverModal() { pauseGame(); $('#gameOverModal').css('display', 'flex').hide().fadeIn(300); }
/** 게임 재시작(변수 초기화 및 화면 전환) */
function restartGame() {
  // 게임 상태 변수 초기화
  lives = 3;
  score = 0;
  currentStage = 1;
  isGamePaused = false;
  dragonPhase = false;
  endingMessageIndex = 0;
  
  // 퀴즈 사용 기록 초기화
  usedQuizzes = {
    html: [],
    css: [],
    javascript: [],
    jquery: []
  };
  
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // 선택 UI 초기화
  $('.character-card, .pet-option, .bgm-option, .stage-button').removeClass('selected');

  // HUD 초기화
  $('.hud-box.score .hud-label').text('점수');
  $('.hud-box.life .heart-img').show();
  $('.hud-box.time .time-text').text('10:00');
  $('#stage-label').text('Stage1');
  $('.hud-box.equipment .hud-label').text('장비 : 0/3');

  // 팝업/모달 숨김
  $('#gameOverModal').fadeOut(300);
  $('#quizModal').hide();
  $('#itemModal').hide();

  // 화면 전환
  $('.game-wrapper').fadeOut(300, function() {
    $('.setup-wrapper').fadeIn(300);
  });
}
/** 장비획득 팝업 표시 및 스테이지 전환 */
function showItemPopup(stage) {
  pauseGame();
  playItemGetSound(); // 장비 획득 효과음 재생
  let itemImage, itemTitle, equipmentCount;
  switch(stage) {
    case 1:
      itemImage = 'img/sword.png';
      itemTitle = '전설의 검 획득!';
      equipmentCount = '1/3개 수집 완료';
      break;
    case 2:
      itemImage = 'img/armor.png';
      itemTitle = '전설의 갑옷 획득!';
      equipmentCount = '2/3개 수집 완료';
      break;
    case 3:
      itemImage = 'img/dragon.png';
      itemTitle = '전설의 용 획득!';
      equipmentCount = '3/3개 수집 완료';
      break;
  }
  $('#itemImage').attr('src', itemImage);
  $('#itemTitle').text(itemTitle);
  $('#itemText').text(equipmentCount);
  for(let i = 1; i <= stage; i++) {
    $(`#itemIcon${i}`).css('opacity', '1');
  }
  for(let i = stage + 1; i <= 3; i++) {
    $(`#itemIcon${i}`).css('opacity', '0.3');
  }
  $('#itemModal').css('display', 'flex').hide().fadeIn(300);
  $('#continueBtn').off('click').on('click', function() {
    $('#itemModal').fadeOut(300, function() {
      if (stage >= 3) {
        $('.game-wrapper').fadeOut(300, function () {
          $('.ending-wrapper').fadeIn(300);
          startEndingSequence();
        });
      } else {
        currentStage = stage + 1;
        $('#stage-label').text(`Stage${currentStage}`);
        selectedQuizLabels = QUIZ_LABELS_BY_STAGE[currentStage] || ['???'];
        // 스테이지 전환 시 퀴즈 사용 기록 초기화
        usedQuizzes = {
          html: [],
          css: [],
          javascript: [],
          jquery: []
        };
        initCanvasGame();
      }
    });
  });
}
/** 스테이지별 랜덤 퀴즈 반환 */
function getRandomQuizForStage(stage) {
  if (!quizData || quizData.length === 0) {
    console.error('퀴즈 데이터가 로드되지 않았습니다.');
    return null;
  }
  const categories = STAGE_TO_CATEGORY[stage] || ['html'];
  const stageQuizzes = quizData.filter(quiz => 
    categories.includes(quiz.category.toLowerCase())
  );
  if (stageQuizzes.length === 0) {
    console.error(`Stage ${stage}에 해당하는 퀴즈가 없습니다.`);
    return null;
  }
  const randomIndex = Math.floor(Math.random() * stageQuizzes.length);
  return stageQuizzes[randomIndex];
}
/** 점수 증가 및 HUD 반영 */
function updateScore(amount) { score += amount; $('.hud-box.score .hud-label').text(`점수: ${score}`); }
/** 생명 감소 및 HUD 반영 */
function decreaseLife() { 
  lives--; 
  playLifeLossSound(); 
  updateLivesDisplay(); 
  checkGameOverOrClear(); 
}
/** 생명 표시 갱신 */
function updateLivesDisplay() { $('.hud-box.life .heart-img').each(function (index) { if (index < lives) { $(this).show(); } else { $(this).hide(); } }); }
/** 제한시간 감소 및 HUD 반영 */
function updateTimer() { if (isGamePaused) return; remainingTime--; const minutes = Math.floor(remainingTime / 60); const seconds = remainingTime % 60; $('.hud-box.time .time-text').text(`${minutes}:${seconds.toString().padStart(2, '0')}`); if (remainingTime <= 0) { clearInterval(timerInterval); gameOver(); } }
/** 엔딩 단계별 화면 표시 */
function showEndingStep(step) { $('.ending-step').hide(); $(`.ending-step.step${step + 1}`).fadeIn(300); }
/** 엔딩 시퀀스 시작(마왕 대사 등) */
function startEndingSequence() {
  playBossBgm(); // 마왕조우 BGM
  showEndingStep(0);
  setTimeout(() => {
    showEndingStep(1);
    $('.ending-message').html(beforeDragonMessages[0]);
  }, 1000);
}

// ======= 엔딩크레딧 진입 및 BGM 관리 =======
function goToEndingCredit() {
  if (window.globalBgmAudio) {
    window.globalBgmAudio.pause();
    window.globalBgmAudio.currentTime = 0;
    window.globalBgmAudio.src = '';
    window.globalBgmAudio.load();
  }
  $('.ending-wrapper').fadeOut(300, function () {
    $('.endingcredit-wrapper').fadeIn(300, function () {
      setTimeout(() => {
        playEnding2Bgm(); // 엔딩2 BGM
      }, 100);
    });
  });
}

// ======= BGM 재생 함수 =======
function playBossBgm() { playBgm(BGM_BOSS, false); }
function playEnding1Bgm() { playBgm(BGM_ENDING1, false); }
function playEnding2Bgm() { playBgm(BGM_ENDING2, false); }

// ======= jQuery 이벤트 및 화면 초기화 =======
$(document).ready(function () {
  $('.start').show();
  $('.prologue-wrapper, .setup-wrapper, .game-wrapper, .ending-wrapper, .endingcredit-wrapper').hide();
  $('#start-button').on('click', function () {
    playClickSound();
    $('.start').fadeOut(300, function () {
      $('.prologue-wrapper').fadeIn(300);
    });
  });
  const messages = [
    "하지만 곧... 타성에 젖은 이세계에 <br>'마왕 기말고사'가 덮칠 것이다!",
    "그걸 막을 자는 너뿐이야.",
    "전설의 검, 갑옷, 그리고 잠든 용을 찾아라!",
    "그럼 난 이만… 다음 수업 있으니."
  ];
  let currentMessageIndex = 0;
  $('.prologue-button.next').on('click', function () {
    playClickSound();
    currentMessageIndex++;
    if (currentMessageIndex < messages.length) {
      $('.prologue-message').html(messages[currentMessageIndex]);
    }
    if (currentMessageIndex === messages.length - 1) {
      $('.prologue-button.next').hide();
      $('.prologue-wrapper').fadeOut(300, function () {
        $('.setup-wrapper').fadeIn(300);
      });
    }
  });
  $('.prologue-button.skip').on('click', function () {
    playClickSound();
    $('.prologue-wrapper').fadeOut(300, function () {
      $('.setup-wrapper').fadeIn(300);
    });
  });
  function setupSelectionHandlers() {
    const selectors = [
      '.character-card',
      '.pet-option',
      '.bgm-option',
      '.stage-button'
    ];
    selectors.forEach(selector => {
      $('.setup-wrapper').on('click', selector, function () {
        playSettingClickSound();
        $(this).parent().find(selector).removeClass('selected');
        $(this).addClass('selected');
      });
    });
  }
  setupSelectionHandlers();
  $('.setting-start-button').on('click', function () {
    playClickSound();
    const characterSelected = $('.character-card.selected').length > 0;
    const petSelected = $('.pet-option.selected').length > 0;
    const bgmSelected = $('.bgm-option.selected').length > 0;
    const stageSelected = $('.stage-button.selected').length > 0;
    if (!characterSelected || !petSelected || !bgmSelected || !stageSelected) {
      let missing = [];
      if (!characterSelected) missing.push("캐릭터");
      if (!petSelected) missing.push("펫");
      if (!bgmSelected) missing.push("배경음악");
      if (!stageSelected) missing.push("스테이지");
      alert(`${missing.join(', ')}을(를) 선택해야 합니다.`);
      return;
    }
    currentStage = getSelectedStage();
    playSelectedBGM();
    $('.setup-wrapper').fadeOut(300, function () {
      $('.game-wrapper').fadeIn(300);
      resizeCanvas();
      initCanvasGame();
    });
  });
  // 게임오버 다시시작 버튼 이벤트 등록
  $('#restartBtn').on('click', function() {
    playClickSound();
    restartGame();
  });
  $('.ending-button.next').on('click', function () {
    playClickSound();
    if (!dragonPhase) {
      endingMessageIndex++;
      if (endingMessageIndex < beforeDragonMessages.length) {
        $('.ending-message').html(beforeDragonMessages[endingMessageIndex]);
        if (beforeDragonMessages[endingMessageIndex] === "주인공: 용, 준비됐지?") {
          dragonPhase = true;
          endingMessageIndex = -1; // 용 등장 신호
        }
      }
    } else if (dragonPhase && endingMessageIndex === -1) {
      // 용 등장 연출
      showEndingStep(2);
      setTimeout(() => {
        showEndingStep(3);
        $('.ending-message').html(afterDragonMessages[0]);
        endingMessageIndex = 0;
      }, 1000);
    } else {
      // afterDragonMessages 순차 출력
      endingMessageIndex++;
      if (endingMessageIndex < afterDragonMessages.length) {
        $('.ending-message').html(afterDragonMessages[endingMessageIndex]);
      } else {
        // 모든 afterDragonMessages 출력 후 엔딩크레딧
        setTimeout(() => {
          goToEndingCredit();
        }, 1000);
      }
    }
  });
  $('.ending-button.skip').on('click', function () {
    playClickSound();
    goToEndingCredit();
  });
});

/** 벽돌 라벨에 따른 카테고리별 중복없는 퀴즈 반환 */
function getQuizByBrickLabel(brickLabel) {
  if (!quizData || quizData.length === 0) {
    console.error('퀴즈 데이터가 로드되지 않았습니다.');
    return null;
  }
  
  // 라벨을 카테고리로 매핑
  let category;
  switch(brickLabel.toLowerCase()) {
    case 'html':
      category = 'html';
      break;
    case 'css':
      category = 'css';
      break;
    case 'js':
      category = 'javascript';
      break;
    case 'jquery':
      category = 'jquery';
      break;
    default:
      category = 'html';
  }
  
  // 해당 카테고리의 모든 퀴즈 가져오기
  const categoryQuizzes = quizData.filter(quiz => 
    quiz.category.toLowerCase() === category
  );
  
  if (categoryQuizzes.length === 0) {
    console.error(`${category} 카테고리에 해당하는 퀴즈가 없습니다.`);
    return null;
  }
  
  // 사용하지 않은 퀴즈 찾기
  const unusedQuizzes = categoryQuizzes.filter(quiz => 
    !usedQuizzes[category].includes(quiz.id)
  );
  
  // 모든 퀴즈를 사용했다면 초기화
  if (unusedQuizzes.length === 0) {
    usedQuizzes[category] = [];
    const resetQuizzes = categoryQuizzes.slice();
    const randomIndex = Math.floor(Math.random() * resetQuizzes.length);
    const selectedQuiz = resetQuizzes[randomIndex];
    usedQuizzes[category].push(selectedQuiz.id);
    return selectedQuiz;
  }
  
  // 랜덤하게 하나 선택
  const randomIndex = Math.floor(Math.random() * unusedQuizzes.length);
  const selectedQuiz = unusedQuizzes[randomIndex];
  usedQuizzes[category].push(selectedQuiz.id);
  
  return selectedQuiz;
}