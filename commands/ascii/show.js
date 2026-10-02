const { SlashCommandBuilder } = require("discord.js");
const { getAscii, formatReply, normalizeName, NAME_PATTERN } = require("../../asciiArt");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ascii")
    .setDescription("Show a saved ASCII art image by name")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name given when the image was saved")
        .setRequired(true)
        .setMaxLength(40),
    ),
  async execute(interaction) {
    const name = normalizeName(interaction.options.getString("name"));

    if (!NAME_PATTERN.test(name)) {
      await interaction.reply({
        content: "Use a name with letters, numbers, and hyphens (up to 32 characters).",
        ephemeral: true,
      });
      return;
    }

    const art = getAscii(name);
    if (!art) {
      await interaction.reply(`No ASCII art saved as \`${name}\`.`);
      return;
    }

    await interaction.reply(formatReply(name, art));
  },
};
