const { SlashCommandBuilder } = require("discord.js");
const { listAsciiNames, formatNameList } = require("../../asciiArt");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ascii-list")
    .setDescription("List every saved ASCII art name"),
  async execute(interaction) {
    await interaction.reply(formatNameList(listAsciiNames()));
  },
};
