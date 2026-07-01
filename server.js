const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 4003;
const DIST = path.join(__dirname, 'dist');

const MIME = {
  '.html'  : 'text/html; charset=utf-8',
  '.css'   : 'text/css',
  '.js'    : 'application/javascript',
  '.json'  : 'application/json',
  '.png'   : 'image/png',
  '.jpg'   : 'image/jpeg',
  '.jpeg'  : 'image/jpeg',
  '.gif'   : 'image/gif',
  '.svg'   : 'image/svg+xml',
  '.ico'   : 'image/x-icon',
  '.webp'  : 'image/webp',
  '.woff'  : 'font/woff',
  '.woff2' : 'font/woff2',
  '.ttf'   : 'font/ttf',
  '.eot'   : 'application/vnd.ms-fontobject',
  '.map'   : 'application/json',
};

http.createServer(function (req, res) {
  var url  = req.url.split('?')[0];
  var file = url === '/' ? '/index.html' : url;
  var full = path.join(DIST, file);

  // Security: prevent path traversal
  if (!full.startsWith(DIST)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(full, function (err, data) {
    if (err) {
      // Try index.html for SPA-like routing (e.g. /cart.html → cart.html exists)
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    var ext  = path.extname(full).toLowerCase();
    var type = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    res.end(data);
  });

}).listen(PORT, '127.0.0.1', function () {
  console.log('Pulse static server running on http://127.0.0.1:' + PORT);
});
