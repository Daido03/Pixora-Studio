# PIXORA Image Editor — v0.2

A more complete Photoshop-inspired browser editor foundation.

## Included
- Dark desktop-style editing workspace, menu bar, tool rail, options bar, tabs, status bar, and docked Layers / Properties / History panels
- Open image and create blank document
- Multiple layers, visibility, duplicate, delete, rename, opacity, fill, blend modes
- Brush and eraser strokes, text placement, eyedropper
- Brightness, contrast, saturation, hue adjustments
- Grayscale, sepia, invert filters applied to the selected layer
- Canvas resize, zoom controls, PNG export
- Save/open editable `.pixora` JSON project files
- Keyboard shortcuts: Ctrl/Cmd+O, Ctrl/Cmd+N, Ctrl/Cmd+S, B, E, V, T, Z, C, Delete
- PWA manifest and offline shell cache

## Important limits
This is not a 1:1 Photoshop replacement yet. Marquee/lasso/quick selection, crop, pen, clone/healing, gradients, masks, full transform, robust undo/redo, smart objects, PSD support, color management, and AI tools need dedicated implementations. Some menu items are scaffolding or apply simple browser filters. Browser canvas memory limits apply to large documents.

## Deploy
Upload the files in this folder to the root of your existing `pixora-studio` GitHub repository, replacing the previous files. Then open Settings → Pages and keep `main` / `/ (root)`. If the old version remains after deployment, hard refresh the page or clear the site's cached data; the service worker cache name was bumped for v0.2.

## PWA
Open the HTTPS GitHub Pages URL. On iPad Safari, Share → Add to Home Screen. Browser and OS PWA behavior may vary.
