#!/usr/bin/env bash
# tunnel.sh — cloudflared quick tunnel + auto-register Telegram webhook

set -euo pipefail

LOGFILE=/tmp/cf-tunnel.log
BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-8752731720:AAHtL3nXN05lzeEu92qn4-UDD6QdX9aAzj8}"
PORT="${PORT:-3456}"

# 기존 터널 프로세스 정리
pkill -f "cloudflared tunnel --url" 2>/dev/null || true
sleep 1

# 로그 초기화
rm -f "$LOGFILE"

# 터널 시작 (백그라운드)
/opt/homebrew/bin/cloudflared tunnel --url "http://localhost:${PORT}" --logfile "$LOGFILE" &
TUNNEL_PID=$!

echo "[tunnel] cloudflared 시작 (PID=$TUNNEL_PID)"

# URL 나올 때까지 대기 (최대 30초)
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOGFILE" 2>/dev/null | head -1 || true)
  if [ -n "$TUNNEL_URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "[tunnel] URL 획득 실패"
  exit 1
fi

echo "[tunnel] URL: $TUNNEL_URL"

# Telegram webhook 등록
WEBHOOK="${TUNNEL_URL}/telegram-webhook"
RESULT=$(curl -s "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK}")
echo "[tunnel] Telegram webhook 설정: $RESULT"

# 터널 프로세스가 죽으면 이 스크립트도 종료 (PM2가 재시작)
wait $TUNNEL_PID
