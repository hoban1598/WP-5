$(document).ready(() => {
  // 캔버스 및 컨텍스트 설정
  const canvas = document.getElementById("game-canvas")
  const ctx = canvas.getContext("2d")

  // 캔버스 크기 설정
  function resizeCanvas() {
    canvas.width = $("#game-container").width()
    canvas.height = $("#game-container").height()
  }

  resizeCanvas()
  $(window).on("resize", resizeCanvas)

  // 게임 상태 변수
  let gameStarted = false
  let gamePaused = false
  let score = 0
  let lives = 3
  let difficulty = "easy"
  let gameLoopId

  // 공 속성
  const ball = {
    x: 0,
    y: 0,
    radius: 10,
    speedX: 4,
    speedY: -4,
    color: "#FF5722",
  }

  // 패들 속성
  const paddle = {
    x: 0,
    y: 0,
    width: 100,
    height: 15,
    color: "#2196F3",
  }

  // 벽돌 속성
  let bricks = []
  const brickWidth = 70
  const brickHeight = 30
  const brickMargin = 10
  let brickRowCount = 5
  let brickColumnCount = 8

  // 벽돌 색상
  const brickColors = [
    "#4CAF50", // 녹색
    "#2196F3", // 파란색
    "#FFC107", // 노란색
    "#9C27B0", // 보라색
    "#FF5722", // 주황색
    "#607D8B", // 회색
  ]

  // 퀴즈 카테고리
  const quizCategories = ["HTML", "CSS", "JS", "jQuery"]

  // 퀴즈 데이터
  const quizData = {
    HTML: [
      {
        question: "다음 중 HTML에서 이미지를 삽입하는 올바른 태그는?",
        options: [
          '<img src="image.jpg" alt="이미지">',
          '<image src="image.jpg">',
          '<picture src="image.jpg">',
          '<img href="image.jpg">',
        ],
        answer: 0,
        explanation: "<img> 태그는 src 속성으로 이미지 경로를 지정하고, alt 속성으로 대체 텍스트를 제공합니다.",
      },
      {
        question: "HTML 문서의 기본 구조에서 필수적인 태그가 아닌 것은?",
        options: ["<html>", "<head>", "<body>", "<footer>"],
        answer: 3,
        explanation: "<footer> 태그는 문서의 바닥글을 정의하는 태그로, HTML 문서의 기본 구조에 필수적이지 않습니다.",
      },
      {
        question: "다음 중 시맨틱 태그가 아닌 것은?",
        options: ["<article>", "<section>", "<div>", "<nav>"],
        answer: 2,
        explanation: "<div> 태그는 의미를 갖지 않는 컨테이너 요소로, 시맨틱 태그가 아닙니다.",
      },
      {
        question: "HTML에서 링크를 생성하는 태그는?",
        options: ["<link>", "<a>", "<href>", "<url>"],
        answer: 1,
        explanation: "<a> 태그는 하이퍼링크를 생성하는 태그로, href 속성을 사용하여 링크 대상을 지정합니다.",
      },
      {
        question: "다음 중 HTML5에서 추가된 태그가 아닌 것은?",
        options: ["<video>", "<audio>", "<canvas>", "<marquee>"],
        answer: 3,
        explanation: "<marquee> 태그는 HTML5 이전부터 존재했으며, 현재는 사용이 권장되지 않는 태그입니다.",
      },
    ],
    CSS: [
      {
        question: "CSS에서 클래스 선택자는 어떤 기호로 시작하나요?",
        options: ["#", ".", "@", "$"],
        answer: 1,
        explanation: "CSS에서 클래스 선택자는 마침표(.)로 시작합니다. 예: .className { }",
      },
      {
        question: "다음 중 CSS 박스 모델의 구성 요소가 아닌 것은?",
        options: ["margin", "border", "padding", "position"],
        answer: 3,
        explanation:
          "CSS 박스 모델은 content, padding, border, margin으로 구성됩니다. position은 요소의 위치를 지정하는 속성입니다.",
      },
      {
        question: "CSS에서 요소를 화면에서 숨기는 속성은?",
        options: ["visibility: hidden;", "display: none;", "opacity: 0;", "위의 모든 것"],
        answer: 3,
        explanation:
          "모든 옵션이 요소를 화면에서 숨기는 방법이지만, 각각 다르게 동작합니다. visibility:hidden은 공간을 유지하고, display:none은 공간도 제거하며, opacity:0은 투명하게 만듭니다.",
      },
      {
        question: "CSS에서 flexbox의 주축(main axis)을 설정하는 속성은?",
        options: ["flex-direction", "justify-content", "align-items", "flex-wrap"],
        answer: 0,
        explanation:
          "flex-direction 속성은 flexbox의 주축 방향을 설정합니다. row(기본값), row-reverse, column, column-reverse 값을 가질 수 있습니다.",
      },
      {
        question: "다음 중 CSS에서 가상 클래스(pseudo-class)가 아닌 것은?",
        options: [":hover", ":active", ":before", ":focus"],
        answer: 2,
        explanation:
          ":before는 가상 요소(pseudo-element)이며, ::before로 표기하는 것이 올바릅니다. 가상 클래스는 요소의 특정 상태를 선택합니다.",
      },
    ],
    JS: [
      {
        question: "JavaScript에서 변수를 선언하는 키워드가 아닌 것은?",
        options: ["var", "let", "const", "function"],
        answer: 3,
        explanation: "function은 함수를 선언하는 키워드입니다. 변수 선언에는 var, let, const를 사용합니다.",
      },
      {
        question: "다음 중 JavaScript의 원시 타입(primitive type)이 아닌 것은?",
        options: ["String", "Number", "Boolean", "Array"],
        answer: 3,
        explanation:
          "Array는 객체 타입입니다. JavaScript의 원시 타입은 String, Number, Boolean, Null, Undefined, Symbol, BigInt입니다.",
      },
      {
        question: "JavaScript에서 비동기 처리를 위한 객체는?",
        options: ["Object", "Promise", "Array", "Function"],
        answer: 1,
        explanation: "Promise는 비동기 작업의 최종 완료 또는 실패를 나타내는 객체입니다.",
      },
      {
        question: "다음 중 JavaScript에서 이벤트 리스너를 추가하는 메서드는?",
        options: ["addEventListener()", "attachEvent()", "appendListener()", "addEvent()"],
        answer: 0,
        explanation: "addEventListener() 메서드는 지정한 이벤트가 대상에 전달될 때마다 호출할 함수를 설정합니다.",
      },
      {
        question: "JavaScript에서 배열의 마지막 요소를 제거하는 메서드는?",
        options: ["pop()", "shift()", "splice()", "slice()"],
        answer: 0,
        explanation: "pop() 메서드는 배열에서 마지막 요소를 제거하고 그 요소를 반환합니다.",
      },
    ],
    jQuery: [
      {
        question: "jQuery에서 문서가 준비되었을 때 실행할 코드를 작성하는 방법은?",
        options: [
          "$(window).load(function() { });",
          "$(document).ready(function() { });",
          "$(body).onload(function() { });",
          "$(document).load(function() { });",
        ],
        answer: 1,
        explanation: "$(document).ready() 메서드는 DOM이 완전히 로드되었을 때 실행할 코드를 지정합니다.",
      },
      {
        question: "jQuery에서 요소의 클래스를 추가하는 메서드는?",
        options: [".addClass()", ".setClass()", ".appendClass()", ".insertClass()"],
        answer: 0,
        explanation: ".addClass() 메서드는 선택한 요소에 하나 이상의 클래스를 추가합니다.",
      },
      {
        question: "jQuery에서 AJAX 요청을 보내는 기본 메서드는?",
        options: ["$.ajax()", "$.get()", "$.post()", "모든 답변이 맞습니다"],
        answer: 3,
        explanation: "$.ajax()는 기본 AJAX 메서드이며, $.get()과 $.post()는 $.ajax()의 단축 메서드입니다.",
      },
      {
        question: "jQuery에서 요소의 내용을 변경하는 메서드가 아닌 것은?",
        options: [".text()", ".html()", ".val()", ".content()"],
        answer: 3,
        explanation:
          ".content() 메서드는 jQuery에 존재하지 않습니다. 요소의 내용을 변경하는 메서드는 .text(), .html(), .val() 등이 있습니다.",
      },
      {
        question: "jQuery에서 요소를 숨기는 메서드는?",
        options: [".hide()", ".invisible()", ".display()", ".remove()"],
        answer: 0,
        explanation: ".hide() 메서드는 선택한 요소를 숨깁니다. .remove()는 요소를 DOM에서 제거합니다.",
      },
    ],
  }

  // 난이도 설명 업데이트
  function updateDifficultyDescription(difficulty) {
    let description = ""
    switch (difficulty) {
      case "easy":
        description = "쉬움: 공 속도가 느리고, 패들이 넓습니다."
        break
      case "normal":
        description = "보통: 공 속도와 패들 크기가 균형을 이룹니다."
        break
      case "hard":
        description = "어려움: 공 속도가 빠르고, 패들이 좁습니다."
        break
    }
    $("#difficulty-desc").text(description)
  }

  // 난이도 버튼 클릭 이벤트
  $(".difficulty-btn").on("click", function () {
    $(".difficulty-btn").removeClass("selected")
    $(this).addClass("selected")
    difficulty = $(this).data("difficulty")
    updateDifficultyDescription(difficulty)
  })

  // 벽돌 생성 함수
  function createBricks() {
    bricks = []

    // 난이도에 따른 벽돌 배치 조정
    switch (difficulty) {
      case "easy":
        brickRowCount = 4
        brickColumnCount = 7
        break
      case "normal":
        brickRowCount = 5
        brickColumnCount = 8
        break
      case "hard":
        brickRowCount = 6
        brickColumnCount = 9
        break
    }

    // 벽돌 생성
    for (let r = 0; r < brickRowCount; r++) {
      for (let c = 0; c < brickColumnCount; c++) {
        // 벽돌 위치 계산
        const brickX = c * (brickWidth + brickMargin) + brickMargin
        const brickY = r * (brickHeight + brickMargin) + brickMargin + 50

        // 랜덤 색상 선택
        const colorIndex = Math.floor(Math.random() * brickColors.length)

        // 퀴즈 벽돌 여부 결정 (약 40% 확률)
        const isQuizBrick = Math.random() < 0.4

        // 퀴즈 카테고리 선택
        const categoryIndex = Math.floor(Math.random() * quizCategories.length)

        bricks.push({
          x: brickX,
          y: brickY,
          width: brickWidth,
          height: brickHeight,
          color: brickColors[colorIndex],
          visible: true,
          isQuiz: isQuizBrick,
          category: isQuizBrick ? quizCategories[categoryIndex] : null,
        })
      }
    }
  }

  // 게임 초기화 함수
  function initGame() {
    // 게임 상태 초기화
    score = 0
    lives = 3

    // 난이도에 따른 게임 설정
    switch (difficulty) {
      case "easy":
        ball.speedX = 4
        ball.speedY = -4
        paddle.width = 120
        break
      case "normal":
        ball.speedX = 5
        ball.speedY = -5
        paddle.width = 100
        break
      case "hard":
        ball.speedX = 6
        ball.speedY = -6
        paddle.width = 80
        break
    }

    // UI 업데이트
    $("#score").text(score)
    $("#lives").text(lives)

    // 공 위치 초기화
    ball.x = canvas.width / 2
    ball.y = canvas.height / 2
    ball.speedX = ball.speedX * (Math.random() > 0.5 ? 1 : -1)
    ball.speedY = -Math.abs(ball.speedY)

    // 패들 위치 초기화
    paddle.x = (canvas.width - paddle.width) / 2
    paddle.y = canvas.height - paddle.height - 20

    // 벽돌 생성
    createBricks()

    // 게임 요소 표시
    $("#game-canvas").show()
    $("#start-screen").hide()
    $("#game-over").hide()
    $("#game-clear").hide()

    // 게임 루프 시작
    gameStarted = true
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId)
    }
    gameLoop()
  }

  // 게임 루프 함수
  function gameLoop() {
    if (!gameStarted || gamePaused) {
      gameLoopId = requestAnimationFrame(gameLoop)
      return
    }

    // 캔버스 지우기
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 공 이동
    ball.x += ball.speedX
    ball.y += ball.speedY

    // 벽 충돌 감지
    if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
      ball.speedX = -ball.speedX
    }

    if (ball.y - ball.radius <= 0) {
      ball.speedY = -ball.speedY
    }

    // 바닥 충돌 (게임 오버 또는 생명 감소)
    if (ball.y + ball.radius >= canvas.height) {
      lives--
      $("#lives").text(lives)

      if (lives <= 0) {
        gameOver()
      } else {
        // 공 위치 초기화
        ball.x = canvas.width / 2
        ball.y = canvas.height / 2
        ball.speedX = ball.speedX * (Math.random() > 0.5 ? 1 : -1)
        ball.speedY = -Math.abs(ball.speedY)

        // 패들 위치 초기화
        paddle.x = (canvas.width - paddle.width) / 2
      }
    }

    // 패들 충돌 감지
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x + ball.radius >= paddle.x &&
      ball.x - ball.radius <= paddle.x + paddle.width
    ) {
      // 충돌 위치에 따라 반사 각도 조정
      const hitPosition = ball.x - (paddle.x + paddle.width / 2)
      const normalizedHit = hitPosition / (paddle.width / 2)

      ball.speedX = normalizedHit * 5
      ball.speedY = -Math.abs(ball.speedY)
    }

    // 벽돌 충돌 감지
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i]

      if (brick.visible) {
        if (
          ball.x + ball.radius >= brick.x &&
          ball.x - ball.radius <= brick.x + brick.width &&
          ball.y + ball.radius >= brick.y &&
          ball.y - ball.radius <= brick.y + brick.height
        ) {
          // 충돌 방향에 따라 반사
          const fromBottom = Math.abs(ball.y - ball.radius - (brick.y + brick.height))
          const fromTop = Math.abs(ball.y + ball.radius - brick.y)
          const fromLeft = Math.abs(ball.x + ball.radius - brick.x)
          const fromRight = Math.abs(ball.x - ball.radius - (brick.x + brick.width))

          const min = Math.min(fromBottom, fromTop, fromLeft, fromRight)

          if (min === fromBottom || min === fromTop) {
            ball.speedY = -ball.speedY
          } else {
            ball.speedX = -ball.speedX
          }

          // 벽돌 제거
          brick.visible = false

          // 퀴즈 벽돌인 경우 퀴즈 출제
          if (brick.isQuiz) {
            showQuiz(brick.category)
          } else {
            // 일반 벽돌인 경우 점수 증가
            score += 10
            $("#score").text(score)
          }

          // 모든 벽돌이 제거되었는지 확인
          if (bricks.every((b) => !b.visible)) {
            gameClear()
          }

          break
        }
      }
    }

    // 요소 그리기
    drawBall()
    drawPaddle()
    drawBricks()

    // 다음 프레임 요청
    gameLoopId = requestAnimationFrame(gameLoop)
  }

  // 공 그리기 함수
  function drawBall() {
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
    ctx.fillStyle = ball.color
    ctx.fill()
    ctx.closePath()
  }

  // 패들 그리기 함수
  function drawPaddle() {
    ctx.beginPath()
    ctx.rect(paddle.x, paddle.y, paddle.width, paddle.height)
    ctx.fillStyle = paddle.color
    ctx.fill()
    ctx.closePath()
  }

  // 벽돌 그리기 함수
  function drawBricks() {
    for (let i = 0; i < bricks.length; i++) {
      const brick = bricks[i]

      if (brick.visible) {
        // 벽돌 배경 그리기
        ctx.beginPath()
        ctx.rect(brick.x, brick.y, brick.width, brick.height)
        ctx.fillStyle = brick.color
        ctx.fill()
        ctx.closePath()

        // 퀴즈 벽돌인 경우 텍스트 표시
        if (brick.isQuiz) {
          ctx.font = "12px Arial"
          ctx.fillStyle = "white"
          ctx.textAlign = "center"
          ctx.textBaseline = "middle"
          ctx.fillText(brick.category, brick.x + brick.width / 2, brick.y + brick.height / 2)
        }
      }
    }
  }

  // 퀴즈 표시 함수
  function showQuiz(category) {
    // 게임 일시 정지
    gamePaused = true

    // 해당 카테고리의 퀴즈 중 랜덤 선택
    const quizzes = quizData[category]
    const randomIndex = Math.floor(Math.random() * quizzes.length)
    const quiz = quizzes[randomIndex]

    // 퀴즈 내용 설정
    $("#quiz-category").text(category + " 퀴즈")
    $("#quiz-question").text(quiz.question)
    $("#quiz-options").empty()
    $("#quiz-explanation").addClass("hidden")

    // 선택지 생성
    quiz.options.forEach((option, index) => {
      const $option = $("<div>").addClass("quiz-option").html(option).data("index", index)

      $("#quiz-options").append($option)
    })

    // 퀴즈 모달 표시
    $("#quiz-modal").css("display", "flex").addClass("fade-in")

    // 선택지 클릭 이벤트
    $(".quiz-option").on("click", function () {
      const selectedIndex = $(this).data("index")
      const isCorrect = selectedIndex === quiz.answer

      // 정답/오답 표시
      $(".quiz-option").each(function () {
        const index = $(this).data("index")
        if (index === quiz.answer) {
          $(this).addClass("correct")
        } else if (index === selectedIndex && !isCorrect) {
          $(this).addClass("incorrect")
        }
      })

      // 해설 표시
      $("#quiz-explanation").removeClass("hidden").html(quiz.explanation)

      // 점수 처리
      if (isCorrect) {
        score += 20
        $("#score").text(score)
      }

      // 클릭 이벤트 제거 (중복 클릭 방지)
      $(".quiz-option").off("click")

      // 3초 후 퀴즈 모달 닫기
      setTimeout(() => {
        $("#quiz-modal").fadeOut(300, () => {
          // 게임 재개
          gamePaused = false

          // 모든 벽돌이 제거되었는지 확인
          if (bricks.every((b) => !b.visible)) {
            gameClear()
          }
        })
      }, 3000)
    })
  }

  // 게임 오버 함수
  function gameOver() {
    // 게임 종료
    gameStarted = false

    // 최종 점수 표시
    $("#final-score").text(score)

    // 게임 오버 화면 표시
    $("#game-canvas").hide()
    $("#game-over").fadeIn(500)
  }

  // 게임 클리어 함수
  function gameClear() {
    // 게임 종료
    gameStarted = false

    // 최종 점수 표시
    $("#clear-score").text(score)

    // 게임 클리어 화면 표시
    $("#game-canvas").hide()
    $("#game-clear").fadeIn(500)
  }

  // 마우스 이동 이벤트 (패들 제어)
  $("#game-container").on("mousemove", function (e) {
    if (!gameStarted) return

    const gameOffset = $(this).offset()
    const relativeX = e.pageX - gameOffset.left

    // 패들이 게임 영역을 벗어나지 않도록 제한
    paddle.x = Math.max(0, Math.min(relativeX - paddle.width / 2, canvas.width - paddle.width))
  })

  // 게임 시작 버튼 클릭
  $("#start-button").on("click", () => {
    initGame()
  })

  // 다시 시작 버튼 클릭
  $("#restart-button, #play-again-button").on("click", () => {
    initGame()
  })

  // 창 크기 변경 이벤트
  $(window).on("resize", () => {
    resizeCanvas()

    if (gameStarted) {
      // 패들 위치 조정
      paddle.y = canvas.height - paddle.height - 20

      // 패들이 게임 영역을 벗어나지 않도록 제한
      paddle.x = Math.min(paddle.x, canvas.width - paddle.width)
    }
  })

  // 초기 난이도 설명 설정
  updateDifficultyDescription("easy")
})
