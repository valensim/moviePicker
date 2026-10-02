# Agent notes

Discord bot. Entry point is `app.js`. Slash commands live in `commands/<name>/`. Each command file exports `data` (SlashCommandBuilder) and `execute`. `deploy/deployCommands.js` registers them globally when the process starts.

JSON stores are paths in `config.js` `DB_NAMES`. `utils.getDb` reads one. Files have no `.json` suffix and are gitignored: `emoteIndex`, `japIndex`, `timeUntilReply`, `asciiIndex`.

## ASCII art

- `asciiArt.js` converts an image buffer to a fixed-size ASCII string and reads/writes `asciiIndex`.
- `fitSize` uses the image's own aspect ratio. Character cells are about twice as tall as they are wide (`CHAR_ASPECT` 0.5). The grid grows until `formatReply` would pass Discord's 2000-character limit. Jimp applies JPEG EXIF orientation on read, so do not rotate again.
- `/ascii-save` is `commands/ascii/save.js`. `/ascii` is `commands/ascii/show.js`. `/ascii-list` is `commands/ascii/list.js`.
- Names match `/^[a-z0-9][a-z0-9-]{0,31}$/` after trim, lowercase, and spaces-to-hyphens.
- Tests: `node --test` (`asciiArt.test.js`, `countdown.test.js`).
- Image decode uses `jimp` 0.22 (CommonJS). PNG, JPG, and GIF. Do not switch to Jimp 1 without moving the project to ESM.
