#!/usr/bin/env bash
set -euo pipefail

DETACHED=false
while [[ $# -gt 0 ]]; do
  case $1 in
    -d|--detached)
      DETACHED=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [-d|--detached]"
      exit 1
      ;;
  esac
done

# 1. Stop a previous detached phorge (pidfile only — never blind-kill a port)
if [ -f logs/phorge.pid ]; then
  echo "Stopping previous phorge (pid $(cat logs/phorge.pid))..."
  kill "$(cat logs/phorge.pid)" 2>/dev/null || true
  rm -f logs/phorge.pid
fi

# 2. Compile Phorge server
echo "Compiling Phorge server..."
npx esbuild tools/phorge/server.http.ts --bundle --platform=node --format=esm --packages=external --outfile=dist/phorge/server.http.js

# 3. Build and start the agent containers in background
echo "Building agent containers..."
npm run agents:build
echo "Starting agent containers..."
npm run agents:up

cleanup() {
  echo ""
  echo "Stopping agent containers..."
  npm run agents:down
}

if [ "$DETACHED" = true ]; then
  mkdir -p logs
  echo "Starting Phorge HTTP server in the background (logging to logs/phorge.log)..."
  node --env-file=.env dist/phorge/server.http.js > logs/phorge.log 2> logs/phorge.err.log &
  PHORGE_PID=$!
  echo $PHORGE_PID > logs/phorge.pid
  echo "Phorge HTTP server started successfully on PID $PHORGE_PID."
  echo "You can view logs with: tail -f logs/phorge.log"
  echo "To stop, run: npm run agents:down && kill \$(cat logs/phorge.pid)"
else
  # Set up trap to stop agent containers when Ctrl+C is pressed
  trap cleanup EXIT INT TERM
  
  echo "Starting Phorge HTTP server in the foreground..."
  echo "Press CTRL+C to stop both Phorge and the agent containers."
  echo "--------------------------------------------------------"
  node --env-file=.env dist/phorge/server.http.js
fi
