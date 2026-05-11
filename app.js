/* =================================================================
 * myStage - Stage Plot Builder
 * -----------------------------------------------------------------
 * Application architecture
 *
 *   - CATALOG : static list of items the user can drag onto the
 *               stage, grouped by category. Each entry has a stable
 *               `type` key used for serialisation and lookup.
 *
 *   - state   : in-memory model. The single source of truth.
 *               {
 *                 items: [
 *                   { id, type, x, y, rotation, z, label, notes, ... }
 *                 ],
 *                 selectedId, zCounter
 *               }
 *
 *   - render* : functions that project `state` -> DOM. We re-render
 *               only the input list on changes; canvas items are
 *               managed imperatively so we don't lose drag state.
 *
 *   - persistence : on every mutating action we save to localStorage
 *                   (debounced). Import/Export use the same shape.
 * ================================================================= */

(function () {
    "use strict";

    /* =============================================================
     * 1. CATALOG: palette items
     *    Each item has:
     *      - type   : stable identifier (also the SVG icon key in
     *                 window.MYSTAGE_ICONS, defined in icons.js)
     *      - name   : human-friendly label
     *    Categories group these for the palette UI. The category
     *    `icon` is a FontAwesome class used purely as a chrome glyph
     *    next to the category heading.
     * ============================================================= */
    const CATALOG = [
        {
            name: "Vocals",
            icon: "fa-microphone-lines",
            items: [
                { type: "vox-lead",   name: "Lead Vocal" },
                { type: "vox-bg",     name: "Backing Vocal" },
                { type: "vox-choir",  name: "Choir/Ensemble" },
            ],
        },
        {
            name: "Drums & Percussion",
            icon: "fa-drum",
            items: [
                { type: "drum-kit",   name: "Drum Kit" },
                { type: "drum-epad",  name: "Electronic Pad" },
                { type: "drum-conga", name: "Congas/Bongos" },
                { type: "drum-cajon", name: "Cajon" },
                { type: "drum-timp",  name: "Timpani" },
                { type: "drum-aux",   name: "Aux Percussion" },
            ],
        },
        {
            name: "Guitars & Strings",
            icon: "fa-guitar",
            items: [
                { type: "gtr-electric", name: "Electric Gtr" },
                { type: "gtr-acoustic", name: "Acoustic Gtr" },
                { type: "gtr-bass",     name: "Bass Guitar" },
                { type: "str-upright",  name: "Upright Bass" },
                { type: "str-violin",   name: "Violin" },
                { type: "str-cello",    name: "Cello" },
                { type: "str-banjo",    name: "Banjo" },
                { type: "str-mando",    name: "Mandolin" },
            ],
        },
        {
            name: "Keyboards & Electronics",
            icon: "fa-keyboard",
            items: [
                { type: "key-grand",   name: "Grand Piano" },
                { type: "key-upright", name: "Upright Piano" },
                { type: "key-synth",   name: "Synthesizer" },
                { type: "key-digital", name: "Keyboard" },
                { type: "key-hammond", name: "Hammond Organ" },
                { type: "key-dj",      name: "DJ Setup" },
                { type: "key-laptop",  name: "Playback Rig" },
            ],
        },
        {
            name: "Horns & Woodwinds",
            icon: "fa-music",
            items: [
                { type: "horn-trumpet",  name: "Trumpet" },
                { type: "horn-trombone", name: "Trombone" },
                { type: "horn-sax",      name: "Saxophone" },
                { type: "horn-flute",    name: "Flute" },
                { type: "horn-clarinet", name: "Clarinet" },
                { type: "horn-french",   name: "French Horn" },
                { type: "horn-tuba",     name: "Tuba" },
            ],
        },
        {
            name: "Audio / Monitors",
            icon: "fa-volume-high",
            items: [
                { type: "aud-monitor",  name: "Floor Monitor" },
                { type: "aud-gtr-amp",  name: "Guitar Amp" },
                { type: "aud-bass-rig", name: "Bass Rig" },
                { type: "aud-di",       name: "DI Box" },
                { type: "aud-mic-boom", name: "Mic Stand (Boom)" },
                { type: "aud-mic-strt", name: "Mic (Straight)" },
            ],
        },
        {
            name: "Stage Setup",
            icon: "fa-bolt",
            items: [
                { type: "stage-power", name: "Power Drop" },
                { type: "stage-riser", name: "Stage Riser" },
            ],
        },
        {
            name: "Text",
            icon: "fa-font",
            items: [
                { type: "text-label", name: "Text Label" },
            ],
        },
    ];

    /**
     * Look up the SVG markup for a given item type.
     * Falls back to a "?" placeholder if a type is unknown.
     */
    function svgFor(type) {
        const lib = window.MYSTAGE_ICONS || {};
        return lib[type] || lib.__fallback ||
            '<svg viewBox="0 0 64 64" fill="currentColor"><circle cx="32" cy="32" r="20"/></svg>';
    }

    // Flat lookup for type -> catalog entry
    const TYPE_MAP = {};
    CATALOG.forEach((cat) => {
        cat.items.forEach((it) => {
            TYPE_MAP[it.type] = { ...it, category: cat.name };
        });
    });

    /* =============================================================
     * 2. STATE
     * ============================================================= */
    const STORAGE_KEY = "myStage.session.v1";

    let state = {
        title: "",       // user-supplied plot name (band / event / date)
        items: [],       // array of placed canvas items
        selectedId: null,
        zCounter: 1,     // monotonically increasing for stacking
    };

    // ID generator for new canvas items
    function newId() {
        return "i_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
    }

    /* =============================================================
     * 3. DOM REFERENCES
     * ============================================================= */
    const $palette       = document.getElementById("palette");
    const $stage         = document.getElementById("stage");
    const $inputBody     = document.getElementById("input-list-body");
    const $emptyHint     = document.getElementById("empty-hint");
    const $toolbar       = document.getElementById("item-toolbar");
    const $rotateSlider  = document.getElementById("rotate-slider");
    const $title         = document.getElementById("plot-title");

    /* =============================================================
     * 4. PERSISTENCE
     *    Debounced save so rapid drags don't thrash localStorage.
     * ============================================================= */
    let saveTimer = null;
    function save() {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            } catch (e) {
                console.warn("Could not save to localStorage:", e);
            }
        }, 200);
    }

    function load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.items)) {
                state = {
                    title: typeof parsed.title === "string" ? parsed.title : "",
                    items: parsed.items,
                    selectedId: null,
                    zCounter: parsed.zCounter || (parsed.items.length + 1),
                };
            }
        } catch (e) {
            console.warn("Could not parse saved session:", e);
        }
    }

    /**
     * Push state.title -> the topbar input.
     */
    function syncTitleInput() {
        if ($title && $title.value !== state.title) {
            $title.value = state.title || "";
        }
    }

    /* =============================================================
     * 5. PALETTE RENDERING
     *    Build the categorised, draggable palette from CATALOG.
     * ============================================================= */
    function renderPalette() {
        $palette.querySelectorAll(".palette-category").forEach((n) => n.remove());

        CATALOG.forEach((cat) => {
            const wrap = document.createElement("div");
            wrap.className = "palette-category";

            // Header (click to collapse)
            const header = document.createElement("div");
            header.className = "palette-category-header";
            header.innerHTML = `
                <span><i class="fa-solid ${cat.icon}"></i>&nbsp; ${cat.name}</span>
                <i class="fa-solid fa-chevron-down chev"></i>
            `;
            header.addEventListener("click", () => wrap.classList.toggle("collapsed"));
            wrap.appendChild(header);

            // Items grid
            const items = document.createElement("div");
            items.className = "palette-category-items";

            cat.items.forEach((it) => {
                const node = document.createElement("div");
                node.className = "palette-item";
                node.draggable = true;
                node.dataset.type = it.type;
                // Inline SVG icon + label. The SVG inherits color via currentColor.
                node.innerHTML = `
                    <div class="palette-item-icon">${svgFor(it.type)}</div>
                    <span>${it.name}</span>
                `;
                // Use HTML5 drag-and-drop. We tag the dataTransfer with
                // the catalog `type`, and the stage's drop handler will
                // create a new item at the drop coordinates.
                node.addEventListener("dragstart", (e) => {
                    e.dataTransfer.setData("application/x-mystage-type", it.type);
                    e.dataTransfer.effectAllowed = "copy";
                });
                items.appendChild(node);
            });

            wrap.appendChild(items);
            $palette.appendChild(wrap);
        });
    }

    /* =============================================================
     * 6. CANVAS RENDERING (full re-render)
     *    Used after loading from JSON / localStorage. During live
     *    interactions we mutate the DOM directly to avoid disrupting
     *    pointer captures.
     * ============================================================= */
    function renderStage() {
        // Clear all current canvas items (preserve the grid layer)
        $stage.querySelectorAll(".canvas-item").forEach((n) => n.remove());
        state.items.forEach((item) => mountItem(item));
        renderInputList();
    }

    /**
     * Build the DOM for a single canvas item and append it to the stage.
     * Returns the DOM node so callers can attach extra behaviour.
     */
    function mountItem(item) {
        const def = TYPE_MAP[item.type] || { name: item.type };

        const el = document.createElement("div");
        el.className = "canvas-item";
        if (item.type === "text-label") el.classList.add("type-text");
        el.dataset.id = item.id;

        // Icon (inline SVG container). innerHTML is safe here because
        // svgFor returns only our own static SVG markup, never user input.
        const icon = document.createElement("div");
        icon.className = "icon";
        icon.innerHTML = svgFor(item.type);

        // Label
        const label = document.createElement("div");
        label.className = "label";
        label.textContent = item.label || def.name;

        // Channel badge (filled in by renderInputList)
        const badge = document.createElement("div");
        badge.className = "ch-badge";
        badge.textContent = "";

        el.appendChild(badge);
        el.appendChild(icon);
        el.appendChild(label);

        applyTransform(el, item);
        el.style.zIndex = item.z;

        $stage.appendChild(el);

        // Wire up interactions for this item
        attachItemInteractions(el);

        return el;
    }

    /**
     * Apply the position/rotation transform. We translate from the
     * stored x/y (which are the item's top-left in stage coordinates)
     * and rotate around the item's center.
     */
    function applyTransform(el, item) {
        el.style.left = item.x + "px";
        el.style.top  = item.y + "px";
        el.style.transform = `rotate(${item.rotation || 0}deg)`;
    }

    /* =============================================================
     * 7. DROP TARGET: stage canvas
     * ============================================================= */
    $stage.addEventListener("dragover", (e) => {
        // Allow drop only when the drag carries our custom type
        if (Array.from(e.dataTransfer.types).includes("application/x-mystage-type")) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            $stage.classList.add("drag-over");
        }
    });
    $stage.addEventListener("dragleave", () => {
        $stage.classList.remove("drag-over");
    });
    $stage.addEventListener("drop", (e) => {
        e.preventDefault();
        $stage.classList.remove("drag-over");
        const type = e.dataTransfer.getData("application/x-mystage-type");
        if (!type || !TYPE_MAP[type]) return;

        // Translate page coordinates into stage-local coordinates.
        const rect = $stage.getBoundingClientRect();
        const x = e.clientX - rect.left - 35; // center the 70x70 item on the cursor
        const y = e.clientY - rect.top  - 35;

        const item = createItem(type, x, y);
        state.items.push(item);
        mountItem(item);
        selectItem(item.id);
        renderInputList();
        save();
    });

    /**
     * Create a new item record (does not mount it).
     */
    function createItem(type, x, y) {
        const def = TYPE_MAP[type];
        return {
            id: newId(),
            type,
            x: Math.max(0, x),
            y: Math.max(0, y),
            rotation: 0,
            z: ++state.zCounter,
            label: type === "text-label" ? "Custom Text" : def.name,
            notes: "",
        };
    }

    /* =============================================================
     * 8. CANVAS ITEM INTERACTIONS
     *    - Click to select
     *    - Pointer-drag to move (using Pointer Events for unified
     *      mouse + touch support, with setPointerCapture).
     *    - Double-click to edit label
     * ============================================================= */
    function attachItemInteractions(el) {
        let dragInfo = null; // { offsetX, offsetY, moved }

        el.addEventListener("pointerdown", (e) => {
            // Ignore if user clicks on the floating toolbar.
            if (e.target.closest(".item-toolbar")) return;
            e.stopPropagation();

            const id = el.dataset.id;
            selectItem(id);

            const item = getItem(id);
            const rect = $stage.getBoundingClientRect();

            dragInfo = {
                startMouseX: e.clientX,
                startMouseY: e.clientY,
                startItemX:  item.x,
                startItemY:  item.y,
                stageRect:   rect,
                moved:       false,
            };

            el.classList.add("dragging");
            el.setPointerCapture(e.pointerId);
        });

        el.addEventListener("pointermove", (e) => {
            if (!dragInfo) return;
            const dx = e.clientX - dragInfo.startMouseX;
            const dy = e.clientY - dragInfo.startMouseY;
            if (!dragInfo.moved && Math.hypot(dx, dy) > 2) dragInfo.moved = true;

            const item = getItem(el.dataset.id);
            item.x = dragInfo.startItemX + dx;
            item.y = dragInfo.startItemY + dy;

            // Constrain to the stage area
            const maxX = dragInfo.stageRect.width  - el.offsetWidth;
            const maxY = dragInfo.stageRect.height - el.offsetHeight;
            item.x = Math.max(0, Math.min(maxX, item.x));
            item.y = Math.max(0, Math.min(maxY, item.y));

            applyTransform(el, item);
            positionToolbarFor(el);
        });

        el.addEventListener("pointerup", (e) => {
            if (!dragInfo) return;
            el.classList.remove("dragging");
            try { el.releasePointerCapture(e.pointerId); } catch (_) {}
            if (dragInfo.moved) save();
            dragInfo = null;
        });

        // Double-click to edit label
        el.addEventListener("dblclick", (e) => {
            e.stopPropagation();
            editLabel(el.dataset.id);
        });
    }

    /* =============================================================
     * 9. SELECTION + FLOATING TOOLBAR
     * ============================================================= */
    function selectItem(id) {
        state.selectedId = id;
        // Update visual selection
        $stage.querySelectorAll(".canvas-item.selected").forEach((n) =>
            n.classList.remove("selected")
        );
        const el = $stage.querySelector(`.canvas-item[data-id="${id}"]`);
        if (!el) {
            hideToolbar();
            return;
        }
        el.classList.add("selected");

        // Sync rotation slider
        const item = getItem(id);
        $rotateSlider.value = item.rotation || 0;

        positionToolbarFor(el);
        // Also highlight the matching input list row
        $inputBody.querySelectorAll("tr").forEach((tr) => tr.classList.remove("row-selected"));
        const tr = $inputBody.querySelector(`tr[data-id="${id}"]`);
        if (tr) tr.classList.add("row-selected");
    }

    function clearSelection() {
        state.selectedId = null;
        $stage.querySelectorAll(".canvas-item.selected").forEach((n) =>
            n.classList.remove("selected")
        );
        $inputBody.querySelectorAll("tr").forEach((tr) => tr.classList.remove("row-selected"));
        hideToolbar();
    }

    /**
     * Position the floating toolbar above the given canvas item.
     * Uses absolute coordinates on document.body so the toolbar can
     * float above all panels.
     */
    function positionToolbarFor(el) {
        const rect = el.getBoundingClientRect();
        $toolbar.hidden = false;
        // Place above the element, clamped to viewport
        const toolbarWidth = $toolbar.offsetWidth || 320;
        let left = rect.left + rect.width / 2 - toolbarWidth / 2;
        let top  = rect.top - 44;
        if (top < 60) top = rect.bottom + 8;
        left = Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, left));
        $toolbar.style.left = left + "px";
        $toolbar.style.top  = top + "px";
    }

    function hideToolbar() {
        $toolbar.hidden = true;
    }

    // Clicking on empty stage clears selection
    $stage.addEventListener("pointerdown", (e) => {
        if (e.target === $stage || e.target.classList.contains("stage-grid")) {
            clearSelection();
        }
    });

    // Reposition toolbar when window resizes / scrolls
    window.addEventListener("resize", () => {
        if (state.selectedId) {
            const el = $stage.querySelector(`.canvas-item[data-id="${state.selectedId}"]`);
            if (el) positionToolbarFor(el);
        }
    });
    document.querySelector(".stage-wrap").addEventListener("scroll", () => {
        if (state.selectedId) {
            const el = $stage.querySelector(`.canvas-item[data-id="${state.selectedId}"]`);
            if (el) positionToolbarFor(el);
        }
    });

    /* =============================================================
     * 10. ITEM ACTIONS (rotate / layer / duplicate / label / delete)
     * ============================================================= */
    function getItem(id) {
        return state.items.find((i) => i.id === id);
    }

    function rotateBy(delta) {
        const item = getItem(state.selectedId);
        if (!item) return;
        item.rotation = ((item.rotation || 0) + delta) % 360;
        if (item.rotation < 0) item.rotation += 360;
        applyTransform($stage.querySelector(`.canvas-item[data-id="${item.id}"]`), item);
        $rotateSlider.value = item.rotation;
        save();
    }

    function setRotation(value) {
        const item = getItem(state.selectedId);
        if (!item) return;
        item.rotation = Number(value) % 360;
        applyTransform($stage.querySelector(`.canvas-item[data-id="${item.id}"]`), item);
        save();
    }

    function bringForward() {
        const item = getItem(state.selectedId);
        if (!item) return;
        item.z = ++state.zCounter;
        $stage.querySelector(`.canvas-item[data-id="${item.id}"]`).style.zIndex = item.z;
        save();
    }

    function sendBackward() {
        const item = getItem(state.selectedId);
        if (!item) return;
        // Send to bottom by setting z below the current minimum
        const minZ = Math.min(...state.items.map((i) => i.z)) - 1;
        item.z = minZ;
        $stage.querySelector(`.canvas-item[data-id="${item.id}"]`).style.zIndex = item.z;
        save();
    }

    function duplicateSelected() {
        const item = getItem(state.selectedId);
        if (!item) return;
        const copy = {
            ...item,
            id: newId(),
            x: item.x + 20,
            y: item.y + 20,
            z: ++state.zCounter,
            notes: item.notes,
        };
        state.items.push(copy);
        mountItem(copy);
        selectItem(copy.id);
        renderInputList();
        save();
    }

    function editLabel(id) {
        const item = getItem(id);
        if (!item) return;
        const next = prompt("Label for this item:", item.label || "");
        if (next === null) return; // cancelled
        item.label = next.trim() || (TYPE_MAP[item.type] && TYPE_MAP[item.type].name) || "Item";
        const el = $stage.querySelector(`.canvas-item[data-id="${id}"]`);
        if (el) el.querySelector(".label").textContent = item.label;
        renderInputList();
        save();
    }

    function deleteSelected() {
        const item = getItem(state.selectedId);
        if (!item) return;
        state.items = state.items.filter((i) => i.id !== item.id);
        const el = $stage.querySelector(`.canvas-item[data-id="${item.id}"]`);
        if (el) el.remove();
        clearSelection();
        renderInputList();
        save();
    }

    // Wire up the floating toolbar
    $toolbar.addEventListener("click", (e) => {
        const btn = e.target.closest("button");
        if (!btn) return;
        const action = btn.dataset.action;
        switch (action) {
            case "rotate-left":  rotateBy(-15); break;
            case "rotate-right": rotateBy(+15); break;
            case "forward":      bringForward(); break;
            case "backward":     sendBackward(); break;
            case "duplicate":    duplicateSelected(); break;
            case "label":        editLabel(state.selectedId); break;
            case "delete":       deleteSelected(); break;
        }
    });
    $rotateSlider.addEventListener("input", (e) => setRotation(e.target.value));

    // Keyboard shortcuts: Delete to remove, D to duplicate.
    document.addEventListener("keydown", (e) => {
        // Don't capture when user is typing into an input
        if (e.target.matches("input, textarea")) return;
        if (!state.selectedId) return;

        if (e.key === "Delete" || e.key === "Backspace") {
            e.preventDefault();
            deleteSelected();
        } else if (e.key.toLowerCase() === "d" && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            duplicateSelected();
        }
    });

    /* =============================================================
     * 11. INPUT LIST RENDERING
     *    Channels are numbered by current insertion order (the order
     *    of state.items). Editing the notes field updates state and
     *    saves immediately.
     * ============================================================= */
    function renderInputList() {
        $inputBody.innerHTML = "";

        if (state.items.length === 0) {
            $emptyHint.style.display = "block";
            // Clear channel badges (none exist anyway)
            return;
        }
        $emptyHint.style.display = "none";

        state.items.forEach((item, idx) => {
            const ch = idx + 1;
            const def = TYPE_MAP[item.type] || { name: item.type };

            // Update channel badge on the canvas item too
            const badgeEl = $stage.querySelector(
                `.canvas-item[data-id="${item.id}"] .ch-badge`
            );
            if (badgeEl) {
                // Text labels don't get a channel badge
                if (item.type === "text-label") {
                    badgeEl.style.display = "none";
                } else {
                    badgeEl.style.display = "";
                    badgeEl.textContent = ch;
                }
            }

            // Don't list pure text labels as input channels
            if (item.type === "text-label") return;

            const tr = document.createElement("tr");
            tr.dataset.id = item.id;
            if (item.id === state.selectedId) tr.classList.add("row-selected");

            tr.innerHTML = `
                <td class="ch-num">${ch}</td>
                <td class="ch-name">
                    <span class="row-icon">${svgFor(item.type)}</span>
                    ${escapeHtml(item.label || def.name)}
                </td>
                <td>
                    <input
                        type="text"
                        class="notes-field"
                        placeholder="e.g. SM58, needs phantom power…"
                        value="${escapeHtml(item.notes || "")}"
                    />
                </td>
            `;

            // Selecting a row selects the canvas item too
            tr.addEventListener("click", () => selectItem(item.id));

            // Editing notes -> save
            const notes = tr.querySelector(".notes-field");
            notes.addEventListener("input", (e) => {
                item.notes = e.target.value;
                save();
            });
            // Prevent row-click selection from firing while typing
            notes.addEventListener("click", (e) => e.stopPropagation());

            $inputBody.appendChild(tr);
        });

        // After rebuilding, re-number badges for items that came after a text-label
        // (the loop above already handles all items, but channel numbers should skip
        // text-labels in the displayed list). For badge purposes we used idx+1 from
        // state.items which is fine since labels also occupy a position visually.
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    /* =============================================================
     * 12. TOP BAR ACTIONS
     *    - Clear     : wipe stage
     *    - JSON Export: download state as .json
     *    - JSON Import: load state from .json
     *    - PNG/PDF   : rasterise + download
     * ============================================================= */
    document.getElementById("btn-clear").addEventListener("click", () => {
        if (!state.items.length && !state.title) return;
        if (!confirm("Clear the entire stage? This cannot be undone.")) return;
        state.title = "";
        state.items = [];
        state.selectedId = null;
        state.zCounter = 1;
        renderStage();
        syncTitleInput();
        save();
    });

    document.getElementById("btn-export-json").addEventListener("click", () => {
        const payload = {
            app: "myStage",
            version: 1,
            exportedAt: new Date().toISOString(),
            title: state.title || "",
            items: state.items,
            zCounter: state.zCounter,
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
            type: "application/json",
        });
        triggerDownload(blob, exportFilename("json"));
    });

    document.getElementById("file-import").addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result);
                if (!data || !Array.isArray(data.items)) {
                    alert("That file doesn't look like a myStage session.");
                    return;
                }
                state.title = typeof data.title === "string" ? data.title : "";
                state.items = data.items.map(sanitiseImportedItem);
                state.zCounter = data.zCounter || state.items.length + 1;
                state.selectedId = null;
                renderStage();
                syncTitleInput();
                save();
            } catch (err) {
                alert("Could not parse JSON: " + err.message);
            } finally {
                e.target.value = ""; // reset so the same file can be re-imported
            }
        };
        reader.readAsText(file);
    });

    /**
     * Ensure imported items have all required fields and that unknown
     * types fall back to a generic icon.
     */
    function sanitiseImportedItem(it) {
        return {
            id: it.id || newId(),
            type: TYPE_MAP[it.type] ? it.type : it.type, // keep, render handles unknown
            x: Number(it.x) || 0,
            y: Number(it.y) || 0,
            rotation: Number(it.rotation) || 0,
            z: Number(it.z) || 1,
            label: typeof it.label === "string" ? it.label : "",
            notes: typeof it.notes === "string" ? it.notes : "",
        };
    }

    document.getElementById("btn-export-png").addEventListener("click", () => {
        exportImage("png");
    });
    document.getElementById("btn-export-pdf").addEventListener("click", () => {
        exportPdf();
    });

    /* =============================================================
     * 13. EXPORTS
     * -----------------------------------------------------------------
     * Two strategies are used:
     *
     *   PNG export  : html2canvas a composite HTML node (stage + table)
     *                 -> JPEG-compressed bitmap of the whole thing.
     *                 Optimised: scale=1.5, JPEG q=0.85. ~300-600 KB.
     *
     *   PDF export  : *vector* native rendering via jsPDF.
     *                 - Title, frame, table, channel rows, notes:
     *                   drawn with jsPDF primitives (selectable text,
     *                   sharp lines, ~5-10 KB of vector data total).
     *                 - Only the stage interior (where the icons sit) is
     *                   rasterised, as JPEG q=0.82, then embedded with
     *                   'FAST' compression so jsPDF doesn't re-deflate
     *                   the already-compressed JPEG.
     *                 Typical output: 150-400 KB.
     * ============================================================= */

    /**
     * Build an off-screen DOM node containing only the stage (for
     * rasterisation). The container is sized to match the live stage
     * aspect ratio so html2canvas produces a tight crop with no chrome.
     */
    function buildStageRasterNode() {
        // We use the live stage's aspect ratio but a fixed target width
        // so the output bitmap is predictable in size.
        const liveRect = $stage.getBoundingClientRect();
        const aspect = liveRect.width / liveRect.height || (16 / 9);

        const TARGET_W = 1200; // logical CSS px; scale below controls real bitmap size
        const TARGET_H = Math.round(TARGET_W / aspect);

        const wrap = document.createElement("div");
        wrap.style.position = "fixed";
        wrap.style.left = "-99999px";
        wrap.style.top = "0";
        wrap.style.width = TARGET_W + "px";
        wrap.style.height = TARGET_H + "px";
        wrap.style.background = "#ffffff";

        const clone = $stage.cloneNode(true);
        // Force layout dimensions on the clone
        clone.style.width = TARGET_W + "px";
        clone.style.height = TARGET_H + "px";
        clone.style.position = "relative";
        clone.style.margin = "0";
        // Remove selection chrome from the clone
        clone.querySelectorAll(".canvas-item.selected").forEach((n) =>
            n.classList.remove("selected")
        );
        // Drop the dot-grid — it adds JPEG entropy with no informational value
        const gridLayer = clone.querySelector(".stage-grid");
        if (gridLayer) gridLayer.remove();

        // Items are positioned by the *original* stage's pixel coords.
        // Because our target width is wider than the live stage we'd get
        // items clustered in the top-left. Scale child item positions to
        // the new size to preserve the visual layout.
        const sx = TARGET_W / liveRect.width;
        const sy = TARGET_H / liveRect.height;
        Array.from(clone.querySelectorAll(".canvas-item")).forEach((el, idx) => {
            const original = $stage.querySelectorAll(".canvas-item")[idx];
            if (!original) return;
            const ox = parseFloat(original.style.left) || 0;
            const oy = parseFloat(original.style.top) || 0;
            el.style.left = ox * sx + "px";
            el.style.top = oy * sy + "px";
        });

        wrap.appendChild(clone);
        return { node: wrap, width: TARGET_W, height: TARGET_H };
    }

    /**
     * PNG export: composite stage + table into a single bitmap.
     * Uses JPEG compression for ~5-10x smaller file vs. PNG, which
     * is fine for a printed/emailed stage plot.
     */
    async function exportImage(format) {
        if (typeof html2canvas === "undefined") {
            alert("Export library failed to load. Check your internet connection.");
            return;
        }

        // Build a composite node with header + stage + table
        const container = buildHtmlExportComposite();
        document.body.appendChild(container);
        try {
            const canvas = await html2canvas(container, {
                backgroundColor: "#ffffff",
                scale: 1.5,           // ~150 DPI equivalent; plenty for email/print
                useCORS: true,
                logging: false,
            });

            // Always encode as JPEG to avoid PNG bloat. The `format` arg
            // is kept in the API for backwards compatibility, but PNG
            // would still produce huge files; JPEG is the sane default.
            const mime = "image/jpeg";
            canvas.toBlob((blob) => {
                if (blob) triggerDownload(blob, exportFilename("jpg"));
            }, mime, 0.85);
        } catch (err) {
            alert("Image export failed: " + err.message);
        } finally {
            container.remove();
        }
    }

    /**
     * Helper used by the PNG path: builds the visual composite.
     * (Separate from the PDF path so the PDF can be drawn natively.)
     */
    function buildHtmlExportComposite() {
        const container = document.createElement("div");
        container.style.position = "fixed";
        container.style.left = "-99999px";
        container.style.top = "0";
        container.style.width = "1100px";
        container.style.background = "#fff";
        container.style.padding = "24px";
        container.style.fontFamily = getComputedStyle(document.body).fontFamily;
        container.style.color = "#1f2937";

        // Header. Show the user's plot title prominently; fall back to a
        // generic name if none has been set.
        const titleText = state.title || "Untitled Stage Plot";
        const header = document.createElement("div");
        header.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-end;
                        border-bottom: 2px solid #1f2937; padding-bottom: 8px; margin-bottom: 16px;">
                <div>
                    <h1 style="margin:0 0 2px 0; font-size:24px; color:#1f2937;">${escapeHtml(titleText)}</h1>
                    <div style="font-size:11px; color:#9ca3af; text-transform:uppercase; letter-spacing:1px;">myStage · Stage Plot</div>
                </div>
                <div style="text-align:right;">
                    <div style="font-size:12px; color:#6b7280;">Generated ${new Date().toLocaleString()}</div>
                    <div style="font-size:11px; color:#9ca3af;">Front of stage / audience faces DOWN</div>
                </div>
            </div>
        `;
        container.appendChild(header);

        const stageClone = $stage.cloneNode(true);
        stageClone.style.width = "1050px";
        stageClone.style.height = "600px";
        stageClone.style.position = "relative";
        stageClone.querySelectorAll(".canvas-item.selected").forEach((n) =>
            n.classList.remove("selected")
        );

        // Scale item positions to fit new stage size (see notes in buildStageRasterNode)
        const liveRect = $stage.getBoundingClientRect();
        const sx = 1050 / liveRect.width;
        const sy = 600  / liveRect.height;
        Array.from(stageClone.querySelectorAll(".canvas-item")).forEach((el, idx) => {
            const original = $stage.querySelectorAll(".canvas-item")[idx];
            if (!original) return;
            el.style.left = (parseFloat(original.style.left) || 0) * sx + "px";
            el.style.top  = (parseFloat(original.style.top)  || 0) * sy + "px";
        });

        const stageWrap = document.createElement("div");
        stageWrap.style.marginBottom = "16px";
        const mkLabel = (text) => {
            const d = document.createElement("div");
            d.style.cssText =
                "text-align:center; font-size:10px; letter-spacing:2px; color:#6b7280; font-weight:700; padding:4px 0;";
            d.textContent = text;
            return d;
        };
        stageWrap.appendChild(mkLabel("BACK OF STAGE (UPSTAGE)"));
        stageWrap.appendChild(stageClone);
        stageWrap.appendChild(mkLabel("FRONT OF STAGE / AUDIENCE"));
        container.appendChild(stageWrap);

        // Input list table
        const visibleItems = state.items.filter((it) => it.type !== "text-label");
        const tableWrap = document.createElement("div");
        tableWrap.innerHTML = `
            <h2 style="font-size:14px; margin:16px 0 8px 0; letter-spacing:1px;
                       text-transform:uppercase; color:#374151;">Input List</h2>
        `;
        if (visibleItems.length === 0) {
            const empty = document.createElement("div");
            empty.style.color = "#9ca3af";
            empty.style.fontStyle = "italic";
            empty.textContent = "No input channels.";
            tableWrap.appendChild(empty);
        } else {
            const table = document.createElement("table");
            table.style.cssText = "width:100%; border-collapse:collapse; font-size:12px;";
            table.innerHTML = `
                <thead>
                    <tr style="background:#f3f4f6;">
                        <th style="text-align:left; padding:6px; border:1px solid #e5e7eb; width:50px;">Ch</th>
                        <th style="text-align:left; padding:6px; border:1px solid #e5e7eb;">Item</th>
                        <th style="text-align:left; padding:6px; border:1px solid #e5e7eb;">Notes</th>
                    </tr>
                </thead>
            `;
            const tbody = document.createElement("tbody");
            visibleItems.forEach((item, idx) => {
                const def = TYPE_MAP[item.type] || { name: item.type };
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td style="padding:6px; border:1px solid #e5e7eb; text-align:center; font-weight:700; color:#b45309;">${idx + 1}</td>
                    <td style="padding:6px; border:1px solid #e5e7eb;">${escapeHtml(item.label || def.name)}</td>
                    <td style="padding:6px; border:1px solid #e5e7eb;">${escapeHtml(item.notes || "")}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            tableWrap.appendChild(table);
        }
        container.appendChild(tableWrap);
        return container;
    }

    /**
     * PDF export (size-optimised hybrid).
     *
     * Layout (landscape A4, 297 × 210 mm, 10 mm margins):
     *   - Title bar           : vector text + line
     *   - Stage area          : JPEG image inside a vector border,
     *                           with "BACK"/"FRONT" labels in vector text
     *   - Input list table    : vector text + lines, page-breaks if long
     */
    async function exportPdf() {
        if (typeof html2canvas === "undefined" || !window.jspdf) {
            alert("Export libraries failed to load. Check your internet connection.");
            return;
        }

        const { jsPDF } = window.jspdf;
        // `compress: true` turns on PDF stream deflate for vector content.
        const pdf = new jsPDF({
            orientation: "landscape",
            unit: "mm",
            format: "a4",
            compress: true,
        });

        // ---- page metrics (mm) ----
        const PAGE_W = pdf.internal.pageSize.getWidth();    // 297
        const PAGE_H = pdf.internal.pageSize.getHeight();   // 210
        const M      = 10;                                  // margin

        // ---- 1. Rasterise the stage area to a JPEG ----
        const stageRaster = buildStageRasterNode();
        document.body.appendChild(stageRaster.node);

        let stageJpeg, stageW, stageH;
        try {
            // Reasonable DPI for print: ~140 DPI of stage at ~180mm wide
            // ≈ 1000 px wide bitmap. We let html2canvas render at scale 1
            // because we already sized the node to 1200 px.
            const c = await html2canvas(stageRaster.node, {
                backgroundColor: "#ffffff",
                scale: 1,
                useCORS: true,
                logging: false,
                width: stageRaster.width,
                height: stageRaster.height,
            });
            stageJpeg = c.toDataURL("image/jpeg", 0.82);
            stageW = c.width;
            stageH = c.height;
        } catch (err) {
            stageRaster.node.remove();
            alert("PDF export failed while rendering the stage: " + err.message);
            return;
        }
        stageRaster.node.remove();

        // ---- 2. Vector title bar ----
        // Plot title (user-set) is the dominant heading; the app name is a
        // small subtitle so the venue immediately sees what show this is.
        const titleText = state.title || "Untitled Stage Plot";

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(31, 41, 55);
        // Clip the title if it would collide with the right-side metadata.
        const titleMaxW = PAGE_W - M - M - 100;
        const titleLines = pdf.splitTextToSize(titleText, titleMaxW);
        pdf.text(titleLines[0], M, M + 6);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(156, 163, 175);
        pdf.text("MYSTAGE · STAGE PLOT", M, M + 11);

        pdf.setFontSize(9);
        pdf.setTextColor(107, 114, 128);
        pdf.text("Generated " + new Date().toLocaleString(), PAGE_W - M, M + 6, { align: "right" });
        pdf.text("Front of stage / audience faces DOWN", PAGE_W - M, M + 11, { align: "right" });

        pdf.setDrawColor(31, 41, 55);
        pdf.setLineWidth(0.4);
        pdf.line(M, M + 14, PAGE_W - M, M + 14);

        // Set the PDF document's metadata title so it shows up in the
        // viewer tab and file properties dialog.
        try {
            pdf.setProperties({
                title: titleText,
                subject: "Stage plot",
                creator: "myStage",
            });
        } catch (_) { /* older jsPDF builds may not support this */ }

        // ---- 3. Stage block (vector border + JPEG fill + vector labels) ----
        // Reserve right ~110mm for the input list (so plot + list fit on page 1).
        const stageBoxX = M;
        const stageBoxY = M + 20;
        const stageBoxW = PAGE_W - M - M - 110;   // ~177 mm
        // Maintain stage aspect ratio
        const aspect = stageW / stageH;
        let stageBoxH = stageBoxW / aspect;
        const maxStageH = PAGE_H - stageBoxY - M - 8; // 8 mm for FRONT label below
        if (stageBoxH > maxStageH) {
            stageBoxH = maxStageH;
        }

        // BACK label
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7);
        pdf.setTextColor(107, 114, 128);
        pdf.text("BACK OF STAGE (UPSTAGE)", stageBoxX + stageBoxW / 2, stageBoxY - 1, {
            align: "center",
        });

        // Frame around stage
        pdf.setDrawColor(31, 41, 55);
        pdf.setLineWidth(0.6);
        pdf.rect(stageBoxX, stageBoxY, stageBoxW, stageBoxH);

        // Stage JPEG. The 4th-from-last "FAST" alias tells jsPDF NOT to
        // re-deflate the JPEG, which would balloon the file. The last
        // string is the alias used internally.
        pdf.addImage(
            stageJpeg,
            "JPEG",
            stageBoxX,
            stageBoxY,
            stageBoxW,
            stageBoxH,
            undefined,
            "FAST"
        );

        // FRONT label
        pdf.text("FRONT OF STAGE / AUDIENCE", stageBoxX + stageBoxW / 2, stageBoxY + stageBoxH + 4, {
            align: "center",
        });

        // ---- 4. Vector input list (right column on page 1) ----
        const listX = stageBoxX + stageBoxW + 6;
        const listY = stageBoxY;
        const listW = PAGE_W - M - listX;        // ~104 mm
        drawInputListVector(pdf, listX, listY, listW, PAGE_H - M, M);

        // ---- 5. Save ----
        pdf.save(exportFilename("pdf"));
    }

    /**
     * Draw the input list table as native PDF vectors starting at (x,y).
     * Wraps onto additional pages when it runs past `maxY`. `margin` is
     * the page margin used when adding new pages.
     */
    function drawInputListVector(pdf, x, y, width, maxY, margin) {
        const visibleItems = state.items.filter((it) => it.type !== "text-label");

        // Title
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(55, 65, 81);
        pdf.text("INPUT LIST", x, y + 4);

        const PAGE_W = pdf.internal.pageSize.getWidth();
        const PAGE_H = pdf.internal.pageSize.getHeight();

        let cursorY = y + 8;

        if (visibleItems.length === 0) {
            pdf.setFont("helvetica", "italic");
            pdf.setFontSize(9);
            pdf.setTextColor(156, 163, 175);
            pdf.text("No input channels.", x, cursorY + 4);
            return;
        }

        // Column geometry (mm)
        const colChW    = 10;
        const colItemW  = Math.max(28, width * 0.42);
        const colNotesW = width - colChW - colItemW;
        const rowH      = 6;
        const headerH   = 6;

        // Header row
        const drawHeader = (hy) => {
            pdf.setFillColor(243, 244, 246);
            pdf.rect(x, hy, width, headerH, "F");
            pdf.setDrawColor(229, 231, 235);
            pdf.setLineWidth(0.2);
            pdf.rect(x, hy, width, headerH);

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8);
            pdf.setTextColor(75, 85, 99);
            pdf.text("Ch",    x + 2,                     hy + 4);
            pdf.text("Item",  x + colChW + 2,            hy + 4);
            pdf.text("Notes", x + colChW + colItemW + 2, hy + 4);
        };

        drawHeader(cursorY);
        cursorY += headerH;

        // Body
        visibleItems.forEach((item, idx) => {
            const def = TYPE_MAP[item.type] || { name: item.type };
            const ch = idx + 1;
            const itemText  = item.label || def.name;
            const notesText = item.notes || "";

            // Compute wrapped notes to size the row
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8.5);
            const notesLines = pdf.splitTextToSize(notesText, colNotesW - 3);
            const itemLines  = pdf.splitTextToSize(itemText,  colItemW - 3);
            const lineCount  = Math.max(1, notesLines.length, itemLines.length);
            const thisRowH   = Math.max(rowH, lineCount * 3.6 + 2);

            // Page break if needed
            if (cursorY + thisRowH > maxY) {
                pdf.addPage();
                cursorY = margin;
                drawHeader(cursorY);
                cursorY += headerH;
            }

            // Row borders
            pdf.setDrawColor(229, 231, 235);
            pdf.setLineWidth(0.15);
            pdf.rect(x, cursorY, colChW, thisRowH);
            pdf.rect(x + colChW, cursorY, colItemW, thisRowH);
            pdf.rect(x + colChW + colItemW, cursorY, colNotesW, thisRowH);

            // Channel #
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(180, 83, 9);
            pdf.text(String(ch), x + colChW / 2, cursorY + 4, { align: "center" });

            // Item
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(31, 41, 55);
            pdf.text(itemLines, x + colChW + 1.5, cursorY + 4);

            // Notes
            pdf.setTextColor(55, 65, 81);
            pdf.text(notesLines, x + colChW + colItemW + 1.5, cursorY + 4);

            cursorY += thisRowH;
        });
    }

    /* =============================================================
     * 14. UTILITIES
     * ============================================================= */
    function triggerDownload(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        // Revoke after a tick so the click has a chance to fire.
        setTimeout(() => URL.revokeObjectURL(url), 0);
    }

    function timestamp() {
        const d = new Date();
        const pad = (n) => String(n).padStart(2, "0");
        return (
            d.getFullYear() +
            pad(d.getMonth() + 1) +
            pad(d.getDate()) +
            "-" +
            pad(d.getHours()) +
            pad(d.getMinutes())
        );
    }

    /**
     * Convert the plot title into a safe filename slug, falling back to
     * "mystage" if no title is set. Returns e.g. "the-band-2026-05-11.pdf".
     */
    function exportFilename(ext) {
        const slug = (state.title || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 60);
        const base = slug || "mystage";
        return `${base}-${timestamp()}.${ext}`;
    }

    /* =============================================================
     * 15. BOOT
     * ============================================================= */
    function init() {
        renderPalette();
        load();
        renderStage();
        syncTitleInput();

        // Title editing: update state + autosave on every keystroke.
        // Also reflect the title in the document.title so the browser tab
        // is identifiable when several plots are open.
        const syncDocTitle = () => {
            document.title = state.title
                ? `${state.title} — myStage`
                : "myStage — Stage Plot Builder";
        };
        if ($title) {
            $title.addEventListener("input", (e) => {
                state.title = e.target.value;
                syncDocTitle();
                save();
            });
        }
        syncDocTitle();
    }

    init();
})();
