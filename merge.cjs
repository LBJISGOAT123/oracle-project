const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const outputFile = path.join(__dirname, 'all_project_code.txt');

// 무시할 파일/폴더 패턴
const ignorePattern = ['.DS_Store', '.git', 'node_modules', 'vite-env.d.ts', '.png', '.jpg', '.svg'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      // 무시할 패턴 체크
      if (!ignorePattern.some(pattern => file.endsWith(pattern))) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

try {
  const files = getAllFiles(srcDir);
  let content = '';

  files.forEach(file => {
    // 상대 경로 계산
    const relativePath = path.relative(__dirname, file);
    const fileContent = fs.readFileSync(file, 'utf8');

    // AI가 인식하기 좋은 구분자 포맷
    content += `\n\n// === FILE: /${relativePath.replace(/\\/g, '/')} ===\n\n`;
    content += fileContent;
    content += `\n// ==========================================\n`;
  });

  fs.writeFileSync(outputFile, content);
  console.log(`✅ 성공! 모든 코드가 '${outputFile}'에 저장되었습니다.`);
} catch (e) {
  console.error("오류 발생:", e);
}