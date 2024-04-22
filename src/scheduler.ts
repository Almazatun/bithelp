import { CronJob } from "cron";
import { txsListener } from "./bit";

const cronTime = "*/3 * * * *"; //every 3 min

export async function runScheduler() {
	new CronJob(
		cronTime,
		async () => {
			await txsListener();
		},
		null,
		true,
		null,
		null,
		true
	);
}
