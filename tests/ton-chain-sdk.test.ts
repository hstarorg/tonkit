import { config } from 'dotenv';
import { APIV2Endpoints, TonChainSDK } from '../src';

config();

describe('ton-chain-sdk', () => {
  let tonChainSDK: TonChainSDK;
  beforeEach(() => {
    tonChainSDK = new TonChainSDK({
      endpoint: APIV2Endpoints.TONCENTER_TESTNET,
      apiKey: process.env.TONCENTER_TESTNET_API_KEY,
    });
  });

  it('get account jetton balance ok', async () => {
    const jettonBalance = await tonChainSDK.getAccountJettonBalance(
      'kQCa2efoPKIq7gdpcGZQliz5yxT566m9pKg_pOhH__G5KMCd',
      'kQCa2efoPKIq7gdpcGZQliz5yxT566m9pKg_pOhH__G5KMCd'
    );
    expect(jettonBalance).toBe(BigInt(500000000000));
  });
});
