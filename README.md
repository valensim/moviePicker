# Movie Night Discord Bot

This Discord bot helps make the process of deciding what movie to watch with friends just a tiny bit easier.

Forked from [Original Repository](https://github.com/dhavdc/DiscordBotTemplate.git)

## Prerequisites

You will need a `.env` file with the following environment variables:

- `CLIENT_TOKEN` (Discord bot token)
- `CLIENT_ID` (Discord client ID)
- `OMDB_API_KEY` (OMDB API key)

## Setup

1. Install dependencies:
    ```sh
    npm install
    ```

2. Create a `.env` file in the root directory and add your environment variables:
    ```env
    CLIENT_TOKEN=your_discord_bot_token
    CLIENT_ID=your_discord_client_id
    OMDB_API_KEY=your_omdb_api_key
    ```

3. Run the bot:
    ```sh
    node app.js
    ```

## Features

- **Presence Voting**: Start a vote on the presence of members.
- **Add Movie**: Adds movie to the watch-list.
- **Top Movies**: Calculate and display the top movies based on reactions.

## Commands

- `/presence`: Starts a vote on the presence of the members.
- `/back-fill`: Backfills the backlog with movies.
- `/stop-the-vote`: Stops the vote and calculates the top movies.