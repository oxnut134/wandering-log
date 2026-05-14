import Axios from 'axios'

const axios = Axios.create({
    // 以前の 8080 やIPアドレスを全消去。 
    // 相対パスの '/api' にすることで、Next.js 自身の app/api/... へ自動的にアクセスします
    baseURL: "/api",
    
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    // ❌ Laravel専用だった xsrfCookieName や xsrfHeaderName は、
    // Neon（サーバーレス）環境では不要なので、全消去。
});
/*const axios = Axios.create({
    //baseURL: "http://localhost:8080",
    baseURL: "http://localhost:8080",
    //baseURL: "http://3000192.168.3.3:8080",
    withCredentials: true, // 👈 これが「ポケットの合言葉を使う」命令
    xsrfCookieName: "XSRF-TOKEN", // 👈 これが「合言葉の名前」
    xsrfHeaderName: "X-XSRF-TOKEN", // 👈 これが「見せる時のヘッダー名」
});*/

export default axios;

