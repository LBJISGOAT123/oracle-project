#!/bin/bash

OUTPUT="all_src_code.txt"
echo "--- START OF FILE $OUTPUT ---" > $OUTPUT

# 1. 주요 설정 파일 추가 (있을 경우만)
for config in "package.json" "vite.config.ts" "tsconfig.json"; do
  if [ -f "$config" ]; then
    echo "Adding $config..."
    echo "" >> $OUTPUT
    echo "==========================================" >> $OUTPUT
    echo "FILE PATH: $config" >> $OUTPUT
    echo "==========================================" >> $OUTPUT
    cat "$config" >> $OUTPUT
    echo "" >> $OUTPUT
  fi
done

# 2. src 폴더 내의 소스 코드 추가 (ts, tsx, css)
echo "Scanning src directory..."
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort | while read file; do
  echo "Adding $file..."
  echo "" >> $OUTPUT
  echo "==========================================" >> $OUTPUT
  echo "FILE PATH: $file" >> $OUTPUT
  echo "==========================================" >> $OUTPUT
  cat "$file" >> $OUTPUT
  echo "" >> $OUTPUT
done

echo "------------------------------------------"
echo "✅ 완료! 모든 코드가 '$OUTPUT' 파일에 저장되었습니다."
echo "좌측 파일 탐색기에서 '$OUTPUT' 파일을 찾아 다운로드하거나 내용을 복사하세요."
