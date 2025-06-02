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
const BGM_BOSS = 'sound/마왕조우.mp3';
const BGM_ENDING1 = 'sound/엔딩1.mp3';
const BGM_ENDING2 = 'sound/엔딩2.mp3';

// ======= BGM 재생 함수 =======
function playBgm(src, loop = false) {
  // 기존 BGM 완전 정지 및 해제
  if (window.globalBgmAudio) {
    window.globalBgmAudio.pause();
    window.globalBgmAudio.currentTime = 0;
    window.globalBgmAudio.src = '';
    window.globalBgmAudio.load();
  }
  // 파일 존재 여부 체크 (HEAD 요청)
  fetch(src, { method: 'HEAD' })
    .then(res => {
      if (!res.ok) throw new Error('BGM 파일 없음: ' + src);
      window.globalBgmAudio = new Audio(src);
      window.globalBgmAudio.loop = loop;
      window.globalBgmAudio.volume = 0.3;
      window.globalBgmAudio.play().catch(e => {
        console.warn('BGM 재생 실패:', src, e.message);
      });
    })
    .catch(err => {
      console.warn('[BGM]', err.message);
    });
}

function playSelectedBGM() {
  const bgmSrc = getSelectedBGM();
  if (!bgmSrc) return;
  playBgm(bgmSrc, true);
}

function playEndingSound() {
  playBgm('sound/엔딩1.mp3', false);
}
function playCreditSound() {
  playBgm('sound/엔딩크레딧.mp3', false);
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
  return selectedCharacter || 'default-character.png';
}
/** 선택된 펫 이미지 경로 반환 */
function getSelectedPetImage() {
  const selectedPet = $('.pet-option.selected img').attr('src');
  return selectedPet || 'default-pet.png';
}
/** 선택된 배경음악 경로 반환 */
function getSelectedBGM() {
  const selectedBGM = $('.bgm-option.selected').data('bgm');
  return selectedBGM;
}
/** 사운드 파일 재생 */
function playSound(soundFile) {
  if (!soundFile) return;
  const audio = new Audio(soundFile);
  audio.volume = 0.3;
  audio.play().catch(error => {
    console.log(`사운드 재생 실패 (${soundFile}):`, error.message);
  });
}
/** 벽돌 히트 사운드(임시) */
function playBrickHitSound() {}
/** 퀴즈 정답 사운드(임시) */
function playQuizCorrectSound() {}
/** 퀴즈 오답 사운드(임시) */
function playQuizWrongSound() {}
/** 마왕 조우 사운드 재생 */
function playBossSound() { playSound('sound/마왕조우.mp3'); }
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
  bricks = [];
  for (let c = 0; c < colCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < rowCount; r++) {
      const brickX = c * (brickWidth + brickPadding) + offsetLeft;
      const brickY = r * (brickHeight + brickPadding) + offsetTop;
      const isQuizBrick = Math.random() < 0.3;
      const label = getQuizLabelForStage();
      bricks[c][r] = { x: brickX, y: brickY, width: brickWidth, height: brickHeight, status: isQuizBrick ? 2 : 1, label: label };
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
    "question": "HTML에서 가장 큰 제목을 나타내는 태그는?",
    "options": ["<h6>", "<h3>", "<h1>", "<header>"],
    "correct": 2,
    "explanation": "<h1>은 HTML에서 가장 큰 제목을 나타내는 태그입니다."
  },
  {
    "id": 4,
    "category": "html",
    "question": "HTML에서 이미지를 삽입하는 태그는?",
    "options": ["<image>", "<img>", "<picture>", "<photo>"],
    "correct": 1,
    "explanation": "<img> 태그는 HTML에서 이미지를 삽입할 때 사용합니다."
  },
  {
    "id": 5,
    "category": "html",
    "question": "HTML에서 링크를 만드는 태그는?",
    "options": ["<link>", "<a>", "<href>", "<url>"],
    "correct": 1,
    "explanation": "<a> 태그는 HTML에서 하이퍼링크를 만들 때 사용합니다."
  },
  {
    "id": 6,
    "category": "css",
    "question": "CSS에서 텍스트 색상을 변경하는 속성은?",
    "options": ["background-color", "color", "text-color", "font-color"],
    "correct": 1,
    "explanation": "CSS에서 color 속성은 텍스트의 색상을 변경합니다."
  },
  {
    "id": 7,
    "category": "css",
    "question": "CSS에서 요소를 가운데 정렬하는 속성은?",
    "options": ["align: center", "text-align: center", "center: true", "position: center"],
    "correct": 1,
    "explanation": "text-align: center는 텍스트나 인라인 요소를 가운데 정렬합니다."
  },
  {
    "id": 8,
    "category": "css",
    "question": "CSS에서 배경색을 설정하는 속성은?",
    "options": ["color", "bg-color", "background-color", "background"],
    "correct": 2,
    "explanation": "background-color 속성은 요소의 배경색을 설정합니다."
  },
  {
    "id": 9,
    "category": "css",
    "question": "CSS에서 글꼴 크기를 설정하는 속성은?",
    "options": ["text-size", "font-size", "size", "font-weight"],
    "correct": 1,
    "explanation": "font-size 속성은 텍스트의 글꼴 크기를 설정합니다."
  },
  {
    "id": 10,
    "category": "css",
    "question": "CSS에서 요소의 테두리를 설정하는 속성은?",
    "options": ["border", "outline", "frame", "edge"],
    "correct": 0,
    "explanation": "border 속성은 요소의 테두리를 설정합니다."
  },
  {
    "id": 11,
    "category": "javascript",
    "question": "JavaScript에서 변수를 선언하는 키워드는?",
    "options": ["variable", "var", "define", "set"],
    "correct": 1,
    "explanation": "var, let, const 등이 JavaScript에서 변수를 선언하는 키워드입니다."
  },
  {
    "id": 12,
    "category": "javascript",
    "question": "JavaScript에서 함수를 정의하는 키워드는?",
    "options": ["function", "def", "func", "method"],
    "correct": 0,
    "explanation": "function 키워드는 JavaScript에서 함수를 정의할 때 사용합니다."
  },
  {
    "id": 13,
    "category": "javascript",
    "question": "JavaScript에서 배열의 길이를 구하는 속성은?",
    "options": ["size", "length", "count", "total"],
    "correct": 1,
    "explanation": "length 속성은 JavaScript 배열의 길이를 반환합니다."
  },
  {
    "id": 14,
    "category": "javascript",
    "question": "JavaScript에서 문자열을 숫자로 변환하는 함수는?",
    "options": ["parseInt()", "toNumber()", "convert()", "number()"],
    "correct": 0,
    "explanation": "parseInt() 함수는 문자열을 정수로 변환합니다."
  },
  {
    "id": 15,
    "category": "javascript",
    "question": "JavaScript에서 요소를 선택하는 메서드는?",
    "options": ["selectElement()", "getElementById()", "getElement()", "findElement()"],
    "correct": 1,
    "explanation": "getElementById()는 특정 ID를 가진 요소를 선택하는 메서드입니다."
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
  if (ballNextX - 15 < leftWall || ballNextX + 15 > rightWall) {
    ball.dx = -ball.dx;
  }
  if (ball.y + ball.dy < ball.radius) {
    ball.dy = -ball.dy;
  }
  if (
    ball.y + ball.dy > paddle.y - paddle.height &&
    ball.x > paddle.x &&
    ball.x < paddle.x + paddle.width
  ) {
    ball.dy = -ball.dy;
  }
  if (ball.y + ball.dy > canvas.height - ball.radius) {
    decreaseLife();
    resetBallAndPaddle();
  }
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
            const quiz = getRandomQuizForStage(currentStage);
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
  $('#quizQuestion').text(quizObj.question);
  const options = $('.quiz-option');
  options.each(function(index) {
    if (index < quizObj.options.length) {
      const optionLetter = String.fromCharCode(65 + index);
      $(this).find('.quiz-option-text').text(`${optionLetter}. ${quizObj.options[index]}`);
      $(this).attr('data-answer', index);
      $(this).removeClass('selected');
      $(this).css('pointer-events', 'auto');
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
  $('.quiz-box').animate({
    height: '540px'
  }, 300);
  const resultText = isCorrect ? '정답 !' : '틀렸습니다 !';
  const resultColor = isCorrect ? '#4ADE80' : '#EF4444';
  if (isCorrect) {
    $('#quizResult').css({
      'background': 'rgba(74, 222, 128, 0.10)',
      'outline': '1px solid #4ADE80'
    });
  } else {
    $('#quizResult').css({
      'background': 'rgba(248, 113, 113, 0.10)',
      'outline': '1px solid #F87171'
    });
  }
  $('#resultText').text(resultText).css('color', resultColor);
  $('#resultExplanation').text(`해설 : ${currentQuiz.explanation}`);
  $('#quizResult').fadeIn(300);
  if (isCorrect) {
    updateScore(200);
    playQuizCorrectSound();
  } else {
    decreaseLife();
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
function gameOver() { cancelAnimationFrame(animationId); clearInterval(timerInterval); showGameOverModal(); }
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
  let itemImage, itemTitle, equipmentCount;
  switch(stage) {
    case 1:
      itemImage = 'Img/sword.png';
      itemTitle = '전설의 검 획득!';
      equipmentCount = '1/3개 수집 완료';
      break;
    case 2:
      itemImage = 'Img/armor.png';
      itemTitle = '전설의 갑옷 획득!';
      equipmentCount = '2/3개 수집 완료';
      break;
    case 3:
      itemImage = 'Img/dragon.png';
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
function decreaseLife() { lives--; updateLivesDisplay(); checkGameOverOrClear(); }
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
        $(this).parent().find(selector).removeClass('selected');
        $(this).addClass('selected');
      });
    });
  }
  setupSelectionHandlers();
  $('.setting-start-button').on('click', function () {
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
    restartGame();
  });
  $('.ending-button.next').on('click', function () {
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
    goToEndingCredit();
  });
  // [임시] 엔딩 바로보기 버튼 (나중에 삭제)
  $('#show-ending-btn').on('click', function() {
    $('.start').fadeOut(300, function() {
      $('.ending-wrapper').fadeIn(300);
      startEndingSequence();
    });
  });
});
