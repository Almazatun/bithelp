import fetch from "node-fetch";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "@ton/crypto";
import {
	TonClient,
	WalletContractV4,
	fromNano,
	internal,
	toNano,
} from "@ton/ton";
import BigNumber from "bignumber.js";

import { isCorrectPayload, rpcParams, sleep, decrypt } from "./helpers";
import { CurrTxData, RawTransaction, TonCXResponse } from "./types";
import { configs } from "./config";

// https://testnet.toncenter.com/api/v2/jsonRPC
const toncenterUrl = "https://toncenter.com/api/v2/jsonRPC";

const opt = {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(rpcParams()),
};
const txMap = new Map<string, string>();

export async function txsListener() {
	let listTxWithIncorrectPayload: RawTransaction[] = [];

	const response = await fetch(toncenterUrl, opt);
	const resData = (await response.json()) as TonCXResponse;
	const isCorrectResponse = "result" in resData && resData.result.length > 1;

	if (isCorrectResponse) {
		// list transaction with incorrect payload
		listTxWithIncorrectPayload = resData.result.filter(
			(tx) =>
				"message" in tx.in_msg &&
				tx.in_msg.msg_data["@type"] === "msg.dataText" &&
				!isCorrectPayload(tx.in_msg.message.replace("\n", "")) &&
				tx.in_msg.message.replace("\n", "").length === 8 &&
				tx.transaction_id["@type"] === ""
		);
	} else {
		return;
	}

	if (listTxWithIncorrectPayload.length == 0) return;

	let currTx: CurrTxData = {
		data: listTxWithIncorrectPayload[0],
		date: new Date(listTxWithIncorrectPayload[0].utime),
	};

	for (const txData of listTxWithIncorrectPayload) {
		let date = new Date(txData.utime);

		if (
			currTx.date! < date &&
			txData.in_msg.source !== currTx.data!.in_msg.source
		) {
			currTx.data = txData;
			currTx.date = new Date(txData.utime);
		}
	}

	if (!currTx.data) {
		return;
	}

	if (!txMap.has(currTx.data.in_msg.source)) {
		txMap.set(currTx.data.in_msg.source, currTx.data.in_msg.source);
	} else {
		return;
	}

	console.log(`${new Date()} Current Tx data\n`, currTx.data);

	// "testnet" | "mainnet"
	const endpoint = await getHttpEndpoint({ network: "mainnet" });
	const client = new TonClient({ endpoint });
	const key = await mnemonicToWalletKey(
		decrypt(configs.dapp.seed!, configs.dapp.key!).split(" ")
	);
	const wallet = WalletContractV4.create({
		publicKey: key.publicKey,
		workchain: 0,
	});

	// make sure wallet is deployed
	if (!(await client.isContractDeployed(wallet.address))) {
		console.log("Dapp is not deployed");
		return;
	}

	const walletContract = client.open(wallet);
	const seqno = await walletContract.getSeqno();

	const balance = await client.getBalance(wallet.address);
	const isEnoughBalance = new BigNumber(fromNano(balance)).isGreaterThan(
		"0.0011"
	);

	if (!isEnoughBalance && currTx.data !== null) {
		console.log(`${new Date()} Not enough balance ${fromNano(balance)}`);
		return;
	}

	const msgAmount = toNano("0.0001"); // 0.0001 TON
	await walletContract.sendTransfer({
		secretKey: key.secretKey,
		seqno: seqno,
		messages: [
			internal({
				to: currTx.data.in_msg.source,
				value: msgAmount,
				body: `To return your TON coins for free, send a message to the bot ${configs.bot.username}`, // optional comment
				bounce: false,
			}),
		],
	});

	// wait until confirmed
	let currentSeqno = seqno;
	while (currentSeqno == seqno && currTx.data !== null) {
		console.log(
			`${new Date()}\nwaiting for transaction to confirm... | DESTINATION -> ${
				currTx.data.in_msg.source
			}`
		);
		await sleep(1500);
		currentSeqno = await walletContract.getSeqno();
	}
	console.log(`${new Date()}\nTransaction confirmed`);
	currTx.data = null;
	currTx.date = null;

	// Check map size
	if (txMap.size > 500) {
		txMap.clear();
	}

	return;
	// Can't use (for loop) for bellow reason
	// https://github.com/toncenter/ton-wallet/issues/196
}
