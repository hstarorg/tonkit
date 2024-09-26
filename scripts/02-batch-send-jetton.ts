import { keyPairFromSecretKey } from '@ton/crypto';
import { TonClient, comment, internal, OutActionSendMsg, SendMode, Address, serializeTuple } from '@ton/ton';
import {
  APIV2Endpoints,
  createSimpleJettonTransferMessageWithComment,
  getAccountJettonWallet,
  HighloadWalletV3Helper,
  HighloadWalletV3QueryId,
} from '../src';

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
  const senderAddress = getWalletAddress(keypair.publicKey, demoData.subwalletId);
  console.log(senderAddress);

  // 2. Deposit jetton to highload wallet - Manual Deposit

  // 3. Send tokens to customers
  const highloadWalletV3Helper = new HighloadWalletV3Helper(keypair.publicKey, demoData.subwalletId);
  const tonClient = await getTonClient();

  const to = Address.parse('0QDhAkNwnl4a1Djk9hdFsR7LPRTQenB2Jd6AkltcrsN9x_8A');
  const jettonMaster = 'kQCa2efoPKIq7gdpcGZQliz5yxT566m9pKg_pOhH__G5KMCd'; // testnet bitcoin
  const senderJettonWalletAddress = await getAccountJettonWallet(tonClient, jettonMaster, senderAddress);

  console.log(`
sender address: ${senderAddress.toString()}
jetton wallet address: ${senderJettonWalletAddress.toString()}   
`);

  const outMsgs: OutActionSendMsg[] = [
    {
      type: 'sendMsg',
      mode: SendMode.PAY_GAS_SEPARATELY,
      outMsg: internal({
        to: senderJettonWalletAddress,
        value: '0.05',
        body: createSimpleJettonTransferMessageWithComment(to, '1', senderAddress, 'jetton-01'),
      }),
    },
    {
      type: 'sendMsg',
      mode: SendMode.NONE,
      outMsg: internal({
        to: senderJettonWalletAddress,
        value: '0.05',
        body: createSimpleJettonTransferMessageWithComment(to, '2', senderAddress, 'jetton-02'),
      }),
    },
  ];
  // Notice: Need increase query id for each batch send
  const queryId = HighloadWalletV3QueryId.fromQueryId(BigInt(11));
  const res = await highloadWalletV3Helper.sendBatch(tonClient, keypair.secretKey, outMsgs, queryId);
  console.log(res);
})();
