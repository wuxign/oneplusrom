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

function generateMainHTML() {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OnePlus ROM</title>
    <link rel="icon" type="image/png" href="./ico.png">
    <link rel="shortcut icon" type="image/png" href="./ico.png">
    <link rel="apple-touch-icon" href="./ico.png">
    <style>
        :root {
            /* 现代配色方案 - 基于一加品牌色 */
            --primary-color: #2c5aa0;
            --primary-light: #4a7bc8;
            --primary-dark: #1e3f73;
            --accent-color: #e74c3c;
            --accent-light: #ff6b5b;
            --success-color: #27ae60;
            --warning-color: #f39c12;
            
            /* 背景和表面 */
            --bg-primary: #0a0e1a;
            --bg-secondary: #111827;
            --bg-tertiary: #1f2937;
            --surface: rgba(255, 255, 255, 0.05);
            --surface-hover: rgba(255, 255, 255, 0.08);
            --surface-active: rgba(255, 255, 255, 0.12);
            
            /* 毛玻璃效果 */
            --glass-bg: rgba(255, 255, 255, 0.08);
            --glass-bg-hover: rgba(255, 255, 255, 0.12);
            --glass-border: rgba(255, 255, 255, 0.15);
            --glass-border-hover: rgba(255, 255, 255, 0.25);
            --glass-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            --glass-shadow-hover: 0 8px 32px rgba(0, 0, 0, 0.35);
            
            /* 文字颜色 */
            --text-primary: #ffffff;
            --text-secondary: #d1d5db;
            --text-muted: #9ca3af;
            --text-subtle: #6b7280;
            
            /* 尺寸和间距 */
            --spacing-xs: 0.25rem;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
            --spacing-xl: 2rem;
            --spacing-2xl: 3rem;
            
            /* 圆角 */
            --radius-sm: 6px;
            --radius-md: 10px;
            --radius-lg: 16px;
            --radius-xl: 20px;
            
            /* 过渡 */
            --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-normal: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: 
                radial-gradient(circle at 25% 25%, rgba(44, 90, 160, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(231, 76, 60, 0.1) 0%, transparent 50%),
                linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 50%, var(--bg-tertiary) 100%);
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
            font-weight: 400;
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
                will-change: auto;
            }
            
            .rom-item {
                will-change: auto;
                transition: none;
            }
            
            .copy-button {
                will-change: auto;
                transition: none;
            }
            
            .copy-button:hover {
                transform: none;
            }
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: var(--spacing-xl) var(--spacing-lg);
            position: relative;
            z-index: 2;
        }
        
        .header {
            text-align: center;
            margin-bottom: var(--spacing-2xl);
            padding: var(--spacing-xl) 0;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 100px;
            background: linear-gradient(90deg, var(--primary-color) 0%, var(--accent-color) 100%);
            border-radius: 50px;
            opacity: 0.08;
            z-index: -1;
            filter: blur(60px);
        }
        
        .header h1 {
            font-size: clamp(2.5rem, 6vw, 3.5rem);
            font-weight: 700;
            margin-bottom: var(--spacing-md);
            background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-light) 70%, var(--accent-color) 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.01em;
            position: relative;
        }
        
        .header p {
            font-size: clamp(1rem, 2.5vw, 1.125rem);
            color: var(--text-secondary);
            font-weight: 400;
            margin-bottom: var(--spacing-xl);
            opacity: 0.9;
        }
        
        .stats-bar {
            display: flex;
            justify-content: center;
            gap: var(--spacing-xl);
            margin-top: var(--spacing-lg);
            flex-wrap: wrap;
        }
        
        .stat-item {
            background: var(--surface);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-lg) var(--spacing-xl);
            text-align: center;
            min-width: 140px;
            transition: var(--transition-normal);
            position: relative;
            overflow: hidden;
        }
        
        .stat-number {
            font-size: 1.75rem;
            font-weight: 600;
            color: var(--primary-light);
            display: block;
            margin-bottom: var(--spacing-xs);
        }
        
        .stat-label {
            font-size: 0.875rem;
            color: var(--text-muted);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }
        
        .search-box {
            margin-bottom: var(--spacing-2xl);
            position: relative;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .search-input {
            width: 100%;
            padding: var(--spacing-lg) var(--spacing-xl);
            font-size: 1rem;
            border: 2px solid var(--glass-border);
            border-radius: var(--radius-xl);
            background: var(--surface);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            color: var(--text-primary);
            transition: var(--transition-normal);
            box-shadow: var(--glass-shadow);
            font-family: inherit;
            font-weight: 400;
        }
        
        .search-input::placeholder {
            color: var(--text-muted);
        }
        
        .search-input:focus {
            outline: none;
            background: var(--surface-hover);
            border-color: var(--primary-light);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            box-shadow: 
                var(--glass-shadow-hover),
                0 0 0 4px rgba(76, 123, 200, 0.15);
            transform: translateY(-1px);
        }
        
        .search-box::after {
            content: '🔍';
            position: absolute;
            right: var(--spacing-lg);
            top: 50%;
            transform: translateY(-50%);
            font-size: 1.125rem;
            pointer-events: none;
            opacity: 0.5;
        }
        
        .devices-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: var(--spacing-xl);
            margin-bottom: var(--spacing-2xl);
        }
        
        .device-card {
            background: var(--surface);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-xl);
            padding: var(--spacing-xl);
            transition: var(--transition-normal);
            cursor: pointer;
            position: relative;
            overflow: hidden;
            box-shadow: var(--glass-shadow);
            display: flex;
            flex-direction: column;
            min-height: 200px;
        }
        
        .device-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-light) 50%, var(--accent-color) 100%);
            transform: scaleX(0);
            transform-origin: center;
            transition: var(--transition-normal);
            border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }
        
        .device-card:hover::before {
            transform: scaleX(1);
        }
        
        .device-card:hover {
            background: var(--surface-hover);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            transform: translateY(-4px);
            border-color: var(--glass-border-hover);
            box-shadow: 
                0 12px 40px rgba(0, 0, 0, 0.15),
                0 4px 16px rgba(44, 90, 160, 0.1);
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
            font-size: 1.375rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: var(--spacing-sm);
            line-height: 1.3;
            letter-spacing: -0.01em;
        }
        
        .device-code {
            font-size: 0.8125rem;
            color: var(--text-subtle);
            font-weight: 500;
            font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
            background: var(--surface-active);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            width: fit-content;
            margin-bottom: auto;
            letter-spacing: 0.025em;
            border: 1px solid var(--glass-border);
        }
        
        .load-button {
            width: 100%;
            padding: var(--spacing-md) var(--spacing-lg);
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
            color: var(--text-primary);
            border: none;
            border-radius: var(--radius-lg);
            font-weight: 500;
            font-size: 0.9375rem;
            cursor: pointer;
            transition: var(--transition-normal);
            margin-top: auto;
            position: relative;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(44, 90, 160, 0.3);
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
            background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary-color) 100%);
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(44, 90, 160, 0.4);
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
            background: rgba(10, 14, 26, 0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 1000;
            animation: fadeIn var(--transition-normal);
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
            background: var(--bg-secondary);
            border: 2px solid var(--glass-border);
            border-radius: var(--radius-xl);
            width: 95%;
            max-width: 850px;
            max-height: 85vh;
            overflow: hidden;
            animation: slideUp var(--transition-slow);
            position: relative;
            box-shadow: 
                0 25px 50px rgba(0, 0, 0, 0.25),
                0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        
        @media (prefers-reduced-motion: reduce) {
            .modal-content {
                animation: none;
            }
        }
        
        .modal-header {
            padding: var(--spacing-xl) var(--spacing-2xl);
            border-bottom: 2px solid var(--glass-border);
            background: var(--bg-tertiary);
            border-radius: var(--radius-xl) var(--radius-xl) 0 0;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: var(--spacing-lg);
        }
        
        .modal-header h2 {
            color: var(--text-primary);
            margin: 0;
            font-size: clamp(1.375rem, 3vw, 1.75rem);
            font-weight: 700;
            letter-spacing: -0.02em;
            background: linear-gradient(135deg, var(--text-primary) 0%, var(--primary-light) 100%);
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            flex: 1;
        }
        
        .modal-header p {
            color: var(--text-primary);
            margin: 0;
            font-family: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
            font-size: 0.875rem;
            background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-light) 100%);
            padding: var(--spacing-xs) var(--spacing-sm);
            border-radius: var(--radius-sm);
            letter-spacing: 0.025em;
            font-weight: 500;
            text-transform: uppercase;
            white-space: nowrap;
            flex-shrink: 0;
        }
        
        .modal-close {
            background: var(--surface);
            border: 2px solid var(--glass-border);
            border-radius: var(--radius-lg);
            width: 40px;
            height: 40px;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 1.125rem;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition-normal);
            font-weight: 600;
            flex-shrink: 0;
        }
        
        .modal-close:hover {
            background: var(--accent-color);
            color: var(--text-primary);
            border-color: var(--accent-color);
            transform: scale(1.05);
            box-shadow: 0 4px 16px rgba(231, 76, 60, 0.3);
        }
        
        .modal-body {
            padding: var(--spacing-2xl);
            max-height: 65vh;
            overflow-y: auto;
            background: var(--bg-secondary);
            will-change: scroll-position;
            contain: layout style paint;
            transform: translateZ(0);
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
            backface-visibility: hidden;
            perspective: 1000px;
        }
        
        .modal-body::-webkit-scrollbar {
            width: 8px;
        }
        
        .modal-body::-webkit-scrollbar-track {
            background: var(--bg-tertiary);
            border-radius: var(--radius-sm);
        }
        
        .modal-body::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: var(--radius-sm);
        }
        
        .modal-body::-webkit-scrollbar-thumb:hover {
            background: var(--primary-light);
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
            background: rgba(10, 10, 25, 0.92);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            z-index: 999;
            justify-content: center;
            align-items: center;
        }
        
        .loading-modal.show {
            display: flex;
        }
        
        .loading-content {
            background: var(--glass-bg-strong);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid var(--glass-border);
            border-radius: var(--border-radius-lg);
            padding: var(--spacing-xl);
            text-align: center;
            color: var(--text-primary);
            box-shadow: 
                var(--glass-shadow-hover),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
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
        
        .loading-devices {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-xl);
            color: var(--text-secondary);
            grid-column: 1 / -1;
        }
        
        .loading-devices .loading-spinner {
            width: 40px;
            height: 40px;
            margin-bottom: var(--spacing-md);
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
            background: var(--surface);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            margin-bottom: var(--spacing-lg);
            transition: var(--transition-normal);
            box-shadow: var(--glass-shadow);
            overflow: visible;
            position: relative;
            /* 性能优化 */
            will-change: transform;
            contain: layout;
            transform: translateZ(0);
        }
        
        .rom-item:hover {
            background: var(--surface-hover);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            transform: translateY(-2px) translateZ(0);
            border-color: var(--glass-border-hover);
            box-shadow: 
                var(--glass-shadow-hover),
                0 8px 24px rgba(44, 90, 160, 0.1);
        }
        
        .rom-version {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: var(--spacing-md);
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            -webkit-user-select: none;
            -moz-user-select: none;
            user-select: none;
            padding-bottom: var(--spacing-sm);
            border-bottom: 1px solid var(--glass-border);
        }
        
        .rom-toggle {
            background: var(--surface);
            border: 1px solid var(--glass-border);
            border-radius: var(--radius-md);
            color: var(--text-secondary);
            padding: var(--spacing-sm) var(--spacing-md);
            font-size: 0.8125rem;
            font-weight: 500;
            cursor: pointer;
            transition: var(--transition-normal);
            margin-left: var(--spacing-sm);
        }
        
        .rom-toggle:hover {
            background: var(--surface-hover);
            color: var(--primary-light);
            border-color: var(--primary-light);
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
            padding: var(--spacing-sm) var(--spacing-lg);
            background: var(--surface);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            border-radius: var(--radius-md);
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            transition: var(--transition-normal);
            flex: none;
            min-width: 120px;
            text-align: center;
            white-space: nowrap;
            box-shadow: var(--glass-shadow);
            position: relative;
            /* 性能优化 */
            will-change: transform;
            backface-visibility: hidden;
        }
        
        .copy-button:hover {
            background: var(--surface-hover);
            border-color: var(--primary-light);
            color: var(--primary-light);
            transform: translateY(-1px) scale(1.02);
            box-shadow: 
                var(--glass-shadow-hover),
                0 2px 8px rgba(44, 90, 160, 0.2);
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
            
            .modal-body {
                -webkit-overflow-scrolling: touch;
                overscroll-behavior: none;
            }
            
            .rom-item {
                will-change: auto;
                contain: layout;
            }
            
            .rom-item:hover {
                transform: none;
                border-color: var(--glass-border);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            }
            
            .copy-button {
                will-change: auto;
            }
            
            .copy-button:hover {
                transform: none;
                background: rgba(255, 255, 255, 0.06);
                color: var(--text-primary);
                border-color: var(--glass-border);
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
                width: 120px; 
                flex: none;
                padding: 0.5rem 0.75rem;
                font-size: 0.8rem;
                min-width: unset; 
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
                width: 100px; 
                padding: 0.4rem 0.6rem;
                font-size: 0.75rem;
                min-width: unset; 
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
                    <span class="stat-number" id="deviceCount">0</span>
                    <span class="stat-label">设备型号</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" id="romCount">0</span>
                    <span class="stat-label">ROM版本</span>
                </div>
                <div class="stat-item">
                    <span class="stat-number" id="linkCount">0</span>
                    <span class="stat-label">下载链接</span>
                </div>
            </div>
        </div>

        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="🔍 搜索设备型号或代码名..." id="searchInput">
        </div>
        
        <div class="devices-grid" id="devicesGrid">
            <div class="loading-devices">
                <div class="loading-spinner"></div>
                <div>正在加载设备列表...</div>
            </div>
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
        let allDevices = []; 
        
        document.addEventListener('DOMContentLoaded', function() {
            loadDevicesList();
        });
        
        async function loadDevicesList() {
            try {
                const response = await fetch('./data/devices.json');
                const devices = await response.json();
                allDevices = devices;
                
                updateStats(devices);
                
                renderDeviceCards(devices);
                
                initializeSearch();
                
            } catch (error) {
                console.error('加载设备列表失败:', error);
                document.getElementById('devicesGrid').innerHTML = 
                    '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">加载失败，请刷新页面重试</div>';
            }
        }
        
        function updateStats(devices) {
            const totalRoms = devices.reduce((sum, device) => sum + device.romCount, 0);
            const totalLinks = devices.reduce((sum, device) => sum + device.linkCount, 0);
            
            document.getElementById('deviceCount').textContent = devices.length;
            document.getElementById('romCount').textContent = totalRoms;
            document.getElementById('linkCount').textContent = totalLinks;
        }
        
        function renderDeviceCards(devices) {
            const devicesGrid = document.getElementById('devicesGrid');
            
            const cardsHTML = devices.map(device => \`
                <div class="device-card" data-code="\${device.code}" data-name="\${device.name}">
                    <div class="device-content">
                        <div class="device-model">\${device.name}</div>
                        <div class="device-code">\${device.code}</div>
                        <button class="load-button" onclick="loadDeviceData('\${device.code}', '\${device.name}')">
                            查看详情
                        </button>
                    </div>
                </div>
            \`).join('');
            
            devicesGrid.innerHTML = cardsHTML;
        }
        
        function initializeSearch() {
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
        }
        
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
                
                loadingModal.classList.remove('show');
                
                modalTitle.textContent = name;
                modalCode.textContent = code;
                
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
                

                deviceModal.classList.add('show');
                
            } catch (error) {
                console.error('加载设备数据失败:', error);
                loadingModal.classList.remove('show');
                
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
        
        function closeModal() {
            const deviceModal = document.getElementById('deviceModal');
            deviceModal.classList.remove('show');
            
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

    const { devices } = readDeviceData();
    console.log(`处理了 ${devices.length} 个设备文件`);

    if (!fs.existsSync('docs')) {
        fs.mkdirSync('docs');
    }
    if (!fs.existsSync('docs/data')) {
        fs.mkdirSync('docs/data');
    }

    generateDeviceList(devices);
    generateDeviceDataFiles(devices);
    generateMainHTML();

    fs.writeFileSync('docs/.nojekyll', '');
}

main();
