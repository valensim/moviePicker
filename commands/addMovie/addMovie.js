const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-movie-to-watchlist")
    .setDescription("adds movie to the public watchlist")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Text to convert")
        .setRequired(true),
    ),
  async execute(interaction) {
    try {
      const watchlist = interaction.guild.channels.cache.find(
        (ch) => ch.name === "watch-list",
      );
      if (!watchlist) {
        await interaction.reply("No watchlist channel found");
        return;
      }

      await interaction.deferReply();
      
      const info = await getMovieInfo(interaction);
      if (!info) {
        await interaction.editReply("Movie not found");
        return;
      }

      const imdbLink = `https://www.imdb.com/title/${info.imdbID || "not found"}`;
      const msg = `**${info.Title || "not found"}** (${info.Year || "not found"})\n[IMDB](${imdbLink}) Rating: ${info.imdbRating || "not found"}\n${info.Runtime || "not found"}\n${info.Plot || "not found"}`;
      const embed = new EmbedBuilder()
        .setDescription(msg)
        .setImage(info.Poster || "");

      const movie = await watchlist.send({ embeds: [embed] });
      await interaction.editReply("Movie added to watchlist!");
      
      try {
        await movie.react("🔥");
        await movie.react("💩");
      } catch (error) {
        console.error("Failed to add reactions:", error);
      }
    } catch (error) {
      console.error("Error in addMovie command:", error);
      const response = interaction.deferred ? 
        interaction.editReply : interaction.reply;
      await response.call(interaction, "Failed to add movie. Please try again later.");
    }
  },
};

async function getMovieInfo(interaction) {
  try {
    const name = interaction.options.getString("name");
    const encodedName = encodeURIComponent(name);
    const id = getImdbIdFromImdbLink(name);
    let res;
    if (id) {
      res = await axios.get(
        `https://www.omdbapi.com/?i=${id}&apikey=${process.env.OMDB_API_KEY}`,
      )
    } else {
      res = await axios.get(
        `https://www.omdbapi.com/?t=${encodedName}&apikey=${process.env.OMDB_API_KEY}`,
      );
    }
    if (res.data.Response === "False" || !res.data) {
      console.error("Movie not found:", name);
      return null;
    }
    return res.data;
  } catch (error) {
    console.error("Error fetching movie info:", error);
    return null;
  }
}

function getImdbIdFromImdbLink(link) {
  const match = link.match(/tt\d+/);
  return match ? match[0] : null;
}