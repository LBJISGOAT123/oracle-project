#!/bin/bash

OUTPUT="all_project_code.txt"

# 기존 파일이 있다면 삭제
rm -f "$OUTPUT"
touch "$OUTPUT"

echo "Extracting all source codes to $OUTPUT ..."

# src 폴더 내의 모든 ts, tsx, css 파일을 찾아서 병합
find src -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.css" \) | sort | while read -r file; do
  echo "==========================================" >> "$OUTPUT"
  echo "FILE PATH: $file" >> "$OUTPUT"
  echo "==========================================" >> "$OUTPUT"
  cat "$file" >> "$OUTPUT"
  echo -e "\n\n" >> "$OUTPUT"
done

echo "✅ Extraction Complete!"
echo "파일 탐색기에서 'all_project_code.txt' 파일을 확인하거나 다운로드하세요."
