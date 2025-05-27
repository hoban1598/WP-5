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

  //게임 시작 버튼 클릭 시 선택된 스테이지 보여주기
  $('.setting-start-button').on('click', function () {
    const selectedStageText = $('.stage-button.selected .stage-button-text').text().trim().toLowerCase();
    const selectedStageId = selectedStageText; // 예: 'stage1'

    $('.setup-wrapper').fadeOut(300, function () {
      $('.game-stage').hide(); // 모든 스테이지 숨김
      $(`#${selectedStageId}`).fadeIn(300); // 선택된 스테이지만 보여줌
    });
  });

  setupSelectionHandlers();

  // 4. 게임실행화면
  //설정에서 고른 캐릭터,펫(공),배경음악,스테이지 이름 적용로직
  //초기설정으로 버튼 누르면 설정화면으로 이동하는 로직
  //점수로직
  //목숨 줄어드는 로직
  //제한시간 줄어드는 로직
  //벽돌깨기 게임 로직
  //스테이지 클리어시 다음스테이지로 넘어가고 스테이지 3클리어시 엔딩화면인 ending-wrapper로 화면전환되는 로직
  // 5. 엔딩 화면
  const endingMessages = [
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

  let endingMessageIndex = 0;

  $('.ending-button.next').on('click', function () {
    endingMessageIndex++;
    if (endingMessageIndex < endingMessages.length) {
      $('.ending-message').html(endingMessages[endingMessageIndex]);
    }
    if (endingMessageIndex === endingMessages.length - 1) {
      $('.ending-button.next').hide();
      $('.ending-wrapper').fadeOut(300, function () {
        $('.endingcredit-wrapper').fadeIn(300);
      });
    }
  });
  $('.ending-button.skip').on('click', function () {
    $('.ending-wrapper').fadeOut(300, function () {
      $('.endingcredit-wrapper').fadeIn(300);
    });
  });
  //6.엔딩 크레딧 화면
});