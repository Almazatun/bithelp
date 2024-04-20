import { CronJob } from "cron";
import { bitCheckTxs } from "./bit";

const cronTime = "*/3 * * * *"; //every 3 min

export async function runScheduler() {
	new CronJob(
		cronTime,
		async () => {
			await bitCheckTxs();
		},
		null,
		true,
		null,
		null,
		true
	);
}
