const { SlashCommandBuilder } = require('discord.js');
const { CHANNELS } = require('../../config');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('presence')
		.setDescription('starts vote on the presence of the members')
		.addStringOption(option => 
			option.setName('date')
				.setDescription('Date for the screening (format: DD.MM.YYYY or DD/MM/YYYY)')
				.setRequired(false)),
	async execute(interaction) {

        // Find the right channel
        const screening = interaction.guild.channels.cache.find(ch => ch.name === CHANNELS.SCREENING);

        // Get the date parameter or use today's date
        const dateInput = interaction.options.getString('date');
        let displayDate;
        
        if (dateInput) {
            // Parse the input date and validate it
            const dateRegex = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/;
            const match = dateInput.match(dateRegex);
            
            if (!match) {
                await interaction.reply({ 
                    content: 'Invalid date format. Please use DD.MM.YYYY or DD/MM/YYYY (e.g., 25.12.2024)', 
                    ephemeral: true 
                });
                return;
            }
            
            const [, day, month, year] = match;
            const parsedDate = new Date(year, month - 1, day);
            
            // Validate that the date is valid
            if (isNaN(parsedDate.getTime()) || 
                parsedDate.getDate() !== parseInt(day) || 
                parsedDate.getMonth() !== parseInt(month) - 1) {
                await interaction.reply({ 
                    content: 'Invalid date. Please provide a valid date.', 
                    ephemeral: true 
                });
                return;
            }
            
            displayDate = parsedDate.toLocaleDateString('cs-CZ');
            const messageContent = `@everyone Dorazim na promitani (${displayDate})`;
        } else {
            displayDate = new Date().toLocaleDateString('cs-CZ');
            const messageContent = `@everyone Dorazim na dnesnipromitani (${displayDate})`;
        }
        
        const msg = await screening.send(messageContent);
        interaction.reply('Vote has started');


        // Add reactions for voting
        await msg.react('👍'); // Yes
        await msg.react('👎'); // No
	},
};