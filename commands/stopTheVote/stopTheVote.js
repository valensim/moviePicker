const { SlashCommandBuilder } = require('discord.js');

//testing
//const screeningChannel = 'screeningtest';
//const watchlistChannel = 'backlog';

//prod
const screeningChannel = 'screening';
const watchlistChannel = 'watch-list';



module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop-the-vote')
		.setDescription('gets the top 5 movies from the watchlist based on attendees votes'),
	async execute(interaction) {
        const atendies = await getAttendies(interaction);
        if (atendies.size === 0) {
            interaction.reply('No votes has been casted yet');
            return;
        }

        const watchlist = interaction.guild.channels.cache.find(ch => ch.name === watchlistChannel);
        if (!watchlist) {
            interaction.reply('No watchlist');
            return;
        }

        const fetchedMessages = await watchlist.messages.fetch({ limit: 100 });

        if (fetchedMessages.size === 0) {
            interaction.reply('No movies found in watchlist');
            return;
        }
        interaction.reply('Calculating movie scores...');

        const scoredMovies = await calculateMovieScores(atendies, fetchedMessages);

        // post top 3 movies to the screening channel
        const screening = interaction.guild.channels.cache.find(ch => ch.name === screeningChannel);
        if (!screening) {
            return;
        }
        
        const topMovies = scoredMovies.slice(0, 5).map(movie => `${movie.name} (Score: ${movie.score})`).join('\n'); 
        screening.send(`The top 5 movies for current squadron: \n ${topMovies}`);
	},
};

async function calculateMovieScores(attendees, movies) {
    const fireEmoji = '🔥';
    const poopEmoji = '💩';

    const scores = await Promise.all(movies.map(async movie => {
        const fireReactions = movie.reactions.cache.get(fireEmoji);
        const poopReactions = movie.reactions.cache.get(poopEmoji);

        let fireCount = 0;
        let poopCount = 0;

        // after changes to the positng in new channel it will have to check if the count is greater than 1 to ignore the bot
        if (fireReactions.count > 1) {
            const fireUsers = await fireReactions.users.fetch();
            fireCount = fireUsers.filter(user => attendees.includes(user.id)).size;
        }

        if (poopReactions.count > 1) {
            const poopUsers = await poopReactions.users.fetch();
            poopCount = poopUsers.filter(user => attendees.includes(user.id)).size;
        }

        const score = fireCount - poopCount;

       // Check if the message has embeds and get the first line of the description
       let name = 'Unknown';
       if (movie.embeds && movie.embeds.length > 0) {
           const description = movie.embeds[0].data.description;
           name = description.split('\n')[0];
       }

       return { name, score };
    }));

    // Sort the movies by score
    scores.sort((a, b) => b.score - a.score);
    return scores;
}



async function getAttendies(interaction){
    const screening = interaction.guild.channels.cache.find(ch => ch.name === screeningChannel);
    if (!screening) {
        interaction.reply('No screeningtest channel found');
        return;
    }

    // Fetch the latest 100 messages from the channel
    // room for optimisation here find from what end does the fetch go 100 seems bit too much
    const fetchedMessages = await screening.messages.fetch({ limit: 100 });

    // Filter messages to find the newest one from the bot that contains the votes
    const votings = fetchedMessages.filter(msg => 
        msg.author.id === interaction.client.user.id && 
        msg.content.includes("Dorazim na dnesni promitani")
    );
    const currentVote = votings.first();

    if (!currentVote) {
        throw new Error('no votes found');
    }

    const reaction = currentVote.reactions.cache.get('👍');
    const users = await reaction.users.fetch();
    const attendees = users
    .filter(user => user.id !== interaction.client.user.id)
    .map(user => user.id);

    return attendees;
}