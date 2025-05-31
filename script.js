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
let isGamePaused = false; // 게임 일시정지 상태
let currentQuiz = null; // 현재 퀴즈 객체
// 각 스테이지별 퀴즈 라벨 정의
const QUIZ_LABELS_BY_STAGE = {
  1: ['HTML', 'CSS'],
  2: ['JS'],
  3: ['jQuery']
};

// 스테이지별 퀴즈 카테고리 매핑
const STAGE_TO_CATEGORY = {
  1: ['html', 'css'],
  2: ['javascript'],
  3: ['jquery']
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

    // 배경음악 재생 (사용자 상호작용 후)
    playSelectedBGM();

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
    return selectedBGM; // 선택되지 않으면 undefined 반환
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
    if (!bgmSrc) {
      console.log('배경음악이 선택되지 않았습니다.');
      return;
    }
    
    const audio = new Audio(bgmSrc);
    audio.loop = true; // 반복 재생
    audio.volume = 0; // 임시적으로 소리 끄기 (원래: 0.3)
    
    // 사용자 상호작용 후 재생 시도
    audio.play().catch(error => {
      console.log("배경음악은 사용자 상호작용 후에 재생됩니다:", error.message);
    });
  }
  // ========== 게임 시작 시 캔버스 크기 조정 ==========
    function resizeCanvas() {
      // 캔버스를 고정 크기로 설정
      canvas = document.getElementById('gameCanvas');
      if (!canvas) return; // 캔버스가 없으면 리턴
      // 캔버스 크기를 고정값으로 설정
      canvas.width = 720;
      canvas.height = 580;
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

    // 생명 표시 업데이트
    updateLivesDisplay();

    // 2. 공 초기화
    ball = {
      x: canvas.width / 2,
      y: canvas.height - 100,
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
    const selectedStage = getSelectedStage();
    let rowCount;
    let colCount = 7; // 한 줄에 7개로 고정
    
    // 스테이지별로 행 수 설정
    if (selectedStage === 1) {
      rowCount = 3; // 스테이지 1: 21개 (7개씩 3줄)
    } else {
      rowCount = 4; // 스테이지 2,3: 28개 (7개씩 4줄)
    }
    
    const brickWidth = 89;
    const brickHeight = 24;
    const brickPadding = 0;
    const offsetTop = 50;
    
    // 벽돌들이 좌우 여백 없이 캔버스 전체에 퍼지도록 중앙 정렬 offset 계산
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
    // 퀴즈 데이터가 이미 JavaScript 내부에 포함되어 있음
    console.log('퀴즈 데이터 로드 완료:', quizData.length + '개 문제');
    console.log('카테고리별 문제 수:');
    const categories = {};
    quizData.forEach(quiz => {
      categories[quiz.category] = (categories[quiz.category] || 0) + 1;
    });
    console.log(categories);
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

    // 게임이 일시정지 상태가 아닐 때만 다음 프레임 요청
    if (!isGamePaused) {
      animationId = requestAnimationFrame(draw);
    }
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
              playBrickHitSound(); // 일반 벽돌 충돌 사운드
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
    if (!quizObj) return;
    
    currentQuiz = quizObj;
    
    // 모달 크기를 초기 크기로 설정
    $('.quiz-box').css('height', '320px');
    
    // 퀴즈 모달 요소들 설정
    $('#quizTitle').text(`Stage ${currentStage} 퀴즈`);
    $('#quizQuestion').text(quizObj.question);
    
    // 선택지 설정
    const options = $('.quiz-option');
    options.each(function(index) {
      if (index < quizObj.options.length) {
        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
        $(this).find('.quiz-option-text').text(`${optionLetter}. ${quizObj.options[index]}`);
        $(this).attr('data-answer', index);
        $(this).removeClass('selected');
        $(this).css('pointer-events', 'auto'); // 선택지 활성화
        $(this).off('click').on('click', function() {
          // 모든 선택지에서 selected 클래스 제거
          $('.quiz-option').removeClass('selected');
          // 클릭한 선택지에 selected 클래스 추가
          $(this).addClass('selected');
          // 답안 확인
          checkAnswer(index);
        });
      }
    });
    
    // 결과 영역 완전히 숨기기 (처음에는 보이지 않음)
    $('#quizResult').hide();
    
    // 모달 표시
    $('#quizModal').css('display', 'flex').hide().fadeIn(300);
  }

  function checkAnswer(userAnswer) {
    if (!currentQuiz) return;
    
    const isCorrect = userAnswer === currentQuiz.correct;
    
    // 선택지 비활성화
    $('.quiz-option').off('click').css('pointer-events', 'none');
    
    // 모달 크기 확장 (결과 영역을 위해)
    $('.quiz-box').animate({
      height: '540px'
    }, 300);
    
    // 결과 표시
    const resultText = isCorrect ? '정답 !' : '틀렸습니다 !';
    const resultColor = isCorrect ? '#4ADE80' : '#EF4444';
    
    // 결과 영역 스타일 설정
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
    
    // 결과 영역을 fade in으로 표시
    $('#quizResult').fadeIn(300);
    
    // 점수 또는 생명 처리
    if (isCorrect) {
      updateScore(200); // 퀴즈 정답 시 더 높은 점수
      playQuizCorrectSound(); // 정답 사운드
    } else {
      // 퀴즈 틀려도 목숨 감소 없음, 오답 사운드만 재생
      playQuizWrongSound(); // 오답 사운드
    }
  }

  // ========== 게임 상태 관리 ==========
  function pauseGame() {
    isGamePaused = true;
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  function resumeGame() {
    isGamePaused = false;
    animationId = requestAnimationFrame(draw);
  }

  // ========== 공과 패들 초기화 ==========
  function resetBallAndPaddle() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 100;
    ball.dx = 3;
    ball.dy = -3;
    paddle.x = (canvas.width - paddle.width) / 2;
  }

  // ========== 게임 종료 또는 클리어 체크 ==========
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

  // ========== 게임오버 모달 표시 ==========
  function showGameOverModal() {
    pauseGame();
    $('#gameOverModal').css('display', 'flex').hide().fadeIn(300);
  }

  // ========== 게임 재시작 ==========
  function restartGame() {
    // 모든 변수 초기화
    lives = 3;
    score = 0;
    currentStage = 1;
    
    // 게임오버 모달 숨기기
    $('#gameOverModal').fadeOut(300);
    
    // 게임 화면 숨기고 시작화면으로 돌아가기
    $('.game-wrapper').fadeOut(300, function() {
      $('.start').fadeIn(300);
    });
    
    // 애니메이션 정리
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  }

  // ========== 스테이지 전환 / 장비획득 ==========
  function showItemPopup(stage) {
    // 게임 일시정지
    pauseGame();
    
    // 획득한 장비에 따른 이미지와 텍스트 설정
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
    
    // 팝업 내용 설정
    $('#itemImage').attr('src', itemImage);
    $('#itemTitle').text(itemTitle);
    $('#itemText').text(equipmentCount);
    
    // 장비 아이콘 상태 업데이트
    for(let i = 1; i <= stage; i++) {
      $(`#itemIcon${i}`).css('opacity', '1'); // 획득한 장비는 불투명하게
    }
    for(let i = stage + 1; i <= 3; i++) {
      $(`#itemIcon${i}`).css('opacity', '0.3'); // 미획득 장비는 반투명하게
    }
    
    // 팝업 표시
    $('#itemModal').css('display', 'flex').hide().fadeIn(300);
    
    // 계속하기 버튼 이벤트
    $('#continueBtn').off('click').on('click', function() {
      $('#itemModal').fadeOut(300);
      
      if (stage >= 3) {
        // 모든 스테이지 완료 시 엔딩 시작
        $('.game-wrapper').fadeOut(300, function() {
          $('.ending-wrapper').fadeIn(300);
          startEndingSequence();
        });
      } else {
        // 다음 스테이지로 진행
        currentStage++;
        $('#stage-label').text(`Stage${currentStage}`);
        selectedQuizLabels = QUIZ_LABELS_BY_STAGE[currentStage] || ['???'];
        
        // 새로운 벽돌 생성 및 게임 재시작
        initCanvasGame();
      }
    });
  }

  // ========== 보조 함수 ==========
  function getRandomQuizForStage(stage) {
    if (!quizData || quizData.length === 0) {
      console.error('퀴즈 데이터가 로드되지 않았습니다.');
      return null;
    }
    
    const categories = STAGE_TO_CATEGORY[stage] || ['html'];
    
    // 해당 스테이지의 카테고리에 맞는 퀴즈들만 필터링
    const stageQuizzes = quizData.filter(quiz => 
      categories.includes(quiz.category.toLowerCase())
    );
    
    if (stageQuizzes.length === 0) {
      console.error(`Stage ${stage}에 해당하는 퀴즈가 없습니다.`);
      return null;
    }
    
    // 랜덤으로 하나 선택
    const randomIndex = Math.floor(Math.random() * stageQuizzes.length);
    return stageQuizzes[randomIndex];
  }

  // ========== 점수 업데이트 ==========
  function updateScore(amount) {
    score += amount;
    // HUD의 점수 표시 업데이트 (별 이미지 옆의 점수)
    $('.hud-box.score .hud-label').text(`점수: ${score}`);
  }

  // ========== 생명 감소 ==========
  function decreaseLife() {
    lives--;
    updateLivesDisplay();
    checkGameOverOrClear(); // 생명 감소 후 게임오버 체크
  }

  // ========== 생명 표시 갱신 ==========
  function updateLivesDisplay() {
    $('.hud-box.life .heart-img').each(function (index) {
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
    playBossSound(); // 마왕 조우 사운드
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
          playEndingSound(1); // 엔딩 사운드 재생
          $('.ending-wrapper').fadeOut(300, function () {
            $('.endingcredit-wrapper').fadeIn(300);
          });
        }, 1000);
      }
    }
  });

  // "건너뛰기" 버튼
  $('.ending-button.skip').on('click', function () {
    playEndingSound(2); // 건너뛰기 시 다른 엔딩 사운드
    $('.ending-wrapper').fadeOut(300, function () {
      $('.endingcredit-wrapper').fadeIn(300);
    });
  });
  //8.엔딩 크레딧 화면

  // ========== 사운드 효과 재생 함수들 ==========
  function playSound(soundFile) {
    if (!soundFile) return;
    
    const audio = new Audio(soundFile);
    audio.volume = 0.3; // 볼륨 30%로 조절
    audio.play().catch(error => {
      console.log(`사운드 재생 실패 (${soundFile}):`, error.message);
    });
  }

  function playBrickHitSound() {
    // 일반 벽돌 깨질 때 효과음 (임시로 빈 함수)
  }

  function playQuizCorrectSound() {
    // 퀴즈 정답 효과음 (임시로 빈 함수)
  }

  function playQuizWrongSound() {
    // 퀴즈 오답 효과음 (임시로 빈 함수)
  }

  function playBossSound() {
    playSound('sound/마왕조우.mp3');
  }

  function playEndingSound(endingNumber = 1) {
    playSound(`sound/엔딩${endingNumber}.mp3`);
  }

  // ========== 퀴즈 모달 닫기 함수 ==========
  window.closeQuiz = function() {
    $('#quizModal').fadeOut(300);
    
    // 모달 크기를 원래대로 되돌리기
    $('.quiz-box').css('height', '320px');
    
    // 선택지 상태 초기화
    $('.quiz-option').removeClass('selected').css('pointer-events', 'auto');
    
    // 결과 영역 숨기기
    $('#quizResult').hide();
    
    resumeGame();
  }

  // ========== 다시시작 버튼 이벤트 ==========
  $('#restartBtn').on('click', function() {
    restartGame();
  });

});