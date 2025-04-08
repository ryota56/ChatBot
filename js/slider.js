document.addEventListener('DOMContentLoaded', () => {
  const slider = document.querySelector('.slider');
  const sliderContainer = document.querySelector('.slider-container');
  const slides = document.querySelectorAll('.slide');
  const prevButton = document.querySelector('.prev');
  const nextButton = document.querySelector('.next');
  const indicators = document.querySelectorAll('.indicator');
  const chatContainer = document.querySelector('.chat-container');
  const backButton = document.getElementById('back-to-selection');

  let currentSlide = 0;
  const slideCount = slides.length;

  // スライドを更新する関数
  function updateSlide(index) {
    slider.style.transform = `translateX(-${index * 33.333}%)`;

    // インジケーターの更新
    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === index);
    });

    currentSlide = index;
  }

  // 次のスライドへ
  function nextSlide() {
    const next = (currentSlide + 1) % slideCount;
    updateSlide(next);
  }

  // 前のスライドへ
  function prevSlide() {
    const prev = (currentSlide - 1 + slideCount) % slideCount;
    updateSlide(prev);
  }

  // クリックとタッチイベントを同時に設定する関数
  function addClickAndTouchEvent(element, handler) {
    if (!element) return; // 要素が存在しない場合は処理しない

    element.addEventListener('click', handler);
    element.addEventListener('touchend', function (e) {
      // タップ後のクリックイベント発火を防止
      e.preventDefault();
      handler.call(this, e);
    });
  }

  // ボタンイベントリスナー
  addClickAndTouchEvent(nextButton, nextSlide);
  addClickAndTouchEvent(prevButton, prevSlide);

  // インジケーターのクリックイベント
  indicators.forEach((indicator, index) => {
    addClickAndTouchEvent(indicator, () => updateSlide(index));
  });

  // タッチスワイプ対応
  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener(
    'touchstart',
    (e) => {
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  ); // パフォーマンス向上のためpassive: true

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].clientX;
    handleSwipe();
  });

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchEndX - touchStartX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
  }

  // スライド画像のクリックイベント
  slides.forEach((slide) => {
    const img = slide.querySelector('img');
    if (img) {
      addClickAndTouchEvent(img, () => {
        const character = img.dataset.character;
        selectCharacter(character);
      });
    }
  });

  // キャラクター選択時の処理
  function selectCharacter(characterId) {
    const selectedImage = document.querySelector(
      `img[data-character="${characterId}"]`
    ).src;
    document.getElementById('selected-character').src = selectedImage;

    // スライダーコンテナをフェードアウト
    sliderContainer.style.opacity = '0';

    // 少し遅延を入れてからチャット画面を表示
    setTimeout(() => {
      sliderContainer.style.display = 'none';
      chatContainer.style.display = 'block';
      // 表示後にopacityを変更してフェードイン
      setTimeout(() => {
        chatContainer.classList.add('visible');
      }, 50);
    }, 500);
  }

  // 戻るボタンの処理
  if (backButton) {
    addClickAndTouchEvent(backButton, () => {
      // チャット画面をフェードアウト
      chatContainer.classList.remove('visible');

      // 少し遅延を入れてからスライダーを表示
      setTimeout(() => {
        chatContainer.style.display = 'none';
        sliderContainer.style.display = 'block';
        // 表示後にopacityを変更してフェードイン
        setTimeout(() => {
          sliderContainer.style.opacity = '1';
        }, 50);
      }, 500);
    });
  }

  // 自動スライド切り替え（5秒ごと）
  let autoSlideInterval = setInterval(nextSlide, 5000);

  // マウスオーバー時に自動スライドを停止
  slider.addEventListener('mouseenter', () => {
    clearInterval(autoSlideInterval);
  });

  // マウスアウト時に自動スライドを再開
  slider.addEventListener('mouseleave', () => {
    autoSlideInterval = setInterval(nextSlide, 5000);
  });

  // タッチデバイスでも同様に処理
  slider.addEventListener(
    'touchstart',
    () => {
      clearInterval(autoSlideInterval);
    },
    { passive: true }
  );

  slider.addEventListener('touchend', () => {
    autoSlideInterval = setInterval(nextSlide, 5000);
  });

  // iOSデバイス向けにビューポート高さを調整
  function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  setVh();
  window.addEventListener('resize', setVh);
});
