const dotenv = require('dotenv');
dotenv.config();

const { Client } = require('discord.js');
const client = new Client({
    intents: [
        'DirectMessages',
        'GuildMembers',
        'Guilds',
        'GuildMessages'
    ]
})

client.login(process.env.DISCORD_TOKEN);
client.on("messageCreate", async (message) => {
    console.log(message);
});