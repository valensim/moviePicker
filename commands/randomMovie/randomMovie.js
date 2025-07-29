const { CHANNELS } = require('../../config');
const { SlashCommandBuilder } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('random-movie')
        .setDescription('picks a random movie from the watchlist'),
    async execute(interaction) {
        try {
            await interaction.deferReply();

            const watchlist = interaction.guild.channels.cache.find(ch => ch.name === CHANNELS.WATCHLIST);
            if (!watchlist) {
                await interaction.editReply('Watchlist channel not found' + CHANNELS.WATCHLIST);
                return;
            }

            const fetchedMessages = await watchlist.messages.fetch({ limit: 100 });
            if (fetchedMessages.size === 0) {
                await interaction.editReply('No movies found in watchlist');
                return;
            }

            const messagesArray = Array.from(fetchedMessages.values());
            const index = Math.floor(Math.random() * messagesArray.length);
            const randomMovie = messagesArray[index];
            
            // Extract movie info from the message
            let movieInfo = 'Random movie selected!';
            if (randomMovie.embeds?.[0]?.data?.description) {
                movieInfo = randomMovie.embeds[0].data.description;
            } else if (randomMovie.content) {
                movieInfo = randomMovie.content;
            }
            
            await interaction.editReply(`🎬 **Random Movie Pick:**\n${movieInfo}`);

        } catch (error) {
            console.error('Error in randomMovie command:', error);
            const response = interaction.deferred ? 
                interaction.editReply : interaction.reply;
            await response.call(interaction, 'Failed pick random movie. Please try again later.');
        }
    },
};