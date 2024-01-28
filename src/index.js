const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "users.json");
dotenv.config();

const { Client } = require("discord.js");
const client = new Client({
	intents: ["DirectMessages", "GuildMembers", "Guilds", "GuildMessages"],
});

function readUsers() {
	try {
		const data = fs.readFileSync(filePath, "utf8");
		return JSON.parse(data);
	} catch (error) {
		return [];
	}
}

function initializeUser(uid) {
	const users = readUsers();
    const user = {
        "id": uid,
        "standing": -1,
        "streak": 0,
        challenging: [],
        challengedBy: []
    }
    users.push(user);
	writeUsers(users);
}

function writeUsers(users) {
	fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
}

client.login(process.env.DISCORD_TOKEN);
client.on("messageCreate", async (message) => {
	console.log(message);
    const users = readUsers();
    //initialize user if necessary
    if (!users.find(user => user.id == message.author.id)) {
        initializeUser(message.author.id);
    }

});
