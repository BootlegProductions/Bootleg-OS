FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 python3-venv ffmpeg ca-certificates && rm -rf /var/lib/apt/lists/*
RUN python3 -m venv /opt/ytdlp && /opt/ytdlp/bin/pip install --no-cache-dir 'yt-dlp[default]'
ENV YTDLP=/opt/ytdlp/bin/yt-dlp PORT=10000
WORKDIR /app
COPY package.json server.mjs ./
USER node
EXPOSE 10000
CMD ["node","server.mjs"]
