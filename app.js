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

const darmothNames = ['zlakurwica', 'milovník úvěrů', 'darmoth'];
// Handle replies to specific users
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots (including itself)
  if (message.author.bot) return;

  const username = message.author.username.toLowerCase();

  if (username === 'zlakurwica') {
    const ironicMessage = ironic(message.content);
    const channel = message.channel;
    await message.delete();
    const name = darmothNames[Math.floor(Math.random() * darmothNames.length)];
    await channel.send( name + ' tried to yap: \n' + ironicMessage);
    return;
  }

  return;
  
  // Check if this user has custom responses
  // for (const [user, responses] of Object.entries(userResponses)) {
  //   if (username.includes(user.toLowerCase())) {
  //     // Pick a random response from the user's response array
  //     const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
  //     try {
  //       await message.reply(randomResponse);
  //       console.log(`Replied to ${message.author.username}: "${randomResponse}"`);
  //     } catch (error) {
  //       console.error('Error replying to user message:', error);
  //     }
  //     break; // Only respond once per message
  //   }
  // }
});

client.login(BOT_TOKEN);

