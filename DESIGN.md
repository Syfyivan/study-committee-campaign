# Pixel valley redesign plan

Preserve the existing seven-slide presentation, hash links, keyboard and touch navigation, fullscreen, and print output. Baseline seven-page, boundary, keyboard and hash checks passed before edits.

Replace the original markup and stylesheet rather than layer another theme over it. Keep plain HTML, CSS and JavaScript, without adding runtime dependencies. Preserve the existing repository and deployment URL.

Design: an original pixel farming valley behind a warm wooden-framed journal. Palette: forest #254b39, ink #3d3926, parchment #fff2ce, timber #704929, gold #eebd67, sunset #d68a6b. Fusion Pixel for display and utility labels, system sans-serif for longer text. Keep readable opaque paper beneath body copy.

Motion: directional page changes; staggered card entrances; gently shifting environment, sunbeams, fireflies and pointer parallax; one short constellation celebration on the final page. Single pause control, reduced-motion support, visibility pause, bounded particle count, no audio or remote trackers.

Validate every desktop and mobile slide, rapid navigation, direct links, disabled boundary controls, fullscreen, pause persistence, reduced motion, no runtime errors, printable pages, and public HTTPS assets. Back up the existing server directory before replacing static assets. Do not modify unrelated Caddy routes.

## Copy revision, September 19

Rewrite the visible text as a short classroom speech. Remove slogans, gardening metaphors, invented first-month timelines and repeated promises. Reduce seven pages to five: introduction, motivation, working approach, proposed tasks, closing. Keep the pixel art, lighting and navigation. Do not invent grades, awards, experience, or proven personal traits; use concrete future actions. Update the slide-count checks and final-page animation trigger, then verify text layout and online behavior. Keep the old deployment as a rollback copy.

## Viewport sizing follow-up

Use a fixed viewport grid for the header, journal and navigation. Remove inherited minimum heights from the presentation area; narrow screens use compact rows and flexible scenery. A measured scale fallback fits an unusually small viewport without cutting off content. Keep navigation outside the scaled content, and restore natural sizing in print. Verify all five slides at desktop, embedded-window and small-phone sizes, including actual child bounds rather than merely hiding page overflow.

## Selectable styles, September 22

The audience is the candidate's classmates; there is no agreed aesthetic preference. Offer four complete visual treatments of the same five-page speech, with a visible preview picker. Preserve the existing pixel valley as one option and start new visitors on clean blue and white. Share the same content, navigation and viewport fitting instead of duplicating pages. Baseline nine-viewport and interaction checks passed before this change.

- Clean: white #ffffff, pale blue #eef3fc, ink #19304e, blue #2462df, muted #56677d. System sans display, restrained mono numbering, generous white space and a typographic study motif inside a fine orbit.
- Playful: cream #fffef6, yellow #fff1ad, ink #252339, blue #3159c9, pink #f7d8ed. Heavy system sans headings, hard offset shadows, bright cards and a tilted letterform sticker.
- Midnight: navy #060f20, surface #0d1b30, ink #ebf5ff, cyan #67e8ef, line #2c465e. Crisp system sans headings, mono numbering, a fine grid and a slow geometric glow.
- Valley: retain the original art, pixel typography, wooden frame and lighting.

Treat these as distinct presentations rather than palette swaps: surfaces, type weights, borders, motifs and motion change together. Keep readable text still; animate only decorative artwork, respect pause and reduced-motion settings. Add no dependencies, generated personal claims or third-party requests.

Use a native modal dialog for keyboard focus containment and Escape. A selection preserves the current page, stores the preference locally, and updates the shareable theme query parameter without dropping other query values or the hash. Validate four themes across nine viewports and all five slides, then verify preference precedence, keyboard behavior, mobile picker bounds and full-screen switching. Keep a deployment backup.

## Companion presenter, September 22

Give each visual theme a distinct original companion: a blue-scarf seal, a sticker cat, a cyan robot and a pixel chick. Use generated transparent 2x2 sprite sheets with idle, talk, point and happy poses; preserve the generated files and use percentage-based CSS frame selection. Gentle breathing and finite greeting/talking animations respect the presentation's motion pause and system reduced-motion preference.

Reserve the journal's bottom strip for the pet and speech bubble, rather than placing an overlay on top of the speech. Keep one concise, natural explanation per chapter. On very short mobile windows, remove the optional large typographic motif before reducing text size. Maintain full-viewport layout and navigation.

Sound starts muted on every load. Opt-in device speech reads the current paragraph; navigation cancels the previous utterance and ignores stale callbacks, while a theme change preserves its position. Replay is separate from page navigation. Missing or failed speech keeps the text available. Hidden tabs and print cancel speech; static printed slides omit the companion. No new dependencies or external voice service. Test speech lifecycle with a browser API mock, explicitly separate from real audible-output testing.

## Illustrated collection, September 26

Add three original illustrated themes while preserving the current four, natural speech, default preference, navigation and single-viewport presentation. Baseline nine-viewport verification passed before editing. Reuse the existing non-pixel foundation by replacing its enumerated three-theme selector with the existing non-valley selector; keep distinctive treatments in a separate stylesheet. This is the complete simplification scope; do not restructure the slide or speech logic.

- Forest / 森野手账: ivory #f7f4e8, ink #314c3a, sage #dce5d4, brass #927848. Chinese serif display with sans body, fine ruled paper, botanical reading-nook artwork, tucked paper cards and an owl named 小栗. Signature: an arched watercolor window and notebook margin.
- Ocean / 海盐晴空: chalk #f8fcf9, seafoam #def1eb, teal #177976, navy #254c59. Round sans display with generous line space, postcard edges, layered sea-glass cards and a watercolor coastline. Signature: a sunlit coastal postcard with a sea otter named 泡泡.
- Lunar / 星月剧场: ink #191d33, plum #272840, cream #f1eadc, antique gold #ddbc77, lavender #bdb1d1. Serif display with sans body, thin gold rules, theater-arch artwork and measured starlight. Signature: a luminous celestial library with a moon rabbit named 月月.

Use generated artwork for each cover/finale and transparent four-pose pet sheets. Keep static body text readable; animate decorative light and artwork gently, respecting motion pause and reduced motion. Provide a seven-card gallery with artwork previews, scrollable options only and a persistent close button. No new packages, external font services or fabricated personal claims.

Extend existing interaction and clipping tests to all seven themes and all five slides at nine sizes. Check picker scrolling/focus, illustration loading, pet poses, reduced motion and actual rendered screenshots before publishing. Preserve a complete server backup and verify both GitHub's reference and public deployment separately.
