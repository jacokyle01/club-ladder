const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "users.json");

dotenv.config();
const url = "https://discord.com/channels/1201006010739990693";
const { Client } = require("discord.js");
const client = new Client({
	intents: [
		"DirectMessages",
		"GuildMembers",
		"Guilds",
		"GuildMessages",
		"MessageContent",
	],
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
		id: uid,
		standing: users.length + 1,
		streak: 0,
		challenging: [],
		challengedBy: [],
	};
	users.push(user);
	writeUsers(users);
}

function writeUsers(users) {
	fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
}

client.login(process.env.DISCORD_TOKEN);
client.on("messageCreate", async (message) => {
    const cid = '1201006010739990693';
    const channel = client.channels.cache.get(cid);

	console.log(message);
	const users = readUsers();

	//initialize user if necessary
	if (!users.find((user) => user.id == message.author.id)) {
		initializeUser(message.author.id);
	}

	if (message.content.startsWith("!")) {

        const users = readUsers();
        const me = users.find((user) => user.id == message.author.id);
		const command = message.content.split(" ").at(0).substring(1);
        const args = message.content.split(" ");
        args.shift();
        console.log(args);
		console.log(command);


		switch (command) {
			case "stats":
                channel.send(("Standing: " + me.standing + "\nStreak: " + me.streak));
				break;
            case "challenge":
            case "vs":
                channel.send("Challenging " + args[0]);
                break;
                
		}
	}
});
