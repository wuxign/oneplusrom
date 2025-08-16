const fs = require('fs');
const path = require('path');

console.log('🔍 开始验证JSON文件格式...\n');

// 获取所有JSON文件（排除特殊文件）
const jsonFiles = fs.readdirSync('./data').filter(file => 
  file.endsWith('.json')
);

let validFiles = 0;
let invalidFiles = 0;
let totalDevices = 0;
let totalRoms = 0;
let totalLinks = 0;

jsonFiles.forEach(file => {
  try {
    const content = fs.readFileSync(path.join('./data', file), 'utf8');
    const data = JSON.parse(content);
    
    // 检查必需字段
    if (!data.name) {
      console.log(`❌ ${file}: 缺少 'name' 字段`);
      invalidFiles++;
      return;
    }
    
    if (!data.roms || !Array.isArray(data.roms)) {
      console.log(`❌ ${file}: 缺少 'roms' 字段或格式不正确`);
      invalidFiles++;
      return;
    }
    
    // 检查ROM格式
    let validRoms = 0;
    for (let i = 0; i < data.roms.length; i++) {
      const rom = data.roms[i];
      if (!rom.version) {
        console.log(`⚠️  ${file}: ROM ${i + 1} 缺少 'version' 字段`);
        continue;
      }
      if (!rom.links || !Array.isArray(rom.links)) {
        console.log(`⚠️  ${file}: ROM ${i + 1} 缺少 'links' 字段或格式不正确`);
        continue;
      }
      validRoms++;
      totalLinks += rom.links.length;
    }
    
    if (validRoms === 0) {
      console.log(`❌ ${file}: 没有有效的ROM条目`);
      invalidFiles++;
      return;
    }
    
    console.log(`✅ ${file}: ${data.name} (${validRoms}个ROM, ${data.roms.reduce((sum, rom) => sum + (rom.links ? rom.links.length : 0), 0)}个链接)`);
    validFiles++;
    totalDevices++;
    totalRoms += validRoms;
    
  } catch (error) {
    console.log(`❌ ${file}: JSON格式错误 - ${error.message}`);
    invalidFiles++;
  }
});

console.log('\n📊 验证结果统计:');
console.log(`✅ 有效文件: ${validFiles}`);
console.log(`❌ 无效文件: ${invalidFiles}`);
console.log(`📱 总设备数: ${totalDevices}`);
console.log(`💾 总ROM数: ${totalRoms}`);
console.log(`🔗 总链接数: ${totalLinks}`);

if (invalidFiles === 0) {
  console.log('\n🎉 所有JSON文件格式正确！');
  process.exit(0);
} else {
  console.log(`\n⚠️  发现 ${invalidFiles} 个文件有问题，请修复后再试。`);
  process.exit(1);
}
