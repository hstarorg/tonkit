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

  return await sdk.transferTON(
    WalletVersionEnum.V4,
    keypair,
    '0QDhAkNwnl4a1Djk9hdFsR7LPRTQenB2Jd6AkltcrsN9x_8A',
    '0.01',
    'test transfer',
  );
})();
