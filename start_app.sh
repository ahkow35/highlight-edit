#!/bin/bash

# Function to kill processes on exit
cleanup() {
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
}
trap cleanup EXIT

# 1. Start Backend
echo "Starting Backend on port 8000..."
cd backend
python3 -m venv venv 2>/dev/null # Ensure venv exists
source venv/bin/activate
uvicorn app.main:app --reload &
cd ..

# 2. Wait for Backend to be ready (optional but good)
sleep 2

# 3. Start Frontend
echo "Starting Frontend on port 5173..."
cd frontend
npm run dev &
cd ..

# 4. Start Ngrok
if [ -f "./ngrok" ]; then
    echo "Starting Ngrok tunnel..."
    ./ngrok http 5173 --domain=irremissible-triparted-nieves.ngrok-free.dev &
else
    echo "Ngrok binary not found in root directory. Skipping ngrok."
fi

# Keep script running
wait
