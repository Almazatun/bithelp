import fastify from "fastify";

import { runScheduler } from "./scheduler";
import { configs } from "./config";

const app = fastify({
	bodyLimit: configs.server.bodyLimit,
});

app.get("/health_check", async (req, res) => {
	res.code(200).send("Hey i'm alive ✅");
});

app.listen({ port: configs.server.port }, async (err, address) => {
	if (err) {
		console.error(err);
		process.exit(1);
	}
	console.log(`Server listening at ${address}`);
	await runScheduler();
});
