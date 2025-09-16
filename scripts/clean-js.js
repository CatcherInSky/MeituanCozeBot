#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 移除 "use strict";
  content = content.replace(/^"use strict";\n?/gm, '');
  
  // 移除 Object.defineProperty 相关行
  content = content.replace(/^Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\n?/gm, '');
  
  // 移除 exports 相关行
  content = content.replace(/^exports\.[^=]+ = [^;]+;\n?/gm, '');
  
  // 移除 module.exports 相关行
  content = content.replace(/^module\.exports\.[^=]+ = [^;]+;\n?/gm, '');
  
  // 移除 __importDefault 辅助函数
  content = content.replace(/^var __importDefault = \(this && this\.__importDefault\) \|\| function \(mod\) \{\n    return \(mod && mod\.__esModule\) \? mod : \{ "default": mod \};\n\};\n?/gm, '');
  
  // 转换 dayjs import
  content = content.replace(/const dayjs_1 = __importDefault\(require\("dayjs"\)\);/g, 'import dayjs from "dayjs";');
  content = content.replace(/dayjs_1\.default/g, 'dayjs');
  
  // 移除多余的空行
  content = content.replace(/\n{3,}/g, '\n\n');
  
  fs.writeFileSync(filePath, content);
}

function cleanDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      cleanDirectory(filePath);
    } else if (file.endsWith('.js')) {
      cleanFile(filePath);
    }
  }
}

// 清理 dist 目录
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  cleanDirectory(distPath);
  console.log('Cleaned JavaScript files in dist directory');
} else {
  console.log('Dist directory not found');
}
