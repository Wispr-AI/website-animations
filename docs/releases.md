# Releases and deployments

Public repository: https://github.com/Wispr-AI/website-animations. The initial runtime is published and its commit-pinned CDN URL is verified. The staging page now uses the verified CDN script. The user confirmed it works after switching to hosting; publishing to the custom domain remains separate.

## Procedure

1. Make and validate the intended animation change locally.
2. Review the files being published; `.local/` must stay ignored.
3. Commit and push to the public repository.
4. Build the CDN URL using a commit SHA (full hashes are the robust default; verify the exact URL if using an abbreviation):
   `https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@COMMIT/animations/notetaker-tabs/notetaker-tabs.js`
5. Fetch and verify that exact URL before using it on a page.
6. Update the script tag on the Webflow pages receiving the release, then publish.
7. Smoke-test with Live Server turned off, including desktop and mobile.

Commit-pinned URLs are fixed versions. A new push does not update pages pinned to an old commit. Roll back by restoring the prior script URL and publishing. Different pages can use different versions intentionally.

## Deployment log

| Animation | Page | Full commit SHA | CDN URL | Date |
| --- | --- | --- | --- | --- |
| Notetaker tabs | https://flowsite-dev.webflow.io/notetaker-icp (deployed) | `122d3fa55937a2738608b393daee79c9d051992d` | [Verified script](https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@122d3fa/animations/notetaker-tabs/notetaker-tabs.js) | 2026-09-23 |

## Initial release verification

CDN returned HTTP200 with JavaScript content type, CORS access and immutable caching. Its22,667 bytes match the locally verified script exactly (SHA256 `22c805f279f098ee01711658ec3afc4808e72592da382bea5047a1076452b15d`).

Verified script tag currently published on staging:

```html
<script src="https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@122d3fa/animations/notetaker-tabs/notetaker-tabs.js"></script>
```

Staging source contains exactly one tabs script: the abbreviated commit CDN URL above. No localhost or original stack.js script is active there. The CDN bytes match the tested local runtime. The user reports the hosted animation works well.

The custom-domain URL https://wisprflow.ai/notetaker-icp still served the old localhost tag when checked. Publish the final changes to that domain when ready to launch there; this review did not publish Webflow.

Documentation-only commits after the runtime commit do not require changing its pinned URL.
