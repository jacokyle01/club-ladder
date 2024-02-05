const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "users.json");
const mongoose = require("mongoose");
const User = require("./user");

dotenv.config();
const url = process.env.URL;
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

function isEqual(obj1, obj2) {
	return obj1.toString() === obj2.toString();
}

const handleResult = async (challenger, result, challengee) => {
	//resolve pending challenges

	//cast to string for long comparison ~~~
	challenger.challenging = challenger.challenging.filter(
		(opponent) => !isEqual(opponent, challengee.id)
	);

	challengee.challengedBy = challengee.challengedBy.filter(
		(opponent) => !isEqual(opponent, challenger.id)
	);

	switch (result) {
		case "defeated":
			//streaks
			challenger.streak++;
			challengee.streak = 0;

			//WL
			challenger.wins++;
			challengee.losses++;

			//challenger takes challengee's standing, all in-between move down
			const challengeeStanding = challengee.standing;
			// console.log("challenge standing" + challengee.standing);
			// console.log("challenger " + challenger.standing);
			// console.log("challengee" + challengee.standing);
			const passed = await User.find({
				standing: { $lt: challenger.standing, $gte: challengee.standing },
			});
			passed.forEach((passedUser) => {
				passedUser.standing++;
				passedUser.save();
			});

			challenger.standing = challengeeStanding;

			//TODO update "immunity"/etc...
			break;

		case "lost to":
			//streaks
			challenger.streak = 0;
			challengee.streak++;

			//WL
			challengee.wins++;
			challenger.losses++;

			//standings don't change
			break;
	}
	await challenger.save();
	await challengee.save();
};

const prettyIds = (ids) => {
	let pretty = "";
	ids.forEach((id) => (pretty += " <@" + id + ">"));
	return pretty;
};

async function tryInitializeId(userId) {
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
			losses: 0,
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

	await tryInitializeId(message.author.id);
	channel.send("always");
	if (message.content.startsWith("!")) {
		console.log("~~~~~~~~~~~~~~~~~~~~~");
		let me = await User.findOne({ id: message.author.id });
		const command = message.content.split(" ").at(0).substring(1);
		const args = message.content.split(" ");
		args.shift();

		switch (command) {
			case "stats":
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
						"\nW/L ratio: " +
						me.wins +
						"/" +
						me.losses
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

				await tryInitializeId(challengeeId);

				const challengee = await User.findOne({ id: challengeeId });

				//TODO more conditions
				if (me.challenging.includes(challengeeId)) {
					channel.send("You are already challenging this person");
					break;
				}

				if (me.standing < challengee.standing) {
					channel.send(
						"You must challenge someone higher ranked than yourself!"
					);
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

				//challenger reporting a win
				if (me.challenging.includes(opponentId)) {
					const challengee = await User.findOne({ id: opponentId });
					await handleResult(me, "defeated", challengee);
					channel.send("🎉Congratulations! You beat <@" + opponentId + ">🎉");
				}

				//challengee reporting a win
				if (me.challengedBy.includes(opponentId)) {
					const challenger = await User.findOne({ id: opponentId });
					await handleResult(challenger, "lost to", me);
					channel.send("🎉Congratulations! You beat <@" + opponentId + ">🎉");
				}
				break;
			case "lose":
			case "l":
				if (message.mentions.users.at(0) == undefined) break;
				const opponentsId = message.mentions.users.at(0).id;

				//challenger reporting a loss
				if (me.challenging.includes(opponentsId)) {
					const challengee = await User.findOne({ id: opponentsId });
					await handleResult(me, "lost to", challengee);
					channel.send("You lost to <@" + opponentsId + ">");
				}

				//challengee reporting a loss
				if (me.challengedBy.includes(opponentsId)) {
					const challenger = await User.findOne({ id: opponentsId });
					await handleResult(challenger, "defeated", me);
					channel.send("You lost to <@" + opponentsId + ">");
				}
				break;

			case "standings":
			case "lb":
				let lb = "";

				const users = await User.find({});
				users.sort((u1, u2) => u1.standing - u2.standing);
				users.forEach((user) => {
					lb += `${user.standing}\t<@${user.id}>\t${user.wins}/${user.losses}\n`;
				});
				channel.send(lb);
			case "cancel":
			case "cc":
				if (message.mentions.users.at(0) == undefined) break;
				const enemyId = message.mentions.users.at(0).id;
				const enemy = await User.findOne({ id: enemyId });

				if (!enemy) break;
				//remove challenge

				me.challenging = me.challenging.filter(
					(someId) => !isEqual(someId, enemyId)
				);

				enemy.challengedBy = enemy.challengedBy.filter(
					(someId) => !isEqual(someId, me.id)
				);

				await me.save();
				await enemy.save();
				break;
		}
	}
});
