# Bootleg OS — GitHub Pages release

## Publish using GitHub Desktop

1. On GitHub, create a PUBLIC repository named **Bootleg-OS** in the **BootlegProductions** account. Add a README so the main branch exists.
2. Clone that repository with GitHub Desktop, then choose **Repository → Show in Explorer**.
3. Extract this ZIP. Copy EVERYTHING INSIDE the extracted `Bootleg-OS` folder into the cloned repository. `index.html`, `assets`, `css` and `js` must be at the repository root. Copy `.nojekyll` too. Replace the initial README with this one. Do not upload the ZIP as a single file.
4. In GitHub Desktop, commit with a message such as "Publish Bootleg OS", then click **Push origin**.
5. In the GitHub repository, choose **Settings → Pages → Deploy from a branch**, select **main** and **/(root)**, then save.
6. Once Pages finishes, visit https://bootlegproductions.github.io/Bootleg-OS/ . GitHub displays the actual live URL in Pages settings. Publishing can take a few minutes.

GitHub Desktop is recommended: browser uploads are limited to 100 files at once. This release contains the full media folder and has no individual file over 25 MiB.

## Editable code

The site is static HTML, CSS and JavaScript. No build is needed to publish it.
- `index.html` is the homepage; `project-pages/` and `blog-pages/` contain articles.
- `css/style.css` contains the main styling.
- `js/boots.js` contains the helper's answers and chat behaviour.
- `js/boots-state.js` and `js/boots-frames.js` control the fixed-canvas character animation.
- `assets/brand/boots/` contains the original supplied animations, poses and extracted playback frames.
- `js/gallery-data.js` and `js/project-media-data.js` index the portfolio media.

## Included / pending features

The archive includes all current site media, the new logo, support link, Boots' idle/jump/talk/point/sleep states and the ten-channel logo slideshow.

YouTube downloads remain awaiting backend hosting. The prepared backend ZIP is in `downloads/Bootleg-YouTube-Service.zip`; it is NOT required to publish the portfolio. No paid service is enabled by this release. The Archive Scraper uses Internet Archive directly. Weather and broadcast playback require their existing external data providers.

## Using a different repo or domain

Navigation and assets use relative paths and work beneath a project URL. Share-image metadata that used placeholder domains has been set to the URL above. If you use a different repository name or custom domain, update those absolute metadata URLs in the HTML files.

## Quick check after publishing

Open Home, Projects, Gallery and an article; test Image Tools, Pixel Studio, the clock/map and radio; click Boots from idle and after five minutes, ask her for weather in a named city, and check mobile navigation. Browser autoplay rules may require you to press Play on media.

GitHub Pages documentation: https://docs.github.com/en/pages/quickstart
GitHub upload limits: https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository
