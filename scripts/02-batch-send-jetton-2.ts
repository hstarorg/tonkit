import { keyPairFromSecretKey } from '@ton/crypto';
import { TonClient, internal, OutActionSendMsg, SendMode, Address } from '@ton/ton';
import {
  APIV2Endpoints,
  createSimpleJettonTransferMessageWithComment,
  HighloadWalletV3QueryId,
  TonChainSDK,
} from '../src';

import { config } from 'dotenv';
config();

!(async function start() {
  const demoData = {
    secretKey: process.env.WALLET_SECRET_KEY || '',
    subwalletId: 1024,
  };

  const sdk = new TonChainSDK({
    endpoint: APIV2Endpoints.TONCENTER_TESTNET,
    apiKey: process.env.TONCENTER_TESTNET_API_KEY,
  });

  const keypair = keyPairFromSecretKey(Buffer.from(demoData.secretKey, 'hex'));

  // 1. Get highload wallet address
  const senderAddress = sdk.calculateHighloadWalletV3WalletAddress(keypair.publicKey, demoData.subwalletId);

  // 2. Deposit jetton to highload wallet - Manual Deposit

  // 3. Send tokens to customers

  const to = Address.parse('0QDhAkNwnl4a1Djk9hdFsR7LPRTQenB2Jd6AkltcrsN9x_8A');
  const jettonMaster = 'kQCa2efoPKIq7gdpcGZQliz5yxT566m9pKg_pOhH__G5KMCd'; // testnet bitcoin
  const senderJettonWalletAddress = await sdk.getAccountJettonWallet(jettonMaster, senderAddress);

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
  const queryId = HighloadWalletV3QueryId.fromQueryId(BigInt(12));
  const res = await sdk.batchSendByHighloadWalletV3({ keypair, subwalletId: demoData.subwalletId }, queryId, outMsgs);
  console.log(res);
})();
