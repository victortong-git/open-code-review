#!/bin/sh
# Create a .env.local file with the correct configuration
cat > /app/.env.local << EOL
NEXT_PUBLIC_HTTP_CHAT_COMPLETION_URL=http://aiqtoolkit:8000/chat/stream
NEXT_PUBLIC_WEBSOCKET_CHAT_COMPLETION_URL=ws://aiqtoolkit:8000/websocket
NEXT_PUBLIC_WEB_SOCKET_DEFAULT_ON=true
NEXT_PUBLIC_ENABLE_INTERMEDIATE_STEPS=true
EOL

echo "Created .env.local with the following content:"
cat /app/.env.local || echo "Failed to read .env.local"
