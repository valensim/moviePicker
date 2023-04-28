const axios = require('axios');
const { SlashCommandBuilder } = require('discord.js');


module.exports = {
	data: new SlashCommandBuilder()
		.setName('meme')
		.setDescription('Sends a random meme'),
	async execute(interaction) {
        const res = await axios.get('https://meme-api.com/gimme/1');
        if (res.data.memes[0].url){
            interaction.reply(res.data.memes[0].url);
        }
        else{
            interaction.reply("No meme found :(");
        }
	},
};