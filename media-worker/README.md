# SceneSnap Media Worker

Extracts audio from social/video URLs using yt-dlp. Deploy to Railway, Fly.io, or any Docker host.

## Deploy (Railway)

1. Create a new Railway project from this directory
2. Railway will detect the Dockerfile automatically
3. Copy the deployed URL (e.g. `https://scenesnap-media.up.railway.app`)
4. Set `MEDIA_WORKER_URL` in your Next.js `.env.local`

## Local dev

```bash
pip install fastapi uvicorn yt-dlp
# ffmpeg must be installed
uvicorn main:app --reload --port 8080
```

## Endpoints

- `GET /health` — health check
- `POST /extract` — `{ "url": "https://youtube.com/watch?v=..." }` → MP3 bytes
