# Awesome AI Design Resources

An inspiration index for vibe coders — references, component kits, type, motion,
brand and prompts. Somewhere to browse when the build looks generic and you need
one good idea.

Collated by [Rasagy](https://rasagy.in/) & [Kenneth](https://kenneth.dsouza.im/ai/).

**Site:** `index.html` — a static, buildless page. Open it with any local server:

```sh
python3 -m http.server 4000   # then visit http://localhost:4000
```

Deploy by pointing GitHub Pages at the repo root. No build, no dependencies.

## Adding a resource

Everything lives in [`data/resources.json`](data/resources.json). Add one object
to `resources` and credit yourself with `by`:

```json
{
  "name": "Interface In Game",
  "url": "https://interfaceingame.com",
  "domain": "interfaceingame.com",
  "category": "inspiration",
  "note": "Game UI, catalogued by genre and element. The best cure for a menu that feels like a form.",
  "tags": ["games", "ui"],
  "added": "2026-09-01",
  "by": "kenneth"
}
```

`by` keys into the `contributors` block at the top of the same file — add
yourself there once (`name` + `url`) and every link you submit is credited on the
site. Clicking a credit filters the index to that person's picks
(`?by=kenneth`).

See [CONTRIBUTING.md](CONTRIBUTING.md) for the bar a link has to clear.

## License

MIT.
