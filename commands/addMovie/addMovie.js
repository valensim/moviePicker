const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add-movie-to-watchlist')
		.setDescription('adds movie to the public watchlist')
        .addStringOption(option => option.setName('name').setDescription('Text to convert').setRequired(true)),
	async execute(interaction) {
        const watchlist = interaction.guild.channels.cache.find(ch => ch.name === 'watch-list');
        if (!watchlist) {
            interaction.reply('No watchlist channel found');
            return;
        }
        const info = await getMovieInfo(interaction);
        if (!info) {
            await interaction.reply('Movie not found');
            return;
        }
        interaction.reply('adding movie to watchlist');
        const imdbLink = `https://www.imdb.com/title/${info.imdbID || "not found"}`;
        const msg = `**${info.Title || "not found"}** (${info.Year || "not found"})\n[IMDB](${imdbLink}) Rating: ${info.imdbRating || "not found"}\n${info.Runtime || "not found"}\n${info.Plot || "not found"}`;
        const embed = new EmbedBuilder().setDescription(msg).setImage(info.Poster || "not found");
        const movie = await watchlist.send({ embeds: [embed] });
        // add reactions
        await movie.react('🔥');
        await movie.react('💩');
    },
};


async function getMovieInfo(interaction) {
    const name = interaction.options.getString('name');
    const res = await axios.get(`https://www.omdbapi.com/?t=${name}&apikey=${process.env.OMDB_API_KEY}`);
    if (res.data.Response === 'False' || res.data == null) {
        console.error("Movie " + name + " not found")
        return null;
    }
    return res.data;
}