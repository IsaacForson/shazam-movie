FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg \
    && pip install --no-cache-dir fastapi uvicorn yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY main.py .

EXPOSE 8080
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
