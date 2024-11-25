const { SlashCommandBuilder } = require('discord.js');
const {ironic} = require('ironicase');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('ironic')
		.setDescription('converst message into ironic case')
        .addStringOption(option => option.setName('text').setDescription('Text to convert').setRequired(true)),
	async execute(interaction) {
        const text = interaction.options.getString('text');
        const ironicText = ironic(text);
        interaction.reply(ironicText);
	},
};