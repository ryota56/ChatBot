// イベントリスナーを設定
document.addEventListener('DOMContentLoaded', function () {
  // スライダーのDOM要素を取得
  const sliderContainer = document.querySelector('.slider-container');
  const slides = document.querySelectorAll('.slide');
  const slidesCount = slides.length;
  let currentSlide = 0;

  // スライダーボタンの取得
  const prevButton = document.querySelector('.slider-prev');
  const nextButton = document.querySelector('.slider-next');

  // チャットのDOM要素を取得
  const chatContainer = document.querySelector('.chat-container');
  const selectedCharacterElement =
    document.getElementById('selected-character');
  const chatMessages = document.querySelector('.chat-messages');
  const messageInput = document.getElementById('message-input');
  const sendButton = document.getElementById('send-button');
  const backButton = document.getElementById('back-to-selection');

  // キャラクター切り替え用のサムネイルを取得
  const characterThumbnails = document.querySelectorAll('.character-thumb');

  // 選択中のキャラクターを管理
  let selectedCharacter = null;

  // 前のスライドに移動する関数
  function goToPrevSlide() {
    currentSlide = (currentSlide - 1 + slidesCount) % slidesCount;
    updateSlider();
  }

  // 次のスライドに移動する関数
  function goToNextSlide() {
    currentSlide = (currentSlide + 1) % slidesCount;
    updateSlider();
  }

  // スライダーを更新する関数
  function updateSlider() {
    slides.forEach((slide, index) => {
      if (index === currentSlide) {
        slide.classList.add('active');
      } else {
        slide.classList.remove('active');
      }
    });
  }

  // 初期表示時にアクティブなスライドを設定
  updateSlider();

  // スライダーボタンにイベントリスナーを設定
  prevButton.addEventListener('click', goToPrevSlide);
  nextButton.addEventListener('click', goToNextSlide);

  // キャラクターを選択する関数
  function selectCharacter(character) {
    selectedCharacter = character;

    // キャラクター画像とテキストを設定
    selectedCharacterElement.textContent = character;

    // スライダーを非表示にし、チャット画面を表示
    sliderContainer.style.display = 'none';
    chatContainer.style.display = 'flex';

    // 初期メッセージを追加
    addMessage(
      'こんにちは！' + character + 'です。何か話しましょうか？',
      'character'
    );
  }

  // スライドのキャラクター選択ボタンにイベントリスナーを設定
  slides.forEach((slide) => {
    const selectButtons = slide.querySelectorAll('.select-character');
    selectButtons.forEach((button) => {
      button.addEventListener('click', function () {
        const character = this.getAttribute('data-character');
        selectCharacter(character);
      });
    });
  });

  // キャラクターサムネイルにイベントリスナーを設定
  characterThumbnails.forEach((thumb) => {
    thumb.addEventListener('click', function () {
      const character = this.getAttribute('data-character');

      // 現在選択されているキャラクターと異なる場合のみ切り替え
      if (character !== selectedCharacter) {
        // チャット履歴をクリア
        chatMessages.innerHTML = '';

        // 新しいキャラクターを選択
        selectCharacter(character);

        // アクティブなサムネイルのスタイルを更新
        characterThumbnails.forEach((t) => {
          if (t.getAttribute('data-character') === character) {
            t.classList.add('active');
          } else {
            t.classList.remove('active');
          }
        });
      }
    });
  });

  // メッセージをチャットに追加する関数
  function addMessage(text, sender) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(sender);
    messageElement.textContent = text;
    chatMessages.appendChild(messageElement);

    // 自動スクロールでメッセージを表示
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // 送信ボタンのクリックイベント
  sendButton.addEventListener('click', sendMessage);

  // エンターキーでも送信できるようにする
  messageInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // メッセージを送信する関数
  function sendMessage() {
    const message = messageInput.value.trim();
    if (message && selectedCharacter) {
      // ユーザーのメッセージを追加
      addMessage(message, 'user');

      // 入力フィールドをクリア
      messageInput.value = '';

      // キャラクターの返答を生成（簡易的なもの）
      setTimeout(() => {
        const responses = [
          'なるほど、興味深いですね！',
          'それについて、もっと教えてください！',
          'わかります。私も同じように感じることがあります。',
          'それは素晴らしいアイデアですね！',
          'うーん、考えさせられますね。',
          '本当ですか？それは知りませんでした！',
          'そうなんですね！それで、他には何か？',
          'それについて、違う視点から考えてみましょうか？',
        ];
        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];
        addMessage(randomResponse, 'character');
      }, 1000);
    }
  }

  // 戻るボタンのクリックイベント
  backButton.addEventListener('click', function () {
    // チャット画面を非表示にし、スライダーを表示
    chatContainer.style.display = 'none';
    sliderContainer.style.display = 'block';

    // チャット履歴をクリア
    chatMessages.innerHTML = '';
    messageInput.value = '';

    // 選択中のキャラクターをリセット
    selectedCharacter = null;
  });
});
