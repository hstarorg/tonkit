import { Address, OutActionSendMsg, TonClient } from '@ton/ton';
import { HighloadQueryId, HighloadWalletV3, HighloadWalletV3Code } from '../libs/highload-wallet-v3';

export { HighloadQueryId as HighloadWalletV3QueryId };

export class HighloadWalletV3Helper {
  private readonly highloadWalletV3: HighloadWalletV3;
  private readonly timeout: number;
  constructor(publicKey: Buffer, private subwalletId: number, options?: { timeout?: number }) {
    this.timeout = options?.timeout === undefined ? 128 : options.timeout;
    this.highloadWalletV3 = HighloadWalletV3.createFromConfig(
      {
        publicKey,
        subwalletId,
        timeout: this.timeout,
      },
      HighloadWalletV3Code,
    );
  }

  get address(): Address {
    return this.highloadWalletV3.address;
  }

  async sendBatch(tonClient: TonClient, secretKey: Buffer, outMsgs: OutActionSendMsg[], queryId: HighloadQueryId) {
    const walletContract = tonClient.open(this.highloadWalletV3);
    return await walletContract.sendBatch(
      secretKey,
      outMsgs,
      this.subwalletId,
      queryId,
      this.timeout,
      Math.floor(Date.now() / 1000) - 60,
    );
  }
}
