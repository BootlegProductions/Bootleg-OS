# Bootleg Helper

## Local helper pilot

This pilot runs on the same PC as the browser. It listens on `127.0.0.1:47832` and accepts download jobs from the Bootleg OS GitHub Pages origin.

1. For this developer pilot, install Node.js 24 or newer. For YouTube, install current yt-dlp and FFmpeg and make them available on PATH. Yarn ZIP only needs Node.js.
2. Open a terminal in this folder and run `node local-helper.mjs`. Leave it running while downloading.
3. Open the [Yarn downloader](https://bootlegproductions.github.io/Bootleg-OS/yarn-downloader.html?pilot=1) or the [YouTube downloader](https://bootlegproductions.github.io/Bootleg-OS/youtube-downloader.html?pilot=1). Paste a link, select your options and click the download button. Allow the browser connection if prompted.

Yarn returns one ZIP with numbered MP4s and marks the original clip START. It stops if Yarn refuses access. The browser companion is also available from the Yarn page.

YouTube accepts individual, completed videos you own or have permission to download, up to 30 minutes and 250 MB. Job progress and the file link appear on the site.

Run `node --test test.mjs yarn-sequence.test.mjs` for the service and archive checks. These tests use fixtures.
