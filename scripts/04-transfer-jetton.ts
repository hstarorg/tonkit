import { keyPairFromSecretKey } from '@ton/crypto';
import { APIV2Endpoints, TonChainSDK, WalletVersionEnum } from '../src';

import { config } from 'dotenv';
config();

!(async function start() {
  const demoData = {
    secretKey: process.env.WALLET_SECRET_KEY || '',
  };

  const sdk = new TonChainSDK({
    endpoint: APIV2Endpoints.TONCENTER_TESTNET,
    apiKey: process.env.TONCENTER_TESTNET_API_KEY,
  });

  const keypair = keyPairFromSecretKey(Buffer.from(demoData.secretKey, 'hex'));

  const walletAddress = sdk.calculateWalletAddress(WalletVersionEnum.V4, keypair.publicKey);
  console.log(`
wallet address: ${walletAddress.toString()}
    `);

  const jettonMaster = 'kQAiboDEv_qRrcEdrYdwbVLNOXBHwShFbtKGbQVJ2OKxY_Di'; // testnet AIOTX

  return await sdk.transferJETTON(
    WalletVersionEnum.V4,
    keypair,
    '0QC9gEpl9dbcGAuAN0PMYI6X0JYj0fSOePPTGlT0CKkh4hAb',
    jettonMaster,
    '1',
    '0.05',
    'jetton transfer AIOTX',
  );
})();
