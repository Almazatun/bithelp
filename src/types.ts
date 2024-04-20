export interface TonCXResponse {
	ok: boolean;
	result: RawTransaction[];
}

export interface TonCxType {
	"@type": string;
}

export interface MsgTxData extends TonCxType {
	text: string;
}

export interface RawMsg extends TonCxType {
	source: string;
	destination: string;
	value: string;
	fwd_fee: string;
	ihr_fee: string;
	created_lt: string;
	body_hash: string;
	msg_data: MsgTxData;
	message: string;
}

export interface RawTransaction extends TonCxType {
	address: unknown;
	utime: number;
	data: string;
	transaction_id: unknown;
	fee: string;
	storage_fee: string;
	other_fee: string;
	in_msg: RawMsg;
	out_msgs: unknown[];
}
