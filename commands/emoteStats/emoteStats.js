const { SlashCommandBuilder } = require("discord.js");
const { getDb } = require("../../emoteTracker");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("emote-stats")
        .setDescription("Shows the most used emotes")
        .addIntegerOption((opt) =>
            opt
                .setName("limit")
                .setDescription("Number of emotes to show (default: 10)")
                .setMinValue(1)
                .setMaxValue(25)
        ),
    async execute(interaction) {
        const limit = interaction.options.getInteger("limit") ?? 10;
        const db = getDb();

        if (!db || Object.keys(db).length === 0) {
            await interaction.reply("No emote data yet! Start using some emotes!");
            return;
        }

        const sorted = Object.values(db)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);

        const lines = sorted.map((e, i) => {
            const display = e.isCustom
                ? `<${e.isAnimated ? "a" : ""}:${e.name}:${e.id}>`
                : e.name;
            return `${i + 1}. ${display} — **${e.count}**`;
        });

        await interaction.reply(`📊 **Top ${limit} Emotes**\n\n${lines.join("\n")}`);
    },
};
