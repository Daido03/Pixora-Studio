# PIXORA Studio — starter 0.1

A static, browser-based image-editor foundation designed to be easy to host as a PWA.

## Included in this first build
- Photoshop-inspired dark workspace
- Open image, blank canvas, and PNG export
- Layer list with visibility, opacity, duplicate, delete, and blend modes
- Selected-layer brightness, contrast, and saturation preview/export
- Zoom controls and fit-to-screen
- Basic brush stroke support
- PWA manifest and service worker for install/offline shell caching
- Keyboard shortcuts: Ctrl/Cmd+O, Ctrl/Cmd+S (placeholder), V, B, E, T, C

## Important limitations
This is an early foundation, not a Photoshop replacement yet. Crop, eraser, text, shape, masks, robust undo/redo, native project save/open, color management, PSD import/export, and advanced filters are future modules. Large-canvas history snapshots may be memory-intensive.

## Run locally
Serve this folder over HTTP (service workers do not work reliably from `file://`). For example, with Python installed:
`python -m http.server 8000`
Then open `http://localhost:8000`.

## Deploy on GitHub Pages
1. Create a new public GitHub repository named `pixora-studio`.
2. Upload all files from this folder to the repository root.
3. Open **Settings → Pages**.
4. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
5. Wait for the published URL to appear.

## Install as a PWA
Open the published HTTPS site in a supported browser. On iPhone/iPad Safari, use Share → Add to Home Screen. PWA behavior varies by browser and OS version.
