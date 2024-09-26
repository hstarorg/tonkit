import { config } from 'dotenv';
import { APIV2Endpoints, TonChainSDK } from '../src';
import { Address } from '@ton/core';

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

  it('get account balance ok', async () => {
    const balance = await tonChainSDK.getAccountBalance(
      'kQCa2efoPKIq7gdpcGZQliz5yxT566m9pKg_pOhH__G5KMCd'
    );
    expect(balance).toBeLessThan(BigInt(87375965));
  });

  it('get contract data', async () => {
    const result = await tonChainSDK.readContractData(
      'kQCa2efoPKIq7gdpcGZQliz5yxT566m9pKg_pOhH__G5KMCd',
      'get_jetton_data'
    );
    expect(result.gas_used).toBeGreaterThan(0);
    // total_supply
    expect(result.stack.readBigNumber()).toBe(BigInt('10000000000000000000'));
    // mintable
    expect(result.stack.readBoolean()).toBe(true);
    // admin_address
    expect(
      result.stack
        .readAddress()
        .equals(
          Address.parse(
            '0:0d02cacbcb21e8abc378119f907c00d786da125326dd48a5ce92730b58b6c0ee'
          )
        )
    ).toBe(true);
  });
});
