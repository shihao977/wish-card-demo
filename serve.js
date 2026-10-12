const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT || 3030);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
};

const server = http.createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host || HOST}`).pathname);
    const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(ROOT, relative);
    if (!filePath.startsWith(ROOT + path.sep) && filePath !== path.join(ROOT, 'index.html')) {
      res.writeHead(403); res.end('Forbidden'); return;
    }
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (error) {
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`心愿卡本地网站已启动：http://${HOST}:${PORT}`);
  console.log('关闭此窗口即可停止服务。');
});
