@echo off
set /p SERVER_IP=Enter the server IP: 

ssh -t USER@%SERVER_IP% "curl -fsSL -o /tmp/serverDoc.sh https://raw.githubusercontent.com/davidgb-intratum/utils/refs/heads/main/wordpress/server/serverDoc.sh && chmod +x /tmp/serverDoc.sh && sudo /tmp/serverDoc.sh"

PAUSE
