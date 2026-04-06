const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

const TOKEN = "PASTE_YOUR_BOT_TOKEN";
const CLIENT_ID = "PASTE_CLIENT_ID";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});

// Load data
let savedMessages = {};
if (fs.existsSync('./data.json')) {
  savedMessages = JSON.parse(fs.readFileSync('./data.json'));
}

// Save function
function saveData() {
  fs.writeFileSync('./data.json', JSON.stringify(savedMessages, null, 2));
}

// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('save')
    .setDescription('Save a message')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Name of the message')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Message content')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a saved message')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Saved message name')
        .setRequired(true)),

  new SlashCommandBuilder()
    .setName('list')
    .setDescription('List your saved messages'),

  new SlashCommandBuilder()
    .setName('delete')
    .setDescription('Delete a saved message')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Message name')
        .setRequired(true)),
];

// Register commands
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands },
    );
    console.log('Commands registered');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const userId = interaction.user.id;

  if (!savedMessages[userId]) {
    savedMessages[userId] = {};
  }

  // SAVE
  if (interaction.commandName === 'save') {
    const name = interaction.options.getString('name');
    const text = interaction.options.getString('text');

    savedMessages[userId][name] = text;
    saveData();

    await interaction.reply({ content: `Saved as "${name}"`, ephemeral: true });
  }

  // SAY
  if (interaction.commandName === 'say') {
    const name = interaction.options.getString('name');
    const msg = savedMessages[userId][name];

    if (!msg) {
      return interaction.reply({ content: 'Not found', ephemeral: true });
    }

    await interaction.reply(msg);
  }

  // LIST
  if (interaction.commandName === 'list') {
    const userData = savedMessages[userId];

    if (!userData || Object.keys(userData).length === 0) {
      return interaction.reply({ content: 'No saved messages', ephemeral: true });
    }

    const list = Object.keys(userData).join(', ');
    await interaction.reply({ content: `Your messages: ${list}`, ephemeral: true });
  }

  // DELETE
  if (interaction.commandName === 'delete') {
    const name = interaction.options.getString('name');

    if (!savedMessages[userId][name]) {
      return interaction.reply({ content: 'Not found', ephemeral: true });
    }

    delete savedMessages[userId][name];
    saveData();

    await interaction.reply({ content: `Deleted "${name}"`, ephemeral: true });
  }
});

client.login(TOKEN);
