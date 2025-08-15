const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // 文件不存在，返回404
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - 页面未找到</title>
                        <style>
                            body { 
                                font-family: Arial, sans-serif; 
                                text-align: center; 
                                padding: 50px;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: white;
                                min-height: 100vh;
                                margin: 0;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            .error-container {
                                background: rgba(255,255,255,0.1);
                                padding: 2rem;
                                border-radius: 15px;
                                backdrop-filter: blur(10px);
                            }
                            h1 { font-size: 3rem; margin-bottom: 1rem; }
                            p { font-size: 1.2rem; margin-bottom: 2rem; }
                            a { color: #fff; text-decoration: none; background: rgba(255,255,255,0.2); padding: 0.5rem 1rem; border-radius: 5px; }
                            a:hover { background: rgba(255,255,255,0.3); }
                        </style>
                    </head>
                    <body>
                        <div class="error-container">
                            <h1>404</h1>
                            <p>页面未找到</p>
                            <a href="/">返回首页</a>
                        </div>
                    </body>
                    </html>
                `);
            } else {
                // 服务器错误
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Server Error');
            }
        } else {
            // 成功读取文件
            const mimeType = getMimeType(filePath);
            res.writeHead(200, { 
                'Content-Type': mimeType,
                'Cache-Control': 'no-cache' // 开发环境不缓存
            });
            res.end(content);
        }
    });
}

const server = http.createServer((req, res) => {
    // 解析URL
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // 添加CORS头部（开发环境）
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log(`${new Date().toLocaleTimeString()} - ${req.method} ${pathname}`);

    // 根路径重定向到index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // 构建文件路径
    let filePath = path.join(__dirname, '..', 'docs', pathname);

    // 安全检查：防止路径穿越
    const docsDir = path.join(__dirname, '..', 'docs');
    if (!filePath.startsWith(docsDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    // 检查文件是否存在
    fs.stat(filePath, (err, stat) => {
        if (err) {
            serveFile(res, filePath); // 让serveFile处理错误
        } else if (stat.isDirectory()) {
            // 如果是目录，尝试提供index.html
            const indexPath = path.join(filePath, 'index.html');
            serveFile(res, indexPath);
        } else {
            // 提供文件
            serveFile(res, filePath);
        }
    });
});

server.listen(PORT, () => {
    console.log(`
🚀 OnePlus ROM 数据库本地服务器已启动！

📍 访问地址: http://localhost:${PORT}
📁 服务目录: ./docs
🔄 热重载: 修改文件后刷新页面即可看到更新

💡 使用说明:
   - 访问 http://localhost:${PORT} 查看主页
   - 数据文件位于 http://localhost:${PORT}/data/*.json
   - 按 Ctrl+C 停止服务器

🛠️  开发提示:
   - 修改 generate-html-optimized.js 后运行 'npm run build-optimized' 重新生成
   - JSON 数据文件修改后会自动生效（无需重启服务器）
`);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n👋 正在关闭服务器...');
    server.close(() => {
        console.log('✅ 服务器已关闭');
        process.exit(0);
    });
});
