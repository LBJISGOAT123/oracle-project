import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 환경에서 __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.join(__dirname, 'src');
const OUTPUT_FILE = path.join(__dirname, 'all_project_code.txt');
const INCLUDE_EXTS = ['.ts', '.tsx', '.css', '.js', '.json'];
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build'];

function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    const fullPath = path.join(dirPath, file);
    if (EXCLUDE_DIRS.includes(file)) return;
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

try {
  console.log("📂 파일 탐색 시작...");
  if (!fs.existsSync(TARGET_DIR)) {
    console.error(`❌ src 폴더가 없습니다: ${TARGET_DIR}`);
    process.exit(1);
  }

  const allFiles = getAllFiles(TARGET_DIR);
  fs.writeFileSync(OUTPUT_FILE, '', 'utf8');
  let fileCount = 0;

  allFiles.forEach(filePath => {
    if (INCLUDE_EXTS.includes(path.extname(filePath))) {
      const relativePath = path.relative(__dirname, filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      const output = `\n// === FILE: /${relativePath.replace(/\\/g, '/')} ===\n\n${content}\n`;
      fs.appendFileSync(OUTPUT_FILE, output, 'utf8');
      fileCount++;
      console.log(`✅ 추가됨: ${relativePath}`);
    }
  });

  console.log(`\n🎉 완료! ${fileCount}개 파일 병합됨.`);
  console.log(`👉 생성된 파일: ${OUTPUT_FILE}`);
} catch (err) {
  console.error("오류:", err);
}