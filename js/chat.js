// DOM要素の取得
const chatContainer = document.querySelector('.chat-container');
const chatMessages = document.querySelector('.chat-messages');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-message');
const backButton = document.getElementById('back-to-selection');
const selectedCharacterImg = document.getElementById('selected-character');
const characterThumbnails = document.querySelectorAll('.character-thumb');
const sliderContainer = document.querySelector('.slider-container');

// Dify API設定を外部ファイルからインポート
import { DIFY_CONFIG } from './config.js';

// ES Modulesがサポートされていない場合のフォールバック
// (config.jsでグローバル変数としても公開している場合に使用)
let difyConfig = DIFY_CONFIG;
if (typeof difyConfig === 'undefined' && typeof window.DIFY_CONFIG !== 'undefined') {
  difyConfig = window.DIFY_CONFIG;
  console.log('ES Modulesがサポートされていません。グローバル変数からの設定を使用します。');
}

// ユーザーIDを生成
const USER_ID = "user-" + Math.random().toString(36).substring(2, 15);

// 現在選択されているキャラクター
let currentCharacter = {
  id: '1',
  name: 'キャラクター「ryota」',
  image: 'images/characters/1.png',
  dify_input: 'ryota' // Difyの分岐条件に合わせて小文字に戻す
};

// キャラクター情報
const characters = {
  1: {
    id: '1',
    name: 'キャラクター「ryota」',
    image: 'images/characters/1.png',
    dify_input: 'ryota' // Difyの分岐条件に合わせて小文字に戻す
  },
  2: {
    id: '2',
    name: 'キャラクター「新人A」',
    image: 'images/characters/2.jpg',
    dify_input: '新人A' // すでに正しい
  },
  3: {
    id: '3',
    name: 'キャラクター「天使の猫ちゃん」',
    image: 'images/characters/3.png',
    dify_input: '天使の猫' // すでに正しい
  },
};

// 会話履歴を保持する変数
let conversations = {
  1: { id: null, messages: [], hasStarted: false },
  2: { id: null, messages: [], hasStarted: false },
  3: { id: null, messages: [], hasStarted: false }
};

// 選択画面から直接選択したかどうかのフラグ
let comingFromSelectionScreen = true;

// 初期化関数 - DOMロード完了時に実行
document.addEventListener('DOMContentLoaded', function () {
  // チャット画面の初期化
  chatContainer.style.display = 'none';

  // 会話IDを確実に初期化
  for (const key in conversations) {
    conversations[key].id = null;
    conversations[key].hasStarted = false;
  }

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
  
  // 定型メッセージボタンにイベント追加
  document.querySelectorAll('.predefined-message-btn').forEach((btn) => {
    addClickAndTouchEvent(btn, function () {
      // ボタンのテキストをメッセージ入力欄に設定
      messageInput.value = this.textContent;
      // メッセージを自動送信
      sendMessage();
    });
  });

  // キー入力の処理を変更
  messageInput.addEventListener('keydown', (e) => {
    // Shift+Enter または Ctrl+Enter で送信
    if (e.key === 'Enter' && (e.shiftKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
    // 通常のEnterキーは改行を許可（デフォルト動作）
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

  console.log("********************* キャラクター選択 *********************");
  console.log("選択されたキャラクターID:", characterId);
  console.log("キャラクター情報:", character);
  console.log("キャラクターのDify input値:", character.dify_input);
  console.log("***********************************************************");

  // スライダーを非表示
  sliderContainer.style.display = 'none';

  currentCharacter = character;
  selectedCharacterImg.src = character.image;
  chatContainer.classList.add('visible');
  updateActiveThumbnail();

  // 選択画面から来た場合は会話履歴をリセット
  if (comingFromSelectionScreen) {
    resetConversation(characterId);
    comingFromSelectionScreen = false;
  }

  // チャット履歴をクリア
  chatMessages.innerHTML = '';
  
  // 会話履歴があれば表示
  if (conversations[characterId].messages.length > 0) {
    conversations[characterId].messages.forEach(msg => {
      addMessage(msg.content, msg.type);
    });
  } else {
    // 初期メッセージを表示
    addMessage(`${character.name}が選択されました。`, 'bot');
    
    // 会話履歴に追加
    conversations[characterId].messages.push({
      content: `${character.name}が選択されました。`,
      type: 'bot'
    });
  }

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

// 会話をリセットする関数
function resetConversation(characterId) {
  conversations[characterId].id = null;
  conversations[characterId].messages = [];
  conversations[characterId].hasStarted = false;
  console.log(`キャラクターID ${characterId} の会話履歴をリセットしました。`);
}

// チャット画面を閉じる
function hideChat() {
  chatContainer.classList.remove('visible');
  // スライダーを表示
  sliderContainer.style.display = 'block';
  // チャット履歴をクリア（履歴は保持）
  chatMessages.innerHTML = '';

  // 入力フィールドをクリア
  messageInput.value = '';

  // 選択画面に戻ったことを記録
  comingFromSelectionScreen = true;

  // スクロール位置をトップに
  window.scrollTo(0, 0);
}

// メッセージの送信
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // ユーザーメッセージの表示
  addMessage(message, 'user');
  
  // 会話履歴に追加
  conversations[currentCharacter.id].messages.push({
    content: message,
    type: 'user'
  });
  
  messageInput.value = '';
  
  // 入力中の表示
  const loadingMessageId = showLoadingMessage();

  try {
    // リクエストパラメータの準備
    const requestParams = {
      inputs: {
        input: currentCharacter.dify_input
      },
      query: message,
      response_mode: difyConfig.RESPONSE_MODE,
      user: USER_ID
    };

    // 会話IDがあり、空でなければ追加
    const conversationId = conversations[currentCharacter.id].id;
    if (conversationId) {
      requestParams.conversation_id = conversationId;
    }

    // デバッグ用：詳細なリクエスト情報
    console.log("********************* DIFY API リクエスト *********************");
    console.log("送信URL:", `${difyConfig.API_ENDPOINT}/chat-messages`);
    console.log("送信メソッド:", "POST");
    console.log("送信ヘッダー:", {
      'Authorization': `Bearer ${difyConfig.API_KEY}`,
      'Content-Type': 'application/json'
    });
    console.log("キャラクター情報:", currentCharacter);
    console.log("リクエストボディ:", JSON.stringify(requestParams, null, 2));
    console.log("***************************************************************");

    // Dify APIにリクエスト
    const response = await fetch(`${difyConfig.API_ENDPOINT}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyConfig.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestParams)
    });

    // デバッグ用：レスポンスのステータス情報
    console.log("********************* DIFY API レスポンス *********************");
    console.log("レスポンスステータス:", response.status);
    console.log("レスポンスOK:", response.ok);
    console.log("***************************************************************");

    // レスポンスステータスをチェック
    if (!response.ok) {
      // レスポンスのエラーコードとメッセージをログに出力
      const errorText = await response.text();
      console.error("APIレスポンスエラー:", response.status, errorText);
      
      try {
        // エラーJSONを解析
        const errorJson = JSON.parse(errorText);
        if (errorJson.code === "not_found" && errorJson.message.includes("Conversation Not Exists")) {
          console.log("会話IDがリセットされました。新しい会話を開始します。");
          conversations[currentCharacter.id].id = null;
          
          // 入力中メッセージを削除
          removeLoadingMessage(loadingMessageId);
          
          // 会話IDを削除した状態で再度リクエスト
          const newRequestParams = { ...requestParams };
          delete newRequestParams.conversation_id;
          
          console.log("リトライリクエスト:", newRequestParams);
          
          const retryResponse = await fetch(`${difyConfig.API_ENDPOINT}/chat-messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${difyConfig.API_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRequestParams)
          });
          
          if (retryResponse.ok) {
            // 入力中の表示を削除
            removeLoadingMessage(loadingMessageId);
            
            if (difyConfig.RESPONSE_MODE === 'streaming') {
              handleStreamingResponse(retryResponse);
            } else {
              handleBlockingResponse(retryResponse);
            }
            return;
          } else {
            throw new Error(`Retry failed with status ${retryResponse.status}`);
          }
        }
      } catch (e) {
        console.error("エラー処理中に例外が発生:", e);
      }
      
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    // 入力中の表示を削除
    removeLoadingMessage(loadingMessageId);

    // レスポンスの処理
    if (difyConfig.RESPONSE_MODE === 'streaming') {
      // ストリーミングモードの処理
      handleStreamingResponse(response);
    } else {
      // ブロッキングモードの処理
      handleBlockingResponse(response);
    }
  } catch (error) {
    console.error('Error:', error);
    removeLoadingMessage(loadingMessageId);
    
    // エラーメッセージを表示
    if (error.message.includes('404')) {
      addMessage('APIエンドポイントが見つかりません。URLが正しいか確認してください。', 'bot');
    } else if (error.message.includes('401')) {
      addMessage('APIキーが無効または権限がありません。', 'bot');
    } else if (error.message.includes('CORS')) {
      addMessage('CORSポリシーの問題が発生しました。サーバー設定を確認してください。', 'bot');
    } else {
      addMessage('申し訳ありません。エラーが発生しました: ' + error.message, 'bot');
    }
    
    // 会話履歴に追加
    conversations[currentCharacter.id].messages.push({
      content: '申し訳ありません。エラーが発生しました。',
      type: 'bot'
    });
    
    // テスト用のモックレスポンス（API接続がうまくいかない場合のフォールバック）
    setTimeout(() => {
      const mockResponses = {
        '1': [
          'いや、めっちゃ分かりますよ〜！最初は僕もそんな感じでした☺️',
          'ええ、それいいですね！一緒に頑張りましょう✨',
          'そこまで気にしなくても大丈夫ですよ！コツコツ積み上げていけば、いつか結果は出ますから！'
        ],
        '2': [
          'そうなんですよねぇ～！ワタシもビックリでしたぁ～✨',
          'それ、めっちゃわかりますぅ～！実は私も最初は困ってましたぁ～👍',
          'へぇ～！なるほどですねぇ～！そういう方法もあるんですね～🎯'
        ],
        '3': [
          'そうやで✨ めっちゃ応援してるからね💖',
          'ぜ～んぜん大丈夫やで！安心してな🌸',
          'うちは安心して働けるお店やで🌸 気になることがあったら、いつでも聞いてな😊'
        ]
      };
      
      const characterId = currentCharacter.id;
      const responses = mockResponses[characterId] || mockResponses['1'];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      console.log("********************* モックレスポンス（フォールバック）表示 *********************");
      console.log("キャラクターID:", characterId);
      console.log("選択されたレスポンス:", randomResponse);
      console.log("******************************************************************************");
      
      // モックレスポンスを表示
      addMessage("[モックレスポンス] " + randomResponse, 'bot');
      
      // 会話履歴に追加
      conversations[currentCharacter.id].messages.push({
        content: "[モックレスポンス] " + randomResponse,
        type: 'bot'
      });
    }, 1000);
  }
}

// 入力中メッセージの表示
function showLoadingMessage() {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', 'bot', 'loading');
  messageElement.id = 'loading-' + Date.now();

  const contentElement = document.createElement('div');
  contentElement.classList.add('message-content');
  contentElement.textContent = '入力中...';

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
  messageElement.appendChild(contentElement);
  chatMessages.appendChild(messageElement);

  // スクロール
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  return messageElement.id;
}

// 入力中メッセージの削除
function removeLoadingMessage(messageId) {
  const loadingMessage = document.getElementById(messageId);
  if (loadingMessage) {
    loadingMessage.remove();
  }
}

// ストリーミングレスポンスの処理
async function handleStreamingResponse(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let botResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    buffer += decoder.decode(value, { stream: true });
    
    // バッファから完全なデータチャンクを処理
    const lines = buffer.split('\n\n');
    buffer = lines.pop(); // 最後の不完全な行を残す
    
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.substring(6));
          
          if (data.event === 'message') {
            botResponse += data.answer || '';
            // 部分的なメッセージを表示または更新
            updateOrAddBotMessage(botResponse);
          } else if (data.event === 'message_end') {
            // 会話IDを保存
            if (data.conversation_id) {
              conversations[currentCharacter.id].id = data.conversation_id;
              console.log("会話ID保存(ストリーミング):", currentCharacter.id, data.conversation_id);
            }
            
            // 会話履歴に完全なメッセージを追加
            if (botResponse) {
              conversations[currentCharacter.id].messages.push({
                content: botResponse,
                type: 'bot'
              });
            }
          } else if (data.event === 'error') {
            console.error('Stream error:', data);
            addMessage('エラーが発生しました: ' + data.message, 'bot');
          }
        } catch (e) {
          console.error('Error parsing JSON:', e, line);
        }
      }
    }
  }
}

// ボットメッセージを更新または追加
function updateOrAddBotMessage(content) {
  // すでにストリーミング用のメッセージがあるか確認
  const streamMessage = document.querySelector('.message.bot.streaming');
  
  if (streamMessage) {
    // 既存のメッセージを更新（改行コードを<br>タグに変換）
    streamMessage.querySelector('.message-content').innerHTML = content.replace(/\n/g, '<br>');
  } else {
    // 新しいメッセージを追加
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', 'bot', 'streaming');
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    // 改行コードを<br>タグに変換
    contentElement.innerHTML = content.replace(/\n/g, '<br>');
    
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
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
  }
  
  // アニメーション付きでスクロール
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ブロッキングレスポンスの処理
async function handleBlockingResponse(response) {
  try {
    const data = await response.json();
    
    console.log("********************* DIFY API レスポンス内容 *********************");
    console.log("レスポンスデータ:", data);
    console.log("会話ID:", data.conversation_id);
    console.log("回答内容:", data.answer);
    console.log("*******************************************************************");
    
    if (response.ok) {
      console.log("APIレスポンス:", data);
      
      // 会話IDを保存
      if (data.conversation_id) {
        conversations[currentCharacter.id].id = data.conversation_id;
        console.log("会話ID保存:", currentCharacter.id, data.conversation_id);
      }
      
      // メッセージを表示
      addMessage(data.answer, 'bot');
      
      // 会話履歴に追加
      conversations[currentCharacter.id].messages.push({
        content: data.answer,
        type: 'bot'
      });
    } else {
      console.error('API error:', data);
      addMessage('エラーが発生しました: ' + (data.message || '不明なエラー'), 'bot');
      
      // 会話履歴に追加
      conversations[currentCharacter.id].messages.push({
        content: 'エラーが発生しました: ' + (data.message || '不明なエラー'),
        type: 'bot'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage('申し訳ありません。エラーが発生しました: ' + error.message, 'bot');
    
    // 会話履歴に追加
    conversations[currentCharacter.id].messages.push({
      content: '申し訳ありません。エラーが発生しました。',
      type: 'bot'
    });
  }
}

// メッセージの追加
function addMessage(message, type) {
  // ストリーミング用のメッセージを通常メッセージに変換
  const streamingMessage = document.querySelector('.message.bot.streaming');
  if (type === 'bot' && streamingMessage) {
    streamingMessage.classList.remove('streaming');
    // 改行コードをHTMLの<br>タグに変換してからHTMLとして挿入
    streamingMessage.querySelector('.message-content').innerHTML = message.replace(/\n/g, '<br>');
    return;
  }
  
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', type);

  const contentElement = document.createElement('div');
  contentElement.classList.add('message-content');
  // 改行コードをHTMLの<br>タグに変換してからHTMLとして挿入
  contentElement.innerHTML = message.replace(/\n/g, '<br>');

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
  
  // 会話履歴があれば表示
  if (conversations[characterId].messages.length > 0) {
    conversations[characterId].messages.forEach(msg => {
      addMessage(msg.content, msg.type);
    });
  } else {
    // 初期メッセージを表示
    addMessage(`${character.name}が選択されました。`, 'bot');
    
    // 会話履歴に追加
    conversations[characterId].messages.push({
      content: `${character.name}が選択されました。`,
      type: 'bot'
    });
  }
}
