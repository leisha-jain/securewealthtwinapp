FROM python:3.11-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn
COPY . .
EXPOSE 8004
CMD ["uvicorn", "mock_aggregator:app", "--host", "0.0.0.0", "--port", "8004"]
