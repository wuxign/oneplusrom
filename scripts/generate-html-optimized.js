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
    <link rel="icon" type="image/png" href="./ico.png">
    <link rel="shortcut icon" type="image/png" href="./ico.png">
    <link rel="apple-touch-icon" href="./ico.png">
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
            background: linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe);
            background-size: 400% 400%;
            animation: gradientShift 15s ease infinite;
            min-height: 100vh;
            color: #333;
            line-height: 1.6;
            position: relative;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.15) 0%, transparent 50%);
            pointer-events: none;
            z-index: 1;
        }
        
        @keyframes gradientShift {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
            position: relative;
            z-index: 2;
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
            backdrop-filter: blur(15px);
            color: white;
            placeholder-color: rgba(255, 255, 255, 0.7);
            transition: all 0.3s ease;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.25);
        }
        
        .search-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
        }
        
        .search-input:focus {
            outline: none;
            background: rgba(255, 255, 255, 0.25);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3), 0 8px 32px rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
        }
        
        .devices-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1.5rem;
        }
        
        .device-card {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.25);
            border-radius: 20px;
            padding: 2rem;
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            display: flex;
            flex-direction: column;
            min-height: 200px;
        }
        
        .device-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        
        .device-card::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(255, 255, 255, 0.1) 0%, 
                rgba(255, 255, 255, 0.05) 50%, 
                rgba(255, 255, 255, 0.1) 100%);
            border-radius: 20px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .device-card:hover::before {
            left: 100%;
        }
        
        .device-card:hover::after {
            opacity: 1;
        }
        
        .device-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.25);
            background: rgba(255, 255, 255, 0.22);
            border: 1px solid rgba(255, 255, 255, 0.35);
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
            margin-bottom: auto;
            font-family: 'Courier New', monospace;
            flex-grow: 1;
        }
        
        .device-content {
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
            z-index: 2;
        }
        
        .load-button {
            width: 100%;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 1rem;
            margin-top: auto;
        }
        
        .load-button:hover {
            background: linear-gradient(135deg, #764ba2, #667eea);
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
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
        }
        
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            backdrop-filter: blur(15px);
            z-index: 1000;
            animation: fadeIn 0.3s ease-out;
        }
        
        .modal-overlay.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: rgba(255, 255, 255, 0.12);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 24px;
            width: 90%;
            max-width: 900px;
            max-height: 90vh;
            overflow: hidden;
            animation: slideUp 0.3s ease-out;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .modal-header {
            padding: 2rem 2rem 1rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.08));
        }
        
        .modal-header h2 {
            color: white;
            margin: 0 0 0.5rem 0;
            font-size: 1.8rem;
            font-weight: 600;
        }
        
        .modal-header p {
            color: rgba(255, 255, 255, 0.8);
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
        }
        
        .modal-close {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            color: white;
            cursor: pointer;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
        }
        
        .modal-close:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: scale(1.1);
        }
        
        .modal-body {
            padding: 2rem;
            max-height: 60vh;
            overflow-y: auto;
        }
        
        .modal-body::-webkit-scrollbar {
            width: 8px;
        }
        
        .modal-body::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
        }
        
        .modal-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        
        .modal-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px) scale(0.95);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }
        
        .loading-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            justify-content: center;
            align-items: center;
        }
        
        .loading-modal.show {
            display: flex;
        }
        
        .loading-content {
            background: rgba(255, 255, 255, 0.15);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            text-align: center;
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem auto;
        }
        
        .pulse-animation {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .load-button:active {
            transform: translateY(1px);
        }
        
        .device-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 35px rgba(0,0,0,0.3);
        }
        
        .rom-item:hover {
            background: rgba(255, 255, 255, 0.12);
            transform: translateX(8px);
            border-left: 4px solid #764ba2;
        }
        
        .rom-item {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            border-left: 4px solid #667eea;
            transition: all 0.3s ease;
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
            align-items: stretch;
            justify-content: flex-start;
        }
        
        .copy-button {
            padding: 0.6rem 1.2rem;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.3s ease;
            flex: 1 1 0;
            min-width: 140px;
            max-width: 180px;
            text-align: center;
            white-space: nowrap;
        }
        
        .copy-button:hover {
            background: linear-gradient(135deg, #764ba2, #667eea);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
        
        .copy-button.copied {
            background: linear-gradient(135deg, #56ab2f, #a8e6cf);
        }
        
        /* 按钮数量适配 - 使用数据属性 */
        .rom-links[data-button-count="1"] .copy-button {
            flex: 0 0 140px;
        }
        
        .rom-links[data-button-count="2"] .copy-button {
            flex: 1 1 140px;
            max-width: 160px;
        }
        
        .rom-links[data-button-count="3"] .copy-button {
            flex: 1 1 120px;
            max-width: 150px;
        }
        
        .rom-links[data-button-count="4"] .copy-button {
            flex: 1 1 110px;
            max-width: 140px;
        }
        
        /* 超过4个按钮时的处理 */
        .rom-links[data-button-count="5"] .copy-button,
        .rom-links[data-button-count="6"] .copy-button,
        .rom-links[data-button-count="7"] .copy-button,
        .rom-links[data-button-count="8"] .copy-button {
            flex: 1 1 100px;
            max-width: 130px;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 0.75rem;
            }
            
            .header {
                margin-bottom: 1.5rem;
            }
            
            .header h1 {
                font-size: 1.8rem;
                margin-bottom: 0.25rem;
            }
            
            .header p {
                font-size: 1rem;
            }
            
            .search-box {
                margin-bottom: 1rem;
            }
            
            .search-input {
                padding: 0.75rem 1rem;
                font-size: 1rem;
                border-radius: 12px;
            }
            
            .devices-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .device-card {
                padding: 1.25rem;
                min-height: 150px;
                border-radius: 16px;
            }
            
            .device-model {
                font-size: 1.25rem;
                margin-bottom: 0.25rem;
            }
            
            .device-code {
                font-size: 0.8rem;
                margin-bottom: 0.75rem;
            }
            
            .load-button {
                padding: 0.75rem;
                font-size: 0.9rem;
                border-radius: 10px;
            }
            
            .modal-content {
                width: 95%;
                max-height: 95vh;
                margin: 0 0.5rem;
                border-radius: 16px;
            }
            
            .modal-header {
                padding: 1rem 1rem 0.75rem 1rem;
            }
            
            .modal-header h2 {
                font-size: 1.3rem;
                margin-right: 2.5rem;
                margin-bottom: 0.25rem;
            }
            
            .modal-header p {
                font-size: 0.8rem;
            }
            
            .modal-body {
                padding: 1rem;
                max-height: 75vh;
            }
            
            .modal-close {
                top: 0.75rem;
                right: 0.75rem;
                width: 30px;
                height: 30px;
                font-size: 1rem;
            }
            
            .rom-item {
                padding: 1rem;
                margin-bottom: 0.75rem;
                border-radius: 10px;
            }
            
            .rom-version {
                font-size: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .rom-links {
                flex-direction: row;
                flex-wrap: wrap;
                gap: 0.3rem;
                justify-content: flex-start;
            }
            
            .copy-button {
                width: auto;
                flex: none;
                min-width: 80px;
                padding: 0.5rem 0.75rem;
                font-size: 0.8rem;
                border-radius: 6px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 0.5rem;
            }
            
            .header h1 {
                font-size: 1.6rem;
            }
            
            .header p {
                font-size: 0.9rem;
            }
            
            .search-input {
                padding: 0.6rem 0.8rem;
                font-size: 0.95rem;
            }
            
            .device-card {
                padding: 1rem;
                min-height: 130px;
            }
            
            .device-model {
                font-size: 1.1rem;
            }
            
            .device-code {
                font-size: 0.75rem;
            }
            
            .load-button {
                padding: 0.6rem;
                font-size: 0.85rem;
            }
            
            .modal-header {
                padding: 0.75rem;
            }
            
            .modal-header h2 {
                font-size: 1.2rem;
                margin-right: 2rem;
            }
            
            .modal-body {
                padding: 0.75rem;
            }
            
            .rom-item {
                padding: 0.75rem;
                margin-bottom: 0.5rem;
            }
            
            .rom-version {
                font-size: 0.95rem;
            }
            
            .rom-links {
                gap: 0.25rem;
            }
            
            .copy-button {
                padding: 0.4rem 0.6rem;
                font-size: 0.75rem;
                min-width: 70px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OnePlus ROM 数据库</h1>
        </div>
        

        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="搜索机型..." id="searchInput">
        </div>
        
        <div class="devices-grid" id="devicesGrid">
            ${devices.map(device => `
                <div class="device-card" data-code="${device.code}" data-name="${device.name}">
                    <div class="device-content">
                        <div class="device-model">${device.name}</div>
                        <div class="device-code">${device.code}</div>
                        <button class="load-button" onclick="loadDeviceData('${device.code}', '${device.name}')">
                            查看详情
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="loading-modal" id="loadingModal">
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div>正在加载设备数据...</div>
            </div>
        </div>
        
        <div class="modal-overlay" id="deviceModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">设备详情</h2>
                    <p id="modalCode">GM1900</p>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body" id="modalBody">
                    <!-- 设备详情内容将在这里动态加载 -->
                </div>
            </div>
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
            const loadingModal = document.getElementById('loadingModal');
            const deviceModal = document.getElementById('deviceModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalCode = document.getElementById('modalCode');
            const modalBody = document.getElementById('modalBody');
            
            // 显示加载模态框
            loadingModal.classList.add('show');
            
            try {
                const response = await fetch(\`./data/\${code}.json\`);
                const data = await response.json();
                
                // 隐藏加载模态框
                loadingModal.classList.remove('show');
                
                // 设置模态框内容
                modalTitle.textContent = name;
                modalCode.textContent = code;
                
                // 生成ROM详情HTML
                const romsHTML = data.roms.map((rom, romIndex) => \`
                    <div class="rom-item">
                        <div class="rom-version">
                            <span style="color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-right: 0.5rem;">#\${romIndex + 1}</span>
                            \${rom.version}
                        </div>
                        <div class="rom-links" data-button-count="\${rom.links.length}">
                            \${rom.links.map((link, index) => \`
                                <button class="copy-button" onclick="copyToClipboard('\${link}', this)" title="点击复制下载链接">
                                    <span style="font-size: 0.8rem;">📋</span> 
                                    复制链接\${rom.links.length > 1 ? ' ' + (index + 1) : ''}
                                </button>
                            \`).join('')}
                        </div>
                    </div>
                \`).join('');
                
                modalBody.innerHTML = romsHTML;
                
                // 显示设备详情模态框
                deviceModal.classList.add('show');
                
            } catch (error) {
                console.error('加载设备数据失败:', error);
                loadingModal.classList.remove('show');
                alert('加载失败，请重试');
            }
        }
        
        // 关闭模态框
        function closeModal() {
            const deviceModal = document.getElementById('deviceModal');
            deviceModal.classList.remove('show');
        }
        
        // 点击背景关闭模态框
        document.getElementById('deviceModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal();
            }
        });
        
        // 复制到剪贴板
        async function copyToClipboard(text, button) {
            // 添加点击反馈
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
            
            try {
                await navigator.clipboard.writeText(text);
                
                const originalText = button.innerHTML;
                const originalBg = button.style.background;
                
                // 成功反馈
                button.innerHTML = '<span style="font-size: 0.8rem;">✅</span> 已复制';
                button.style.background = 'linear-gradient(135deg, #56ab2f, #a8e6cf)';
                button.classList.add('copied');
                
                // 2秒后恢复
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = originalBg;
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
                    
                    const originalText = button.innerHTML;
                    button.innerHTML = '<span style="font-size: 0.8rem;">✅</span> 已复制';
                    button.style.background = 'linear-gradient(135deg, #56ab2f, #a8e6cf)';
                    button.classList.add('copied');
                    
                    setTimeout(() => {
                        button.innerHTML = originalText;
                        button.style.background = '';
                        button.classList.remove('copied');
                    }, 2000);
                } catch (err) {
                    // 失败反馈
                    button.innerHTML = '<span style="font-size: 0.8rem;">❌</span> 复制失败';
                    button.style.background = 'linear-gradient(135deg, #ff4757, #ff3838)';
                    
                    setTimeout(() => {
                        button.innerHTML = '<span style="font-size: 0.8rem;">📋</span> 复制链接';
                        button.style.background = '';
                    }, 2000);
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
    
    // 创建.nojekyll文件禁用Jekyll处理
    fs.writeFileSync('docs/.nojekyll', '');
    
    // 复制ico.png到docs目录
    if (fs.existsSync('ico.png')) {
        fs.copyFileSync('ico.png', 'docs/ico.png');
        console.log('📎 已复制 ico.png 到 docs 目录');
    } else {
        console.log('⚠️  未找到 ico.png 文件');
    }
    
    console.log('✅ 优化版HTML生成完成！');
    console.log('📁 文件结构:');
    console.log('   - docs/index.html (主页面，约50KB)');
    console.log('   - docs/data/devices.json (设备列表)');
    console.log(`   - docs/data/*.json (${devices.length}个设备数据文件)`);
    console.log('   - docs/.nojekyll (禁用Jekyll处理)');
    if (fs.existsSync('docs/ico.png')) {
        console.log('   - docs/ico.png (网站图标)');
    }
}

main();
