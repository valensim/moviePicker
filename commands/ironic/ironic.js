const { SlashCommandBuilder } = require('discord.js');
const {ironic} = require('ironicase');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ironic')
		.setDescription('converts message into ironic case')
		.addStringOption(option => option.setName('text').setDescription('Text to convert').setRequired(true)),
	async execute(interaction) {
		try {
			// Defer the reply immediately to prevent timeout
			await interaction.deferReply();
			
			const text = interaction.options.getString('text');
			const ironicText = ironic(text);
			
			// Use editReply instead of reply since we deferred
			await interaction.editReply(ironicText);
		} catch (error) {
			console.error('Error in ironic command:', error);
			
			// Handle the response based on whether we successfully deferred
			const response = interaction.deferred ? 
				interaction.editReply : interaction.reply;
			
			try {
				await response.call(interaction, 'Failed to convert text. Please try again.');
			} catch (followUpError) {
				console.error('Failed to send error response:', followUpError);
			}
		}
	},
};