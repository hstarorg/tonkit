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

  async getAccountJettonWallet(jettonMaster: Address | string, accountAddress: Address | string) {
    const jettonMasterContract = this.tonClient.open(JettonMaster.create(getValidTONAddress(jettonMaster)));

    // find account's jetton wallet
    const jettonWalletAddress = await jettonMasterContract.getWalletAddress(getValidTONAddress(accountAddress));
    return jettonWalletAddress;
  }

  getAccountJettonWalletOffline(
    jettonMaster: Address | string,
    accountAddress: Address | string,
    jettonWalletCode: string,
  ) {
    const JETTON_WALLET_CODE = Cell.fromBoc(
      Buffer.from(
        'b5ee9c7201021301000385000114ff00f4a413f4bcf2c80b0102016202030202cb0405001ba0f605da89a1f401f481f481a9a30201ce06070201580a0b02f70831c02497c138007434c0c05c6c2544d7c0fc07783e903e900c7e800c5c75c87e800c7e800c1cea6d0000b4c7c076cf16cc8d0d0d09208403e29fa96ea68c1b088d978c4408fc06b809208405e351466ea6cc1b08978c840910c03c06f80dd6cda0841657c1ef2ea7c09c6c3cb4b01408eebcb8b1807c073817c160080900113e910c30003cb85360005c804ff833206e953080b1f833de206ef2d29ad0d30731d3ffd3fff404d307d430d0fa00fa00fa00fa00fa00fa00300008840ff2f00201580c0d020148111201f70174cfc0407e803e90087c007b51343e803e903e903534544da8548b31c17cb8b04ab0bffcb8b0950d109c150804d50500f214013e809633c58073c5b33248b232c044bd003d0032c032481c007e401d3232c084b281f2fff274013e903d010c7e800835d270803cb8b13220060072c15401f3c59c3e809dc072dae00e02f33b51343e803e903e90353442b4cfc0407e80145468017e903e9014d771c1551cdbdc150804d50500f214013e809633c58073c5b33248b232c044bd003d0032c0325c007e401d3232c084b281f2fff2741403f1c147ac7cb8b0c33e801472a84a6d8206685401e8062849a49b1578c34975c2c070c00870802c200f1000aa13ccc88210178d4519580a02cb1fcb3f5007fa0222cf165006cf1625fa025003cf16c95005cc2391729171e25007a813a008aa005004a017a014bcf2e2c501c98040fb004300c85004fa0258cf1601cf16ccc9ed5400725269a018a1c882107362d09c2902cb1fcb3f5007fa025004cf165007cf16c9c8801001cb0527cf165004fa027101cb6a13ccc971fb0050421300748e23c8801001cb055006cf165005fa027001cb6a8210d53276db580502cb1fcb3fc972fb00925b33e24003c85004fa0258cf1601cf16ccc9ed5400eb3b51343e803e903e9035344174cfc0407e800870803cb8b0be903d01007434e7f440745458a8549631c17cb8b049b0bffcb8b0b220841ef765f7960100b2c7f2cfc07e8088f3c58073c584f2e7f27220060072c148f3c59c3e809c4072dab33260103ec01004f214013e809633c58073c5b3327b55200087200835c87b51343e803e903e9035344134c7c06103c8608405e351466e80a0841ef765f7ae84ac7cbd34cfc04c3e800c04e81408f214013e809633c58073c5b3327b5520',
        'hex',
      ),
    )[0];
    const JETTON_MASTER_ADDRESS = getValidTONAddress(jettonMaster);
    const USER_ADDRESS = getValidTONAddress(accountAddress);

    const jettonWalletStateInit = beginCell()
      .store(
        storeStateInit({
          code: JETTON_WALLET_CODE,
          data: beginCell()
            .storeCoins(0)
            .storeAddress(USER_ADDRESS)
            .storeAddress(JETTON_MASTER_ADDRESS)
            .storeRef(JETTON_WALLET_CODE)
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
    const jettonWalletContract = this.tonClient.open(JettonWallet.create(jettonWalletAddress));

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
    const balance = await this.tonClient.getBalance(getValidTONAddress(accountAddress));
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
    const methodResult = await this.tonClient.runMethod(contractAddress, methodName);
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

    return await highloadWalletV3Helper.sendBatch(this.tonClient, keypair.secretKey, outMsgs, queryId);
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
    const walletContract = this.tonClient.open(wallet);

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
    const toAddress = getValidTONAddress(to);
    const wallet = this._createWallet(wallerVersion, keypair.publicKey);
    const walletContract = this.tonClient.open(wallet);

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
    const transactions = await this.tonClient.getTransactions(addressObj, {
      limit: 3,
      archival: true,
    });
    return transactions;
  }
}
