# Agent notes

Discord bot. Entry point is `app.js`. Slash commands live in `commands/<name>/`. Each command file exports `data` (SlashCommandBuilder) and `execute`. `deploy/deployCommands.js` registers them globally when the process starts.

JSON stores are paths in `config.js` `DB_NAMES`. `utils.getDb` reads one. Files have no `.json` suffix and are gitignored: `emoteIndex`, `japIndex`, `timeUntilReply`, `asciiIndex`.

## ASCII art

- `asciiArt.js` converts an image buffer to a fixed-size ASCII string and reads/writes `asciiIndex`.
- Caps: 62 columns, 31 rows. A square image fills that grid and `formatReply` stays under Discord's 2000-character limit.
- `/ascii-save` is `commands/ascii/save.js`. `/ascii` is `commands/ascii/show.js`. `/ascii-list` is `commands/ascii/list.js`.
- Names match `/^[a-z0-9][a-z0-9-]{0,31}$/` after trim, lowercase, and spaces-to-hyphens.
- Tests: `node --test` (`asciiArt.test.js`, `countdown.test.js`).
- Image decode uses `jimp` 0.22 (CommonJS). PNG, JPG, and GIF. Do not switch to Jimp 1 without moving the project to ESM.
