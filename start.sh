#!/bin/sh
set -e

echo "Starting application: backend + frontend"

# Start backend
cd /app/backend
export PORT=${PORT:-5000}
export PORT=5000
echo "Applying database migrations (prisma migrate deploy)..."
npx prisma migrate deploy
echo "Starting backend on port $PORT"
node src/index.js &
BACKEND_PID=$!

# Start frontend
cd /app/frontend
export PORT=${FRONTEND_PORT:-3000}
echo "Starting frontend on port $PORT"
node server.js &
FRONTEND_PID=$!

# Wait for any process to exit
wait -n $BACKEND_PID $FRONTEND_PID
EXIT_CODE=$?
echo "One of the processes exited with code $EXIT_CODE, shutting down"
kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
exit $EXIT_CODE
