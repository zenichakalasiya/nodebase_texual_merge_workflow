const http = require('http');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const types = { '.html':'text/html', '.svg':'image/svg+xml', '.css':'text/css', '.js':'text/javascript' };
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/workflow-canvas.html';
  const fp = path.join(root, p);
  fs.readFile(fp, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
}).listen(8777, () => console.log('Server on http://localhost:8777'));
