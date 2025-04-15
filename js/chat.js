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

// 変数を定義
const characterIds = [1, 2, 3];
const characterNames = {
  1: "ryota",
  2: "新人A",
  3: "天使な猫",
};
const characterImages = {
  1: "images/characters/1.png",
  2: "images/characters/2.jpg",
  3: "images/characters/3.png",
};

// キャラクター情報
const characters = {
  1: {
    id: '1',
    name: 'ryota',
    image: 'images/characters/1.png',
    dify_input: 'ryota' // Difyの分岐条件に合わせて小文字に戻す
  },
  2: {
    id: '2',
    name: '新人A',
    image: 'images/characters/2.jpg',
    dify_input: '新人A' // すでに正しい
  },
  3: {
    id: '3',
    name: '天使な猫',
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

// 状態管理
let currentCharacterId = 1;
let conversationHistory = {};

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

  // 戻るボタンにイベント追加
  addClickAndTouchEvent(backButton, hideChat);

  // 送信ボタンの動作設定
  addClickAndTouchEvent(sendButton, sendMessage);
  
  // 定型メッセージボタンにイベント追加
  document.querySelectorAll('.predefined-message-btn').forEach((btn) => {
    addClickAndTouchEvent(btn, function () {
      // ボタンのテキストを取得（アイコンを除く）
      const buttonText = this.textContent;
      
      // メッセージ入力欄に設定
      messageInput.value = buttonText;
      
      // 自動的に送信
      sendMessage();
      
      // ボタンにクリック効果を追加
      this.classList.add('clicked');
      setTimeout(() => {
        this.classList.remove('clicked');
      }, 300);
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
    
    // スマホ版の場合にチャットコンテナの高さを調整
    if (window.innerWidth <= 480 && chatContainer.classList.contains('visible')) {
      // 固定高さではなく、最小高さとして設定
      chatContainer.style.minHeight = `calc(${vh * 100}px - 20px)`;
      // メッセージエリアを最下部までスクロール
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 100);
    }
  };

  setVh();
  
  // リサイズ時の処理頻度を制限
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      setVh();
      // リサイズ後にメッセージのレイアウトを修正
      adjustMessageLayout();
    }, 100);
  });
  
  // モバイルデバイスではスクロール時にも高さを再調整（ツールバーの表示・非表示対策）
  if ('ontouchstart' in window) {
    window.addEventListener('scroll', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(setVh, 100);
    });
  }
  
  // 初期ロード時にメッセージレイアウトを調整
  adjustMessageLayout();
});

// メッセージのレイアウトを調整する関数
function adjustMessageLayout() {
  // メッセージの最大幅を調整（特にボットメッセージ）
  const isMobile = window.innerWidth <= 480;
  const messages = document.querySelectorAll('.message');
  
  messages.forEach(message => {
    const messageContent = message.querySelector('.message-content');
    if (!messageContent) return;
    
    if (message.classList.contains('bot')) {
      // モバイルデバイスの場合
      if (isMobile) {
        // ボットアバターの幅を考慮した最大幅に設定
        const avatar = message.querySelector('.bot-avatar');
        const avatarWidth = avatar ? avatar.offsetWidth : 30;
        const marginRight = avatar ? 8 : 0; // avatarのmargin-right
        messageContent.style.maxWidth = `calc(100% - ${avatarWidth + marginRight + 10}px)`;
        
        // メッセージの内容が長いテキストの場合は折り返しを確実に
        if (messageContent.scrollWidth > messageContent.clientWidth) {
          messageContent.style.wordBreak = 'break-word';
          messageContent.style.whiteSpace = 'pre-wrap';
        }
      } else {
        // デスクトップの場合は最大80%に設定
        messageContent.style.maxWidth = '80%';
      }
    } else if (message.classList.contains('user')) {
      // ユーザーメッセージは常に最大80%に制限
      messageContent.style.maxWidth = '80%';
    }
  });
  
  // アバターが正しく表示されているか確認
  const avatars = document.querySelectorAll('.bot-avatar');
  avatars.forEach(avatar => {
    // 無効なパスや読み込みエラーの場合はデフォルトアバターを設定
    if (!avatar.src || avatar.src === 'undefined' || avatar.src === '') {
      avatar.src = 'images/default-avatar.svg';
    }
    
    // 画像読み込みエラー時のフォールバック
    avatar.onerror = function() {
      this.src = 'images/default-avatar.svg';
    };
  });
  
  // スクロール位置を最下部に設定
  scrollToBottom();
}

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

  currentCharacterId = characterId;
  selectedCharacterImg.src = character.image;
  chatContainer.classList.add('visible');
  
  // サムネイル選択部分は非表示にする
  const characterSwitcher = document.querySelector('.character-switcher');
  if (characterSwitcher) {
    characterSwitcher.style.display = 'none';
  }

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

  // 他のキャラクターとのチャット切り替え部分を更新
  createOtherCharactersSection();

  // スクロール位置をトップに
  window.scrollTo(0, 0);
  
  // モバイルサイズでビューポート高さを再計算
  if (window.innerWidth <= 480) {
    const vh = window.innerHeight * 0.01;
    chatContainer.style.minHeight = `calc(${vh * 100}px - 20px)`;
    // スクロール位置の初期化
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
  }

  // モバイルデバイスではフォーカスをメッセージ入力欄に
  if (window.innerWidth <= 768) {
    setTimeout(() => {
      // 少し遅延させることでアニメーション後に実行
      messageInput.focus();
      // メッセージエリアを最下部までスクロール
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);
  }
}

// 他のキャラクターとの会話セクションを作成する関数
function createOtherCharactersSection() {
  // 既存のセクションがあれば削除
  const existingSection = document.querySelector('.other-characters');
  if (existingSection) {
    existingSection.remove();
  }
  
  // 新しいセクションを作成
  const otherCharactersSection = document.createElement('div');
  otherCharactersSection.className = 'other-characters';
  
  const title = document.createElement('p');
  title.textContent = '他のキャラクターと会話する：';
  otherCharactersSection.appendChild(title);
  
  const thumbnailsContainer = document.createElement('div');
  thumbnailsContainer.className = 'other-character-thumbnails';
  
  // 各キャラクターのサムネイルを追加（現在のキャラクター以外）
  for (const id in characters) {
    if (id !== currentCharacterId.toString()) {
      // ラッパーを作成
      const thumbWrapper = document.createElement('div');
      thumbWrapper.className = 'character-thumb-wrapper';
      
      // サムネイル画像
      const thumb = document.createElement('img');
      thumb.src = characters[id].image;
      thumb.alt = characters[id].name;
      thumb.className = 'other-character-thumb';
      thumb.dataset.character = id;
      
      // 画像読み込みエラー時のフォールバック
      thumb.onerror = function() {
        this.src = 'images/default-avatar.svg';
        console.warn('キャラクター画像の読み込みに失敗しました:', characters[id].image);
      };
      
      // ツールチップを設定
      thumb.title = characters[id].name.replace(/「|」/g, '');
      
      // キャラクター名ラベル
      const characterLabel = document.createElement('span');
      characterLabel.className = 'character-label';
      characterLabel.textContent = characters[id].name.replace(/「|」/g, '');
      
      // クリックイベントを追加（ラッパー全体を対象に）
      thumbWrapper.addEventListener('click', function() {
        switchCharacter(id);
      });
      
      thumbWrapper.appendChild(thumb);
      thumbWrapper.appendChild(characterLabel);
      thumbnailsContainer.appendChild(thumbWrapper);
    }
  }
  
  otherCharactersSection.appendChild(thumbnailsContainer);
  
  // チャットフッターに追加
  const chatFooter = document.querySelector('.chat-footer');
  chatFooter.insertBefore(otherCharactersSection, document.getElementById('back-to-selection'));
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

  // 全キャラクターの会話履歴をリセット
  for (const characterId in conversations) {
    resetConversation(characterId);
  }

  // 選択画面に戻ったことを記録
  comingFromSelectionScreen = true;

  // スクロール位置をトップに
  window.scrollTo(0, 0);
  
  // モバイルサイズでスクロールを再有効化
  if (window.innerWidth <= 480) {
    // document.body.style.overflow = ''; // スクロール防止を削除
  }
}

// キャラクター切り替え
function switchCharacter(characterId) {
  if (currentCharacterId === characterId) return;

  const character = characters[characterId];
  if (!character) return;

  currentCharacterId = characterId;
  selectedCharacterImg.src = character.image;

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
  
  // 他のキャラクターとのチャット切り替え部分を更新
  createOtherCharactersSection();
  
  // メッセージエリアを最上部にスクロール
  chatMessages.scrollTop = 0;
}

// メッセージの送信
async function sendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  // 送信中は入力欄を無効化
  messageInput.disabled = true;

  // ユーザーメッセージの表示
  addMessage(message, 'user');
  
  // 会話履歴に追加
  conversations[currentCharacterId].messages.push({
    content: message,
    type: 'user'
  });
  
  // 入力欄をクリア
  messageInput.value = '';
  
  // 入力中の表示
  const loadingMessageId = showLoadingMessage();

  try {
    // リクエストパラメータの準備
    const requestParams = {
      inputs: {
        input: characters[currentCharacterId].dify_input
      },
      query: message,
      response_mode: difyConfig.RESPONSE_MODE,
      user: USER_ID
    };

    // キャラクター固有のモデル（ナレッジベース）を指定
    // キャラクターIDに基づいて異なるモデル/ナレッジベースを使用
    if (currentCharacterId === 1) {
      requestParams.model = 'ryota_knowledge';  // ryota専用のナレッジベース
    } else if (currentCharacterId === 2) {
      requestParams.model = 'shinjinA_knowledge';  // 新人A専用のナレッジベース
    } else if (currentCharacterId === 3) {
      requestParams.model = 'tenshi_knowledge';  // 天使の猫ちゃん専用のナレッジベース
    }

    // デバッグ用にモデル情報も表示
    console.log("使用するナレッジベース:", requestParams.model);

    // 会話IDがあり、空でなければ追加
    const conversationId = conversations[currentCharacterId].id;
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
    console.log("キャラクター情報:", characters[currentCharacterId]);
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

    // APIリクエスト完了後に入力欄を再度有効化
    messageInput.disabled = false;
    setTimeout(() => {
      // モバイルでは自動フォーカス
      if (window.innerWidth <= 768) {
        messageInput.focus();
      }
    }, 100);

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
          conversations[currentCharacterId].id = null;
          
          // 入力中メッセージを削除
          removeLoadingMessage(loadingMessageId);
          
          // 会話IDを削除した状態で再度リクエスト
          const newRequestParams = { ...requestParams };
          delete newRequestParams.conversation_id;
          
          console.log("リトライリクエスト:", newRequestParams);
          console.log("リトライ時のナレッジベース:", newRequestParams.model);
          
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
    
    // 入力欄を再度有効化
    messageInput.disabled = false;
    
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
    conversations[currentCharacterId].messages.push({
      content: '申し訳ありません。エラーが発生しました。',
      type: 'bot'
    });
    
    // メッセージエリアを最下部までスクロール
    setTimeout(() => {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
    
    // モバイルでは自動フォーカス
    if (window.innerWidth <= 768) {
      setTimeout(() => {
        messageInput.focus();
      }, 200);
    }
    
    // フォールバック用のモックレスポンスを表示（API接続が失敗した場合）
    setTimeout(() => {
      // キャラクターごとのモックレスポンス
      const mockResponses = {
        '1': '申し訳ありませんが、現在サーバーに接続できません。また後でお試しください。😌',
        '2': 'ごめんなさい、今ちょっと通信状況が良くないみたい… また後でお話ししましょう！✨',
        '3': 'ごめんなぁ、今ちょっと繋がらへんわ。また後でな！🌸'
      };
      
      const fallbackResponse = mockResponses[currentCharacterId] || mockResponses['1'];
      
      // 会話履歴に既にエラーメッセージがあるが、ユーザーフレンドリーなメッセージも追加
      addMessage(fallbackResponse, 'bot');
      
      // 会話履歴に追加
      conversations[currentCharacterId].messages.push({
        content: fallbackResponse,
        type: 'bot'
      });
      
      // スクロール位置を調整
      chatMessages.scrollTop = chatMessages.scrollHeight;
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
  avatarElement.src = characters[currentCharacterId].image;
  avatarElement.alt = characters[currentCharacterId].name;
  avatarElement.classList.add('bot-avatar');
  
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
              conversations[currentCharacterId].id = data.conversation_id;
              console.log("会話ID保存(ストリーミング):", currentCharacterId, data.conversation_id);
            }
            
            // 会話履歴に完全なメッセージを追加
            if (botResponse) {
              conversations[currentCharacterId].messages.push({
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
    
    const avatarElement = document.createElement('img');
    avatarElement.src = characters[currentCharacterId].image;
    avatarElement.alt = characters[currentCharacterId].name;
    avatarElement.classList.add('bot-avatar');
    avatarElement.onerror = function() {
      // 画像読み込みエラー時のフォールバック
      this.src = 'images/default-avatar.svg';
      console.warn('キャラクター画像の読み込みに失敗しました:', characters[currentCharacterId].image);
    };
    
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    // 改行コードを<br>タグに変換
    contentElement.innerHTML = content.replace(/\n/g, '<br>');
    
    // ボットメッセージは左側からアバターを配置
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
    chatMessages.appendChild(messageElement);
  }
  
  // アニメーション付きでスクロール
  scrollToBottom();
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
        conversations[currentCharacterId].id = data.conversation_id;
        console.log("会話ID保存:", currentCharacterId, data.conversation_id);
      }
      
      // メッセージを表示
      addMessage(data.answer, 'bot');
      
      // 会話履歴に追加
      conversations[currentCharacterId].messages.push({
        content: data.answer,
        type: 'bot'
      });
    } else {
      console.error('API error:', data);
      addMessage('エラーが発生しました: ' + (data.message || '不明なエラー'), 'bot');
      
      // 会話履歴に追加
      conversations[currentCharacterId].messages.push({
        content: 'エラーが発生しました: ' + (data.message || '不明なエラー'),
        type: 'bot'
      });
    }
  } catch (error) {
    console.error('Error:', error);
    addMessage('申し訳ありません。エラーが発生しました: ' + error.message, 'bot');
    
    // 会話履歴に追加
    conversations[currentCharacterId].messages.push({
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
    avatarElement.src = characters[currentCharacterId].image;
    avatarElement.alt = characters[currentCharacterId].name;
    avatarElement.classList.add('bot-avatar');
    avatarElement.onerror = function() {
      // 画像読み込みエラー時のフォールバック
      this.src = 'images/default-avatar.svg';
      console.warn('キャラクター画像の読み込みに失敗しました:', characters[currentCharacterId].image);
    };
    messageElement.appendChild(avatarElement);
    messageElement.appendChild(contentElement);
  } else {
    // ユーザーメッセージの場合は、先にコンテンツを追加
    messageElement.appendChild(contentElement);
  }

  chatMessages.appendChild(messageElement);

  // アニメーション付きでスクロール
  setTimeout(() => {
    scrollToBottom();
  }, 100);

  // メッセージ追加後にレイアウトを調整
  setTimeout(() => {
    adjustMessageLayout();
  }, 10);
}

// アクティブなサムネイルの更新
function updateActiveThumbnail() {
  characterThumbnails.forEach((thumb) => {
    if (thumb.dataset.character === currentCharacterId.toString()) {
      thumb.classList.add('active');
    } else {
      thumb.classList.remove('active');
    }
  });
}

// 会話履歴を表示する関数
function displayConversationHistory() {
  // 既存の会話履歴をクリア
  chatMessages.innerHTML = '';
  
  // 会話履歴があれば表示
  if (conversations[currentCharacterId].messages.length > 0) {
    conversations[currentCharacterId].messages.forEach(msg => {
      addMessage(msg.content, msg.type);
    });
  } else {
    // 初期メッセージを表示
    addMessage(`${characters[currentCharacterId].name}が選択されました。`, 'bot');
    
    // 会話履歴に追加
    conversations[currentCharacterId].messages.push({
      content: `${characters[currentCharacterId].name}が選択されました。`,
      type: 'bot'
    });
  }
  
  // アクティブなサムネイルを更新
  updateActiveThumbnail();
  
  // メッセージエリアを最上部にスクロール
  chatMessages.scrollTop = 0;
}

// 会話履歴を保存する関数
function saveConversationHistory() {
  // 既存の会話履歴を保存
  conversationHistory = {
    id: conversations[currentCharacterId].id,
    messages: conversations[currentCharacterId].messages.map(msg => ({ ...msg })),
    hasStarted: conversations[currentCharacterId].hasStarted
  };
}

// メッセージストリーミング処理関数
async function messageStreaming(message, messageElement) {
  // ストリーミング完了後
  streamingInProgress = false;
  messageElement.classList.remove('loading');
  messageElement.classList.remove('streaming');
  
  // ストリーミング完了後にレイアウトを調整
  adjustMessageLayout();
  scrollToBottom();
}

// ウィンドウのリサイズイベントリスナー（存在しない場合のみ追加）
if (!window.hasOwnProperty('resizeListenerAdded')) {
  window.addEventListener('resize', () => {
    // iOSのビューポート高さを設定（もし関数が存在する場合）
    if (typeof setViewportHeight === 'function') {
      setViewportHeight();
    }
    // メッセージレイアウトを調整
    adjustMessageLayout();
    // スクロール位置を調整
    scrollToBottom();
  });
  window.resizeListenerAdded = true;
}

// スクロールを最下部に移動する関数
function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}
