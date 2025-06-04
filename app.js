// express 기본 모듈 불러오기
const express = require('express');
const http = require('http');
const path = require('path');
const static = require('serve-static');

const app = express();

// 기본 속성 설정
const PORT = process.env.PORT || 8080;
const HOST = '127.0.0.1';

// 정적 파일 서비스
app.use(static(__dirname));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

/* 루트 경로 리디렉트 */
app.get('/', (req, res) => {
  res.redirect('/index.html');
});

// 404 에러 처리
app.use((req, res, next) => {
  res.status(404).send('페이지를 찾을 수 없습니다.');
});

// 서버 시작
const server = http.createServer(app);

server.listen(PORT, HOST, () => {
  console.log(`🎮 Code of Legends 서버가 실행되었습니다!`);
  console.log(`🌐 주소: http://${HOST}:${PORT}`);
  console.log(`📁 정적 파일 경로: ${__dirname}`);
  console.log(`🎯 게임을 시작하려면 브라우저에서 위 주소로 접속하세요!`);
});

// 서버 에러 처리
server.on('error', (err) => {
  console.error('서버 에러:', err);
});

// 프로세스 종료 처리
process.on('SIGINT', () => {
  console.log('\n서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 정상적으로 종료되었습니다.');
    process.exit(0);
  });
});

