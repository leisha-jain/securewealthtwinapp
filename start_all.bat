@echo off
title SecureWealth Twin - Dev Startup Orchestrator
echo ===================================================
echo   SecureWealth Twin Dev Startup Orchestrator
echo ===================================================
echo.
echo Launching all 6 services in separate windows...
echo.

:: Use pushd to handle paths with spaces safely
:: Each service gets its own cmd window via start

:: 1. Wealth Engine (Port 8001)
echo [-] Starting Wealth Engine on Port 8001...
pushd "%~dp0services\wealth-engine"
start "Wealth Engine (8001)" cmd /k ".venv\Scripts\python -m uvicorn app.main:app --reload --port 8001"
popd

:: 2. Fraud Engine (Port 8002)
echo [-] Starting Fraud Engine on Port 8002...
pushd "%~dp0services\fraud-engine"
start "Fraud Engine (8002)" cmd /k "venv\Scripts\python -m uvicorn api:app --reload --port 8002"
popd

:: 3. Chat Service (Port 8003)
echo [-] Starting Chat Service on Port 8003...
pushd "%~dp0services\chat-service"
start "Chat Service (8003)" cmd /k "venv\Scripts\python -m uvicorn api:app --reload --port 8003"
popd

:: 4. API Gateway (Port 8000)
echo [-] Starting API Gateway on Port 8000...
pushd "%~dp0services\api-gateway"
start "API Gateway (8000)" cmd /k "node index.js"
popd

:: 5. Mock Account Aggregator (Port 8004)
echo [-] Starting Mock Account Aggregator on Port 8004...
pushd "%~dp0data"
start "Account Aggregator (8004)" "%~dp0services\wealth-engine\.venv\Scripts\python.exe" -m uvicorn mock_aggregator:app --reload --port 8004
popd

:: 6. React Frontend (Port 3000)
echo [-] Starting React Frontend on Port 3000...
pushd "%~dp0"
start "React Frontend (3000)" cmd /k "npm start"
popd

echo.
echo ===================================================
echo All services have been launched!
echo Keep this orchestrator open to see status, or close
echo individual windows to stop services.
echo ===================================================
echo.
pause
