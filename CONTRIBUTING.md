# Contributing

One link per pull request, please.

## The bar

A resource earns a place if you have reached for it **twice** on real work.
Not "this exists and is AI-adjacent" — "I opened this when I was stuck and it
helped." Directories of directories, launch-week announcements and anything
behind a hard paywall with no browsable preview get closed.

## How to add one

1. Open [`data/resources.json`](data/resources.json).
2. If you have never contributed before, add yourself to `contributors`:

   ```json
   "kenneth": { "name": "Kenneth", "url": "https://kenneth.dsouza.im/ai/" }
   ```

3. Append your entry to `resources`:

   | field      | required | notes |
   |------------|----------|-------|
   | `name`     | yes      | How the site calls itself. |
   | `url`      | yes      | Canonical https URL, no tracking params. |
   | `domain`   | yes      | Bare host, shown under the name. |
   | `category` | yes      | One of the ids in `categories`. |
   | `note`     | yes      | One or two sentences on *why it earns its place* — what you use it for, not what it is. |
   | `tags`     | no       | Lowercase, hyphenated. Reuse existing tags where you can. |
   | `added`    | yes      | `YYYY-MM-DD`. Drives the ordering and the "last touched" date. |
   | `by`       | no       | Your key from `contributors`. Omit only for house entries. |

4. Check it renders: `python3 -m http.server 4000`, then search for your entry.

## Notes on notes

The `note` is the whole product. Write it like you are telling one person why to
click — plain, specific, a little opinionated. No marketing copy, no "leverage",
no em-dash-free corporate mush. Under about 140 characters reads best in the row.

## New categories

Prefer an existing category and a good tag. If a genuinely new kind of resource
shows up (three or more links that fit nowhere), open an issue first — the chip
row stays legible only while it is short.
