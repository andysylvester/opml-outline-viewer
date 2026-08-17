# OPML Outline Viewer

A single static page that reads an [OPML](http://opml.org/spec2.opml) file and renders it as
an expand/collapse outline. No build step, no server-side code, no JavaScript dependencies —
drop the folder on any web server and it works.

## Quick start

Serve the folder over HTTP and open it in a browser:

```sh
cd opml-outline-viewer
python -m http.server 8000    # or: npx serve
```

Then visit <http://localhost:8000/>.

It has to be served over HTTP rather than opened straight from disk. The page reads the
outline with `fetch`, and browsers block `fetch` against `file://` URLs.

## Choosing an outline

By default the page loads `Activism_Links.opml`. To display a different one, drop the `.opml`
file into this folder and name it in the query string:

```
index.html?opml=davewiner.opml
index.html?opml=outlines/notes.opml
```

The heading and the browser tab take their text from the outline's `<head><title>`, falling
back to the filename if the outline doesn't have one. A trailing `.opml` is trimmed and
underscores are shown as spaces, so `Activism_Links` displays as "Activism Links".

Each outline's expanded/collapsed state is remembered separately in `localStorage`, so
switching between outlines doesn't disturb the others.

## Expand all / collapse all

The switch under the heading expands or collapses the whole outline at once. Outlines open
fully expanded, so it starts on.

It behaves like a "select all" box: it's on only while every node is expanded, and collapsing
any single node by clicking its wedge clears it. Turning it back on re-expands everything.
Whatever state you leave it in is saved with the rest of the expansion state, so the outline
comes back the way you left it.

The outline slides open and shut rather than jumping. Only the outermost level that's actually
changing is animated — anything nested inside it is carried along by that slide, and animating
both would mean sliding to a height that's still moving. A node that's shut inside a parent
that's already open still slides on its own. The switch is out of action for the 150ms the
slide takes, so a second flip can't land in the middle of the first.

If the file can't be read the page says so instead of coming up blank.

### Only files in this folder, by default

`?opml=` accepts relative paths inside the folder. Absolute URLs, protocol-relative URLs,
`..` segments, and things like `javascript:` are refused, and the page falls back to the
default outline with a note in the console.

That restriction is deliberate. An outline's node text is inserted into the page as HTML —
that's what lets outlines contain links and formatting — so whoever writes the outline can
run script on the page. That's fine for files you put in the folder yourself, but without the
check, a link like `?opml=https://example.com/anything.opml` would let a stranger run their
code on your site's origin.

If you want to load outlines from other sites and accept that trade-off, set
`flAllowRemoteOutlines` to `true` in `code.js`. The other site also has to send permissive
CORS headers, or the browser will block the request anyway.

## Configuration

At the top of `code.js`:

```js
const viewerConfig = {
	defaultOutline: "Activism_Links.opml",
	flAllowRemoteOutlines: false
	};
```

| Setting | Default | What it does |
| --- | --- | --- |
| `defaultOutline` | `"Activism_Links.opml"` | Shown when there's no `?opml=` in the URL |
| `flAllowRemoteOutlines` | `false` | Allows `?opml=` to point at other sites — read the section above first |

## Files

| File | What it is |
| --- | --- |
| `index.html` | The page. Loads the scripts and calls `startup()` on `DOMContentLoaded`. |
| `code.js` | Reads the outline, picks the title, renders it, wires up the expand-all switch, saves expansion state. |
| `opml.js` | Parses OPML into a JavaScript object, and can stringify it back. |
| `outlinebrowsercode.js` | Renders the object as nested `<ul>`s, and handles the expand/collapse wedges. |
| `outlinebrowserstyles.css`, `styles.css` | Outline and page styling. |
| `menuappdialog.css` | Menu, dialog and toolbar styling carried over from the original page. |
| `bootstrap.css` | Bootstrap 2.3.1, bundled locally. Supplies the per-level list indentation. |
| `fontawesome-free-5.2.0-web/` | Font Awesome Free 5.2.0, bundled locally. Supplies the caret icons. |
| `fonts/` | Ubuntu, bundled locally. The page's typeface. |
| `Activism_Links.opml` | The sample outline. |

## No dependencies

This started as a jQuery page and was converted:

- `opml.js` parses with `DOMParser` and plain DOM traversal instead of `$.parseXML` and `.children()`
- `code.js` reads over HTTP with `fetch` and an `AbortController` timeout instead of `$.ajax`
- `outlinebrowsercode.js` uses `querySelectorAll` / `getElementById`, and its `slideUp` and
  `slideDown` helpers animate with a CSS transition instead of jQuery's animation queue
- Bootstrap's JavaScript was dropped (nothing on the page used it), and Bootstrap, Font
  Awesome and the Ubuntu font are served from this folder rather than a CDN

Nothing on the page makes a request to another host, so it renders the same offline as on.
The Ubuntu font in `fonts/` is regular, bold and regular italic, latin and latin-ext only —
the cyrillic and greek subsets Google serves are left out, and `fonts/ubuntu.css` says where
to add them back. Rancho, which the original page also loaded, isn't bundled: the only rule
that asked for it styles a menubar this page doesn't draw.

The rendered HTML is byte-for-byte identical to what the jQuery version produced.

Needs a browser with `fetch`, `URLSearchParams`, `AbortController`, and `classList` — anything
current. There's no polyfill or transpile step.

## Credits

The OPML parser (`opml.js`) and the outline browser (`outlinebrowsercode.js`) began as
Dave Winer's code from [scripting.com](http://scripting.com/), reworked here to drop the
jQuery dependency.

## License

[MIT](LICENSE).

The bundled third-party components keep their own licenses: Bootstrap 2.3.1 is Apache 2.0,
Font Awesome Free 5.2.0 ships its `LICENSE.txt` in `fontawesome-free-5.2.0-web/` (icons
CC BY 4.0, fonts SIL OFL 1.1, code MIT), and the Ubuntu font is under the Ubuntu Font
Licence 1.0, in `fonts/LICENSE.txt`.
