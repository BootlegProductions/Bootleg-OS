# Video Compressor

A static, browser-local tool at `video-compressor.html`. No upload endpoint or paid backend is used.

- `js/video-compressor.js`: file selection, previews, progress, cancellation and downloads.
- `js/video-compressor-worker.js`: same-origin classic worker loading the pinned, single-threaded `@ffmpeg/core@0.12.10` engine from jsDelivr.
- `js/video-compressor-core.js`: validated settings and FFmpeg argument construction.
- `tests/video-compressor.test.mjs`: argument checks, worker-protocol tests and a native FFmpeg encoding smoke test.

The engine is downloaded on first use. Single-threaded mode avoids requiring cross-origin-isolation headers on GitHub Pages. User media stays in browser memory; cancelling terminates the worker. The original file is never overwritten. The tool currently limits input to 500 MiB to reduce memory failures. Browser codecs must be able to read the selected file's metadata. Large videos can still exceed a device's available memory or take a long time.

For the user's roughly 2 GB recordings, `compress-large-video.ps1` and its drag-and-drop `compress-large-video.cmd` companion provide an optional Windows desktop route. Install FFmpeg/FFprobe, extract both files from the downloadable ZIP into one folder, then drag the video onto the CMD file. It runs two native H.264 encoding passes targeting 480 MiB by default, preserves the input, scales to at most 720p, and writes the result beside the source. This stays on the user's own PC and uses no hosted backend. The target is an estimate; verify output size and quality. Keep the ZIP in sync after edits:

```sh
python -m zipfile -c tools/video-compressor/bootleg-large-video-windows.zip tools/video-compressor/compress-large-video.cmd tools/video-compressor/compress-large-video.ps1
```

Target size uses a single-pass bitrate estimate with an audio allowance and overhead margin; it is not a guaranteed maximum. Presets use H.264 video, optional AAC audio, and MP4 output. Smaller size entails quality loss. Already-compressed inputs can produce a larger output, which is reported rather than hidden.

Run checks from the repository root:

```sh
node --test tests/video-compressor.test.mjs tests/boots-dialogue.test.mjs
```

The native encoding smoke test requires `ffmpeg` and `ffprobe`. It validates the encoding arguments, not browser WebAssembly execution. Browser QA was not available during this implementation. On the live page, check the first engine download, a small MP4 with audio, a silent MP4, target-size mode, cancellation during loading/encoding, repeat compression, and the downloaded video's playback.

Engine source and licensing: https://github.com/ffmpegwasm/ffmpeg.wasm/tree/main/packages/core
