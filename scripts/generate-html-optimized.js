const fs = require('fs');
const path = require('path');


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
            const deviceName = data.name || deviceCode;

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

function generateDeviceList(devices) {
    const deviceList = devices.map(device => ({
        code: device.code,
        name: device.name,
        romCount: device.romCount,
        linkCount: device.linkCount
    }));
    
    fs.writeFileSync('docs/data/devices.json', JSON.stringify(deviceList, null, 2));
}

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

function generateMainHTML(devices, totalRoms, totalLinks) {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OnePlus ROM</title>
    <link rel="icon" type="image/png" href="./ico.png">
    <link rel="shortcut icon" type="image/png" href="./ico.png">
    <link rel="apple-touch-icon" href="./ico.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            --glass-bg: rgba(255, 255, 255, 0.08);
            --glass-border: rgba(255, 255, 255, 0.2);
            --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.37);
            --accent-color: #00d4ff;
            --secondary-accent: #ff6b6b;
            --text-primary: #ffffff;
            --text-secondary: rgba(255, 255, 255, 0.8);
            --text-muted: rgba(255, 255, 255, 0.6);
            --spacing-xs: 0.5rem;
            --spacing-sm: 1rem;
            --spacing-md: 1.5rem;
            --spacing-lg: 2rem;
            --spacing-xl: 3rem;
            --border-radius: 16px;
            --border-radius-lg: 24px;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: 
                radial-gradient(circle at 20% 20%, rgba(102, 126, 234, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255, 107, 107, 0.3) 0%, transparent 50%),
                radial-gradient(circle at 50% 50%, rgba(0, 212, 255, 0.2) 0%, transparent 70%),
                linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%);
            background-attachment: fixed;
            background-size: 100% 100%;
            min-height: 100vh;
            color: var(--text-primary);
            line-height: 1.6;
            position: relative;
            overflow-x: hidden;
            font-feature-settings: 'liga' 1, 'kern' 1;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        
        html {
            height: 100%;
            --vh: 1vh;
        }

        a,
        area,
        button,
        input,
        label,
        select,
        summary,
        textarea,
        [tabindex] {
            -ms-touch-action: manipulation;
            touch-action: manipulation;
        }
        
        /* 修复浏览器扩展兼容性问题 */
        .immersive-translate-link {
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
        }

        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        body.modal-open {
            overflow: hidden;
            position: fixed;
            width: 100%;
            height: 100vh;
            height: 100dvh; 
            left: 0;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: none;
        }
        
        .modal-body {
            contain: layout;
            transform: translateZ(0);
        }

        @media (prefers-reduced-motion: reduce) {
            .modal-body {
                contain: none;
                transform: none;
            }
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: var(--spacing-lg);
            position: relative;
            z-index: 2;
            box-sizing: border-box;
        }
        
        .header {
            text-align: center;
            margin-bottom: var(--spacing-xl);
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, var(--accent-color) 0%, transparent 70%);
            border-radius: 50%;
            opacity: 0.1;
            z-index: -1;
            filter: blur(40px);
        }
        
        .header h1 {
            font-size: clamp(2.5rem, 8vw, 4rem);
            font-weight: 800;
            margin-bottom: var(--spacing-sm);
            background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-color) 50%, var(--secondary-accent) 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: none;
            letter-spacing: -0.02em;
            position: relative;
        }
        
        .header p {
            font-size: clamp(1rem, 3vw, 1.25rem);
            color: var(--text-secondary);
            font-weight: 400;
            margin-bottom: var(--spacing-lg);
        }
        
        .stats-bar {
            display: flex;
            justify-content: center;
            gap: var(--spacing-lg);
            margin-top: var(--spacing-md);
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius);
            padding: var(--spacing-sm) var(--spacing-md);
            text-align: center;
            min-width: 120px;
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--accent-color);
            display: block;
        }
        
        .stat-label {
            font-size: 0.85rem;
            color: var(--text-muted);
            margin-top: 2px;
        }
        
        .search-box {
            margin-bottom: var(--spacing-xl);
            position: relative;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .search-input {
            width: 100%;
            padding: var(--spacing-md) var(--spacing-lg);
            font-size: 1.1rem;
            border: none;
            border-radius: var(--border-radius-lg);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--glass-shadow);
            font-family: inherit;
        }
        
        .search-input::placeholder {
            color: var(--text-muted);
        }
        
        .search-input:focus {
            outline: none;
            border-color: var(--accent-color);
            box-shadow: 
                var(--glass-shadow),
                0 0 0 3px rgba(0, 212, 255, 0.2);
            transform: translateY(-2px) scale(1.02);
        }
        
        .search-box::after {
            content: '🔍';
            position: absolute;
            right: var(--spacing-md);
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.2rem;
            pointer-events: none;
            opacity: 0.6;
        }
        
        .devices-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
            gap: var(--spacing-lg);
            margin-bottom: var(--spacing-xl);
        }
        
        .device-card {
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-lg);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: var(--glass-shadow);
            display: flex;
            flex-direction: column;
            min-height: 220px;
            group: card;
        }
        
        .device-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent-color), var(--secondary-accent));
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .device-card:hover::before {
            transform: scaleX(1);
        }
        
        .device-card:hover {
            transform: translateY(-8px);
            border-color: var(--accent-color);
            box-shadow: 
                var(--glass-shadow),
                0 16px 64px rgba(0, 212, 255, 0.15);
        }

        @media (prefers-reduced-motion: reduce) {
            .device-card {
                transition: none;
            }
            
            .device-card:hover {
                transform: none;
            }
            
            .device-card::before {
                display: none;
            }
        }

        @media (hover: none) {
            .device-card:hover {
                transform: none;
                border-color: var(--glass-border);
                box-shadow: var(--glass-shadow);
            }
            
            .device-card:hover::before {
                transform: scaleX(0);
            }
        }
        
        .device-content {
            display: flex;
            flex-direction: column;
            height: 100%;
            position: relative;
            z-index: 2;
        }
        
        .device-model {
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: var(--spacing-xs);
            line-height: 1.3;
        }
        
        .device-code {
            font-size: 0.9rem;
            color: var(--text-muted);
            font-weight: 500;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            background: rgba(0, 212, 255, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
            width: fit-content;
            margin-bottom: auto;
            letter-spacing: 0.5px;
        }
        
        .load-button {
            width: 100%;
            padding: var(--spacing-md);
            background: linear-gradient(135deg, var(--accent-color) 0%, #0088cc 100%);
            color: var(--text-primary);
            border: none;
            border-radius: var(--border-radius);
            font-weight: 600;
            font-size: 0.95rem;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: auto;
            position: relative;
            overflow: hidden;
        }
        
        .load-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .load-button:hover::before {
            left: 100%;
        }
        
        .load-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 212, 255, 0.4);
        }
        
        .load-button:active {
            transform: translateY(0);
        }
        
        .loading {
            display: none;
            text-align: center;
            color: var(--text-secondary);
            font-size: 1.1rem;
            margin: var(--spacing-lg) 0;
        }
        
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid var(--text-muted);
            border-radius: 50%;
            border-top-color: var(--accent-color);
            animation: spin 1s ease-in-out infinite;
            margin-right: var(--spacing-xs);
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
            height: 100vh;
            height: 100dvh; 
            background: rgba(15, 15, 35, 0.8);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 1000;
            animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            overscroll-behavior: contain;
        }

        @media (prefers-reduced-motion: reduce) {
            .modal-overlay {
                backdrop-filter: blur(2px);
                animation: none;
            }
        }
        
        @media screen and (max-width: 768px) {
            .modal-overlay {
                min-height: 100vh;
                min-height: 100dvh;
                /* iOS Safari 修复 */
                min-height: -webkit-fill-available;
            }
            
            .modal-content {
                max-height: calc(100vh - 2rem);
                max-height: calc(100dvh - 2rem);
                max-height: calc(-webkit-fill-available - 2rem);
                margin: 1rem;
                width: calc(100% - 2rem);
            }
        }
        
        @media screen and (max-width: 768px) and (display-mode: fullscreen) {
            .modal-overlay {
                height: 100vh !important;
                height: 100dvh !important;
            }
            
            body.modal-open {
                height: 100vh !important;
                height: 100dvh !important;
            }
        }
        
        :root {
            --vh: 1vh;
        }
        
        .fullscreen-browser .modal-overlay {
            height: calc(var(--vh, 1vh) * 100);
        }
        
        .fullscreen-browser body.modal-open {
            height: calc(var(--vh, 1vh) * 100);
        }
        
        .fullscreen-browser body {
            background-attachment: fixed;
            min-height: -webkit-fill-available;
        }
        
        .fullscreen-browser .container {
            padding-top: 1rem;
            padding-bottom: 3rem;
        }
        
        .fullscreen-browser .devices-grid {
            gap: 1.25rem !important;
            margin-bottom: 1.5rem;
        }
        
        .modal-overlay.show {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .modal-content {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius-lg);
            width: 95%;
            max-width: 1000px;
            max-height: 90vh;
            overflow: hidden;
            animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            box-shadow: var(--glass-shadow);
        }
        
        @media (prefers-reduced-motion: reduce) {
            .modal-content {
                animation: none;
            }
        }
        
        .modal-header {
            padding: var(--spacing-lg);
            border-bottom: 1px solid var(--glass-border);
            background: linear-gradient(135deg, 
                rgba(0, 212, 255, 0.1) 0%, 
                rgba(255, 107, 107, 0.05) 100%);
            border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
            position: relative;
        }
        
        .modal-header h2 {
            color: var(--text-primary);
            margin: 0 0 var(--spacing-xs) 0;
            font-size: clamp(1.5rem, 4vw, 2rem);
            font-weight: 700;
            letter-spacing: -0.01em;
        }
        
        .modal-header p {
            color: var(--text-muted);
            margin: 0;
            font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-size: 0.9rem;
            background: rgba(0, 212, 255, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
            width: fit-content;
            letter-spacing: 0.5px;
        }
        
        .modal-close {
            position: absolute;
            top: var(--spacing-md);
            right: var(--spacing-md);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: 50%;
            width: 44px;
            height: 44px;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            title: "关闭";
        }
        
        .modal-close:hover {
            color: var(--text-primary);
            border-color: var(--secondary-accent);
            transform: scale(1.1);
            box-shadow: 0 4px 20px rgba(255, 107, 107, 0.3);
        }
        
        .modal-body {
            padding: var(--spacing-lg);
            max-height: 70vh;
            overflow-y: auto;
        }
        
        .modal-body::-webkit-scrollbar {
            width: 6px;
        }
        
        .modal-body::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .modal-body::-webkit-scrollbar-thumb {
            background: var(--glass-border);
            border-radius: 3px;
        }
        
        .modal-body::-webkit-scrollbar-thumb:hover {
            background: var(--accent-color);
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(60px) scale(0.9);
                filter: blur(4px);
            }
            to { 
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0);
            }
        }
        
        .loading-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 35, 0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 999;
            justify-content: center;
            align-items: center;
        }
        
        .loading-modal.show {
            display: flex;
        }
        
        .loading-content {
            background: var(--glass-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            text-align: center;
            color: var(--text-primary);
            box-shadow: var(--glass-shadow);
            min-width: 200px;
        }
        
        .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid var(--glass-border);
            border-top: 3px solid var(--accent-color);
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto var(--spacing-md) auto;
        }
        
        .pulse-animation {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
        }
        
        .load-button:active {
            transform: translateY(1px);
        }
        
        .rom-item {
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius);
            padding: var(--spacing-lg);
            margin-bottom: var(--spacing-md);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: var(--glass-shadow);
            overflow: visible;
            position: relative;
        }
        
        .rom-item:hover {
            transform: translateY(-4px);
            border-color: var(--accent-color);
            box-shadow: 
                var(--glass-shadow),
                0 16px 32px rgba(0, 212, 255, 0.15);
        }
        
        .rom-version {
            font-size: 1.1rem;
            font-weight: 700;
            color: var(--text-primary);
            margin-bottom: var(--spacing-sm);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            padding-bottom: var(--spacing-xs);
        }
        
        .rom-toggle {
            background: var(--glass-bg);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            border: 1px solid var(--glass-border);
            border-radius: 8px;
            color: var(--text-secondary);
            padding: 6px 12px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: var(--spacing-xs);
        }
        
        .rom-toggle:hover {
            background: rgba(0, 212, 255, 0.15);
            color: var(--accent-color);
            border-color: var(--accent-color);
            transform: scale(1.05);
        }
        
        .rom-toggle.collapsed::after {
            content: "展开 ▼";
        }
        
        .rom-toggle.expanded::after {
            content: "收起 ▲";
        }
        
        .rom-links {
            display: flex;
            flex-wrap: wrap;
            gap: var(--spacing-xs);
            align-items: stretch;
            justify-content: flex-start;
            max-height: 0;
            overflow: hidden;
            opacity: 0;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
            margin-top: 0;
            padding-top: 0;
            box-sizing: border-box;
        }
        
        .rom-links.expanded {
            max-height: 500px;
            opacity: 1;
            margin-top: var(--spacing-md);
            padding-top: var(--spacing-sm);
        }
        
        .copy-button {
            padding: var(--spacing-sm) var(--spacing-md);
            background: var(--glass-bg);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            border-radius: var(--border-radius);
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 600;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            flex: none;
            width: 140px;
            text-align: center;
            white-space: nowrap;
            box-shadow: var(--glass-shadow);
            position: relative;
            overflow: hidden;
        }
        
        .copy-button::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(0,212,255,0.2), transparent);
            transition: left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .copy-button:hover::before {
            left: 100%;
        }
        
        .copy-button:hover {
            border-color: var(--accent-color);
            color: var(--accent-color);
            transform: translateY(-2px) scale(1.02);
            box-shadow: 
                var(--glass-shadow),
                0 8px 25px rgba(0, 212, 255, 0.25);
        }
        
        .copy-button.copied {
            background: rgba(72, 187, 120, 0.2);
            border-color: #48bb78;
            color: #68d391;
            border: 1px solid rgba(86, 171, 47, 0.5);
            color: #a8e6cf;
        }
        
        @media (max-width: 768px) {
            :root {
                --spacing-xs: 0.4rem;
                --spacing-sm: 0.8rem;
                --spacing-md: 1.2rem;
                --spacing-lg: 1.6rem;
                --spacing-xl: 2rem;
                --border-radius: 12px;
                --border-radius-lg: 16px;
            }
            
            .container {
                padding: var(--spacing-md);
            }
            
            .header {
                margin-bottom: var(--spacing-lg);
            }
            
            .stats-bar {
                gap: var(--spacing-sm);
                margin-top: var(--spacing-sm);
            }
            
            .stat-item {
                min-width: 100px;
                padding: var(--spacing-xs) var(--spacing-sm);
            }
            
            .stat-number {
                font-size: 1.2rem;
            }
            
            .search-box {
                margin-bottom: var(--spacing-md);
            }
            
            .search-input {
                padding: var(--spacing-sm) var(--spacing-md);
                font-size: 1rem;
            }
            
            .devices-grid {
                grid-template-columns: 1fr;
                gap: var(--spacing-md);
            }
            
            .device-card {
                padding: var(--spacing-md);
                min-height: 180px;
            }
            
            .device-model {
                font-size: 1.3rem;
                margin-bottom: var(--spacing-xs);
            }
            
            .device-code {
                font-size: 0.8rem;
                margin-bottom: var(--spacing-sm);
            }
            
            .load-button {
                padding: var(--spacing-sm);
                font-size: 0.9rem;
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
                margin-bottom: 0.75rem; 
                padding-bottom: 0.25rem;
            }
            
            .rom-toggle {
                padding: 0.2rem 0.4rem;
                font-size: 0.7rem;
            }
            
            .rom-links {
                flex-direction: row;
                flex-wrap: wrap;
                gap: 0.3rem;
                justify-content: flex-start;
            }
            
            .rom-links.expanded {
                margin-top: 0.75rem; 
                padding-top: 0.5rem;
            }
            
            .copy-button {
                width: 120px; /* 移动端固定宽度 */
                flex: none;
                padding: 0.5rem 0.75rem;
                font-size: 0.8rem;
                min-width: unset; /* 重置最小宽度 */
            }
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
            
            .rom-toggle {
                padding: 0.15rem 0.3rem;
                font-size: 0.65rem;
            }
            
            .rom-links {
                gap: 0.25rem;
            }
            
            .copy-button {
                width: 100px; /* 最小屏幕固定宽度 */
                padding: 0.4rem 0.6rem;
                font-size: 0.75rem;
                min-width: unset; /* 重置最小宽度 */
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>OnePlus ROM</h1>
            <div class="stats-bar">
                <div class="stat-item">
                    <span class="stat-number">${devices.length}</span>
                    <span class="stat-label">设备型号</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalRoms}</span>
                    <span class="stat-label">ROM版本</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number">${totalLinks}</span>
                    <span class="stat-label">下载链接</span>
                </div>
            </div>
        </div>

        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="🔍 搜索设备型号或代码名..." id="searchInput">
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
                    <button class="modal-close" onclick="closeModal()" title="关闭">&times;</button>
                </div>
                <div class="modal-body" id="modalBody">
                    <!-- 设备详情内容将在这里动态加载 -->
                </div>
            </div>
        </div>
        
        <div id="deviceDetails" class="device-details"></div>
    </div>
    
    <script>
        let viewportTimer;
        let lastHeight = window.innerHeight;
        
        function fixViewportHeight() {
            const currentHeight = window.innerHeight;
            

            if (Math.abs(currentHeight - lastHeight) > 50) {
                const vh = currentHeight * 0.01;
                document.documentElement.style.setProperty('--vh', \`\${vh}px\`);
                document.documentElement.style.setProperty('--real-vh', \`\${vh}px\`);
                lastHeight = currentHeight;
            }
        }
        
        function debouncedFixViewportHeight() {
            clearTimeout(viewportTimer);
            viewportTimer = setTimeout(fixViewportHeight, 100);
        }
        

        fixViewportHeight();

        window.addEventListener('resize', debouncedFixViewportHeight);
        window.addEventListener('orientationchange', function() {

            setTimeout(debouncedFixViewportHeight, 300);
        });
        

        function detectFullscreenBrowser() {
            const isFullscreen = window.navigator.standalone || 
                                 window.matchMedia('(display-mode: fullscreen)').matches ||
                                 window.innerHeight === screen.height;
            
            if (isFullscreen) {
                document.body.classList.add('fullscreen-browser');
            }
        }
        
        detectFullscreenBrowser();
        
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
        let savedScrollPosition = 0;
        
        async function loadDeviceData(code, name) {
            const loadingModal = document.getElementById('loadingModal');
            const deviceModal = document.getElementById('deviceModal');
            const modalTitle = document.getElementById('modalTitle');
            const modalCode = document.getElementById('modalCode');
            const modalBody = document.getElementById('modalBody');
            
            savedScrollPosition = window.pageYOffset || document.documentElement.scrollTop;
            
            document.body.classList.add('modal-open');
            document.body.style.top = \`-\${savedScrollPosition}px\`;
            

            fixViewportHeight();

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
                        <div class="rom-version" onclick="toggleRomLinks(this)">
                            <span>
                                <span style="color: rgba(255,255,255,0.6); font-size: 0.8rem; margin-right: 0.5rem;">#\${romIndex + 1}</span>
                                \${rom.version}
                            </span>
                            <button class="rom-toggle collapsed"></button>
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
                
                // 恢复滚动位置（加载失败时）
                document.body.classList.remove('modal-open');
                document.body.style.top = '';
                
                if (savedScrollPosition) {
                    requestAnimationFrame(() => {
                        window.scrollTo({
                            top: savedScrollPosition,
                            behavior: 'auto'
                        });
                    });
                }
                
                alert('加载失败，请重试');
            }
        }
        
        // 关闭模态框
        function closeModal() {
            const deviceModal = document.getElementById('deviceModal');
            deviceModal.classList.remove('show');
            
            // 恢复页面滚动和位置
            document.body.classList.remove('modal-open');
            document.body.style.top = '';
            
            // 恢复之前的滚动位置（平滑滚动）
            if (savedScrollPosition) {
                // 使用 requestAnimationFrame 确保样式更新完成后再滚动
                requestAnimationFrame(() => {
                    window.scrollTo({
                        top: savedScrollPosition,
                        behavior: 'auto' // 立即跳转，不要动画
                    });
                });
            }
        }
        
        function toggleRomLinks(versionElement) {
            const romLinks = versionElement.nextElementSibling;
            const toggleButton = versionElement.querySelector('.rom-toggle');
            
            if (romLinks.classList.contains('expanded')) {
                romLinks.classList.remove('expanded');
                toggleButton.classList.remove('expanded');
                toggleButton.classList.add('collapsed');
            } else {
                romLinks.classList.add('expanded');
                toggleButton.classList.remove('collapsed');
                toggleButton.classList.add('expanded');
            }
        }
        
        document.getElementById('deviceModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                const deviceModal = document.getElementById('deviceModal');
                if (deviceModal.classList.contains('show')) {
                    closeModal();
                }
            }
        });
        
        async function copyToClipboard(text, button) {
            button.style.transform = 'scale(0.95)';
            setTimeout(() => {
                button.style.transform = '';
            }, 150);
            
            try {
                await navigator.clipboard.writeText(text);
                
                const originalText = button.innerHTML;
                const originalBg = button.style.background;
                
                button.innerHTML = '<span style="font-size: 0.8rem;">✅</span> 已复制';
                button.style.background = 'linear-gradient(135deg, #56ab2f, #a8e6cf)';
                button.classList.add('copied');

                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.style.background = originalBg;
                    button.classList.remove('copied');
                }, 2000);
                
            } catch (err) {
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

function main() {
    console.log('开始生成优化版HTML...');
    
    const { devices, totalRoms, totalLinks } = readDeviceData();
    console.log(`读取到 ${devices.length} 个设备，总计 ${totalRoms} 个ROM版本，${totalLinks} 个下载链接`);
    
    if (!fs.existsSync('docs')) {
        fs.mkdirSync('docs');
    }
    if (!fs.existsSync('docs/data')) {
        fs.mkdirSync('docs/data');
    }
    
    generateDeviceList(devices);
    generateDeviceDataFiles(devices);
    generateMainHTML(devices, totalRoms, totalLinks);
    
    fs.writeFileSync('docs/.nojekyll', '');
    
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
