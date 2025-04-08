// DOM要素の取得
const chatContainer = document.querySelector('.chat-container');
const chatMessages = document.querySelector('.chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-message');
const backButton = document.getElementById('back-to-selection');
const selectedCharacterImg = document.getElementById('selected-character');
const characterThumbnails = document.querySelectorAll('.character-thumb');
const sliderContainer = document.querySelector('.slider-container');

// 現在選択されているキャラクター
let currentCharacter = {
  id: '1',
  name: 'キャラクター「ryota」',
  image: 'images/characters/1.png',
};

// キャラクター情報
const characters = {
  1: {
    id: '1',
    name: 'キャラクター「ryota」',
    image: 'images/characters/1.png',
  },
  2: {
    id: '2',
    name: 'キャラクター「新人A」',
    image: 'images/characters/2.jpg',
  },
  3: {
    id: '3',
    name: 'キャラクター「天使の猫ちゃん」',
    image: 'images/characters/3.png',
  },
};

// 初期化関数 - DOMロード完了時に実行
document.addEventListener('DOMContentLoaded', function () {
  // チャット画面の初期化
  chatContainer.style.display = 'none';

  // スライダー画像のクリックイベント - スマホでも動作するようタッチイベントを追加
  const addClickAndTouchEvent = (element, handler) => {
    element.addEventListener('click', handler);
    element.addEventListener('touchend', function (e) {
      e.preventDefault(); // タップ後のクリックイベント発火を防止
      handler.call(this, e);
    });
  };

  // スライダーの画像にイベント追加
  document.querySelectorAll('.slide img').forEach((img) => {
    addClickAndTouchEvent(img, function () {
      const characterId = this.dataset.character;
      showChat(characterId);
    });
  });

  // キャラクターサムネイルにイベント追加
  characterThumbnails.forEach((thumb) => {
    addClickAndTouchEvent(thumb, function () {
      const characterId = this.dataset.character;
      switchCharacter(characterId);
    });
  });

  // 戻るボタンにイベント追加
  addClickAndTouchEvent(backButton, hideChat);

  // 送信ボタンの動作設定
  addClickAndTouchEvent(sendButton, sendMessage);

  // エンターキーでも送信可能にする
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  // iOS対応：ビューポート高さの調整
  const setVh = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  setVh();
  window.addEventListener('resize', setVh);
});

// チャット画面の表示
function showChat(characterId) {
  const character = characters[characterId];
  if (!character) return;

  // スライダーを非表示
  sliderContainer.style.display = 'none';

  currentCharacter = character;
  selectedCharacterImg.src = character.image;
  chatContainer.classList.add('visible');
  updateActiveThumbnail();

  // チャット履歴をクリア
  chatMessages.innerHTML = '';
  // 初期メッセージを表示
  addMessage(`${character.name}が選択されました。`, 'bot');

  // スクロール位置をトップに
  window.scrollTo(0, 0);

  // モバイルデバイスではフォーカスをメッセージ入力欄に
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      // 少し遅延させることでアニメーション後に実行
      messageInput.focus();
    }, 500);
  }
}

// チャット画面を閉じる
function hideChat() {
  chatContainer.classList.remove('visible');
  // スライダーを表示
  sliderContainer.style.display = 'block';
  // チャット履歴をクリア
  chatMessages.innerHTML = '';

  // 入力フィールドをクリア
  messageInput.value = '';

  // スクロール位置をトップに
  window.scrollTo(0, 0);
}

// メッセージの送信
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // ユーザーメッセージの表示
  addMessage(message, 'user');
  messageInput.value = '';

  try {
    // APIリクエストの送信（デモではモックレスポンスを使用）
    setTimeout(() => {
      // ランダムな応答を生成
      const responses = [
        'なるほど、それは興味深いですね！',
        'もっと詳しく教えていただけますか？',
        'それについては、私も同感です！',
        'おもしろい視点ですね！',
        'そうなんですね、知りませんでした！',
        'それはどういう意味ですか？もう少し教えてください。',
        'そのお話、とても面白いです！続きを聞かせてください。',
        'うーん、それは難しい質問ですね...',
      ];
      const response = responses[Math.floor(Math.random() * responses.length)];
      addMessage(response, 'bot');
    }, 1000);
  } catch (error) {
    console.error('Error:', error);
    addMessage('申し訳ありません。エラーが発生しました。', 'bot');
  }
}

// メッセージの追加
function addMessage(message, type) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', type);

  const contentElement = document.createElement('div');
  contentElement.classList.add('message-content');
  contentElement.textContent = message;

  if (type === 'bot') {
    const avatarElement = document.createElement('img');
    avatarElement.src = currentCharacter.image;
    avatarElement.alt = currentCharacter.name;
    avatarElement.style.width = '40px';
    avatarElement.style.height = '40px';
    avatarElement.style.borderRadius = '50%';
    avatarElement.style.objectFit = 'contain';
    avatarElement.style.backgroundColor = 'rgba(20, 20, 30, 0.8)';
    avatarElement.style.padding = '2px';
    messageElement.appendChild(avatarElement);
  }

  messageElement.appendChild(contentElement);
  chatMessages.appendChild(messageElement);

  // アニメーション付きでスクロール
  setTimeout(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }, 100);
}

// アクティブなサムネイルの更新
function updateActiveThumbnail() {
  characterThumbnails.forEach((thumb) => {
    if (thumb.dataset.character === currentCharacter.id) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

// キャラクター切り替え
function switchCharacter(characterId) {
  if (currentCharacter.id === characterId) return;

  const character = characters[characterId];
  if (!character) return;

  currentCharacter = character;
  selectedCharacterImg.src = character.image;
  updateActiveThumbnail();

  // チャット履歴をクリア
  chatMessages.innerHTML = '';
  addMessage(`${character.name}が選択されました。`, 'bot');
}
