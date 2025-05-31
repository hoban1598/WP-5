// ======= 캔버스 게임 글로벌 변수 선언 =======
let canvas, ctx;
let ball, paddle;
let bricks = [];
// 선택된 스테이지를 저장하는 전역 변수
let currentStage = 1;
let lives = 3;
let score = 0;
let animationId;
let selectedQuizLabels = [];
// 각 스테이지별 퀴즈 라벨 정의
const QUIZ_LABELS_BY_STAGE = {
  1: ['HTML', 'CSS'],
  2: ['JS'],
  3: ['jQuery']
};

$(document).ready(function () {
  // 화면 초기화: 시작화면만 보이게, 나머지는 숨김
  $('.start').show();                    // 시작화면만 보여줌
  $('.prologue-wrapper').hide();        // 프롤로그 숨김
  $('.setup-wrapper').hide();           // 설정 숨김
  $('.game-wrapper').hide();            // 게임 숨김
  $('.ending-wrapper').hide();          // 엔딩 숨김
  $('.endingcredit-wrapper').hide();    // 엔딩크레딧 숨김

  // 1. 시작 화면
  $('#start-button').on('click', function () {
    console.log('Start button clicked');
    $('.start').fadeOut(300, function () {
      console.log('Start screen hidden');
      $('.prologue-wrapper').fadeIn(300, function () {
        console.log('Prologue screen shown');
      });
    });
  });

  // 2. 프롤로그 화면
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

  // 3. 초기 설정 화면
  // 버튼 선택 효과 로직
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
  // 버튼 선택 핸들러 실행
  setupSelectionHandlers();

  // "게임시작" 버튼 클릭 시 검증 및 게임 화면 전환
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

    // 선택된 스테이지 번호를 현재 스테이지로 저장
    currentStage = getSelectedStage();

    $('.setup-wrapper').fadeOut(300, function () {
      $('.game-wrapper').fadeIn(300);
      // 캔버스 크기 조정 후 게임을 초기화
      resizeCanvas();
      initCanvasGame(); // 게임 시작 함수
    });
  });

  //4.게임실행화면
  // ========== 선택된 캐릭터 이미지 가져오기 ==========
  function getSelectedCharacterImage() {
    const selectedCharacter = $('.character-card.selected img').attr('src');
    return selectedCharacter || 'default-character.png'; // 기본 이미지
  }
  // ========== 선택된 펫 이미지 가져오기 ==========
  function getSelectedPetImage() {
    const selectedPet = $('.pet-option.selected img').attr('src');
    return selectedPet || 'default-pet.png'; // 기본 이미지
  }
  // ========== 선택된 배경음악 가져오기 ==========
  function getSelectedBGM() {
    const selectedBGM = $('.bgm-option.selected').data('bgm');
    return selectedBGM || 'default-bgm.mp3'; // 기본 BGM
  }
  // ========== 선택된 스테이지 정보 가져오기 ==========
  function getSelectedStage() {
    const selectedStage = $('.stage-button.selected').data('stage');
    return selectedStage || 1;
  }
  // 전역 함수로 분리 (최상단에서 선언)

  // [스테이지 퀴즈 라벨 설정 함수]
  function getQuizLabelForStage() {
    return selectedQuizLabels[Math.floor(Math.random() * selectedQuizLabels.length)];
  }
  // ========== 배경음악 재생 ==========
  function playSelectedBGM() {
    const bgmSrc = getSelectedBGM();
    const audio = new Audio(bgmSrc);
    audio.loop = true; // 반복 재생
    audio.play().catch(error => {
      console.error("배경음악 재생 오류:", error);
    });
  }
  // ========== 게임 시작 시 배경음악 재생 ==========
  playSelectedBGM();
  // ========== 게임 시작 시 캔버스 크기 조정 ==========
    function resizeCanvas() {
      // 캔버스 크기를 브라우저의 37.5% x 53.7% 크기로 반응형 설정
      canvas = document.getElementById('gameCanvas');
      if (!canvas) return; // 캔버스가 없으면 리턴
      // 캔버스 크기를 윈도우 크기에 맞춤
      canvas.width = window.innerWidth * 0.375;
      canvas.height = window.innerHeight * 0.537;
    }
  // 윈도우 리사이즈 이벤트 핸들러
    $(window).on('resize', resizeCanvas);
  // ========== 캔버스 게임 초기화 ==========
  function initCanvasGame() {
    currentStage = getSelectedStage();
    selectedQuizLabels = QUIZ_LABELS_BY_STAGE[currentStage] || ['???'];
    // HUD 상단의 Stage 텍스트를 선택된 스테이지에 따라 갱신
    $('#stage-label').text(`Stage${currentStage}`);
    // 선택한 스테이지 정보에 따라 HUD의 Stage 텍스트 반영됨

    bricks = [];
    let quizData = [];

    // 1. canvas 요소와 context 불러오기
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 2. 공 초기화
    ball = {
      x: canvas.width / 2,
      y: canvas.height - 30,
      radius: 15,
      dx: 3,
      dy: -3,
      image: new Image(),
    };
    ball.image.src = getSelectedPetImage();

    // 3. 패들 초기화
    paddle = {
      width: 156,
      height: 19,
      x: (canvas.width - 156) / 2,
      y: canvas.height - 64,
      speed: 7,
      movingLeft: false,
      movingRight: false,
      image: new Image(),
    };
    paddle.image.src = getSelectedCharacterImage();

    // 4. 벽돌 생성
    const rowCount = 5;
    const brickWidth = 89;
    const brickHeight = 24;
    const brickPadding = 0;
    const offsetTop = 50;
    // 벽돌들이 좌우 여백 없이 캔버스 전체에 퍼지도록 중앙 정렬 offset 계산
    const colCount = Math.floor(canvas.width / brickWidth);
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
        bricks[c][r] = {
          x: brickX,
          y: brickY,
          width: brickWidth,
          height: brickHeight,
          status: isQuizBrick ? 2 : 1,
          label: label,
        };
      }
    }
    
    // 5. 퀴즈 데이터 로드
    loadQuizData();

    // 6. 마우스 이벤트 등록
    canvas.addEventListener('mousemove', function (e) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      let newX = mouseX - paddle.width / 2;

      // 정확한 우측 경계까지 허용
      if (newX < 0) newX = 0;
      if (newX > canvas.width - paddle.width - 0.5) {
        newX = canvas.width - paddle.width;
      }

      paddle.x = newX;
    });

    // 7. 게임 루프 시작
    animationId = requestAnimationFrame(draw);
  }

  // ========== 퀴즈 데이터 로드 ==========
  function loadQuizData() {
    // fetch('quiz.json') 후 quizData 저장
  }

  // ========== 그리기 함수들 ==========
  function draw() {
    // 공 위치 업데이트
    moveBall();

    // 캔버스를 깨끗이 지움
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 벽돌, 공, 패들 그리기
    drawBricks();
    drawBall();
    drawPaddle();

    // 충돌 감지
    detectCollision();

    // 다음 프레임 요청
    animationId = requestAnimationFrame(draw);
  }
// ========== 공 위치 업데이트 ==========
  function moveBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;
  }
// ========== 공 그리기 ==========
  function drawBall() {
    if (ball && ball.image.complete) {
      ctx.drawImage(ball.image, ball.x - 15, ball.y - 15, 30, 30);
    } else {
      // fallback: 원형으로 그림
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0095DD';
      ctx.fill();
      ctx.closePath();
    }
  }
// ========== 패들 그리기 ==========
function drawPaddle() {
  if (paddle) {
    // Base rectangle
    ctx.fillStyle = "#1D2930";
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // Character on top (48x48 centered horizontally)
    if (paddle.image && paddle.image.complete) {
      const characterX = paddle.x + (paddle.width - 48) / 2;
      const characterY = paddle.y - 48;
      ctx.drawImage(paddle.image, characterX, characterY, 48, 48);
    }
  }
}
// ========== 벽돌 그리기 ==========
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
          // 퀴즈 벽돌이면 텍스트 라벨 출력
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
          // 각 스테이지별 퀴즈 라벨이 다르게 출력됨 (Stage 1: HTML/CSS, Stage 2: JS, Stage 3: jQuery)
        }
      }
    }
  }
// ========== 벽돌 색상 설정 ==========
// 벽돌의 상태(status)와 스테이지(stage)에 따라 색상 결정
// 일반 벽돌 색상: #84C669, 퀴즈 벽돌 색상은 stage별로 다름
function getBrickColor(status, stage) {
  if (status === 2) {
    if (stage === 1) return "#FBBF24";
    if (stage === 2) return "#60A5FA";
    return "#A52B2B";
    // Stage 1: #FBBF24, Stage 2: #60A5FA, Stage 3: #A52B2B
  }
  return "#84C669"; // 일반 벽돌 
}

  // ========== 충돌 감지 및 처리 ==========
  function detectCollision() {
    // 공이 좌우 벽에 닿으면 x 방향 반전 (벽돌과 동일한 영역 반영)
    const leftWall = 0;
    const rightWall = canvas.width;
    const ballNextX = ball.x + ball.dx;
    if (ballNextX - 15 < leftWall || ballNextX + 15 > rightWall) {
      ball.dx = -ball.dx;
    }

    // 공이 위쪽 벽에 닿으면 y 방향 반전
    if (ball.y + ball.dy < ball.radius) {
      ball.dy = -ball.dy;
    }
    
    // 공이 패들과 충돌
    if (
      ball.y + ball.dy > paddle.y - paddle.height &&
      ball.x > paddle.x &&
      ball.x < paddle.x + paddle.width
    ) {
      ball.dy = -ball.dy;
    }

    // 공이 바닥에 닿으면 목숨 감소
    if (ball.y + ball.dy > canvas.height - ball.radius) {
      decreaseLife();
      resetBallAndPaddle();
    }

    // 벽돌 충돌 처리
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
            } else {
              updateScore(100);
            }
            brick.status = 0;
            checkGameOverOrClear();
          }
        }
      }
    }
  }

  // ========== 퀴즈 처리 ==========
  function showQuizModal(quizObj) {
    // #quizModal 열기 및 퀴즈 표시
  }

  function checkAnswer(userAnswer) {
    // 정답 체크 → 점수 or 목숨 감소
    // resumeGame()
  }

  // ========== 게임 상태 관리 ==========
  function pauseGame() {
    // cancelAnimationFrame()
  }

  function resumeGame() {
    // requestAnimationFrame(draw)
  }

  // ========== 공과 패들 초기화 ==========
  function resetBallAndPaddle() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 30;
    ball.dx = 3;
    ball.dy = -3;
    paddle.x = (canvas.width - paddle.width) / 2;
  }

  // ========== 게임 종료 또는 클리어 체크 ==========
  function checkGameOverOrClear() {
    if (lives <= 0) {
      alert("Game Over!");
      cancelAnimationFrame(animationId);
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

  // ========== 스테이지 전환 / 장비획득 ==========
  function showItemPopup(stage) {
    // 팝업 열고 아이템 텍스트 표시
    // "계속하기" 클릭 시 다음 스테이지로 전환 or 엔딩
  }

  // ========== 보조 함수 ==========
  function getRandomQuizForStage(stage) {
    // quizData 중에서 해당 stage 문제만 뽑아 랜덤 리턴
  }

  // ========== 점수 업데이트 ==========
  function updateScore(amount) {
    score += amount;
    $('#score-label').text(score);
  }

  // ========== 생명 감소 ==========
  function decreaseLife() {
    lives--;
    updateLivesDisplay();
  }

  // ========== 생명 표시 갱신 ==========
  function updateLivesDisplay() {
    $('.life-heart').each(function (index) {
      if (index < lives) {
        $(this).show();
      } else {
        $(this).hide();
      }
    });
  }

  // 5. 퀴즈 팝업화면 
  // 6. 장비획득팝업화면
  // 7. 엔딩 화면
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
    "마왕: 웹의 힘이라니… 큭… 무너지다니…!",
    "주인공: 이제 모든 수업은 끝났어요. 안녕히 계세요, 교수님.",
    "…그리고 웹의 전설은 그렇게 막을 내렸다."
  ];

  let endingMessageIndex = 0;
  let dragonPhase = false;

  function showEndingStep(step) {
    $('.ending-step').hide();
    $(`.ending-step[data-step="${step}"]`).fadeIn(300);
  }

  function startEndingSequence() {
    showEndingStep(0); // 첫화면 (대사 없음)
    setTimeout(() => {
      showEndingStep(1); // 어두워지고 대사 박스
      $('.ending-message').html(beforeDragonMessages[0]);
    }, 1000);
  }
//'다음' 버튼 로직
  $('.ending-button.next').on('click', function () {
    if (!dragonPhase) {
      endingMessageIndex++;
      if (endingMessageIndex < beforeDragonMessages.length) {
        $('.ending-message').html(beforeDragonMessages[endingMessageIndex]);
      }
      if (beforeDragonMessages[endingMessageIndex] === "주인공: 용, 준비됐지?") {
        showEndingStep(2);
        dragonPhase = true;
        endingMessageIndex = -1;
        setTimeout(() => {
          showEndingStep(3);
          $('.ending-message').html(afterDragonMessages[0]);
          endingMessageIndex = 0;
        }, 1000);
      }
    } else {
      endingMessageIndex++;
      if (endingMessageIndex < afterDragonMessages.length) {
        $('.ending-message').html(afterDragonMessages[endingMessageIndex]);
      } else {
        showEndingStep(4);
        setTimeout(() => {
          $('.ending-wrapper').fadeOut(300, function () {
            $('.endingcredit-wrapper').fadeIn(300);
          });
        }, 1000);
      }
    }
  });

  // 자동 시작
  startEndingSequence();

  // "건너뛰기" 버튼
  $('.ending-button.skip').on('click', function () {
    $('.ending-wrapper').fadeOut(300, function () {
      $('.endingcredit-wrapper').fadeIn(300);
    });
  });
  //8.엔딩 크레딧 화면

});