@echo off
cd /d "C:\Users\Administrator\Desktop\naik\backend"
"C:\Program Files\nodejs\node.exe" node_modules\ts-node\dist\bin.js --transpile-only --skip-project --compiler-options "{\"module\":\"commonjs\",\"moduleResolution\":\"node\"}" src/server.ts
