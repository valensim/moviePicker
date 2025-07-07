require("dotenv").config(); //This will be used to store private keys
const path = require("path");
const fs = require("fs");
const deployCommands = require("./deploy/deployCommands");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");
const { ironic } = require("ironicase");

const BOT_TOKEN = process.env.CLIENT_TOKEN;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

//Register our commands
deployCommands();

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

const names = {
  zlakurwica: ['zlakurwica', 'milovník úvěrů', 'Darmoth'],
  mlik0: ['the whole fokin spectrum', 'arctic goblin', 'milovnik Vina Diesla', 'Mliko'],
  jory4619: ['Jory'],
  airsaltychips: ['Zdena', 'Mrazek'],
  johnythered: ['Anan', 'Johny']
}
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots (including itself)
  if (message.author.bot) return;

  const username = message.author.username.toLowerCase();

  // Check if message contains images (attachments or embeds with images)
  const hasImages = message.attachments.size > 0 || 
                   message.embeds.some(embed => embed.image || embed.thumbnail);

  if (hasImages) return;

  if (Math.random() < 0.069) {
    const ironicMessage = ironic(message.content);
    const channel = message.channel;
    
    // Check if the original message was a reply and if the referenced message still exists
    let replyToMessage = null;
    if (message.reference?.messageId) {
      try {
        replyToMessage = await channel.messages.fetch(message.reference.messageId);
      } catch (error) {
        console.log('Referenced message not found, sending as regular message');
      }
    }
    
    await message.delete();
    const name = names[username] ? names[username][Math.floor(Math.random() * names[username].length)] : username
    const content = name + ' tried to yap: \n' + ironicMessage;
    
    if (replyToMessage) {
      await replyToMessage.reply(content);
    } else {
      await channel.send(content);
    }
    return;
  }

  return;
});

client.login(BOT_TOKEN);

