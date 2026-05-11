/* =================================================================
 * myStage - Icon library (inline SVG)
 * -----------------------------------------------------------------
 * Hand-crafted SVG silhouettes designed for stage-plot readability.
 *
 * All icons share these conventions:
 *   - 64×64 viewBox
 *   - Use `currentColor` for stroke/fill so they inherit text color
 *   - 2px nominal stroke weight
 *   - Centered, with ~6px padding from edges
 *
 * Each entry is keyed by the item `type` declared in app.js CATALOG.
 * Exposed globally as `window.MYSTAGE_ICONS`.
 * ================================================================= */

(function () {
    "use strict";

    // Convenience header wrapped around every <svg>
    const open = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
    const close = "</svg>";
    const wrap = (inner) => open + inner + close;

    const ICONS = {
        /* ============ VOCALS ============ */

        // Lead vocal: classic ball microphone on a tall straight stand
        "vox-lead": wrap(`
            <ellipse cx="32" cy="16" rx="9" ry="10" fill="currentColor" opacity="0.85"/>
            <path d="M32 26 v18"/>
            <path d="M22 44 h20"/>
            <path d="M32 44 v14"/>
            <path d="M24 58 h16"/>
        `),

        // Backing vocal: same mic but smaller + a second mic outline behind
        "vox-bg": wrap(`
            <ellipse cx="26" cy="18" rx="7" ry="8" fill="currentColor" opacity="0.7"/>
            <path d="M26 26 v14"/>
            <ellipse cx="40" cy="22" rx="6" ry="7" fill="currentColor" opacity="0.4"/>
            <path d="M40 29 v11"/>
            <path d="M18 50 h28"/>
            <path d="M32 40 v10"/>
        `),

        // Choir: three little people
        "vox-choir": wrap(`
            <circle cx="18" cy="20" r="5" fill="currentColor" opacity="0.85"/>
            <circle cx="32" cy="16" r="6" fill="currentColor" opacity="0.85"/>
            <circle cx="46" cy="20" r="5" fill="currentColor" opacity="0.85"/>
            <path d="M10 50 c2 -10 10 -14 16 -14" />
            <path d="M22 50 c2 -12 14 -16 20 -16" />
            <path d="M38 50 c2 -10 10 -14 16 -14" />
        `),

        /* ============ DRUMS & PERCUSSION ============ */

        // Drum kit: kick + snare + two toms (top-down)
        "drum-kit": wrap(`
            <circle cx="32" cy="40" r="14" fill="currentColor" opacity="0.15"/>
            <circle cx="32" cy="40" r="14"/>
            <circle cx="16" cy="22" r="7" fill="currentColor" opacity="0.6"/>
            <circle cx="48" cy="22" r="7" fill="currentColor" opacity="0.6"/>
            <circle cx="32" cy="18" r="5" fill="currentColor" opacity="0.4"/>
            <circle cx="10" cy="44" r="3" opacity="0.6"/>
            <circle cx="54" cy="44" r="3" opacity="0.6"/>
        `),

        // Electronic drum pad (SPD-SX style grid)
        "drum-epad": wrap(`
            <rect x="10" y="14" width="44" height="36" rx="4" fill="currentColor" opacity="0.15"/>
            <rect x="10" y="14" width="44" height="36" rx="4"/>
            <rect x="14" y="18" width="10" height="10" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="27" y="18" width="10" height="10" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="40" y="18" width="10" height="10" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="14" y="32" width="10" height="10" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="27" y="32" width="10" height="10" rx="1" fill="currentColor" opacity="0.6"/>
            <rect x="40" y="32" width="10" height="10" rx="1" fill="currentColor" opacity="0.6"/>
        `),

        // Congas / bongos: two stacked drums
        "drum-conga": wrap(`
            <ellipse cx="22" cy="20" rx="10" ry="4" fill="currentColor" opacity="0.5"/>
            <path d="M12 20 v22 a10 4 0 0 0 20 0 v-22"/>
            <ellipse cx="44" cy="26" rx="8" ry="3" fill="currentColor" opacity="0.5"/>
            <path d="M36 26 v18 a8 3 0 0 0 16 0 v-18"/>
        `),

        // Cajon: simple box with a sound port
        "drum-cajon": wrap(`
            <rect x="14" y="12" width="36" height="40" rx="2" fill="currentColor" opacity="0.15"/>
            <rect x="14" y="12" width="36" height="40" rx="2"/>
            <circle cx="32" cy="40" r="5"/>
            <line x1="14" y1="22" x2="50" y2="22" opacity="0.6"/>
        `),

        // Timpani: big kettle drum with stand
        "drum-timp": wrap(`
            <ellipse cx="32" cy="22" rx="22" ry="8" fill="currentColor" opacity="0.2"/>
            <ellipse cx="32" cy="22" rx="22" ry="8"/>
            <path d="M10 22 c0 14 8 22 22 22 c14 0 22 -8 22 -22"/>
            <path d="M20 44 v10"/>
            <path d="M44 44 v10"/>
            <line x1="14" y1="56" x2="50" y2="56"/>
        `),

        // Aux percussion: tambourine + shaker
        "drum-aux": wrap(`
            <circle cx="22" cy="28" r="14"/>
            <circle cx="22" cy="28" r="9" opacity="0.5"/>
            <circle cx="14" cy="20" r="1.5" fill="currentColor"/>
            <circle cx="30" cy="20" r="1.5" fill="currentColor"/>
            <circle cx="34" cy="32" r="1.5" fill="currentColor"/>
            <rect x="42" y="18" width="10" height="28" rx="5" fill="currentColor" opacity="0.5"/>
            <path d="M42 18 v28"/>
            <path d="M52 18 v28"/>
        `),

        /* ============ GUITARS & STRINGS ============ */

        // Electric guitar (Strat-ish double-cutaway silhouette, top-down)
        "gtr-electric": wrap(`
            <path d="M18 38 c-6 0 -10 -4 -10 -8 c0 -4 4 -8 10 -8 c2 0 4 1 6 3 c2 -1 6 -2 10 -2 l30 -2 v18 l-30 -2 c-4 0 -8 -1 -10 -2 c-2 2 -4 3 -6 3 z" fill="currentColor" opacity="0.7"/>
            <circle cx="22" cy="30" r="2" fill="#fff"/>
            <line x1="40" y1="30" x2="58" y2="30" stroke="#fff" stroke-width="0.5"/>
        `),

        // Acoustic guitar: figure-8 body with soundhole
        "gtr-acoustic": wrap(`
            <path d="M22 14 c-6 0 -10 5 -10 11 c0 4 2 7 4 9 c-2 2 -4 5 -4 9 c0 6 4 11 10 11 c8 0 12 -6 12 -14 v-12 c0 -8 -4 -14 -12 -14 z" fill="currentColor" opacity="0.6"/>
            <circle cx="22" cy="34" r="4" fill="#fff"/>
            <line x1="34" y1="34" x2="56" y2="34" stroke-width="1"/>
            <rect x="52" y="30" width="6" height="8" rx="1" fill="currentColor"/>
        `),

        // Bass guitar: longer neck, larger body
        "gtr-bass": wrap(`
            <path d="M14 36 c-4 0 -8 -3 -8 -7 c0 -4 4 -7 8 -7 c3 0 5 1 7 3 l37 -2 v14 l-37 -2 c-2 2 -4 3 -7 3 z" fill="currentColor" opacity="0.75"/>
            <circle cx="18" cy="29" r="2" fill="#fff"/>
            <circle cx="58" cy="22" r="1.5" fill="currentColor"/>
            <circle cx="58" cy="36" r="1.5" fill="currentColor"/>
        `),

        // Upright/double bass
        "str-upright": wrap(`
            <path d="M32 8 v8"/>
            <path d="M28 14 h8"/>
            <path d="M32 16 v8"/>
            <ellipse cx="32" cy="40" rx="16" ry="18" fill="currentColor" opacity="0.5"/>
            <path d="M28 28 c-2 4 -2 8 0 12"/>
            <path d="M36 28 c2 4 2 8 0 12"/>
            <line x1="32" y1="24" x2="32" y2="56"/>
        `),

        // Violin: small body
        "str-violin": wrap(`
            <path d="M32 6 v10"/>
            <path d="M28 12 h8"/>
            <path d="M24 20 c-4 4 -4 14 0 22 c4 6 12 8 16 0 c4 -8 0 -18 -4 -22"/>
            <path d="M30 24 c-1 4 -1 10 0 14"/>
            <path d="M34 24 c1 4 1 10 0 14"/>
            <line x1="32" y1="16" x2="32" y2="50"/>
            <line x1="12" y1="44" x2="50" y2="56"/>
        `),

        // Cello: larger, with endpin
        "str-cello": wrap(`
            <path d="M32 4 v8"/>
            <path d="M28 10 h8"/>
            <ellipse cx="32" cy="34" rx="16" ry="18" fill="currentColor" opacity="0.45"/>
            <path d="M28 24 c-2 4 -2 10 0 14"/>
            <path d="M36 24 c2 4 2 10 0 14"/>
            <line x1="32" y1="12" x2="32" y2="58"/>
        `),

        // Banjo: circular drum body with neck
        "str-banjo": wrap(`
            <circle cx="36" cy="36" r="16" fill="currentColor" opacity="0.5"/>
            <circle cx="36" cy="36" r="16"/>
            <line x1="36" y1="20" x2="36" y2="52" opacity="0.5"/>
            <line x1="20" y1="36" x2="52" y2="36" opacity="0.5"/>
            <path d="M22 22 l-14 -14"/>
            <path d="M8 8 h6 v6"/>
        `),

        // Mandolin: teardrop
        "str-mando": wrap(`
            <path d="M30 12 v6"/>
            <path d="M26 16 h8"/>
            <path d="M20 26 c-6 6 -6 18 0 24 c8 8 22 4 22 -10 c0 -10 -8 -18 -22 -14 z" fill="currentColor" opacity="0.55"/>
            <circle cx="30" cy="36" r="3" fill="#fff"/>
        `),

        /* ============ KEYBOARDS & ELECTRONICS ============ */

        // Grand piano (top-down silhouette)
        "key-grand": wrap(`
            <path d="M14 14 h20 c14 0 22 12 22 24 v8 c0 4 -2 6 -6 6 h-36 c-4 0 -6 -2 -6 -6 v-26 c0 -4 2 -6 6 -6 z" fill="currentColor" opacity="0.7"/>
            <rect x="14" y="44" width="38" height="8" fill="#fff" opacity="0.9"/>
            <line x1="20" y1="44" x2="20" y2="52"/>
            <line x1="26" y1="44" x2="26" y2="52"/>
            <line x1="32" y1="44" x2="32" y2="52"/>
            <line x1="38" y1="44" x2="38" y2="52"/>
            <line x1="44" y1="44" x2="44" y2="52"/>
        `),

        // Upright piano (front-view box with keys)
        "key-upright": wrap(`
            <rect x="10" y="10" width="44" height="44" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="14" y="38" width="36" height="14" fill="#fff"/>
            <line x1="20" y1="38" x2="20" y2="52"/>
            <line x1="26" y1="38" x2="26" y2="52"/>
            <line x1="32" y1="38" x2="32" y2="52"/>
            <line x1="38" y1="38" x2="38" y2="52"/>
            <line x1="44" y1="38" x2="44" y2="52"/>
            <rect x="18" y="38" width="3" height="8" fill="currentColor"/>
            <rect x="30" y="38" width="3" height="8" fill="currentColor"/>
            <rect x="42" y="38" width="3" height="8" fill="currentColor"/>
        `),

        // Synth: rack-style box with knobs and small keys
        "key-synth": wrap(`
            <rect x="6" y="20" width="52" height="24" rx="2" fill="currentColor" opacity="0.6"/>
            <circle cx="14" cy="28" r="3" fill="#fff"/>
            <circle cx="24" cy="28" r="3" fill="#fff"/>
            <circle cx="34" cy="28" r="3" fill="#fff"/>
            <circle cx="44" cy="28" r="3" fill="#fff"/>
            <rect x="10" y="36" width="44" height="6" fill="#fff"/>
            <line x1="16" y1="36" x2="16" y2="42"/>
            <line x1="22" y1="36" x2="22" y2="42"/>
            <line x1="28" y1="36" x2="28" y2="42"/>
            <line x1="34" y1="36" x2="34" y2="42"/>
            <line x1="40" y1="36" x2="40" y2="42"/>
            <line x1="46" y1="36" x2="46" y2="42"/>
        `),

        // Digital keyboard: wide piano on stand
        "key-digital": wrap(`
            <rect x="6" y="22" width="52" height="14" rx="2" fill="currentColor" opacity="0.7"/>
            <rect x="10" y="28" width="44" height="6" fill="#fff"/>
            <line x1="16" y1="28" x2="16" y2="34"/>
            <line x1="22" y1="28" x2="22" y2="34"/>
            <line x1="28" y1="28" x2="28" y2="34"/>
            <line x1="34" y1="28" x2="34" y2="34"/>
            <line x1="40" y1="28" x2="40" y2="34"/>
            <line x1="46" y1="28" x2="46" y2="34"/>
            <line x1="14" y1="36" x2="14" y2="54"/>
            <line x1="50" y1="36" x2="50" y2="54"/>
            <line x1="10" y1="54" x2="54" y2="54"/>
        `),

        // Hammond organ: double manual + drawbars
        "key-hammond": wrap(`
            <rect x="8" y="10" width="48" height="44" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="12" y="14" width="40" height="6" fill="#fff"/>
            <rect x="14" y="14" width="2" height="6" fill="currentColor"/>
            <rect x="20" y="14" width="2" height="6" fill="currentColor"/>
            <rect x="26" y="14" width="2" height="6" fill="currentColor"/>
            <rect x="32" y="14" width="2" height="6" fill="currentColor"/>
            <rect x="38" y="14" width="2" height="6" fill="currentColor"/>
            <rect x="44" y="14" width="2" height="6" fill="currentColor"/>
            <rect x="12" y="26" width="40" height="6" fill="#fff"/>
            <rect x="12" y="38" width="40" height="6" fill="#fff"/>
            <line x1="18" y1="38" x2="18" y2="44"/>
            <line x1="26" y1="38" x2="26" y2="44"/>
            <line x1="34" y1="38" x2="34" y2="44"/>
            <line x1="42" y1="38" x2="42" y2="44"/>
        `),

        // DJ setup: two turntables + mixer
        "key-dj": wrap(`
            <circle cx="14" cy="32" r="10" fill="currentColor" opacity="0.6"/>
            <circle cx="14" cy="32" r="3" fill="#fff"/>
            <circle cx="50" cy="32" r="10" fill="currentColor" opacity="0.6"/>
            <circle cx="50" cy="32" r="3" fill="#fff"/>
            <rect x="26" y="20" width="12" height="24" rx="1" fill="currentColor" opacity="0.7"/>
            <line x1="32" y1="24" x2="32" y2="32"/>
            <circle cx="32" cy="38" r="2" fill="#fff"/>
        `),

        // Laptop / playback rig
        "key-laptop": wrap(`
            <rect x="10" y="14" width="44" height="30" rx="2" fill="currentColor" opacity="0.6"/>
            <rect x="14" y="18" width="36" height="22" fill="#fff"/>
            <path d="M6 44 h52 l-4 6 h-44 z" fill="currentColor" opacity="0.7"/>
            <circle cx="32" cy="29" r="3" fill="currentColor" opacity="0.5"/>
        `),

        /* ============ HORNS & WOODWINDS ============ */

        // Trumpet
        "horn-trumpet": wrap(`
            <path d="M6 32 h36 l14 -10 v20 l-14 -10" fill="currentColor" opacity="0.6"/>
            <rect x="20" y="22" width="4" height="8" fill="currentColor"/>
            <rect x="28" y="22" width="4" height="8" fill="currentColor"/>
            <rect x="36" y="22" width="4" height="8" fill="currentColor"/>
            <circle cx="22" cy="20" r="2"/>
            <circle cx="30" cy="20" r="2"/>
            <circle cx="38" cy="20" r="2"/>
        `),

        // Trombone (slide)
        "horn-trombone": wrap(`
            <path d="M6 28 h28 v8 h-28 z" fill="currentColor" opacity="0.5"/>
            <path d="M34 24 h20 l4 -10 v36 l-4 -10 h-20 z" fill="currentColor" opacity="0.6"/>
            <line x1="34" y1="20" x2="34" y2="44"/>
        `),

        // Saxophone: curved body with bell
        "horn-sax": wrap(`
            <path d="M28 8 v18 c0 8 -8 10 -12 14 c-4 4 -4 12 4 14 l24 4 l8 -16 l-12 -2 c-6 -1 -8 -4 -8 -10 v-22 z" fill="currentColor" opacity="0.65"/>
            <circle cx="46" cy="42" r="1.5" fill="#fff"/>
            <circle cx="42" cy="36" r="1.5" fill="#fff"/>
            <circle cx="38" cy="30" r="1.5" fill="#fff"/>
            <circle cx="34" cy="24" r="1.5" fill="#fff"/>
            <circle cx="30" cy="18" r="1.5" fill="#fff"/>
        `),

        // Flute (horizontal tube)
        "horn-flute": wrap(`
            <rect x="6" y="28" width="52" height="6" rx="3" fill="currentColor" opacity="0.65"/>
            <circle cx="14" cy="31" r="1.5" fill="#fff"/>
            <circle cx="22" cy="31" r="1.5" fill="#fff"/>
            <circle cx="30" cy="31" r="1.5" fill="#fff"/>
            <circle cx="38" cy="31" r="1.5" fill="#fff"/>
            <circle cx="46" cy="31" r="1.5" fill="#fff"/>
            <circle cx="54" cy="31" r="1.5" fill="#fff"/>
        `),

        // Clarinet (vertical with bell)
        "horn-clarinet": wrap(`
            <rect x="28" y="8" width="8" height="36" rx="1" fill="currentColor" opacity="0.7"/>
            <path d="M24 44 h16 l-2 12 h-12 z" fill="currentColor" opacity="0.6"/>
            <circle cx="32" cy="16" r="1.5" fill="#fff"/>
            <circle cx="32" cy="22" r="1.5" fill="#fff"/>
            <circle cx="32" cy="28" r="1.5" fill="#fff"/>
            <circle cx="32" cy="34" r="1.5" fill="#fff"/>
        `),

        // French horn: coiled bell
        "horn-french": wrap(`
            <circle cx="32" cy="32" r="18" fill="currentColor" opacity="0.4"/>
            <circle cx="32" cy="32" r="18"/>
            <circle cx="32" cy="32" r="10"/>
            <path d="M50 32 l8 -6 v12 z" fill="currentColor" opacity="0.7"/>
        `),

        // Tuba: big circular bell
        "horn-tuba": wrap(`
            <ellipse cx="32" cy="34" rx="22" ry="20" fill="currentColor" opacity="0.45"/>
            <ellipse cx="32" cy="34" rx="22" ry="20"/>
            <ellipse cx="32" cy="34" rx="10" ry="8"/>
            <rect x="28" y="6" width="8" height="10" rx="2" fill="currentColor" opacity="0.7"/>
        `),

        /* ============ AUDIO / MONITORS ============ */

        // Floor monitor: wedge shape (side profile)
        "aud-monitor": wrap(`
            <path d="M6 44 l8 -24 h36 l8 24 z" fill="currentColor" opacity="0.65"/>
            <circle cx="32" cy="36" r="8" fill="#fff"/>
            <circle cx="32" cy="36" r="5"/>
            <circle cx="32" cy="36" r="1.5" fill="currentColor"/>
            <circle cx="20" cy="26" r="2" fill="#fff"/>
            <circle cx="44" cy="26" r="2" fill="#fff"/>
        `),

        // Guitar amp: small combo amp
        "aud-gtr-amp": wrap(`
            <rect x="10" y="12" width="44" height="40" rx="2" fill="currentColor" opacity="0.55"/>
            <rect x="14" y="20" width="36" height="22" fill="#1a1a1a" opacity="0.2"/>
            <rect x="14" y="20" width="36" height="22" stroke="currentColor" stroke-dasharray="2 2" fill="none"/>
            <circle cx="18" cy="16" r="1.5" fill="#fff"/>
            <circle cx="26" cy="16" r="1.5" fill="#fff"/>
            <circle cx="34" cy="16" r="1.5" fill="#fff"/>
            <circle cx="42" cy="16" r="1.5" fill="#fff"/>
            <circle cx="32" cy="31" r="8" fill="#fff" opacity="0.4"/>
        `),

        // Bass rig: tall cabinet with 4x10 grid
        "aud-bass-rig": wrap(`
            <rect x="14" y="6" width="36" height="52" rx="2" fill="currentColor" opacity="0.6"/>
            <circle cx="24" cy="18" r="6" fill="#fff" opacity="0.3"/>
            <circle cx="40" cy="18" r="6" fill="#fff" opacity="0.3"/>
            <circle cx="24" cy="36" r="6" fill="#fff" opacity="0.3"/>
            <circle cx="40" cy="36" r="6" fill="#fff" opacity="0.3"/>
            <rect x="18" y="48" width="28" height="6" fill="#fff" opacity="0.4"/>
        `),

        // DI box: small box with jacks
        "aud-di": wrap(`
            <rect x="16" y="20" width="32" height="24" rx="2" fill="currentColor" opacity="0.7"/>
            <circle cx="24" cy="32" r="3" fill="#fff"/>
            <circle cx="40" cy="32" r="3" fill="#fff"/>
            <rect x="28" y="24" width="8" height="2" fill="#fff"/>
            <text x="32" y="42" font-size="6" font-family="sans-serif" fill="#fff" text-anchor="middle" stroke="none">DI</text>
        `),

        // Boom mic stand (top-down: stand + boom arm + mic)
        "aud-mic-boom": wrap(`
            <circle cx="18" cy="42" r="8" fill="currentColor" opacity="0.25"/>
            <circle cx="18" cy="42" r="3" fill="currentColor"/>
            <line x1="18" y1="42" x2="48" y2="22"/>
            <ellipse cx="50" cy="20" rx="4" ry="3" fill="currentColor" transform="rotate(-30 50 20)"/>
        `),

        // Straight mic stand (top-down)
        "aud-mic-strt": wrap(`
            <circle cx="32" cy="42" r="10" fill="currentColor" opacity="0.2"/>
            <circle cx="32" cy="42" r="3" fill="currentColor"/>
            <ellipse cx="32" cy="22" rx="5" ry="6" fill="currentColor"/>
            <line x1="32" y1="28" x2="32" y2="42"/>
        `),

        /* ============ STAGE SETUP ============ */

        // Power drop: outlet box
        "stage-power": wrap(`
            <rect x="10" y="14" width="44" height="36" rx="4" fill="currentColor" opacity="0.7"/>
            <circle cx="24" cy="28" r="2" fill="#fff"/>
            <circle cx="24" cy="38" r="2" fill="#fff"/>
            <rect x="34" y="26" width="2" height="4" fill="#fff"/>
            <rect x="40" y="26" width="2" height="4" fill="#fff"/>
            <rect x="34" y="36" width="2" height="4" fill="#fff"/>
            <rect x="40" y="36" width="2" height="4" fill="#fff"/>
            <path d="M28 4 l-4 8 h8 l-4 8" stroke="#f59e0b" stroke-width="2" fill="none"/>
        `),

        // Stage riser: hatched rectangle
        "stage-riser": wrap(`
            <rect x="6" y="14" width="52" height="36" rx="2" fill="currentColor" opacity="0.3"/>
            <rect x="6" y="14" width="52" height="36" rx="2" stroke-dasharray="4 2"/>
            <line x1="14" y1="22" x2="50" y2="22" opacity="0.5"/>
            <line x1="14" y1="32" x2="50" y2="32" opacity="0.5"/>
            <line x1="14" y1="42" x2="50" y2="42" opacity="0.5"/>
        `),

        /* ============ TEXT ============ */

        // Text label glyph
        "text-label": wrap(`
            <text x="32" y="42" font-size="36" font-family="serif" font-weight="700" fill="currentColor" text-anchor="middle" stroke="none">T</text>
        `),
    };

    // Fallback for unknown types
    ICONS.__fallback = wrap(`
        <circle cx="32" cy="32" r="20" stroke-dasharray="3 3"/>
        <text x="32" y="38" font-size="20" font-family="sans-serif" fill="currentColor" text-anchor="middle" stroke="none">?</text>
    `);

    window.MYSTAGE_ICONS = ICONS;
})();
