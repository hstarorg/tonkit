import {
  Address,
  beginCell,
  Cell,
  comment,
  internal,
  JettonMaster,
  JettonWallet,
  OpenedContract,
  OutActionSendMsg,
  SendMode,
  storeStateInit,
  TonClient,
  TonClientParameters,
  TupleReader,
  WalletContractV4,
  WalletContractV5R1,
} from '@ton/ton';
import { KeyPair } from '@ton/crypto';

import { createSimpleJettonTransferMessageWithComment, getValidTONAddress } from '../utils/ton-utils';
import { HighloadWalletV3Helper, HighloadWalletV3QueryId } from './HighloadWalletV3Helper';
import { WalletVersionEnum } from '../constants/enums';
import { JettonData } from '../types';

export type TonChainSDKOptions = {
  endpoint: string;
  apiKey?: string;
};

export class TonChainSDK {
  private _tonClient: TonClient;
  constructor(private readonly options: TonChainSDKOptions) {
    this._initTonClient();
  }

  getTonClient() {
    return this._tonClient;
  }

  private _initTonClient(): void {
    const params: TonClientParameters = {
      endpoint: this.options.endpoint,
    };
    if (this.options.apiKey) {
      params.apiKey = this.options.apiKey;
    }
    this._tonClient = new TonClient(params);
  }

  async getAccountJettonWallet(jettonMaster: Address | string, accountAddress: Address | string) {
    const jettonMasterContract = this._tonClient.open(JettonMaster.create(getValidTONAddress(jettonMaster)));

    // find account's jetton wallet
    const jettonWalletAddress = await jettonMasterContract.getWalletAddress(getValidTONAddress(accountAddress));
    return jettonWalletAddress;
  }

  // async getJettonData(jettonMaster: Address | string): Promise<JettonData> {
  //   const jettonMasterContract = this._tonClient.open(JettonMaster.create(getValidTONAddress(jettonMaster)));
  //   const result = await jettonMasterContract.getJettonData();
  //   const cs = result.content.beginParse();

  //   const contentType = cs.loadUint(8);

  //   return {
  //     totalSupply: result.totalSupply,
  //     mintable: result.mintable,
  //     adminAddress: result.adminAddress.toString(),
  //   };
  // }

  getAccountJettonWalletOffline(
    jettonMaster: Address | string,
    accountAddress: Address | string,
    jettonWalletCode: Cell,
  ) {
    const JETTON_MASTER_ADDRESS = getValidTONAddress(jettonMaster);
    const USER_ADDRESS = getValidTONAddress(accountAddress);

    const jettonWalletStateInit = beginCell()
      .store(
        storeStateInit({
          code: jettonWalletCode,
          data: beginCell()
            .storeCoins(0)
            .storeAddress(USER_ADDRESS)
            .storeAddress(JETTON_MASTER_ADDRESS)
            .storeRef(jettonWalletCode)
            .endCell(),
        }),
      )
      .endCell();
    const userJettonWalletAddress = new Address(0, jettonWalletStateInit.hash());

    return userJettonWalletAddress;
  }

  /**
   * Get Jetton balance by owner address
   * @param jettonMaster
   * @param accountAddress
   * @returns
   */
  async getAccountJettonBalance(jettonMaster: Address | string, accountAddress: Address | string): Promise<bigint> {
    // 1. get jetton wallet address
    const jettonWalletAddress = await this.getAccountJettonWallet(jettonMaster, accountAddress);

    // 2. open jetton wallet contract
    const jettonWalletContract = this._tonClient.open(JettonWallet.create(jettonWalletAddress));

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
    const balance = await this._tonClient.getBalance(getValidTONAddress(accountAddress));
    return balance;
  }

  /**
   * Get contract data by contract address and method name
   * @param contractAddr
   * @param methodName
   * @returns
   */
  async readContractData(
    contractAddr: Address | string,
    methodName: string,
  ): Promise<{ gas_used: number; stack: TupleReader }> {
    const contractAddress = getValidTONAddress(contractAddr);
    const methodResult = await this._tonClient.runMethod(contractAddress, methodName);
    return methodResult;
  }

  /**
   * Calculate highload wallet v3 wallet address
   * @param publicKey
   * @param subwalletId
   * @returns
   */
  calculateHighloadWalletV3WalletAddress(publicKey: Buffer, subwalletId: number) {
    const highloadWalletV3Helper = new HighloadWalletV3Helper(publicKey, subwalletId);
    return highloadWalletV3Helper.address;
  }

  /**
   * Calculate wallet address, support V4, V5
   * @param walletVersion
   * @param publicKey
   * @param walletId
   * @returns
   */
  calculateWalletAddress(walletVersion: WalletVersionEnum, publicKey: Buffer, walletId?: number) {
    const wallet = this._createWallet(walletVersion, publicKey, walletId);
    return wallet.address;
  }

  /**
   * Send batch messages by highload wallet v3
   * @param serderInfo
   * @param queryId
   * @param outMsgs
   * @returns
   */
  async batchSendByHighloadWalletV3(
    serderInfo: { keypair: KeyPair; subwalletId: number },
    queryId: HighloadWalletV3QueryId,
    outMsgs: OutActionSendMsg[],
  ) {
    const { keypair, subwalletId } = serderInfo;
    const highloadWalletV3Helper = new HighloadWalletV3Helper(keypair.publicKey, subwalletId);

    return await highloadWalletV3Helper.sendBatch(this._tonClient, keypair.secretKey, outMsgs, queryId);
  }

  async transferTON(
    wallerVersion: WalletVersionEnum,
    keypair: KeyPair,
    to: Address | string,
    tonAmount: string,
    commentString?: string,
  ) {
    const toAddress = getValidTONAddress(to);
    const wallet = this._createWallet(wallerVersion, keypair.publicKey);
    const walletContract = this._tonClient.open(wallet);

    const seqno = await walletContract.getSeqno();

    const transferArgs = {
      seqno,
      secretKey: keypair.secretKey,
      messages: [
        internal({
          to: toAddress,
          value: tonAmount,
          body: commentString ? comment(commentString) : beginCell().endCell(),
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY,
    };

    if (wallerVersion === WalletVersionEnum.V4) {
      return await (walletContract as OpenedContract<WalletContractV4>).sendTransfer(transferArgs);
    } else if (wallerVersion === WalletVersionEnum.V5R1) {
      return await (walletContract as OpenedContract<WalletContractV5R1>).sendTransfer(transferArgs);
    }
  }

  async transferJETTON(
    wallerVersion: WalletVersionEnum,
    keypair: KeyPair,
    to: Address | string,
    jettonMaster: Address | string,
    jetttonAmount: string,
    tonAmount: string,

    commentString?: string,
  ) {
    const wallet = this._createWallet(wallerVersion, keypair.publicKey);
    const walletContract = this._tonClient.open(wallet);

    const seqno = await walletContract.getSeqno();

    const senderJettonWalletAddress = await this.getAccountJettonWallet(jettonMaster, wallet.address);

    const transferArgs = {
      seqno,
      secretKey: keypair.secretKey,
      messages: [
        internal({
          to: senderJettonWalletAddress,
          value: tonAmount,
          body: createSimpleJettonTransferMessageWithComment(to, jetttonAmount, wallet.address, commentString),
        }),
      ],
      sendMode: SendMode.PAY_GAS_SEPARATELY,
    };

    if (wallerVersion === WalletVersionEnum.V4) {
      return await (walletContract as OpenedContract<WalletContractV4>).sendTransfer(transferArgs);
    } else if (wallerVersion === WalletVersionEnum.V5R1) {
      return await (walletContract as OpenedContract<WalletContractV5R1>).sendTransfer(transferArgs);
    }
  }

  private _createWallet(walletVersion: WalletVersionEnum, publicKey: Buffer, walletId?: number) {
    if (walletVersion === WalletVersionEnum.V4) {
      return WalletContractV4.create({ workchain: 0, publicKey, walletId });
    } else if (walletVersion === WalletVersionEnum.V5R1) {
      return WalletContractV5R1.create({
        publicKey,
        walletId: walletId
          ? {
              networkGlobalId: -239,
              context: {
                walletVersion: 'v5r1',
                workchain: 0,
                subwalletNumber: walletId,
              },
            }
          : undefined,
      });
    } else {
      throw new Error('Invalid wallet version');
    }
  }

  async getTransactions(address: Address | string) {
    const addressObj = getValidTONAddress(address);
    const transactions = await this._tonClient.getTransactions(addressObj, {
      limit: 3,
      archival: true,
    });
    return transactions;
  }
}
