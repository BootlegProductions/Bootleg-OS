# Bootleg.log article format

Oliver approved this format on 20 October 2026. Use `TEMPLATE.html` for new posts, with `install-linux-mint.html` as the finished reference. Keep shared layout rules in `../css/blog-editorial.css` and reading/animation helpers in `../js/blog-enhancements.js`.

- Keep the compact header: back link, topic logo beside category, full-width title, short introduction, author/date/read time, then the collapsible contents window.
- Use the `welcome.exe` gradient window bars, three dots and black bar text for contents and related reading.
- Use real photos, screenshots or supplied artwork. Keep the hero free of reserved blank space; provide useful alt text and captions. Confirm image files actually decode before publication.
- Pair prose and images with `editorial-split`, aligning the photo with the section’s top rule. Stack the columns on mobile. Avoid empty grid cells.
- Keep orange `post-note` and `useful-links` boxes. Use plain, concise instructions and give personal stories their own space.
- Put GIF-style reactions directly in `content-article`, outside split text columns. Center them at their natural proportions. The small play/pause overlay belongs at the TOP RIGHT so subtitles remain visible. Keep source links short and respect reduced motion.
- Keep related article image/title links and the existing global header, radio, Boots and footer integration.

To publish a post: copy TEMPLATE.html to a descriptive filename, replace example title/summary/category/logo/hero/body/related links, set accurate dates and canonical/social metadata, and remove the template’s noindex meta tag. Update `../js/blog-data.js`, the static card fallback in `../blog.html`, and `../sitemap.xml`. TEMPLATE.html itself stays noindex and is excluded from the index and sitemap. Check local links and media, then verify the deployed files. Raise the stylesheet version when a visible CSS change needs an immediate refresh.
