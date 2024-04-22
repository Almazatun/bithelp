import express from "express";
import cors from "cors";

import { runScheduler } from "./scheduler";
import { configs } from "./config";
import { bot } from "./bot";
import { decrypt, msgTemplate } from "./helpers";

const app = express();

app.use(express.json({ limit: configs.server.bodyLimit }));
app.use(cors());

// Set the bot API endpoint
// app.use(await bot.createWebhook({ domain: webhookDomain }));

app.get("/health_check", async (req, res) => {
	res.status(200).send("Hey I'm alive 🤖");
});

bot.start((ctx) => ctx.reply(msgTemplate));

app
	.listen({ port: configs.server.port }, async () => {
		console.log(`Server listening ${configs.server.port}`);
		await runScheduler();
		bot.launch();
	})
	.on("error", (error) => {
		throw new Error(error.message);
	});
