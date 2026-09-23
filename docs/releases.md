# Releases and deployments

Public repository: https://github.com/Wispr-AI/website-animations. The initial runtime is published and its commit-pinned CDN URL is verified. Webflow still uses localhost until the page owner replaces the script tag and publishes.

## Procedure

1. Make and validate the intended animation change locally.
2. Review the files being published; `.local/` must stay ignored.
3. Commit and push to the public repository.
4. Build the CDN URL using the full commit SHA:
   `https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@COMMIT/animations/notetaker-tabs/notetaker-tabs.js`
5. Fetch and verify that exact URL before using it on a page.
6. Update the script tag on the Webflow pages receiving the release, then publish.
7. Smoke-test with Live Server turned off, including desktop and mobile.

Commit-pinned URLs are fixed versions. A new push does not update pages pinned to an old commit. Roll back by restoring the prior script URL and publishing. Different pages can use different versions intentionally.

## Deployment log

| Animation | Page | Full commit SHA | CDN URL | Date |
| --- | --- | --- | --- | --- |
| Notetaker tabs | /notetaker-icp (Webflow switch pending) | `122d3fa55937a2738608b393daee79c9d051992d` | [Verified script](https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@122d3fa55937a2738608b393daee79c9d051992d/animations/notetaker-tabs/notetaker-tabs.js) | 2026-09-23 |

## Initial release verification

CDN returned HTTP200 with JavaScript content type, CORS access and immutable caching. Its22,667 bytes match the locally verified script exactly (SHA256 `22c805f279f098ee01711658ec3afc4808e72592da382bea5047a1076452b15d`).

Replace the existing localhost tag in the Webflow page head with:

```html
<script src="https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@122d3fa55937a2738608b393daee79c9d051992d/animations/notetaker-tabs/notetaker-tabs.js"></script>
```

Do not keep both tags. Publish, turn Live Server off, and check desktop tabs/melt/waves and mobile stacking. This production-page check remains pending. Documentation-only commits after the runtime commit do not require changing its pinned URL.
