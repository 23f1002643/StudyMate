# Root structure (for publishing)

This repository now includes a minimal top-level shell suitable for simple publishing or GitHub Pages. The real app remains in `client/` and should be run with Vite for development.

Top-level files added:

- `index.html` — minimal shell linking the root assets and pointing to `client/index.html` for development.
- `styles.css` — minimal styles for the root shell.
- `agent.js` — placeholder agent/background script.
- `manifest.json` — basic web app manifest.
- `sw.js` — lightweight service worker to cache the root assets.
- `assets/` — directory for images/icons (contains `.gitkeep`).

How to push to GitHub (example for PowerShell):

```powershell
git init
git remote add origin https://github.com/23f1002643/StudyMate.git
git add .
git commit -m "Add root publishing shell and assets"
git branch -M main
git push -u origin main
```

If you'd like, I can run these git commands here — tell me to proceed and ensure your environment has the appropriate credentials.
