# OnePlus ROM 数据库 📱

## 📁 项目结构

```
oneplusrom/
├── 📁 .github/workflows/        
│   └── deploy.yml              
├── 📁 data/                    
│   ├── GM1900.json             
│   ├── PLF110.json             
│   └── ...                       
├── 📁 docs/                     
│   ├── index.html               
│   └── data/                     
├── 📁 scripts/                   
│   ├── generate-html-optimized.js 
│   ├── validate-json.js          
│   └── server.js            
├── package.json                 
└── README.md                 
```

## 🚀 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/your-username/oneplusrom.git
   cd oneplusrom
   ```

2. **安装依赖**
   ```bash
   npm install  
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   # 访问 http://localhost:3000
   ```

4. **构建网站**
   ```bash
   npm run build
   ```

### GitHub Pages部署

项目已配置自动部署，推送到main分支即可：

```bash
git add .
git commit -m "update data"
git push origin main
```

GitHub Actions会自动：
- ✅ 验证JSON数据格式
- ✅ 生成优化的HTML网站
- ✅ 部署到GitHub Pages

### 添加新设备

1. 在 `data/` 目录创建新的JSON文件，文件名使用设备型号（如 `PLF110.json`）
2. 使用以下格式：

```json
{
    "model": "一加OnePlus ACE 5 竞速版",
    "roms": [
        {
            "version": "ColorOS PLF110_15.0.2.206(CN01) A.20",
            "links": [
                "https://example.com/rom1.zip",
                "https://example.com/rom2.zip"
            ]
        }
    ]
}
```

3. **验证数据格式**
   ```bash
   npm run validate
   ```

4. **本地预览**
   ```bash
   npm run dev
   ```

5. **推送部署**
   ```bash
   git add data/PLF110.json
   git commit -m "add PLF110 device data"
   git push origin main
   ```

## 🔧 开发命令

```bash
# 验证JSON数据
npm run validate

# 构建网站
npm run build

# 启动开发服务器
npm run dev

# 运行完整测试
npm run test

# 清理构建文件
npm run clean
```

## 🔧 GitHub Pages 部署

### ✅ GitHub Actions 自动部署

项目已配置完整的CI/CD流程，**GitHub Pages可以正常使用**：

1. **自动触发**：推送到main分支自动部署
2. **工作流程**：
   - ✅ 验证30个JSON数据文件
   - ✅ 生成优化的HTML网站 
   - ✅ 创建`.nojekyll`文件禁用Jekyll处理
   - ✅ 自动部署到GitHub Pages
3. **权限配置**：已配置所需的Pages权限

### Jekyll处理问题解决

⚠️ **如果遇到Jekyll错误**：项目自动生成`.nojekyll`文件来禁用Jekyll处理，确保纯HTML网站正常工作。

```
Error: No such file or directory @ dir_chdir0 - /github/workspace/docs
```

**解决方案**：构建脚本会自动创建`docs/.nojekyll`文件，告诉GitHub Pages不要用Jekyll处理我们的静态HTML。

### 部署设置

1. **启用GitHub Pages**
   - 仓库设置 → Pages
   - 源选择：GitHub Actions

2. **自动部署**
   - 推送代码到main分支
   - GitHub Actions自动构建和部署
   - 访问：`https://your-username.github.io/oneplusrom/`
