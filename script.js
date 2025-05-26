const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 이미지 초기화
const paddleImage = new Image();
const ballImage = new Image();
let selectedPaddle = "man.png";
let selectedBall = "파랑펫.png";
let selectedBgm = "bgm1.mp3";
let selectedStage = 1;
let bgmAudio = null;

let fullQuizData = [];
let quizData = [];
let gameInitialized = false;
let bricks = []; // <== 벽돌 배열 전역 선언 추가

// 게임 초기화 함수
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

const ballRadius = 10;  // 예: 공 반지름
let x, y, dx, dy;        // 공 좌표 및 속도

canvas.width = 720;
canvas.height = 580;

let currentStage = 1;
let isQuizOpen = false;
const itemInfo = [
  {
    name: "전설의 검 획득!",
    img: "sword.png",        // 실제 경로로 교체
    iconIndex: 0
  },
  {
    name: "전설의 갑옷 획득!",
    img: "armor.png",
    iconIndex: 1
  },
  {
    name: "전설의 용 획득!",
    img: "dragon.png",
    iconIndex: 2
  }
];

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

// 버튼 이벤트
document.getElementById("continueBtn").addEventListener("click", () => {
  document.getElementById("itemModal").style.display = "none";
  currentStage++;
  score = 0;
  resetStage();
});

// 패들
const paddleHeight = 67;
const paddleWidth = 156;
let paddleX = (canvas.width - paddleWidth) / 2;
let gameStarted = false;
let timeLeft = getInitialTime(currentStage);
let timerInterval = null;

function updateStageInfo() {
    document.getElementById("stage").textContent = `Stage ${currentStage}`;
    document.getElementById("equipment").textContent = `장비 : ${currentStage - 1}/3`;
}

// 스테이지별 벽돌 설정
const stageConfig = {
    1: {
        total: 20,    // 전체 벽돌 수 (14 일반 + 6 퀴즈)
        quiz: 6,      // 퀴즈 벽돌 수
        types: ["HTML", "CSS"]  // 스테이지 1의 퀴즈 종류
    },
    2: {
        total: 30,    // 전체 벽돌 수 (21 일반 + 9 퀴즈)
        quiz: 9,      // 퀴즈 벽돌 수
        types: ["JS"]  // 스테이지 2의 퀴즈 종류
    },
    3: {
        total: 30,    // 전체 벽돌 수 (21 일반 + 9 퀴즈)
        quiz: 9,      // 퀴즈 벽돌 수
        types: ["jQuery"]  // 스테이지 3의 퀴즈 종류
    }
};

function resetStage() {
    const config = stageConfig[currentStage];

    // 현재 스테이지의 퀴즈 데이터 가져오기
    const currentStageQuizzes = quizData.filter(q =>
        q.stage === currentStage && config.types.includes(q.label)
    );

    // 벽돌 배열 초기화
    bricks = [];
    const columns = Math.ceil(config.total / brickRowCount);

    // 모든 벽돌 위치 초기화
    for(let c = 0; c < columns; c++) {
        bricks[c] = [];
        for(let r = 0; r < brickRowCount; r++) {
            if((c * brickRowCount + r) < config.total) {
                bricks[c][r] = {
                    x: c * (brickWidth + brickPadding) + brickOffsetLeft,
                    y: r * (brickHeight + brickPadding) + brickOffsetTop,
                    status: 1,
                    type: "normal"
                };
            }
        }
    }

    // 퀴즈 벽돌 위치 선정
    let availablePositions = [];
    for(let c = 0; c < columns; c++) {
        for(let r = 0; r < brickRowCount; r++) {
            if(bricks[c] && bricks[c][r]) {
                availablePositions.push({c, r});
            }
        }
    }

    // 위치 섞기
    availablePositions = shuffle(availablePositions);

    // 퀴즈 벽돌 설정
    for(let i = 0; i < Math.min(config.quiz, availablePositions.length); i++) {
        const pos = availablePositions[i];
        const quizType = currentStageQuizzes[i % currentStageQuizzes.length];

        if(quizType && bricks[pos.c] && bricks[pos.c][pos.r]) {
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

    // 공/패들 초기화
    x = canvas.width / 2;
    y = canvas.height - paddleHeight - ballRadius - 10;
    dx = getBallSpeed(currentStage);
    dy = -getBallSpeed(currentStage);
    paddleX = (canvas.width - paddleWidth) / 2;
    gameStarted = false;

    // 목숨 초기화
    lives = 3;
    drawLives();

    // 타이머 초기화
    timeLeft = getInitialTime(currentStage);
    document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
    clearInterval(timerInterval);
    timerInterval = null;

    // UI 업데이트
    updateStageInfo();
}

function startTimer() {
    timerInterval = setInterval(() => {
        // 퀴즈 중에도 시간은 계속 흐르게 한다
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
    switch(stage) {
        case 1: return 600;  // 10분
        case 2: return 420;  // 7분
        case 3: return 300;  // 5분
        default: return 600;
    }
}
function moveToNextStage() {
    currentStage++;
    timeLeft = getInitialTime(currentStage);
    document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
    clearInterval(timerInterval);
    startTimer();
    // 여기서 스테이지 관련 데이터도 리로드해야 함
}

// 스테이지별 공 속도 설정 함수 추가가
function getBallSpeed(stage) {
    switch(stage) {
        case 1: return 3;
        case 2: return 4;
        case 3: return 5;
        default: return 3;
    }
}

function drawBall() {
  ctx.drawImage(ballImage, x - ballRadius, y - ballRadius, ballRadius * 2, ballRadius * 2);
}

// 벽돌
const brickRowCount = 3;
const brickColumnCount = 7;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 35;



// 셔플 함수
function shuffle(array) {
    for(let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// 스테이지 선택 이벤트
document.querySelectorAll(".stage-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedStage = parseInt(btn.dataset.stage);
    document.querySelectorAll(".stage-btn").forEach(b => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

let paddleLoaded = false;
let ballLoaded = false;

paddleImage.onload = () => {
  paddleLoaded = true;
  if (ballLoaded) startGame();
};
ballImage.onload = () => {
  ballLoaded = true;
  if (paddleLoaded) startGame();
};

// 게임 시작 함수
function startGame() {
    // BGM 설정
    try {
        if (bgmAudio) {
            bgmAudio.pause();
        }
        bgmAudio = new Audio(selectedBgm);
        bgmAudio.loop = true;
        bgmAudio.play().catch(error => {
            console.log('BGM 재생 실패:', error);
            // BGM 재생 실패해도 게임은 계속 진행
        });
    } catch (error) {
        console.log('BGM 초기화 실패:', error);
        // BGM 초기화 실패해도 게임은 계속 진행
    }

    // 게임 상태 초기화
    currentStage = selectedStage;
    updateStageInfo();
    resetStage();

    // 화면 전환
    document.getElementById("startScreen").style.display = "none";
    document.getElementById("game-container").style.display = "block";

    // 게임 시작
    requestAnimationFrame(draw);
}

// 게임 시작 버튼 이벤트
document.getElementById("startGameBtn").addEventListener("click", () => {
    if (!gameInitialized) {
        initializeGame().then(() => {
            startGameWithImages();
        });
    } else {
        startGameWithImages();
    }
});

// 이미지 로드 및 게임 시작
function startGameWithImages() {
    // 이미지 로드 시작
    paddleLoaded = false;
    ballLoaded = false;

    // 이미지 로드 완료 체크
    function checkImagesLoaded() {
        if (paddleLoaded && ballLoaded) {
            startGame();
        }
    }

    // 이미지 로드 이벤트
    paddleImage.onload = () => {
        paddleLoaded = true;
        checkImagesLoaded();
    };

    ballImage.onload = () => {
        ballLoaded = true;
        checkImagesLoaded();
    };

    // 이미지 로드 시작
    paddleImage.src = selectedPaddle;
    ballImage.src = selectedBall;
}

document.querySelectorAll(".paddle-option").forEach(img => {
  img.addEventListener("click", () => {
    selectedPaddle = img.dataset.paddle;
    document.querySelectorAll(".paddle-option").forEach(el => el.classList.remove("selected"));
    img.classList.add("selected");
  });
});

document.querySelectorAll(".ball-option").forEach(img => {
  img.addEventListener("click", () => {
    selectedBall = img.dataset.ball;
    document.querySelectorAll(".ball-option").forEach(el => el.classList.remove("selected"));
    img.classList.add("selected");
  });
});

function highlightSelection(selector, selectedElement) {
  document.querySelectorAll(selector).forEach(el => el.classList.remove("selected"));
  selectedElement.classList.add("selected");
}

let rightPressed = false;
let leftPressed = false;

// 점수
let score = 0;

// 목숨
let lives = 3;

document.addEventListener("keydown", keyDownHandler);
document.addEventListener("keyup", keyUpHandler);
document.addEventListener("keydown", function(e) {
    if(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        e.preventDefault();
    }
}, false);

function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
        gameStarted = true;

        if (!timerInterval) {
            timeLeft = getInitialTime(currentStage); // 현재 스테이지에 맞는 시간 설정
            document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
            startTimer();
        }
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
        gameStarted = true;

        if (!timerInterval) {
            timeLeft = getInitialTime(currentStage); // 현재 스테이지에 맞는 시간 설정
            document.getElementById("timer").textContent = `⏰ ${formatTime(timeLeft)}`;
            startTimer();
        }
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

function keyUpHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    } else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function collisionDetection() {
    for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
            const b = bricks[c][r];
            if(b && b.status === 1) {
                if(x > b.x && x < b.x+brickWidth && y > b.y && y < b.y+brickHeight) {
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

                    if (score === brickRowCount * brickColumnCount) {
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

function drawPaddle() {
    ctx.drawImage(paddleImage, paddleX, canvas.height - paddleHeight - 10, paddleWidth, paddleHeight);
}

function drawBricks() {
    for(let c=0; c<brickColumnCount; c++) {
        for(let r=0; r<brickRowCount; r++) {
            const b = bricks[c][r];
            if(b.status === 1) {
                const brickX = (c*(brickWidth+brickPadding)) + brickOffsetLeft;
                const brickY = (r*(brickHeight+brickPadding)) + brickOffsetTop;
                b.x = brickX;
                b.y = brickY;
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = (b.type === "quiz") ? "#FFD700" : "#FFA500";  // 퀴즈: 노랑, 일반: 주황
                ctx.fill();
                ctx.closePath();

                // 퀴즈 텍스트 라벨 표시
                if (b.type === "quiz") {
                    ctx.fillStyle = "#000";
                    ctx.font = "12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillText(b.label, brickX + brickWidth/2, brickY + brickHeight/2 + 4);
                }
            }
        }
    }
}

function drawScore() {
    document.getElementById("score").textContent = `⭐ 점수: ${score}`;
}

function drawLives() {
    document.getElementById("lives").textContent = `❤️ 목숨: ${lives}`;
}

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
            if(x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
                dx = -dx;
            }
            if(y + dy < ballRadius) {
                dy = -dy;
            } else if (y + dy > canvas.height - paddleHeight - ballRadius - 10) {
                if(x > paddleX && x < paddleX + paddleWidth) {
                    dy = -dy;
                } else {
                    lives--;
                    if(!lives) {
                        alert("게임 오버!");
                        lives = 3;
                        score = 0;
                        resetStage();
                    } else {
                        x = canvas.width/2;
                        y = canvas.height - paddleHeight - ballRadius - 10;
                        dx = getBallSpeed(currentStage);
                        dy = -getBallSpeed(currentStage);
                        paddleX = (canvas.width - paddleWidth)/2;
                        gameStarted = false;
                    }
                }
            }

            x += dx;
            y += dy;
        }

        if(rightPressed && paddleX < canvas.width - paddleWidth) {
            paddleX += 7;
        } else if(leftPressed && paddleX > 0) {
            paddleX -= 7;
        }
    }

    requestAnimationFrame(draw);
}

updateStageInfo();  // 최초 1회 실행 (draw() 위에 넣어도 됨)

// 수정된 openQuizModal
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

function handleQuizAnswer(selectedIndex, quizObj) {
    const resultBox = document.getElementById("quizResult");
    const resultText = document.getElementById("resultText");
    const explanation = document.getElementById("resultExplanation");
    const options = document.querySelectorAll(".quiz-option");

    options.forEach((opt, index) => {
        opt.style.pointerEvents = "none";

        if (index === quizObj.correct) {
            opt.classList.add("correct");
        }
        if (index === selectedIndex && index !== quizObj.correct) {
            opt.classList.add("wrong");
        }
    });

    if (selectedIndex === quizObj.correct) {
        resultBox.className = "quiz-result correct";
        resultText.textContent = "정답!";
    } else {
        resultBox.className = "quiz-result wrong";
        resultText.textContent = "오답!";
    }

    explanation.textContent = `해설 : ${quizObj.explanation}`;
    resultBox.style.display = "block";
}

function closeQuiz() {
    document.getElementById("quizModal").style.display = "none";
    document.getElementById("quizResult").style.display = "none";

    // 옵션 초기화
    document.querySelectorAll(".quiz-option").forEach(opt => {
        opt.style.pointerEvents = "auto";
        opt.classList.remove("correct", "wrong");
    });

    isQuizOpen = false; // 게임 재개
}

// 초기 설정으로 돌아가기 버튼 이벤트
document.getElementById("backToSetup").addEventListener("click", () => {
    // BGM 정지
    if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio = null;
    }

    // 타이머 정지
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    // 게임 상태 초기화
    score = 0;
    lives = 3;
    currentStage = selectedStage;
    gameStarted = false;

    // 화면 전환
    document.getElementById("game-container").style.display = "none";
    document.getElementById("startScreen").style.display = "flex";
});