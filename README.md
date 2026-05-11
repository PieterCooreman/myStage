# myStage

A single-page stage plot builder for bands and sound engineers. Pure HTML / CSS / vanilla JS, no build step.

**Live demo:** https://pietercooreman.github.io/myStage/

## Run

Open `index.html` in a browser. That's it.

## Features

- Drag-and-drop palette of instruments, gear, and stage elements (hand-drawn SVG icons)
- Move, rotate (slider or ±15° buttons), duplicate, layer, label, and delete items on the stage
- Auto-generated channel list with editable per-channel notes
- Autosaves to `localStorage`
- Import / export sessions as JSON
- Export plot + input list as a compressed JPEG image or a size-optimised PDF (vector chrome + selectable table text, typically ~150–400 KB)

## Shortcuts

- Click an item → floating toolbar
- Double-click → edit label
- `Delete` / `Backspace` → remove
- `Ctrl` / `Cmd` + `D` → duplicate

## Files

- `index.html` — layout
- `styles.css` — styling
- `icons.js` — inline SVG icon library
- `app.js` — application logic

## Dependencies (CDN)

- FontAwesome 6 (UI chrome only)
- html2canvas (image / PDF rasterisation)
- jsPDF (PDF generation)
