# Releases and deployments

Public repository: https://github.com/Wispr-AI/website-animations. The initial runtime is being published; Webflow still uses localhost until its script tag is replaced.

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
| Notetaker tabs | /notetaker-icp | Pending | Pending; currently localhost | — |
