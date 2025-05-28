$(document).ready(function () {
  // 화면 초기화: 시작화면만 보이게, 나머지는 숨김
  $('.start').show();                    // 시작화면만 보여줌
  $('.prologue-wrapper').hide();        // 프롤로그 숨김
  $('.setup-wrapper').hide();           // 설정 숨김
  $('.game-wrapper').hide();            // 게임 숨김
  $('.ending-wrapper').hide();          // 엔딩 숨김
  $('.endingcredit-wrapper').hide();    // 엔딩크레딧 숨김
  $('#itemModal').hide();

// 배열을 무작위로 섞는 함수
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

  // Canvas 요소 가져오기
const canvas = document.getElementById("gameCanvas");
if (!canvas) {
  console.error("canvas 요소를 찾을 수 없습니다!");
}
const ctx = canvas.getContext("2d");
canvas.width = 720;
canvas.height = 580;


  // 이미지 및 오디오 관련 설정
  const paddleImage = new Image();
  const ballImage = new Image();
  let selectedPaddle = "img/man.png";
  let selectedBall = "img/blue.png";
  let selectedBgm = "bgm1.mp3";
  let bgmAudio = null;

  // 게임 상태 관련 변수
  let selectedStage = 1;
  let currentStage = 1;
  let gameInitialized = false;
  let gameStarted = false;
  let isQuizOpen = false;
  let score = 0;
  let lives = 3;

  // 퀴즈 관련 데이터
  let fullQuizData = [];
  let quizData = [];
  let bricks = [];

  // 공 관련 설정
  const ballRadius = 10;
  let x, y, dx, dy;

  // 패들 관련 설정
  const paddleHeight = 67;
  const paddleWidth = 156;
  let paddleX = (canvas.width - paddleWidth) / 2;

  // 벽돌 관련 설정
  const brickRowCount = 3;
  const brickColumnCount = 7;
  const brickWidth = 85;
  const brickHeight = 25;
  const brickPadding = 10;
  const brickOffsetTop = 30;
  const brickOffsetLeft = 35;

  // 키보드 입력 상태
  let rightPressed = false;
  let leftPressed = false;

  // 타이머 관련
  let timeLeft = 600;
  let timerInterval = null;

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

  // 스테이지별 설정
  const stageConfig = {
    1: { total: 21, quiz: 6, types: ["HTML", "CSS"] },
    2: { total: 28, quiz: 9, types: ["JS"] },
    3: { total: 28, quiz: 9, types: ["jQuery"] }
  };

  // 아이템 정보
  const itemInfo = [
    { name: "전설의 검 획득!", img: "img/sword.png", iconIndex: 0 },
    { name: "전설의 갑옷 획득!", img: "img/armor.png", iconIndex: 1 },
    { name: "전설의 용 획득!", img: "img/dragon.png", iconIndex: 2 }
  ];

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

  // 3. 초기 설정 화면: div → button 변환
 // 버튼 선택 효과 로직
      function setupSelectionHandlers() {
        $('.character-card').on('click', function () {
          $('.character-card').removeClass('selected');
          $(this).addClass('selected');
          const imgSrc = $(this).find('img').attr('src');
          if (imgSrc.includes('male.png')) {
            selectedPaddle = 'img/man.png';
          } else if (imgSrc.includes('female.png')) {
            selectedPaddle = 'img/woman.png';
          } else {
            selectedPaddle = imgSrc;
          }
        });

        $('.pet-option').on('click', function () {
          $('.pet-option').removeClass('selected');
          $(this).addClass('selected');
          selectedBall = $(this).find('img').attr('src'); // 선택한 펫(공) 이미지
        });

        $('.bgm-option').on('click', function () {
          $('.bgm-option').removeClass('selected');
          $(this).addClass('selected');
        });

        $('.stage-button').on('click', function () {
          $('.stage-button').removeClass('selected');
          $(this).addClass('selected');
          selectedStage = parseInt($(this).find('.stage-button-text').text().replace("Stage", ""));
        });
      }
      $('#game-info').hide();
      // 게임 시작 버튼 클릭 시 선택된 스테이지 보여주기
      // 게임 시작 버튼 클릭 시
      $('.setting-start-button').on('click', function () {
      $('#game-info').show();
        $('.setup-wrapper').fadeOut(300, function () {
          $('#game-container').show();
        });
      });

      setupSelectionHandlers();

      /*******************************************************************************
       * 게임 초기화 및 시작 관련 함수
       *******************************************************************************/

      // 퀴즈 JSON 불러오기 및 분류
      function initializeGame() {
        return fetch("quiz.json")
          .then(response => response.json())
          .then(data => {
            fullQuizData = data;
            quizData = [
              { stage: 1, label: "HTML", questions: fullQuizData.filter(q => q.category === "html") },
              { stage: 1, label: "CSS", questions: fullQuizData.filter(q => q.category === "css") },
              { stage: 2, label: "JS", questions: fullQuizData.filter(q => q.category === "javascript") },
              { stage: 3, label: "jQuery", questions: fullQuizData.filter(q => q.category === "jquery") }
            ];
            console.log("퀴즈 데이터 로딩 완료", quizData);
            gameInitialized = true;
          })
          .catch(error => {
            console.error("퀴즈 로딩 실패:", error);
            alert("퀴즈 데이터를 불러오는데 실패했습니다. 페이지를 새로고침 해주세요.");
          });
      }

      // BGM 설정 + 게임 시작 처리
      function startGame() {
        try {
          if (bgmAudio) {
            bgmAudio.pause();
          }
          bgmAudio = new Audio(selectedBgm);
          bgmAudio.loop = true;
          bgmAudio.play().catch(error => {
            console.warn("BGM 재생 실패:", error);
          });
        } catch (error) {
          console.warn("BGM 초기화 실패:", error);
        }

        currentStage = selectedStage;
        updateStageInfo();
        resetStage();

        $('.setup-wrapper').hide();
        $('#game-container').show();

        requestAnimationFrame(draw);
      }

      // 이미지 로드 후 게임 시작
      function startGameWithImages() {
        let paddleLoaded = false;
        let ballLoaded = false;

        paddleImage.onload = () => { paddleLoaded = true; if (ballLoaded) startGame(); };
        ballImage.onload = () => { ballLoaded = true; if (paddleLoaded) startGame(); };

        paddleImage.src = selectedPaddle;
        ballImage.src = selectedBall;
      }

      // 게임 시작 버튼 이벤트
      document.querySelector(".setting-start-button").addEventListener("click", () => {
        if (!gameInitialized) {
          initializeGame().then(() => {
            startGameWithImages();
          });
        } else {
          startGameWithImages();
        }
      });

      // 스테이지 선택 이벤트
      document.querySelectorAll(".stage-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          selectedStage = parseInt(btn.dataset.stage);
          document.querySelectorAll(".stage-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
        });
      });

      // 캐릭터 선택 이벤트
      document.querySelectorAll(".paddle-option").forEach(img => {
        img.addEventListener("click", () => {
          selectedPaddle = img.dataset.paddle;
          document.querySelectorAll(".paddle-option").forEach(el => el.classList.remove("selected"));
          img.classList.add("selected");
        });
      });

      // 공 선택 이벤트
      document.querySelectorAll(".ball-option").forEach(img => {
        img.addEventListener("click", () => {
          selectedBall = img.dataset.ball;
          document.querySelectorAll(".ball-option").forEach(el => el.classList.remove("selected"));
          img.classList.add("selected");
        });
      });

      // 초기 설정으로 돌아가기 버튼 이벤트
      $('#backToSetup').on('click', function () {
        $('#game-info').hide();
        if (bgmAudio) { bgmAudio.pause(); bgmAudio = null; }
        if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
        score = 0;
        lives = 3;
        currentStage = selectedStage;
        gameStarted = false;

        // 공 위치와 속도도 초기화
        const speed = getBallSpeed(selectedStage);
        x = canvas.width / 2;
        y = canvas.height - paddleHeight - ballRadius - 10;
        dx = (Math.random() < 0.5 ? 1 : -1) * speed;
        dy = -speed;
        paddleX = (canvas.width - paddleWidth) / 2;

        $('#game-container').hide();
        $('.setup-wrapper').fadeIn(300);
      });
        // 계속하기 버튼 이벤트
        document.getElementById("continueBtn").addEventListener("click", () => {
          document.getElementById("itemModal").style.display = "none";
          currentStage++;
          score = 0;
          resetStage();
        });

        // 타이머 시작 함수
        function startTimer() {
          timerInterval = setInterval(() => {
            if (gameStarted) {
              timeLeft--;
              document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;

              if (timeLeft <= 0) {
                clearInterval(timerInterval);
                alert("시간 초과! 게임 오버!");
                document.location.reload();
              }
            }
          }, 1000);
        }

        function formatTime(seconds) {
          const min = Math.floor(seconds / 60).toString().padStart(2, "0");
          const sec = (seconds % 60).toString().padStart(2, "0");
          return `${min}:${sec}`;
        }

        function getInitialTime(stage) {
          switch (stage) {
            case 1: return 600;
            case 2: return 420;
            case 3: return 300;
            default: return 600;
          }
        }

        // 게임 루프
        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          drawBricks();
          drawBall();
          drawPaddle();
          drawScore();
          drawLives();

          if (!isQuizOpen) {
            collisionDetection();

            if (gameStarted) {
              if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) dx = -dx;
              if (y + dy < ballRadius) dy = -dy;
              else if (y + dy > canvas.height - paddleHeight - ballRadius - 10) {
                if (x > paddleX && x < paddleX + paddleWidth) {
                  dy = -dy;
                } else {
                  lives--;
                  if (!lives) {
                    alert("게임 오버!");
                    lives = 3;
                    score = 0;
                    resetStage();
                  } else {
                    const speed = getBallSpeed(currentStage);
                    x = canvas.width / 2;
                    y = canvas.height - paddleHeight - ballRadius - 10;
                    dx = (Math.random() < 0.5 ? 1 : -1) * speed;
                    dy = -speed;
                    paddleX = (canvas.width - paddleWidth) / 2;
                    gameStarted = false;
                  }
                }
              }

              x += dx;
              y += dy;
            }

            if (rightPressed && paddleX < canvas.width - paddleWidth) {
              paddleX += 7;
            } else if (leftPressed && paddleX > 0) {
              paddleX -= 7;
            }
          }

          requestAnimationFrame(draw);
        }

        function drawBall() {
          ctx.drawImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
        }

        function drawPaddle() {
          ctx.drawImage(paddleImage, paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
        }

        function drawScore() {
          document.getElementById("score").textContent = `⭐ 점수: ${score}`;
        }

        function drawLives() {
          document.getElementById("lives").textContent = `❤️ 목숨: ${lives}`;
        }

        function drawBricks() {
          for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
              const b = bricks[c][r];
              if (b && b.status === 1) {
                const brickX = (c * (brickWidth + brickPadding)) + brickOffsetLeft;
                const brickY = (r * (brickHeight + brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;

                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = (b.type === "quiz") ? "#FFD700" : "#FFA500";
                ctx.fill();
                ctx.closePath();

                if (b.type === "quiz") {
                  ctx.fillStyle = "#000";
                  ctx.font = "12px Arial";
                  ctx.textAlign = "center";
                  ctx.fillText(b.label, brickX + brickWidth / 2, brickY + brickHeight / 2 + 4);
                }
              }
            }
          }
        }

        // 충돌 감지
        function collisionDetection() {
          for (let c = 0; c < brickColumnCount; c++) {
            for (let r = 0; r < brickRowCount; r++) {
              const b = bricks[c][r];
              if (b && b.status === 1) {
                if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
                  dy = -dy;

                  if (b.type === "quiz") {
                    const questions = b.questions;
                    if (Array.isArray(questions) && questions.length > 0) {
                      const randomQuiz = questions[Math.floor(Math.random() * questions.length)];
                      openQuizModal(b.label, randomQuiz);
                    }
                  }

                  b.status = 0;
                  score++;

                  const totalBricks = stageConfig[currentStage].total;
                  if (score >= totalBricks) {
                    if (currentStage < 3) {
                      showItemModal(currentStage);
                    } else {
                      showItemModal(currentStage);
                      document.getElementById("continueBtn").onclick = () => {
                        alert("축하합니다! 모든 전설의 장비를 수집하고 게임을 클리어했습니다!");
                        document.location.reload();
                      };
                    }
                  }
                }
              }
            }
          }
        }
          // 스테이지 리셋
          function resetStage() {
            const config = stageConfig[currentStage];

            // 퀴즈 필터링
            const currentStageQuizzes = quizData.filter(q =>
              q.stage === currentStage && config.types.includes(q.label)
            );

            // 벽돌 배열 초기화
            bricks = [];
            const columns = Math.ceil(config.total / brickRowCount);

            for (let c = 0; c < columns; c++) {
              bricks[c] = [];
              for (let r = 0; r < brickRowCount; r++) {
                if ((c * brickRowCount + r) < config.total) {
                  bricks[c][r] = {
                    x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                    y: r * (brickHeight + brickPadding) + brickOffsetTop,
                    status: 1,
                    type: "normal"
                  };
                }
              }
            }

            // 퀴즈 벽돌 무작위 설정
            let availablePositions = [];
            for (let c = 0; c < columns; c++) {
              for (let r = 0; r < brickRowCount; r++) {
                if (bricks[c][r]) availablePositions.push({ c, r });
              }
            }

            availablePositions = shuffle(availablePositions);

            for (let i = 0; i < Math.min(config.quiz, availablePositions.length); i++) {
              const pos = availablePositions[i];
              const quizType = currentStageQuizzes[i % currentStageQuizzes.length];

              if (quizType && bricks[pos.c][pos.r]) {
                bricks[pos.c][pos.r] = {
                  x: pos.c * (brickWidth + brickPadding) + brickOffsetLeft,
                  y: pos.r * (brickHeight + brickPadding) + brickOffsetTop,
                  status: 1,
                  type: "quiz",
                  label: quizType.label,
                  questions: quizType.questions
                };
              }
            }

            // 공/패들 위치 초기화
            const speed = getBallSpeed(currentStage);  // 현재 스테이지에 맞는 고정 속도 가져오기
            x = canvas.width / 2;
            y = canvas.height - paddleHeight - ballRadius - 10;
            dx = (Math.random() < 0.5 ? 1 : -1) * speed;
            dy = -speed; // 위로 이동
            paddleX = (canvas.width - paddleWidth) / 2;
            gameStarted = false;

            lives = 3;
            drawLives();

            timeLeft = getInitialTime(currentStage);
            document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
            clearInterval(timerInterval);
            timerInterval = null;

            updateStageInfo();
          }

          // 퀴즈 팝업 열기
          function openQuizModal(label, quizData) {
            if (!quizData || !quizData.options) {
              console.error("퀴즈 데이터가 올바르지 않습니다:", quizData);
              return;
            }

            document.getElementById("quizTitle").textContent = `${label} 퀴즈`;
            document.getElementById("quizQuestion").textContent = quizData.question;

            const options = document.querySelectorAll(".quiz-option");
            options.forEach((opt, index) => {
              if (quizData.options[index]) {
                opt.textContent = `${String.fromCharCode(65 + index)}. ${quizData.options[index]}`;
                opt.onclick = () => handleQuizAnswer(index, quizData);
              }
            });

            document.getElementById("quizModal").style.display = "block";
            isQuizOpen = true;
          }

          // 퀴즈 정답 처리
          // 퀴즈 옵션 클릭 시
          function handleQuizAnswer(selectedIndex, quizObj) {
            const resultBox = document.getElementById("quizResult");
            const resultText = document.getElementById("resultText");
            const explanation = document.getElementById("resultExplanation");
            const options = document.querySelectorAll(".quiz-option");

            options.forEach((opt, index) => {
              opt.disabled = true;
              opt.classList.remove("correct", "wrong");
              if (index === quizObj.correct) {
                opt.classList.add("correct");
              }
              if (index === selectedIndex && index !== quizObj.correct) {
                opt.classList.add("wrong");
              }
            });

            if (selectedIndex === quizObj.correct) {
              resultBox.className = "quiz-result correct";
              resultText.textContent = "정답 !";
            } else {
              resultBox.className = "quiz-result wrong";
              resultText.textContent = "오답 !";
            }

            explanation.innerHTML = `해설 : <b>${quizObj.explanation}</b>`;
            resultBox.style.display = "block";
          }

          // 완료 버튼 및 닫기 버튼
          document.getElementById("quizDoneBtn").onclick = closeQuiz;
          document.getElementById("quizCloseBtn").onclick = closeQuiz;

          function closeQuiz() {
            document.getElementById("quizModal").style.display = "none";
            document.getElementById("quizResult").style.display = "none";
            document.querySelectorAll(".quiz-option").forEach(opt => {
              opt.disabled = false;
              opt.classList.remove("correct", "wrong");
            });
            isQuizOpen = false;
          }

          function moveToNextStage() {
            currentStage++;
            timeLeft = getInitialTime(currentStage);
            document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
            clearInterval(timerInterval);
            startTimer();
          }
          function getBallSpeed(stage) {
            if (stage === 1) return 3;
            if (stage === 2) return 3;
            if (stage === 3) return 3;
            return 3;
          }

          function updateStageInfo() {
            document.getElementById("stage").textContent = `Stage ${currentStage}`;
            document.getElementById("equipment").textContent = `장비 : ${currentStage - 1}/3`;
          }

          function showItemModal(stage) {
            const item = itemInfo[stage - 1];
            document.getElementById("itemImage").src = item.img;
            document.getElementById("itemTitle").textContent = item.name;
            document.getElementById("itemText").textContent = `${stage}/3개 수집 완료`;

            for (let i = 0; i < 3; i++) {
              const icon = document.getElementById(`itemIcon${i + 1}`);
              icon.classList.toggle("active", i < stage);
            }

            document.getElementById("itemModal").style.display = "block";
          }
            /*******************************************************************************
             * 이벤트 핸들러
             *******************************************************************************/

            function keyDownHandler(e) {
              if (e.key === "Right" || e.key === "ArrowRight") {
                rightPressed = true;
                gameStarted = true;

                if (!timerInterval) {
                  timeLeft = getInitialTime(currentStage);
                  document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
                  startTimer();
                }
              } else if (e.key === "Left" || e.key === "ArrowLeft") {
                leftPressed = true;
                gameStarted = true;

                if (!timerInterval) {
                  timeLeft = getInitialTime(currentStage);
                  document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
                  startTimer();
                }
              }
            }

            function keyUpHandler(e) {
              if (e.key === "Right" || e.key === "ArrowRight") {
                rightPressed = false;
              } else if (e.key === "Left" || e.key === "ArrowLeft") {
                leftPressed = false;
              }
            }

            function startGameIfNeeded() {
              gameStarted = true;

              if (!timerInterval) {
                timeLeft = getInitialTime(currentStage);
                document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
                startTimer();
              }
            }

            // 키보드 이벤트 리스너
            document.addEventListener("keydown", keyDownHandler);
            document.addEventListener("keyup", keyUpHandler);
            document.addEventListener("keydown", function (e) {
              if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
                e.preventDefault();
              }
            }, false);

            /*******************************************************************************
             * 엔딩 시퀀스
             *******************************************************************************/

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
              showEndingStep(0); // 첫화면
              setTimeout(() => {
                showEndingStep(1); // 어두워지고 대사 박스 등장
                $('.ending-message').html(beforeDragonMessages[0]);
              }, 1000);
            }

            $('.ending-button.next').on('click', function () {
              if (!dragonPhase) {
                endingMessageIndex++;
                if (endingMessageIndex < beforeDragonMessages.length) {
                  $('.ending-message').html(beforeDragonMessages[endingMessageIndex]);
                }
                if (beforeDragonMessages[endingMessageIndex] === "주인공: 용, 준비됐지?") {
                  showEndingStep(2); // 용 등장
                  dragonPhase = true;
                  endingMessageIndex = -1;
                  setTimeout(() => {
                    showEndingStep(3); // 마무리 대사
                    $('.ending-message').html(afterDragonMessages[0]);
                    endingMessageIndex = 0;
                  }, 1000);
                }
              } else {
                endingMessageIndex++;
                if (endingMessageIndex < afterDragonMessages.length) {
                  $('.ending-message').html(afterDragonMessages[endingMessageIndex]);
                } else {
                  showEndingStep(4); // 크레딧 전환
                  setTimeout(() => {
                    $('.ending-wrapper').fadeOut(300, function () {
                      $('.endingcredit-wrapper').fadeIn(300);
                    });
                  }, 1000);
                }
              }
            });

            $('.ending-button.skip').on('click', function () {
              $('.ending-wrapper').fadeOut(300, function () {
                $('.endingcredit-wrapper').fadeIn(300);
              });
            });

            // 자동으로 엔딩 시작
            startEndingSequence();

            // 초기 UI 정보 표시
            updateStageInfo();
 });


