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

const getID = () => (Math.random() + 1).toString(36).substring(7);
