// Dify API設定
const DIFY_CONFIG = {
  API_ENDPOINT: 'https://api.dify.ai/v1',
  API_KEY: 'app-LM5yInuzeqGengtKTYvaZAOz',
  RESPONSE_MODE: 'blocking' // 'streaming' または 'blocking'
};

// ES Modules用のエクスポート
export { DIFY_CONFIG };

// グローバル変数としても公開（ESモジュールが使えない環境向け）
if (typeof window !== 'undefined') {
  window.DIFY_CONFIG = DIFY_CONFIG;
} 