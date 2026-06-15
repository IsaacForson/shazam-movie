from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, HttpUrl
import subprocess
import tempfile
import os

app = FastAPI(title="SceneSnap Media Worker")

ALLOWED_DOMAINS = [
    "youtube.com", "youtu.be", "tiktok.com", "instagram.com",
    "twitter.com", "x.com", "facebook.com", "fb.watch",
    "vm.tiktok.com", "reels.com",
]

class ExtractRequest(BaseModel):
    url: HttpUrl

def is_allowed_url(url: str) -> bool:
    return any(domain in url.lower() for domain in ALLOWED_DOMAINS)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract")
def extract_audio(req: ExtractRequest):
    url = str(req.url)

    if not is_allowed_url(url):
        raise HTTPException(status_code=400, detail="URL domain not supported")

    with tempfile.TemporaryDirectory() as tmpdir:
        output_path = os.path.join(tmpdir, "audio.mp3")

        cmd = [
            "yt-dlp",
            "--extract-audio",
            "--audio-format", "mp3",
            "--audio-quality", "5",
            "--postprocessor-args", "ffmpeg:-ac 1 -ar 16000",
            "--download-sections", "*0-90",
            "--max-filesize", "25M",
            "--no-playlist",
            "--quiet",
            "-o", output_path,
            url,
        ]

        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=60,
            )
        except subprocess.TimeoutExpired:
            raise HTTPException(status_code=504, detail="Download timed out")

        if result.returncode != 0:
            raise HTTPException(
                status_code=502,
                detail=f"Failed to extract audio: {result.stderr[:200]}",
            )

        if not os.path.exists(output_path):
            mp3_files = [f for f in os.listdir(tmpdir) if f.endswith(".mp3")]
            if not mp3_files:
                raise HTTPException(status_code=502, detail="No audio extracted")
            output_path = os.path.join(tmpdir, mp3_files[0])

        with open(output_path, "rb") as f:
            audio_bytes = f.read()

        if len(audio_bytes) == 0:
            raise HTTPException(status_code=502, detail="Empty audio file")

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=audio.mp3"},
        )
