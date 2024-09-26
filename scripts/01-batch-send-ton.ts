import { keyPairFromSecretKey } from '@ton/crypto';
import { TonClient, comment, internal, OutActionSendMsg, SendMode } from '@ton/ton';
import { APIV2Endpoints, HighloadWalletV3Helper, HighloadWalletV3QueryId } from '../src';

import { config } from 'dotenv';
config();

function getWalletAddress(publicKey: Buffer, subwalletId: number) {
  const highloadWalletV3Helper = new HighloadWalletV3Helper(publicKey, subwalletId);

  return highloadWalletV3Helper.address.toString();
}

async function getTonClient() {
  const tonClient = new TonClient({
    endpoint: APIV2Endpoints.TONCENTER_TESTNET,
    apiKey: process.env.TONCENTER_TESTNET_API_KEY,
  });

  return tonClient;
}

!(async function start() {
  const demoData = {
    secretKey: process.env.WALLET_SECRET_KEY || '',
    subwalletId: 1024,
  };
  const keypair = keyPairFromSecretKey(Buffer.from(demoData.secretKey, 'hex'));

  // 1. Get highload wallet address
  const address = getWalletAddress(keypair.publicKey, demoData.subwalletId);
  console.log(address);

  // 2. Deposit to highload wallet - Manual Deposit

  // 3. Send tokens to customers
  const highloadWalletV3Helper = new HighloadWalletV3Helper(keypair.publicKey, demoData.subwalletId);
  const tonClient = await getTonClient();

  const outMsgs: OutActionSendMsg[] = [
    {
      type: 'sendMsg',
      mode: SendMode.PAY_GAS_SEPARATELY,
      outMsg: internal({
        to: '0QDhAkNwnl4a1Djk9hdFsR7LPRTQenB2Jd6AkltcrsN9x_8A',
        value: '0.01',
        body: comment('t-1'),
      }),
    },
    {
      type: 'sendMsg',
      mode: SendMode.NONE,
      outMsg: internal({
        to: '0QDhAkNwnl4a1Djk9hdFsR7LPRTQenB2Jd6AkltcrsN9x_8A',
        value: '0.02',
        body: comment('t-2'),
      }),
    },
  ];
  // Notice: Need increase query id for each batch send
  const queryId = HighloadWalletV3QueryId.fromQueryId(BigInt(1));
  const res = await highloadWalletV3Helper.sendBatch(tonClient, keypair.secretKey, outMsgs, queryId);
  console.log(res);
})();
