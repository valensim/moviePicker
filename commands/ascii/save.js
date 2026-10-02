const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");
const {
  imageToAscii,
  saveAscii,
  normalizeName,
  NAME_PATTERN,
} = require("../../asciiArt");

const MAX_BYTES = 8 * 1024 * 1024;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ascii-save")
    .setDescription("Turn an image into ASCII art and save it under a name")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name used later to show this art")
        .setRequired(true)
        .setMaxLength(40),
    )
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("PNG, JPG, or GIF to convert")
        .setRequired(true),
    ),
  async execute(interaction) {
    const name = normalizeName(interaction.options.getString("name"));
    const attachment = interaction.options.getAttachment("image");

    if (!NAME_PATTERN.test(name)) {
      await interaction.reply({
        content: "Use a name with letters, numbers, and hyphens (up to 32 characters).",
        ephemeral: true,
      });
      return;
    }

    if (!attachment.contentType?.startsWith("image/")) {
      await interaction.reply({
        content: "Send an image file (PNG, JPG, or GIF).",
        ephemeral: true,
      });
      return;
    }

    if (attachment.size > MAX_BYTES) {
      await interaction.reply({
        content: "That image is too big. Send one under 8 MB.",
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const response = await axios.get(attachment.url, {
        responseType: "arraybuffer",
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
      });
      const art = await imageToAscii(Buffer.from(response.data));
      const saved = saveAscii(name, art);
      const verb = saved.replaced ? "Replaced" : "Saved";
      await interaction.editReply(`${verb} \`${saved.name}\`. Show it with \`/ascii\`.`);
    } catch (error) {
      console.error("ascii-save failed:", error);
      await interaction.editReply(
        "Could not turn that image into ASCII art. Send a PNG, JPG, or GIF.",
      );
    }
  },
};
