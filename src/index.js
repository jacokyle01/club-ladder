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

function initializeUser(users, uid) {
	const user = {
		id: uid,
		standing: users.length + 1,
		streak: 0,
		challenging: [],
		challengedBy: [],
		alias: "",
	};
	return user;
}

// function updateUser(userId, updatedData) {
// 	const index = users.findIndex((user) => user.id === userId);

// 	if (index !== -1) {
// 		users[index] = { ...users[index], ...updatedData };
// 		writeUsers(users);
// 	}
// }

function writeUsers(users) {
	fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
}

const prettyIds = (users, ids) => {
	let pretty = "";
	ids.forEach((id) => (pretty += " <@" + id + ">"));
	return pretty;
};

const findIndexById = (users, id) => users.findIndex((user) => user.id == id);
const userFromId = (users, id) => users.find((user) => user.id == id);

client.login(process.env.DISCORD_TOKEN);
client.on("messageCreate", async (message) => {
	const users = readUsers();
	const cid = "1201006010739990693";
	const channel = client.channels.cache.get(cid);
	// client.channels
	// 	.fetch(cid)
	// 	.then((channel) => channel.send("booyah!"));
	console.log("hi");
	//initialize user if necessary
	const senderId = message.author.id;
	console.log("sender ID " + senderId);
	if (findIndexById(users, senderId) == -1) {
		console.log("initializing");
		users.push(initializeUser(users, senderId));
	}
	console.log("USERS " + users);
	if (message.content.startsWith("!")) {
		let me = userFromId(users, senderId);
		console.log("ME" + me.challengedBy);
		const command = message.content.split(" ").at(0).substring(1);
		const args = message.content.split(" ");
		args.shift();
		console.log(args);
		console.log(command);

		switch (command) {
			case "stats":
				console.log("STATS");
				console.log(channel.id);
				channel.send(
					"Alias " +
						me.alias +
						"\nStanding: " +
						me.standing +
						"\nStreak: " +
						me.streak +
						"\nChallenging: " +
						prettyIds(users, me.challenging) +
						"\nChallenged by " +
						prettyIds(users, me.challengedBy)
				);
				console.log("hi sher");
				break;
			case "challenge": // ex. !challenge @Presiident
			case "vs":
				//assume usage is "!challenge @[username] and username is initialized"
				const numbers = args[0].match(/\d+/g);
				//TODO null safety here
				const challengeeId = numbers[0];
				let challengee = userFromId(users, challengeeId);

				//don't challenge the same person twice
				if (me.challenging.includes(challengeeId)) {
					channel.send("You are already challenging this person");
					break;
				}

				channel.send("⚔️  Challenging " + args[0] + " ⚔️");
				//update challenger and challengee
				users[findIndexById(users, me.id)] = {
					...me,
					challenging: [...me.challenging, challengeeId],
				};

				users[findIndexById(users, challengeeId)] = {
					...challengee,
					challenged: [...challengee.challengedBy, me.id],
				};
				console.log(challengee);
				break;

			case "alias":
				if (args[0]) {
					users[findIndexById[senderId]] = {
                        ...me, 
                        alias: args[0]
                    }
				}
				break;
		}
	}
	writeUsers(users);
});
