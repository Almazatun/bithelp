import { strict as assert } from "assert";
import { config } from "dotenv";

config();

const checkEnv = (envName: string) => {
	const env = process.env[envName];
	assert.notStrictEqual(env, undefined, `${envName} is not specified`);
	return env;
};

export const configs = {
	server: {
		port: process.env.PORT,
		apiKey: checkEnv("API_KEY"),
		bodyLimit: Number(process.env.BODY_LIMIT) || 20480, //20KB
		domain: process.env.DOMAIN || "",
	},
	dapp: {
		seed: checkEnv("SEED"),
		address: process.env.ADDRESS || "",
		key: checkEnv("KEY"),
	},
	bot: {
		apiKey: checkEnv("TG_BOT_API_KEY"),
		username: checkEnv("TG_BOT_USERNAME"),
	},
};
