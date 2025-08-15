const fs = require('fs');
const path = require('path');

// 读取所有设备数据
function readDeviceData() {
    const deviceFiles = fs.readdirSync('./data')
        .filter(file => file.endsWith('.json'))
        .sort();
    
    const devices = [];
    let totalRoms = 0;
    let totalLinks = 0;
    
    deviceFiles.forEach(file => {
        try {
            const content = fs.readFileSync(path.join('./data', file), 'utf8');
            const data = JSON.parse(content);
            const deviceCode = path.basename(file, '.json');
            const deviceName = data.model || deviceCode; // 使用JSON中的中文名称，fallback到文件名
            
            devices.push({
                code: deviceCode,
                name: deviceName,
                roms: data.roms || [],
                romCount: (data.roms || []).length,
                linkCount: (data.roms || []).reduce((sum, rom) => sum + (rom.links || []).length, 0)
            });
            
            totalRoms += (data.roms || []).length;
            totalLinks += (data.roms || []).reduce((sum, rom) => sum + (rom.links || []).length, 0);
        } catch (error) {
            console.error(`读取 ${file} 时出错:`, error.message);
        }
    });
    
    return { devices, totalRoms, totalLinks };
}

// 生成设备列表JSON文件
function generateDeviceList(devices) {
    const deviceList = devices.map(device => ({
        code: device.code,
        name: device.name,
        romCount: device.romCount,
        linkCount: device.linkCount
    }));
    
    fs.writeFileSync('docs/data/devices.json', JSON.stringify(deviceList, null, 2));
}

// 生成单个设备的数据文件
function generateDeviceDataFiles(devices) {
    devices.forEach(device => {
        const deviceData = {
            code: device.code,
            name: device.name,
            roms: device.roms
        };
        
        fs.writeFileSync(
            `docs/data/${device.code}.json`, 
            JSON.stringify(deviceData, null, 2)
        );
    });
}

// 生成主页面HTML
function generateMainHTML(devices, totalRoms, totalLinks) {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OnePlus ROM 数据库</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            color: white;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
            font-weight: 300;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .stat-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 1.5rem;
            text-align: center;
            color: white;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        }
        
        .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 1rem;
            opacity: 0.9;
        }
        
        .search-box {
            margin-bottom: 2rem;
        }
        
        .search-input {
            width: 100%;
            padding: 1rem 1.5rem;
            font-size: 1.1rem;
            border: none;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            color: white;
            placeholder-color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease;
        }
        
        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
        }
        
        .devices-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .device-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 1.5rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .device-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s;
        }
        
        .device-card:hover::before {
            left: 100%;
        }
        
        .device-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            background: rgba(255, 255, 255, 0.15);
        }
        
        .device-model {
            font-size: 1.5rem;
            font-weight: 600;
            color: white;
            margin-bottom: 0.5rem;
        }
        
        .device-code {
            font-size: 0.9rem;
            color: rgba(255, 255, 255, 0.8);
            font-weight: 400;
            margin-bottom: 1rem;
            font-family: 'Courier New', monospace;
        }
        
        .device-stats {
            display: flex;
            justify-content: space-between;
            margin-bottom: 1rem;
        }
        
        .device-stat {
            text-align: center;
            color: rgba(255, 255, 255, 0.9);
        }
        
        .device-stat-value {
            font-size: 1.2rem;
            font-weight: 600;
            display: block;
        }
        
        .device-stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .load-button {
            width: 100%;
            padding: 0.8rem;
            background: linear-gradient(135deg, #ff6b6b, #ee5a24);
            color: white;
            border: none;
            border-radius: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
        }
        
        .load-button:hover {
            background: linear-gradient(135deg, #ee5a24, #ff6b6b);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(238, 90, 36, 0.4);
        }
        
        .loading {
            display: none;
            text-align: center;
            color: white;
            font-size: 1.2rem;
            margin: 2rem 0;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
            margin-right: 0.5rem;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .device-details {
            display: none;
            margin-top: 2rem;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 15px;
            padding: 2rem;
        }
        
        .rom-item {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 1rem;
            margin-bottom: 1rem;
            border-left: 4px solid #ff6b6b;
        }
        
        .rom-version {
            font-size: 1.1rem;
            font-weight: 600;
            color: white;
            margin-bottom: 0.5rem;
        }
        
        .rom-links {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .copy-button {
            padding: 0.5rem 1rem;
            background: linear-gradient(135deg, #4facfe, #00f2fe);
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        
        .copy-button:hover {
            background: linear-gradient(135deg, #00f2fe, #4facfe);
            transform: translateY(-1px);
        }
        
        .copy-button.copied {
            background: linear-gradient(135deg, #56ab2f, #a8e6cf);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .devices-grid {
                grid-template-columns: 1fr;
            }
            
            .stats {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OnePlus ROM 数据库</h1>
            <p>专业的 OnePlus ROM 下载资源集合</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${devices.length}</div>
                <div class="stat-label">支持机型</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalRoms}</div>
                <div class="stat-label">ROM 版本</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalLinks}</div>
                <div class="stat-label">下载链接</div>
            </div>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="搜索机型..." id="searchInput">
        </div>
        
        <div class="loading" id="loading">
            <span class="spinner"></span>
            加载中...
        </div>
        
        <div class="devices-grid" id="devicesGrid">
            ${devices.map(device => `
                <div class="device-card" data-code="${device.code}" data-name="${device.name}">
                    <div class="device-model">${device.name}</div>
                    <div class="device-code">${device.code}</div>
                    <div class="device-stats">
                        <div class="device-stat">
                            <span class="device-stat-value">${device.romCount}</span>
                            <span class="device-stat-label">ROM版本</span>
                        </div>
                        <div class="device-stat">
                            <span class="device-stat-value">${device.linkCount}</span>
                            <span class="device-stat-label">下载链接</span>
                        </div>
                    </div>
                    <button class="load-button" onclick="loadDeviceData('${device.code}', '${device.name}')">
                        查看详情
                    </button>
                </div>
            `).join('')}
        </div>
        
        <div id="deviceDetails" class="device-details"></div>
    </div>
    
    <script>
        // 搜索功能
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const deviceCards = document.querySelectorAll('.device-card');
            
            deviceCards.forEach(card => {
                const code = card.getAttribute('data-code').toLowerCase();
                const name = card.getAttribute('data-name').toLowerCase();
                if (code.includes(searchTerm) || name.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
        
        // 加载设备数据
        async function loadDeviceData(code, name) {
            const loading = document.getElementById('loading');
            const deviceDetails = document.getElementById('deviceDetails');
            
            // 显示加载状态
            loading.style.display = 'block';
            deviceDetails.style.display = 'none';
            
            // 滚动到加载区域
            loading.scrollIntoView({ behavior: 'smooth' });
            
            try {
                const response = await fetch(\`./data/\${code}.json\`);
                const data = await response.json();
                
                // 隐藏加载状态
                loading.style.display = 'none';
                
                // 生成详情HTML
                const detailsHTML = \`
                    <h2 style="color: white; margin-bottom: 0.5rem; font-size: 1.8rem; font-weight: 600;">\${name}</h2>
                    <p style="color: rgba(255,255,255,0.8); margin-bottom: 1.5rem; font-family: 'Courier New', monospace;">\${code}</p>
                    <div style="margin-bottom: 1rem;">
                        <button onclick="closeDetails()" style="background: #666; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">关闭详情</button>
                    </div>
                    \${data.roms.map(rom => \`
                        <div class="rom-item">
                            <div class="rom-version">\${rom.version}</div>
                            <div class="rom-links">
                                \${rom.links.map(link => \`
                                    <button class="copy-button" onclick="copyToClipboard('\${link}', this)">
                                        复制链接
                                    </button>
                                \`).join('')}
                            </div>
                        </div>
                    \`).join('')}
                \`;
                
                deviceDetails.innerHTML = detailsHTML;
                deviceDetails.style.display = 'block';
                
                // 滚动到详情区域
                deviceDetails.scrollIntoView({ behavior: 'smooth' });
                
            } catch (error) {
                console.error('加载设备数据失败:', error);
                loading.style.display = 'none';
                alert('加载失败，请重试');
            }
        }
        
        // 关闭详情
        function closeDetails() {
            const deviceDetails = document.getElementById('deviceDetails');
            deviceDetails.style.display = 'none';
        }
        
        // 复制到剪贴板
        async function copyToClipboard(text, button) {
            try {
                await navigator.clipboard.writeText(text);
                
                const originalText = button.textContent;
                button.textContent = '已复制';
                button.classList.add('copied');
                
                setTimeout(() => {
                    button.textContent = originalText;
                    button.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
                // 备用方案
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    button.textContent = '已复制';
                    button.classList.add('copied');
                    
                    setTimeout(() => {
                        button.textContent = '复制链接';
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    alert('复制失败，请手动复制链接');
                }
                
                document.body.removeChild(textArea);
            }
        }
    </script>
</body>
</html>`;
    
    fs.writeFileSync('docs/index.html', html);
}

// 主函数
function main() {
    console.log('开始生成优化版HTML...');
    
    const { devices, totalRoms, totalLinks } = readDeviceData();
    console.log(`读取到 ${devices.length} 个设备，总计 ${totalRoms} 个ROM版本，${totalLinks} 个下载链接`);
    
    // 确保输出目录存在
    if (!fs.existsSync('docs')) {
        fs.mkdirSync('docs');
    }
    if (!fs.existsSync('docs/data')) {
        fs.mkdirSync('docs/data');
    }
    
    // 生成文件
    generateDeviceList(devices);
    generateDeviceDataFiles(devices);
    generateMainHTML(devices, totalRoms, totalLinks);
    
    console.log('✅ 优化版HTML生成完成！');
    console.log('📁 文件结构:');
    console.log('   - docs/index.html (主页面，约50KB)');
    console.log('   - docs/data/devices.json (设备列表)');
    console.log(`   - docs/data/*.json (${devices.length}个设备数据文件)`);
}

main();
