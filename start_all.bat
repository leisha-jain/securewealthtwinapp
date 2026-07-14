@echo off
title SecureWealth Twin - Dev Startup Orchestrator
echo ===================================================
echo   SecureWealth Twin Dev Startup Orchestrator
echo ===================================================
echo.
echo Launching all 5 services in separate windows...
echo.

:: 1. Launch Wealth Engine (FastAPI) on Port 8001
echo [-] Starting Wealth Engine on Port 8001...
start "Wealth Engine (8001)" cmd /k "cd services\wealth-engine && .venv\Scripts\activate && uvicorn app.main:app --reload --port 8001"

:: 2. Launch Fraud Engine (FastAPI) on Port 8002
echo [-] Starting Fraud Engine on Port 8002...
start "Fraud Engine (8002)" cmd /k "cd services\fraud-engine && venv\Scripts\activate && uvicorn api:app --reload --port 8002"

:: 3. Launch Chat Service (FastAPI) on Port 8003
echo [-] Starting Chat Service on Port 8003...
start "Chat Service (8003)" cmd /k "cd services\chat-service && venv\Scripts\activate && uvicorn main:app --reload --port 8003"

:: 4. Launch API Gateway (Express) on Port 8000
echo [-] Starting API Gateway on Port 8000 (running npm install first)...
start "API Gateway (8000)" cmd /k "cd services\api-gateway && npm install && node index.js"

:: 5. Launch Account Aggregator (FastAPI) on Port 8004
echo [-] Starting Mock Account Aggregator on Port 8004...
start "Account Aggregator (8004)" cmd /k "cd data && ..\services\wealth-engine\.venv\Scripts\activate && uvicorn mock_aggregator:app --reload --port 8004"

:: 6. Launch React Frontend on Port 3000
echo [-] Starting React Frontend on Port 3000 (running npm install first)...
start "React Frontend (3000)" cmd /k "npm install && npm start"


echo.
echo ===================================================
echo All services have been launched!
echo Keep this orchestrator open to see status, or close
echo individual windows to stop services.
echo ===================================================
echo.
pause
