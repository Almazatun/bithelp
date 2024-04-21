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

import { isCorrectPayload, rpcParams, sleep } from "./helpers";
import { RawTransaction, TonCXResponse } from "./types";
import { configs } from "./config";

// https://testnet.toncenter.com/api/v2/jsonRPC
const toncenterUrl = "https://toncenter.com/api/v2/jsonRPC";

const opt = {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(rpcParams()),
};
const txMap = new Map<string, string>();

export async function bitCheckTxs() {
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
				!isCorrectPayload(tx.in_msg.message)
		);

		if (listTxWithIncorrectPayload.length == 0) return;
	} else {
		return;
	}

	let currTx: RawTransaction = listTxWithIncorrectPayload[0];
	let currTxDate = new Date(currTx.utime);

	for (const txData of listTxWithIncorrectPayload) {
		let date = new Date(txData.utime);

		if (
			currTxDate < date &&
			txData.in_msg.source !== currTx.in_msg.source &&
			!txMap.has(txData.in_msg.source)
		) {
			currTx = txData;
			currTxDate = new Date(txData.utime);
		}
	}

	if (!currTx) {
		return;
	}

	txMap.set(currTx.in_msg.source, currTx.in_msg.source);

	// "testnet" | "mainnet"
	const endpoint = await getHttpEndpoint({ network: "testnet" });
	const client = new TonClient({ endpoint });
	const key = await mnemonicToWalletKey(configs.dapp.seed!.split(" "));
	const wallet = WalletContractV4.create({
		publicKey: key.publicKey,
		workchain: 0,
	});

	// make sure wallet is deployed
	if (!(await client.isContractDeployed(wallet.address))) {
		console.log("wallet is not deployed");
		return;
	}

	const walletContract = client.open(wallet);
	const seqno = await walletContract.getSeqno();

	const balance = await client.getBalance(wallet.address);
	const isEnoughBalance = new BigNumber(fromNano(balance)).isGreaterThan(
		"0.0011"
	);

	if (!isEnoughBalance) {
		console.log(`Not enough balance ${fromNano(balance)}`);
		return;
	}

	const msgAmount = toNano("0.0001"); // 0.0001 TON
	await walletContract.sendTransfer({
		secretKey: key.secretKey,
		seqno: seqno,
		messages: [
			internal({
				to: currTx.in_msg.source,
				value: msgAmount,
				// TODO
				body: "_", // optional comment
				bounce: false,
			}),
		],
	});

	// wait until confirmed
	let currentSeqno = seqno;
	while (currentSeqno == seqno) {
		console.log("waiting for transaction to confirm...");
		await sleep(1500);
		currentSeqno = await walletContract.getSeqno();
	}
	console.log("transaction confirmed!");

	// Check map size
	if (txMap.size > 100) {
		txMap.clear();
	}

	return;
	// Can't use (for loop) for bellow reason
	// https://github.com/toncenter/ton-wallet/issues/196
}
