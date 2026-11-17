# Bootleg Helper

## Windows setup

Download **Bootleg Helper** from the [Yarn](https://bootlegproductions.github.io/Bootleg-OS/yarn-downloader.html) or [YouTube](https://bootlegproductions.github.io/Bootleg-OS/youtube-downloader.html) page. Open the downloaded setup and choose **I**. Setup downloads Node.js, yt-dlp and FFmpeg, checks their SHA-256 digests and installs under your Windows account. The helper starts immediately and at your next sign-in. Run setup again and choose **U** to uninstall.

The browser connects to the helper at `127.0.0.1:47832`. The helper accepts download jobs from the Bootleg OS GitHub Pages origin.

## Developer test

Use Node.js 24 or newer and run `node local-helper.mjs`. The YouTube flow also needs current yt-dlp and FFmpeg on PATH. Run `node --test test.mjs yarn-sequence.test.mjs` for the service and archive fixture checks.

Yarn returns one ZIP with numbered MP4s and marks the starting clip START. It stops if Yarn refuses access. YouTube takes individual completed videos you own or have permission to download, up to 30 minutes and 250 MB.
