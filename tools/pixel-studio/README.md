# Pixel Studio

The editable application is `../../js/pixel-studio-source.js`. ZIP grouping and
GIF decoding live in `../../js/pixel-import.js`. The page uses the bundled file
so visitors need no build tools, accounts or external API.

To rebuild after editing the source:

    cd tools/pixel-studio
    npm install
    npm test
    npm run build

Import accepts PNG, JPEG, WebP, animated GIF, multiple selected images and ZIP
sprite packs. Images retain native size and transparency. Mixed image sizes
are centred on a canvas large enough for every frame. GIF timing and disposal
are preserved. Changing FPS applies a uniform duration to every frame.

When a ZIP has `animations/` directories, those become separate selectable
groups; rotation poses are excluded from the animation strip. Other ZIPs are
grouped by image directory. Filenames sort numerically (`frame_2` before
`frame_10`).

Limits: 25 MB input, 64 MB extracted images, 512 pixels per side, 256 frames,
16 million canvas pixels across an imported animation. Import replaces the
current document only after successful decoding and user confirmation when
the canvas contains work.

Dependency versions are pinned in package.json. License notices are in
THIRD_PARTY_LICENSES.txt. node_modules is a local build dependency, not part of
the published site.
