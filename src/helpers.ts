import { AES, enc } from "crypto-js";

import { configs } from "./config";

export const isCorrectPayload = (txMsg: string) => /^\d+$/.test(txMsg);
const method = "getTransactions";
const bybitAccId = "EQDD8dqOzaj4zUK6ziJOo_G2lx6qf1TEktTRkFJ7T1c_fPQb";

export const rpcParams = () => {
	return {
		id: getID(),
		jsonrpc: "2.0",
		method,
		params: {
			// Bybit pub account in ton viewer | scan
			// https://tonviewer.com/EQDD8dqOzaj4zUK6ziJOo_G2lx6qf1TEktTRkFJ7T1c_fPQb
			address: bybitAccId,
			// limit tx every one min for check
			limit: 50,
			archival: false,
		},
	};
};
export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const msgTemplate = `
Hello 🤖, I'ma BitHelp bot.\n
There are guidelines on how you can return your TON coins.\n
https://github.com/Almazatun/bithelp\n
It will be good when you return your TON coins and help other people too.\n
This dapp app uses a transaction to NOTIFY people when they forget to include their IDENTIFICATION WALLET NUMBER when sending TON coins to Bybit, and this action is not free.\n
To help other people too you can send some TON coins to this dapp by address ${configs.dapp.address} to keep this dapp working and send notify transaction message to other people.
`;

export const encrypt = (str: string, key: string): string => {
	return AES.encrypt(str, key).toString();
};

export const decrypt = (str: string, key: string): string => {
	let bytes = AES.decrypt(str, key);
	return bytes.toString(enc.Utf8);
};

const getID = () => (Math.random() + 1).toString(36).substring(7);
