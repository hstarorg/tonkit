import {
  Address,
  JettonMaster,
  JettonWallet,
  TonClient,
  TonClientParameters,
  TupleReader,
} from '@ton/ton';
import { getValidTONAddress } from '../utils/ton-utils';

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
      JettonMaster.create(getValidTONAddress(jettonMaster))
    );

    // 1. find account's jetton wallet
    const jettonWalletAddress = await jettonMasterContract.getWalletAddress(
      getValidTONAddress(accountAddress)
    );

    // 2. open jetton wallet contract
    const jettonWalletContract = this.tonClient.open(
      JettonWallet.create(jettonWalletAddress)
    );

    // 3. get balance
    const balance = await jettonWalletContract.getBalance();
    return balance;
  }

  /**
   * Get account's TON balance
   * @param accountAddress
   * @returns
   */
  async getAccountBalance(accountAddress: Address | string): Promise<bigint> {
    const balance = await this.tonClient.getBalance(
      getValidTONAddress(accountAddress)
    );
    return balance;
  }

  /**
   * Get contract data by contract address and method name
   * @param contractAddr
   * @param methodName
   * @returns
   */
  async getContractData(
    contractAddr: Address | string,
    methodName: string
  ): Promise<{ gas_used: number; stack: TupleReader }> {
    const contractAddress = getValidTONAddress(contractAddr);
    const methodResult = await this.tonClient.runMethod(
      contractAddress,
      methodName
    );
    return methodResult;
  }
}
