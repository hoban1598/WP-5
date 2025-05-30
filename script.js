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
  // Replace certain .div buttons with <button> inside .setup-wrapper
  (function convertDivsToButtons() {
    const selectors = [
      '.character-button',
      '.pet-button',
      '.bgm-button',
      '.stage-btn',
      '.setting-start-button'
    ];
    const $setup = $('.setup-wrapper');
    selectors.forEach(selector => {
      $setup.find(selector).each(function () {
        if (this.tagName.toLowerCase() === 'div') {
          const $old = $(this);
          const $button = $('<button>');
          $.each(this.attributes, function () {
            $button.attr(this.name, this.value);
          });
          $button.html($old.html());
          $old.replaceWith($button);
        }
      });
    });
  })();

  // 버튼 선택 효과 로직
  function setupSelectionHandlers() {
    const groups = [
      { selector: '.character-card' },
      { selector: '.pet-option' },
      { selector: '.bgm-option' },
      { selector: '.stage-button' }
    ];

    groups.forEach(group => {
      $(document).on('click', group.selector, function () {
        // 같은 그룹 내 다른 선택 해제
        $(group.selector).removeClass('selected');
        // 현재 클릭한 요소 선택
        $(this).addClass('selected');
      });
    });
  }

  // 4. 게임실행화면
  // 공, 패들, 캐릭터, 펫 초기 배치
  function initGameObjects() {
    const $gameArea = $('.brick-area');
    // Ensure .brick-area is position: relative for absolute children and set height
    $gameArea.css({ position: 'relative', top: 0, height: '400px' });

    // Ball: ensure only one and always positioned and styled
    const ball = $('#ball');
    if (ball.length === 0) {
      $gameArea.append('<div id="ball" class="ball"></div>');
    } else {
      ball.appendTo($gameArea);
    }
    // 공 위치를 brick-area 안의 적절한 위치(아래쪽이 아님)로 조정
    // 위치 지정만 남김, 스타일은 CSS로
    $('#ball').css({ top: 480, left: 200 });

    // Paddle: 실제 캐릭터가 포함된 패들이 있다면 해당 요소를 id="paddle"로 변경
    let paddle = $('#paddle');
    if (paddle.length === 0) {
      const $character = $('.game-character');
      if ($character.length && $character.parent().attr('id') !== 'paddle') {
        const $paddleWrapper = $('<div id="paddle" class="paddle"></div>');
        $character.wrap($paddleWrapper);
        paddle = $('#paddle');
      } else {
        $gameArea.append('<div id="paddle" class="paddle"></div>');
        paddle = $('#paddle');
      }
    } else {
      paddle.appendTo($gameArea);
    }
    // 패들 위치만 지정, 스타일은 CSS로
    paddle.css({
      bottom: '20px',
      left: '200px'
    });

    if ($('#character').length === 0) {
      $gameArea.append('<img id="character" class="character" src="">');
    }
    if ($('#pet').length === 0) {
      $gameArea.append('<img id="pet" class="pet" src="">');
    }
  }

  // 펫이 공을 따라다니게 하는 로직
  function syncPetWithBall() {
    const ball = $('#ball');
    const pet = $('#pet');
    if (ball.length && pet.length) {
      const ballPos = ball.position();
      pet.css({
        top: ballPos.top + 10,
        left: ballPos.left + 10
      });
    }
  }
  setInterval(syncPetWithBall, 50);

  // 선택한 캐릭터, 펫, 스테이지, BGM 적용
  function applySettingsToGame() {
    const selectedCharacter = $('.character-card.selected img').attr('src');
    const selectedPet = $('.pet-option.selected img').attr('src');
    let selectedStage = $('.stage-button.selected .stage-button-text').text().trim();
    const selectedBgm = $('.bgm-option.selected').data('bgm');

    $('#character').attr('src', selectedCharacter);
    $('#pet').attr('src', selectedPet);
    $('#stageName').text(selectedStage);
    if (selectedBgm) {
      const bgmAudio = new Audio(selectedBgm);
      bgmAudio.loop = true;
      bgmAudio.play();
    }
    // 퀴즈 벽돌 색깔 설정 (HTML, CSS, JS 각각)
    $('.quiz-brick').each(function () {
      const type = $(this).data('quiz-type');
      if (type === 'html') {
        $(this).css('background-color', '#E34F26'); // HTML: 오렌지
      } else if (type === 'css') {
        $(this).css('background-color', '#2965F1'); // CSS: 파랑
      } else if (type === 'js') {
        $(this).css('background-color', '#F7DF1E'); // JS: 노랑
      }
    });
    // .stage-button.selected에 data-stage 속성 부여
    selectedStage = $('.stage-button.selected .stage-button-text').text().trim();
    const stageNum = selectedStage.replace('Stage', '');
    $('.stage-button.selected').attr('data-stage', stageNum);
  }

  // 선택한 스테이지에 따라 벽돌을 동적으로 생성하는 함수
  // - 30% 확률로 퀴즈 벽돌 생성
  // - 나머지는 일반 벽돌
  function createBricks(stage) {
    const $area = $('.brick-area');
    $area.empty();

    // 퀴즈 타입 스테이지별로 다르게
    let quizTypes = [];
    if (stage === 'Stage1') quizTypes = ['html', 'css'];
    else if (stage === 'Stage2') quizTypes = ['css', 'js'];
    else if (stage === 'Stage3') quizTypes = ['html', 'css', 'js'];
    else quizTypes = ['html', 'css', 'js'];

    // 벽돌 행/열 및 크기
    const rows = 5;
    const cols = 7;
    let totalBricks = rows * cols;
    let brickIndex = 0;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isQuiz = Math.random() < 0.3;
        const brickClass = isQuiz ? 'quiz-brick' : 'normal-brick';
        const brickText = isQuiz ? '퀴즈' : '';
        // 수정: quizType을 무작위로 할당
        const quizType = isQuiz ? quizTypes[Math.floor(Math.random() * quizTypes.length)] : '';
        const $brick = $('<div>')
          .addClass('brick')
          .addClass(brickClass)
          .attr('data-quiz-type', isQuiz ? quizType : '')
          .text(brickText)
          .css({
            top: `${row * 35}px`,
            left: `${col * 90}px`
          });
        $area.append($brick);
        brickIndex++;
      }
    }
    // 퀴즈 벽돌 색상 적용
    $('.quiz-brick').each(function () {
      const type = $(this).data('quiz-type');
      if (type === 'html') {
        $(this).css('background-color', '#E34F26');
      } else if (type === 'css') {
        $(this).css('background-color', '#2965F1');
      } else if (type === 'js') {
        $(this).css('background-color', '#F7DF1E');
      }
    });

    bricksLeft = totalBricks; // 생성된 벽돌 개수로 초기화

    // 벽돌 수 0이 되면 바로 클리어 처리할 수 있도록 이벤트 바인딩 초기화
    $('.brick').off('removed').on('removed', function () {
      bricksLeft--;
      if (bricksLeft === 0) {
        const currentStage = parseInt($('.stage-button.selected').data('stage'));
        showItemPopup(currentStage); // 장비 획득 팝업 표시
        if (currentStage === 3) {
          setTimeout(() => {
            $('.game-wrapper').fadeOut(300, function () {
              $('.ending-wrapper').fadeIn(300);
              startEndingSequence();
            });
          }, 2000);
        }
      }
    });
  }

  const quizQuestions = {
    html: 'HTML에서 문서의 구조를 정의하는 태그는?',
    css: 'CSS에서 색상을 지정하는 속성은?',
    js: 'JavaScript에서 함수를 선언하는 키워드는?'
  };


  setupSelectionHandlers();

  // 공 움직임 시작 함수
  // 공의 초기 속도 설정 및 움직임 시작
  function startBallMovement() {
    const $area = $('.brick-area');
    let ball = $('#ball');
    if (!ball.length) {
      console.warn("Ball element not found - attempting to re-initialize");
      initGameObjects(); // 재초기화 시도
      ball = $('#ball'); // 다시 시도
      if (!ball.length) return;
    }
    // .brick-area 안에 있는지 확인 후 필요할 때만 append
    if (!$.contains($area[0], ball[0])) {
      ball.appendTo($area);
    }
    // 공 위치 및 속도 초기화 (.brick-area 기준)
    ball.css({ left: 200, top: 420 });
    let dx = 3;
    let dy = -3;
    window.ballVelocity = { dx, dy }; // 속도를 전역 변수로 설정

    // Paddle 관련 처리: 패들이 .brick-area에 없으면 append
    let paddle = $('#paddle');
    const $gameArea = $('.brick-area');
    if (paddle.length === 0) {
      const $character = $('.game-character');
      if ($character.length && $character.parent().attr('id') !== 'paddle') {
        const $paddleWrapper = $('<div id="paddle" class="paddle"></div>');
        $character.wrap($paddleWrapper);
        paddle = $('#paddle');
      } else {
        $gameArea.append('<div id="paddle" class="paddle"></div>');
        paddle = $('#paddle');
      }
    }
    if (!$.contains($gameArea[0], paddle[0])) {
      paddle.appendTo($gameArea);
    }

    function moveBall() {
      // ball 객체가 변할 수 있으므로 매번 새로 가져옴
      let ball = $('#ball');
      if (ball.length === 0) return;
      const ballPos = ball.position();
      if (!ballPos || typeof ballPos.left === 'undefined' || typeof ballPos.top === 'undefined') return;
      const ballWidth = ball.outerWidth();
      const ballHeight = ball.outerHeight();
      const areaWidth = $('.brick-area').width();
      const areaHeight = $('.brick-area').height();

      // 속도 불러오기 (window.ballVelocity가 항상 최신값을 가짐)
      let dx = window.ballVelocity.dx;
      let dy = window.ballVelocity.dy;

      // 공 위치 갱신
      let newX = ballPos.left + dx;
      let newY = ballPos.top + dy;
      // 콘솔 로그 추가
      console.log("Moving ball", newX, newY);

      // 벽과 충돌 검사 및 방향 전환
      if (newX <= 0 || newX + ballWidth >= areaWidth) {
        dx = -dx;
      }
      if (newY <= 0) {
        dy = -dy;
      }
      if (newY + ballHeight >= areaHeight) {
        // 바닥에 닿으면 목숨 감소 및 공 위치 초기화
        decreaseLife();
        newX = areaWidth / 2;
        newY = areaHeight / 2;
        dx = 3;
        dy = -3;
      }

      ball.css({ left: newX, top: newY });

      // 속도 갱신
      window.ballVelocity.dx = dx;
      window.ballVelocity.dy = dy;

      checkCollision(ball, dx, dy);
    }

    setInterval(moveBall, 20);
  }
  // 마우스 움직임에 따라 패들이 따라다니는 로직
  $(document).on('mousemove', function (e) {
    const $paddle = $('#paddle');
    const $gameArea = $('.brick-area');
    // .brick-area가 DOM에 존재할 때만 처리, #paddle만 대상으로 고정
    if ($gameArea.length === 0 || $paddle.length === 0) return;
    // 콘솔 로그 추가
    console.log("Paddle exists?", $paddle.length, "GameArea exists?", $gameArea.length);
    const gameOffset = $gameArea.offset();
    if (!gameOffset) return;
    const mouseX = e.pageX - gameOffset.left;
    const newLeft = Math.min(
      Math.max(mouseX - $paddle.width() / 2, 0),
      $gameArea.width() - $paddle.width()
    );
    $paddle.css('left', newLeft);
  });
  // 공과 벽돌, 패들 충돌 체크 함수
  // 충돌 시 공 방향 변경 및 점수 처리
  function checkCollision(ball, dx, dy) {
    const ballPos = ball.position();
    const ballWidth = ball.outerWidth();
    const ballHeight = ball.outerHeight();

    // 패들 충돌 체크
    const paddle = $('#paddle');
    if (paddle.length) {
      const paddlePos = paddle.position();
      const paddleWidth = paddle.outerWidth();
      const paddleHeight = paddle.outerHeight();

      if (
        ballPos.top + ballHeight >= paddlePos.top &&
        ballPos.top <= paddlePos.top + paddleHeight &&
        ballPos.left + ballWidth >= paddlePos.left &&
        ballPos.left <= paddlePos.left + paddleWidth
      ) {
        dy = -dy;
        window.ballVelocity.dy = dy;
      }
    }

    // 벽돌 충돌 체크
    $('.brick').each(function () {
      const $brick = $(this);
      const brickPos = $brick.position();
      const brickWidth = $brick.outerWidth();
      const brickHeight = $brick.outerHeight();

      if (
        ballPos.left + ballWidth > brickPos.left &&
        ballPos.left < brickPos.left + brickWidth &&
        ballPos.top + ballHeight > brickPos.top &&
        ballPos.top < brickPos.top + brickHeight
      ) {
        // 충돌 시 벽돌 제거 및 점수 처리
        const isQuiz = $brick.hasClass('quiz-brick');
        if (isQuiz) {
          const quizType = $brick.data('quiz-type');
          const question = quizQuestions[quizType] || '퀴즈';
          $('#quizQuestion').text(question);
          $('#quizModal').fadeIn(200);
        }
        $brick.remove().trigger('removed');
        hitBrick(isQuiz);
        dy = -dy; // 방향 반전
        window.ballVelocity.dy = dy;
        return false; // each 루프 종료
      }
    });
  }

  // 설정화면에서 게임 시작 버튼 클릭 시 실행되는 주요 게임 초기화 로직
  // - 설정값 적용, 벽돌 생성, 타이머 시작, 공 움직임 시작
  // - 설정화면 → 게임화면 전환
  $('.setting-start-button').on('click', function () {
    initGameObjects();
    applySettingsToGame();
    const selectedStage = $('.stage-button.selected .stage-button-text').text().trim();
    createBricks(selectedStage);
    startTimer();
    startBallMovement(); // 공 움직임 시작
    $('.setup-wrapper').fadeOut(300, function () {
      $('.game-wrapper').fadeIn(300);
    });
  });

  // 점수 로직
  let score = 0;
  function updateScore(value) {
    score += value;
    $('#score').text(score);
  }

  // 목숨 줄어드는 함수 (하트 이미지가 하나씩 제거됨)
  // - 마지막 하트가 제거되면 Game Over 및 페이지 새로고침
  function decreaseLife() {
    const hearts = $('.game-hud .life .hud-heart');
    if (hearts.length > 0) {
      hearts.last().remove();
    }
    if (hearts.length <= 1) {
      alert('Game Over!');
      location.reload();
    }
  }

  // 제한시간 타이머 작동 함수
  // - 스테이지별 시간: 1=10분, 2=7분, 3=5분
  // - 시간 종료 시 게임 종료
  let timeLeft = 60;
  function startTimer() {
    const selectedStage = $('.stage-button.selected .stage-button-text').text().trim();
    if (selectedStage === 'Stage1') timeLeft = 600;
    else if (selectedStage === 'Stage2') timeLeft = 420;
    else if (selectedStage === 'Stage3') timeLeft = 300;
    else timeLeft = 300;

    const timer = setInterval(() => {
      timeLeft--;
      const min = Math.floor(timeLeft / 60);
      const sec = String(timeLeft % 60).padStart(2, '0');
      $('#timer').text(`${min}:${sec}`);
      if (timeLeft <= 0) {
        clearInterval(timer);
        alert("Time's up!");
        location.reload();
      }
    }, 1000);
  }

  // 벽돌이 깨질 때 호출되는 함수
  // - 일반 벽돌이면 점수 증가
  // - 벽돌이 모두 제거되면 스테이지 클리어 처리
  // - Stage3 클리어 시 엔딩 화면으로 이동
  let bricksLeft = 10;
  function hitBrick(isQuiz = false) {
    if (!isQuiz) updateScore(10); // 일반 벽돌은 점수 10점 획득
    bricksLeft--; // 남은 벽돌 수 감소
    if (bricksLeft === 0) {
      const currentStage = parseInt($('.stage-button.selected').data('stage'));
      showItemPopup(currentStage); // 장비 획득 팝업 표시
      if (currentStage === 3) {
        setTimeout(() => {
          $('.game-wrapper').fadeOut(300, function () {
            $('.ending-wrapper').fadeIn(300);
            startEndingSequence();
          });
        }, 2000);
      }
    }
  }

  // (퀴즈 벽돌 클릭 이벤트는 위에서 처리됨)

  // 퀴즈 정답 제출 시 처리 로직
  // - 정답이면 점수 증가
  // - 오답이면 목숨 감소
  // - 팝업 닫기
  $('#quizSubmit').on('click', function () {
    const answer = $('input[name="quizOption"]:checked').val();
    if (answer === 'correct') {
      updateScore(100);
    } else {
      decreaseLife();
    }
    $('#quizModal').fadeOut(200);
  });

  // 스테이지 클리어 시 장비 획득 팝업 출력
  // - Stage 1~3에 따라 획득 아이템 텍스트 다름
  function showItemPopup(stage) {
    let item = '';
    if (stage === 1) item = '전설의 검';
    else if (stage === 2) item = '전설의 갑옷';
    else if (stage === 3) item = '전설의 용';
    $('#itemText').text(`${item}을(를) 획득했습니다!`);
    $('#itemModal').fadeIn(300);
  }

  $('#itemClose').on('click', function () {
    $('#itemModal').fadeOut(300);
  });

  // 5. 엔딩 화면
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
  //6.엔딩 크레딧 화면

});