#!/bin/zsh
source ~/.zshrc

echo ""
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║         🚀 EXTRACTA — Starting...         ║"
echo "  ╚═══════════════════════════════════════════╝"
echo ""

cd ~/Code/EXTRACTA
npx next dev web -p 3000 &
SERVER_PID=$!

sleep 3
open http://localhost:3000

echo "✅ EXTRACTA running at http://localhost:3000"
echo "   Close this window or press Ctrl+C to stop"
echo ""

wait $SERVER_PID
