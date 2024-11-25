const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('back-fill')
		.setDescription('backfills the backlog with movies'),
	async execute(interaction) {
        await interaction.reply('backfill disabled');
        return;
        const backlog = interaction.guild.channels.cache.find(ch => ch.name === 'backlog');
        if (!backlog) {
            interaction.reply('No backlog channel found');
            return;
        }
        const messages = await backlog.messages.fetch({ limit: 100 });
        const watchlist = interaction.guild.channels.cache.find(ch => ch.name === 'watch-list');
        await interaction.reply('backfilling watchlist');
        const movies = await Promise.all(messages.map(async message => {
            const movie = await getMovieInfo(message.content);
            const imdbLink = `https://www.imdb.com/title/${movie.imdbID}`;
            const msg = `**${movie.Title}** (${movie.Year})\n[IMDB](${imdbLink}) Rating: ${movie.imdbRating}\n${movie.Runtime}\n${movie.Plot}`;
            const embed = new EmbedBuilder().setDescription(msg).setImage(movie.Poster);
            const sentMessage =  await watchlist.send({ embeds: [embed] });
            await sentMessage.react('🔥')
            await sentMessage.react('💩');
            return sentMessage;
        }));
    },
};

async function getMovieInfo(name) {
    const res = await axios.get(`https://www.omdbapi.com/?t=${name}&apikey=${process.env.OMDB_API_KEY}`);
    if (res.data.Response === 'False') {
        throw new Error('Movie not found: ' + name);
    }
    return res.data;
}