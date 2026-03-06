const { SlashCommandBuilder } = require("discord.js");
const { getDb } = require("../../emoteTracker");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("emote-trial")
        .setDescription("Tribal council — vote to eliminate the least used custom emote")
        .addIntegerOption((opt) =>
            opt
                .setName("candidates")
                .setDescription("Number of emotes put on trial (default: 5)")
                .setMinValue(2)
                .setMaxValue(10)
        ),
    async execute(interaction) {
        await interaction.deferReply();

        const db = getDb();
        const guildEmojis = await interaction.guild.emojis.fetch();
        const guildEmojiIds = new Set(guildEmojis.map((e) => e.id));

        const limit = interaction.options.getInteger("candidates") ?? 5;

        const candidates = Object.values(db)
            .filter((e) => e.isCustom && guildEmojiIds.has(e.id))
            .sort((a, b) => a.count - b.count)
            .slice(0, limit);

        if (candidates.length < 2) {
            await interaction.editReply("Not enough tracked custom emotes to hold a trial! Use some emotes first.");
            return;
        }

        const lines = candidates.map((e) => {
            const display = `<${e.isAnimated ? "a" : ""}:${e.name}:${e.id}>`;
            return `${display} — used **${e.count}** time${e.count !== 1 ? "s" : ""}`;
        });

        const content = [
            "🔥 **TRIBAL COUNCIL** 🔥",
            "",
            "React with the emote you want eliminated.",
            "The emote with the most votes will be cast out.",
            "",
            lines.join("\n"),
        ].join("\n");

        await interaction.editReply(content);
        const trialMessage = await interaction.fetchReply();

        for (const e of candidates) {
            await trialMessage.react(`${e.name}:${e.id}`);
        }
    },
};
