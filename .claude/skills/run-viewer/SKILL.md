---
name: run-viewer
description: Launch and drive the OPML outline viewer — serve the folder over HTTP, open it in Chrome, and verify the outline renders, the wedges expand and collapse, and no request leaves localhost. Use when asked to run, open, screenshot, or confirm a change in the viewer.
---

# Running the OPML outline viewer

Static page, no build step, no package.json. "Running" it means serving the
folder and driving a real browser against it.

**It must be served over HTTP.** `code.js` reads the outline with `fetch`, and
browsers block `fetch` on `file://` URLs. Opening `index.html` from disk gives a
page with a heading and an empty body — that's the block, not a bug.

## Serve

From the repo root:

```bash
(python -m http.server 8753 >/dev/null 2>&1 &)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8753/   # expect 200
```

Any static server works (`npx serve`); the port is arbitrary. Poll for the 200
rather than sleeping blind.

### Stopping it — Windows gotcha

`pkill -f "http.server"` from the Bash tool **silently fails** on this machine.
It reports success, the port stays bound, and the next launch quietly serves
from the old process. Kill by port, from PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 8753 -State Listen -ErrorAction SilentlyContinue |
  Select-Object -ExpandProperty OwningProcess -Unique |
  ForEach-Object { Stop-Process -Id $_ -Force -Confirm:$false }
```

Then confirm the port is actually free — one `Stop-Process` may not be enough if
a previous failed `pkill` left a second instance behind.

## Drive

There is no `chromium-cli` or Playwright on this machine, but Chrome is
installed. Use the `claude-in-chrome` skill and its `mcp__claude-in-chrome__*`
tools: `tabs_context_mcp` → `navigate` → `computer` (screenshot) →
`javascript_tool`. Close your tab and free the port when done.

A representative pass:

1. `navigate` to `http://localhost:8753/` and `screenshot`. The heading should
   read "Activism Links" — it comes from the outline's `<head><title>`, with
   `.opml` trimmed and underscores turned into spaces.
2. Click a wedge to collapse a section. They're small; aim at the caret glyph
   left of a top-level head (around x=340 at default width), or get coordinates
   from the `.aOutlineWedgeLink i` elements. The section should slide up and the
   caret flip from `fa-caret-down` to `fa-caret-right`.
3. `read_console_messages` — a healthy load logs exactly one line, `startup`.
   Anything more means something regressed.

### Other outlines

`?opml=name.opml` loads a different file from the folder. Absolute URLs and
`..` segments are refused by design (see `getOutlineName` in `code.js`), so a
rejected name falls back to the default with a console note — that's the
security check working, not a failure.

## Verifying the bundled font

The page bundles Ubuntu in `fonts/` specifically so it makes no external
requests. Two checks that actually prove it, since a screenshot can't
distinguish Ubuntu from a fallback:

```js
// via javascript_tool -- is the real face rendering, or a lookalike?
const w = (fam) => { const c = document.createElement('canvas').getContext('2d');
  c.font = `40px ${fam}`; return c.measureText('Handgloves').width; };
JSON.stringify({
  ready: document.fonts.check('18px Ubuntu'),
  differs: w('Ubuntu') !== w('NoSuchFontXYZ')   // both must be true
});
```

Then `read_network_requests` — every URL must be `localhost`. Nothing should hit
`googleapis` or `gstatic`.

**Expect only two woff2 files to load** (`ubuntu-400-latin`, `ubuntu-700-latin`).
The latin-ext and italic faces staying unfetched is the `unicode-range`
subsetting working correctly, not a missing file. To prove those files are
valid, force them:

```js
await document.fonts.load('italic 18px Ubuntu', 'test');
await document.fonts.load('18px Ubuntu', 'Ǆǽ');   // latin-ext codepoints
```

## Gotchas

- **`read_network_requests` starts capturing when first called.** Called after
  the page has loaded, it returns "No network requests found." Call it once,
  re-`navigate`, then read.
- **Clean up `localStorage`.** Expanding or collapsing anything writes
  `expandCollapseState.<outline-filename>`, and it persists across runs — so the
  next run starts from your last test's state instead of the default. Remove the
  key before finishing.
- **Font Awesome supplies the wedges.** Missing carets means
  `fontawesome-free-5.2.0-web/` didn't load, not a rendering bug in the outline
  code.
