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
		port: 3000,
		apiKey: checkEnv("API_KEY"),
		bodyLimit: Number(process.env.BODY_LIMIT) || 20480, //20KB
	},
	dapp: {
		seed: checkEnv("SEED"),
	},
};
