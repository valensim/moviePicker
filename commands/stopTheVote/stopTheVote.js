const { SlashCommandBuilder } = require('discord.js');

//testing
//const screeningChannel = 'screeningtest';
//const watchlistChannel = 'backlog';

//prod
const screeningChannel = 'screening';
const watchlistChannel = 'watch-list';

// Move these to a config file later
const CHANNELS = {
    SCREENING: 'screening',
    WATCHLIST: 'watch-list'
};

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop-the-vote')
		.setDescription('gets the top 5 movies from the watchlist based on attendees votes'),
	async execute(interaction) {
        try {
            await interaction.deferReply();

            const attendees = await getAttendees(interaction);
            if (!attendees || attendees.length === 0) {
                await interaction.editReply('No votes have been cast yet');
                return;
            }

            const watchlist = interaction.guild.channels.cache.find(ch => ch.name === CHANNELS.WATCHLIST);
            if (!watchlist) {
                await interaction.editReply('Watchlist channel not found');
                return;
            }

            const fetchedMessages = await watchlist.messages.fetch({ limit: 100 });
            if (fetchedMessages.size === 0) {
                await interaction.editReply('No movies found in watchlist');
                return;
            }

            const scoredMovies = await calculateMovieScores(attendees, fetchedMessages);
            const screening = interaction.guild.channels.cache.find(ch => ch.name === CHANNELS.SCREENING);
            
            if (!screening) {
                await interaction.editReply('Screening channel not found');
                return;
            }

            const topMovies = scoredMovies
                .slice(0, 5)
                .map((movie, index) => `${index + 1}. ${movie.name} (Score: ${movie.score})`)
                .join('\n');

            await screening.send(`**Top 5 Movies for Current Squadron:**\n${topMovies}`);
            await interaction.editReply('Vote results have been posted!');

        } catch (error) {
            console.error('Error in stopTheVote command:', error);
            const response = interaction.deferred ? 
                interaction.editReply : interaction.reply;
            await response.call(interaction, 'Failed to process votes. Please try again later.');
        }
	},
};

async function calculateMovieScores(attendees, movies) {
    try {
        const REACTIONS = {
            FIRE: '🔥',
            POOP: '💩'
        };

        const scores = await Promise.all(movies.map(async movie => {
            try {
                const fireReactions = movie.reactions.cache.get(REACTIONS.FIRE);
                const poopReactions = movie.reactions.cache.get(REACTIONS.POOP);

                let fireCount = 0;
                let poopCount = 0;

                if (fireReactions?.count > 1) {
                    const fireUsers = await fireReactions.users.fetch();
                    fireCount = fireUsers.filter(user => attendees.includes(user.id)).size;
                }

                if (poopReactions?.count > 1) {
                    const poopUsers = await poopReactions.users.fetch();
                    poopCount = poopUsers.filter(user => attendees.includes(user.id)).size;
                }

                let name = 'Unknown Movie';
                if (movie.embeds?.[0]?.data?.description) {
                    name = movie.embeds[0].data.description.split('\n')[0];
                }

                return { name, score: fireCount - poopCount };
            } catch (error) {
                console.error('Error processing movie:', error);
                return { name: 'Error Processing Movie', score: -999 };
            }
        }));

        return scores
            .filter(movie => movie.score !== -999)
            .sort((a, b) => b.score - a.score);
    } catch (error) {
        console.error('Error calculating movie scores:', error);
        return [];
    }
}

async function getAttendees(interaction) {
    try {
        const screening = interaction.guild.channels.cache.find(
            ch => ch.name === CHANNELS.SCREENING
        );
        
        if (!screening) {
            throw new Error('Screening channel not found');
        }

        // Get today's date in CS locale
        const today = new Date().toLocaleDateString('cs-CZ');
        
        // Fetch only recent messages (last 20 should be enough)
        const fetchedMessages = await screening.messages.fetch({ limit: 20 });

        const currentVote = fetchedMessages.find(msg => 
            msg.author.id === interaction.client.user.id && 
            msg.content.includes(today)
        );

        if (!currentVote) {
            return [];
        }

        const reaction = currentVote.reactions.cache.get('👍');
        if (!reaction) return [];

        const users = await reaction.users.fetch();
        return users
            .filter(user => user.id !== interaction.client.user.id)
            .map(user => user.id);

    } catch (error) {
        console.error('Error getting attendees:', error);
        return [];
    }
}