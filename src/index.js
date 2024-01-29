const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "users.json");
const mongoose = require("mongoose");
const User = require("./user");

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

function writeUsers(users) {
	fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");
}

const prettyIds = (ids) => {
	let pretty = "";
	ids.forEach((id) => (pretty += " <@" + id + ">"));
	return pretty;
};

const findIndexById = (users, id) => users.findIndex((user) => user.id == id);
const userFromId = (users, id) => users.find((user) => user.id == id);

async function tryInitializeId(userId) {
	console.log("trying");
	const user = await User.findOne({ id: userId });
	if (user == null) {
		const count = await User.countDocuments({});
		const me = new User({
			id: userId,
			standing: count + 1,
			alias: "",
			challenging: [],
			challengedBy: [],
            wins: 0,
            losses: 0
		});
		await me.save();
	}
	return false;
}

mongoose.connect(process.env.DATABASE_URL, { useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", () => console.log("Connected to Database"));

client.login(process.env.DISCORD_TOKEN);

client.on("messageCreate", async (message) => {
	if (message?.author.bot) {
		return;
	}

	const cid = "1201006010739990693";
	const botid = "1201005650885488690";
	const channel = client.channels.cache.get(cid);

	console.log("AUTHOR ID " + message.author.id);
	await tryInitializeId(message.author.id);
	console.log("well");
	channel.send("always");
	if (message.content.startsWith("!")) {
		console.log(message);
		let me = await User.findOne({ id: message.author.id });
		console.log("ME" + me.challengedBy);
		const command = message.content.split(" ").at(0).substring(1);
		const args = message.content.split(" ");
		args.shift();
		console.log(args);
		console.log(command);

		switch (command) {
			case "stats":
				console.log(channel.id);
				channel.send(
					"Alias: " +
						me.alias +
						"\nStanding: " +
						me.standing +
						"\nStreak: " +
						me.streak +
						"\nChallenging: " +
						prettyIds(me.challenging) +
						"\nChallenged by " +
						prettyIds(me.challengedBy) +
                        "\nW/L ratio: " + me.wins + "/" + me.losses
				);
				break;

			case "alias":
				if (args.length > 0) {
					me.alias = args[0];
					await me.save();
				}
				break;
			case "challenge": // ex. !challenge @Presiident
			case "vs":
				if (message.mentions.users.at(0) == undefined) break;
				const challengeeId = message.mentions.users.at(0).id;
				if (challengeeId == botid) {
					channel.send("You can't challenge the robot!");
					break;
				}
				if (challengeeId == me.id) {
					channel.send("You can't challenge yourself!");
					break;
				}

				console.log("VS. " + challengeeId);
				await tryInitializeId(challengeeId);

				const challengee = await User.findOne({ id: challengeeId });
				console.log(challengee);

				//TODO more conditions
				if (me.challenging.includes(challengeeId)) {
					channel.send("You are already challenging this person");
					break;
				}

				//all conditions tested, initiate challenge
				me.challenging.push(challengeeId);
				challengee.challengedBy.push(me.id);
				await me.save();
				await challengee.save();
				channel.send("Challenge sent!");
				break;
			case "win":
            case "w":
				if (message.mentions.users.at(0) == undefined) break;
				const opponentId = message.mentions.users.at(0).id;
				//find who was the challenger and challengee

				//challenger won
				if (me.challenging.includes(opponentId)) {
					const opponent = await User.findOne({ id: opponentId });

					//swap standings for now TODO
					let temp = me.standing;
					me.standing = opponent.standing;
					opponent.standing = temp;

					//assign streaks
					me.streak++;
					opponent.streak = 0;

                    //assign W/L
                    me.wins++;
                    opponent.losses++;

                    //remove this challenge attribute
                    me.challenging = me.challenging.filter(opponent => opponent != opponentId);
                    opponent.challengedBy = opponent.challengedBy.filter(challenger => challenger != me.id);

                    await me.save();
                    await opponent.save();
                    channel.send("🎉Congratulations! You beat <@" + opponentId + ">🎉");
				}
                break;
            case "standings":
            case "lb":
                let lb = "";
                const users = await User.find({});
                users.sort((u1, u2) => u1.standing - u2.standing);
                users.forEach(user => {
                    lb += `${user.standing}\t<@${user.id }>\twins: ${user.wins}, losses: ${user.losses}\n`
                })
                channel.send(lb);

		}
	}
});
