import {
  Address,
  JettonMaster,
  JettonWallet,
  TonClient,
  TonClientParameters,
} from '@ton/ton';

export type TonChainSDKOptions = {
  endpoint: string;
  apiKey?: string;
};

export class TonChainSDK {
  private tonClient: TonClient;
  constructor(private readonly options: TonChainSDKOptions) {
    this._initTonClient();
  }

  private _initTonClient(): void {
    const params: TonClientParameters = {
      endpoint: this.options.endpoint,
    };
    if (this.options.apiKey) {
      params.apiKey = this.options.apiKey;
    }
    this.tonClient = new TonClient(params);
  }

  /**
   * Get Jetton balance by owner address
   * @param jettonMaster
   * @param accountAddress
   * @returns
   */
  async getAccountJettonBalance(
    jettonMaster: Address | string,
    accountAddress: Address | string
  ): Promise<bigint> {
    const jettonMasterContract = this.tonClient.open(
      JettonMaster.create(
        typeof jettonMaster === 'string'
          ? Address.parse(jettonMaster)
          : jettonMaster
      )
    );

    // 1. find account's jetton wallet
    const jettonWalletAddress = await jettonMasterContract.getWalletAddress(
      typeof accountAddress === 'string'
        ? Address.parse(accountAddress)
        : accountAddress
    );

    // 2. open jetton wallet contract
    const jettonWalletContract = this.tonClient.open(
      JettonWallet.create(jettonWalletAddress)
    );

    // 3. get balance
    const balance = await jettonWalletContract.getBalance();
    return balance;
  }
}
