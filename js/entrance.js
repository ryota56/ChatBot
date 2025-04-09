document.addEventListener('DOMContentLoaded', () => {
  // エントランスオーバーレイを作成
  const createEntranceOverlay = () => {
    const overlay = document.createElement('div');
    overlay.className = 'entrance-overlay';
    
    // ドアコンテナを作成
    const doorContainer = document.createElement('div');
    doorContainer.className = 'door-container';
    
    // 左ドアを作成
    const doorLeft = document.createElement('div');
    doorLeft.className = 'door door-left';
    const handleLeft = document.createElement('div');
    handleLeft.className = 'door-handle';
    doorLeft.appendChild(handleLeft);
    
    // 右ドアを作成
    const doorRight = document.createElement('div');
    doorRight.className = 'door door-right';
    const handleRight = document.createElement('div');
    handleRight.className = 'door-handle';
    doorRight.appendChild(handleRight);
    
    // ロゴを作成
    const logo = document.createElement('div');
    logo.className = 'door-logo';
    
    // ロゴの代わりにアイコンを使用
    const logoIcon = document.createElement('i');
    logoIcon.className = 'fas fa-comments';
    logoIcon.style.fontSize = '60px';
    logoIcon.style.color = '#c9b372';
    logo.appendChild(logoIcon);
    
    // ウェルカムメッセージを作成
    const welcome = document.createElement('div');
    welcome.className = 'door-welcome';
    welcome.textContent = 'ようこそ、キャラクターチャットへ';
    
    // 要素を追加
    doorContainer.appendChild(doorLeft);
    doorContainer.appendChild(doorRight);
    doorContainer.appendChild(logo);
    doorContainer.appendChild(welcome);
    overlay.appendChild(doorContainer);
    document.body.appendChild(overlay);
    
    return { overlay, doorContainer };
  };
  
  // エントランスアニメーションを開始
  const startEntranceAnimation = () => {
    const { overlay, doorContainer } = createEntranceOverlay();
    
    // アニメーション開始
    const startAnimation = () => {
      // より短い遅延でドアを開く（500ms → 300ms）
      setTimeout(() => {
        doorContainer.classList.add('door-open');
        
        // ドアが開いた後、オーバーレイをフェードアウト（2000ms → 1000ms）
        setTimeout(() => {
          overlay.classList.add('fade-out');
          
          // アニメーション完了後、オーバーレイを削除（3500ms → 1500ms）
          setTimeout(() => {
            overlay.remove();
          }, 1500);
        }, 1000);
      }, 300);
    };
    
    // アニメーションを即座に開始
    startAnimation();
  };
  
  // DOMContentLoadedイベントでアニメーションを開始（loadイベントを待たない）
  // ロード完了を待たずにアニメーション表示
  startEntranceAnimation();
  
  // ページが再訪問された時（ブラウザバック等）にアニメーションをスキップ
  if (window.performance && 
      typeof window.performance.getEntriesByType === 'function' && 
      window.performance.getEntriesByType('navigation').length > 0 && 
      window.performance.getEntriesByType('navigation')[0].type === 'back_forward') {
    // ブラウザバックでアクセスした場合はアニメーションをスキップ
    console.log('ブラウザバックでアクセスしたため、エントランスアニメーションをスキップします。');
  } else {
    // 通常のアクセスではローディング画面を表示
    const body = document.body;
    body.style.opacity = '0';
    
    setTimeout(() => {
      body.style.transition = 'opacity 0.5s ease';
      body.style.opacity = '1';
    }, 100);
  }
}); 