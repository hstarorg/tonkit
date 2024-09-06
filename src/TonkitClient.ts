import { TonClient } from '@ton/ton';
import { APIEndpoints } from './constants';

export type TonkitClientOptions = {
  network?: 'mainnet' | 'testnet';
  provider: keyof (typeof APIEndpoints)['v2'];
  apiKey?: string;
};

export class TonkitClient {
  private readonly tonClient: TonClient;
  constructor(options: TonkitClientOptions) {
    const endpoint =
      APIEndpoints['v2'][options.provider][options.network || 'mainnet'];
    if (!endpoint) {
      throw new Error('Invalid provider or network');
    }
    this.tonClient = new TonClient({
      endpoint,
      apiKey: options.apiKey,
    });
  }
}
