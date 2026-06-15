# Single-container build: Next.js app + ffmpeg + yt-dlp so all 4 modes
# (Listen, Upload, Link, Type) work from one deployment.
FROM node:20-bookworm-slim

# System deps:
#  - ffmpeg: audio processing for the Link pipeline
#  - yt-dlp: pulls audio from YouTube/TikTok/etc. URLs
#  - build-essential + python3: in case better-sqlite3 needs to compile
RUN apt-get update && apt-get install -y --no-install-recommends \
      ffmpeg \
      python3 \
      ca-certificates \
      wget \
      build-essential \
    && wget -q -O /usr/local/bin/yt-dlp \
      https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies (dev deps included — needed for the build step)
COPY package.json package-lock.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["npm", "start"]
