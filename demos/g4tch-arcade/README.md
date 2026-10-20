# G4TCH's ARCADE — web cabinet preview

This browser adaptation accompanies the native Pygame project case study. It is not the Python application. Screenshots in assets/project-media/g4tch-arcade show the desktop prototype supplied by Oliver.

- index.html / arcade.css: branded prism boot, green/blue catalogue and player layout.
- arcade.mjs: catalogue, local file selection, keyboard/touch/gamepad interaction.
- arcade-model.mjs: original Prism Break paddle game and ROM file validation.
- emulator.html / emulator.mjs: isolated EmulatorJS player for local Mega Drive cartridges.

Prism Break is original code included with the preview. No commercial game ROMs are bundled, downloaded from the Archive or uploaded to a server. Selected ROMs live in the page's in-memory catalogue and are passed as File objects to the emulator iframe. Object URLs are revoked when the player unloads.

The ROM beta loads EmulatorJS 4.2.3 and its genesis_plus_gx core from the project's CDN only on request. The external loader, JS, CSS and core data returned HTTP 200 with CORS enabled during checks. Runtime ROM compatibility and device input still need browser testing. The page uses the single-threaded core; it does not require custom COOP/COEP headers on GitHub Pages. A load failure displays a message and the user can return to the library.

EmulatorJS: https://emulatorjs.org/ — https://github.com/EmulatorJS/EmulatorJS (GPL-3.0)
Mega Drive integration: https://emulatorjs.org/docs/systems/sega-mega-drive/
CDN: https://emulatorjs.org/docs/cdn/
Core: https://github.com/ekeeke/Genesis-Plus-GX — see its own licence and non-commercial terms. Third-party software remains under its respective licences; no third-party emulator binaries are included in this repository.

Run the pure logic checks with:
node tests/g4tch-arcade.test.mjs

## Source-informed update

The supplied v0.3 native project was inspected on 20 October 2026. Its Python launcher uses Pygame, then starts RetroArch with Genesis Plus GX as a separate process. The browser preview remains a JavaScript adaptation using EmulatorJS; the native Windows runtime and Python environment are not web assets.

The preview now uses the native theme palette values, saves favourite title keys and theme/intro-sound preferences in `g4tch-preview-v1` localStorage, and includes the native application's original generated seven-second prism music, encoded as `prism-original.mp3`. Audio starts only following a user action. Sound controls apply to the intro; game audio is managed by the emulator. Files and file handles are never persisted. Unavailable storage does not block the tool. Ctrl+D toggles a favourite while the library is active; Tab keeps normal browser focus navigation.

The native archive also contains runtime dependencies, local configuration and cached game files. These were not copied into the website. Pi execution and the cabinet hardware remain to be tested. The page documents native cover matching and custom artwork support; automatic cover lookup and folder scanning are not implemented in this browser adaptation.
