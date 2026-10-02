# Directory structure

- `app.js` — Discord client. Loads commands, handles slash commands, messages, and reactions.
- `config.js` — JSON file paths, channel names, and yap nicknames.
- `utils.js` — Reads a JSON store. Picks a random nickname.
- `package.json` — Dependencies and `npm test` / `npm start`.
- `README.md` — How to run the bot and the command list.
- `.env` — Bot token, client id, and OMDB key. Not committed.
- `.gitignore` — Ignores `node_modules`, `.env`, and the JSON stores.

## ASCII art

- `asciiArt.js` — Shrinks an image, maps brightness to characters, saves and loads named art.
- `asciiArt.test.js` — Tests size caps, conversion, and the JSON store.
- `commands/ascii/save.js` — `/ascii-save` downloads an attachment and stores the art.
- `commands/ascii/show.js` — `/ascii` posts saved art by name.
- `commands/ascii/list.js` — `/ascii-list` posts every saved name.
- `docs/ascii-art.md` — How people use the ASCII commands.
- `asciiIndex` — Created at runtime. Map of name to ASCII text. Gitignored.

## Other commands

- `commands/addMovie/addMovie.js` — `/add-movie-to-watchlist` looks up a movie and posts it.
- `commands/backFill/backFill.js` — `/back-fill` fills the backlog with movies.
- `commands/emoteStats/emoteStats.js` — `/emote-stats` shows the most used emotes.
- `commands/emoteTrial/emoteTrial.js` — `/emote-trial` starts a vote to drop a rare custom emote.
- `commands/ironic/ironic.js` — `/ironic` turns text into ironic case.
- `commands/japCount/japCount.js` — `/jap-count` shows yap streaks.
- `commands/presence/presence.js` — `/presence` starts an attendance vote.
- `commands/randomMovie/randomMovie.js` — `/random-movie` picks from the watchlist.
- `commands/scoreboard/scoreboard.js` — `/scoreboard` shows high yap scores.
- `commands/stopTheVote/stopTheVote.js` — `/stop-the-vote` ranks movies from votes.

## Message-side features

- `japper.js` — Counts yaps and writes `japIndex`.
- `emoteTracker.js` — Counts emotes and reactions into `emoteIndex`.
- `countdown.js` — Times how long a user takes to reply. Writes `timeUntilReply`.
- `countdown.test.js` — Tests direct-mention detection.
- `deploy/deployCommands.js` — Pushes the current slash commands to Discord on startup.
