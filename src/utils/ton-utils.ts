import { Address, beginCell, Cell, comment, toNano } from '@ton/core';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { JettonMaster, TonClient, WalletContractV4, WalletContractV5R1 } from '@ton/ton';

import { TONShardingID, TonAddressFormat } from '../types';
import { WalletVersionEnum } from '../constants/enums';
import { WalletContractMap } from '../constants/configs';

/**
 * Get a valid TON address, return null if the address is invalid
 * @param address
 * @returns
 */
export function getValidTONAddress(address: Address | string): Address | null {
  if (address instanceof Address) {
    return address;
  }
  try {
    return Address.parse(address);
  } catch {
    return null;
  }
}

/**
 * Judge whether the address is a valid TON address
 * @param address
 * @returns
 */
export function isValidTONAddress(address: string): boolean {
  return getValidTONAddress(address) !== null;
}

/**
 * Get the sharding ID of the TON address
 * @param address
 * @returns
 */
export function getTONAddressShardingID(address: Address | string): TONShardingID {
  const validAddress = getValidTONAddress(address);
  if (!validAddress) {
    throw new Error('Invalid TON address');
  }
  return (validAddress.hash[0] >> 4) as TONShardingID;
}

/**
 * Generate a wallet with a specific sharding ID
 * @param shardingId
 * @returns
 */
export async function generateWalletWithShardingID(
  walletVersion: WalletVersionEnum,
  shardingId: TONShardingID,
): Promise<{ mnemonic: string[]; rawAddress: string }> {
  const WalletContract = WalletContractMap[walletVersion];
  if (!WalletContract) {
    throw new Error('Invalid wallet version');
  }

  while (true) {
    const mnemonic = await mnemonicNew(24);
    const keyPair = await mnemonicToPrivateKey(mnemonic);
    const testWallet = WalletContract.create({
      workchain: 0,
      publicKey: keyPair.publicKey,
    });
    const walletAddress = testWallet.address;
    if (walletAddress.hash[0] >> 4 === shardingId) {
      return {
        mnemonic,
        rawAddress: walletAddress.toRawString(),
      };
    }
  }
}

/**
 * Generate 16 wallets with different sharding IDs
 * @returns
 */
export async function generateShardingWallets(
  walletVersion: WalletVersionEnum,
): Promise<{ mnemonic: string[]; rawAddress: string }[]> {
  const promises = new Array(16)
    .fill(0)
    .map((_, idx) => generateWalletWithShardingID(walletVersion, idx as TONShardingID));
  const wallets = await Promise.all(promises);
  return wallets;
}

function createWallet(walletVersion: WalletVersionEnum, publicKey: Buffer, walletId: number) {
  if (walletVersion === WalletVersionEnum.V4) {
    return WalletContractV4.create({ workchain: 0, publicKey, walletId });
  } else if (walletVersion === WalletVersionEnum.V5R1) {
    return WalletContractV5R1.create({
      publicKey,
      walletId: {
        networkGlobalId: -239,
        context: {
          walletVersion: 'v5r1',
          workchain: 0,
          subwalletNumber: walletId,
        },
      },
    });
  } else {
    throw new Error('Invalid wallet version');
  }
}

/**
 * Generate 16 sub-wallet with different sharding IDs
 * @param mnemonic
 * @returns
 */
export async function generateShardingSubWallets(
  walletVersion: WalletVersionEnum,
  mnemonic: string[],
): Promise<{ walletId: number; rawAddress: string }[]> {
  let keyPair = await mnemonicToPrivateKey(mnemonic);
  let walletId = 0;
  const wallets: { walletId: number; rawAddress: string }[] = [];

  for (let i = 0; i < 16; i++) {
    while (true) {
      let wallet = createWallet(walletVersion, keyPair.publicKey, walletId);
      if (wallet.address.hash[0] >> 4 == i) {
        wallets.push({ walletId, rawAddress: wallet.address.toRawString() });
        break;
      }
      walletId++;
    }
  }
  return wallets;
}

/**
 * Get the TON address with UQ prefix
 * @param address
 * @returns
 */
export function getTONAddressWithFormat(
  address: Address | string,
  tonAddressFormat: TonAddressFormat, // Why use type instead of enum here, ensure the caller can only pass value simple
): string {
  const addr = getValidTONAddress(address);
  if (!addr) {
    throw new Error('Invalid TON address');
  }

  if (tonAddressFormat === 'RawString') {
    return addr.toRawString();
  }

  let args: { bounceable: boolean; testOnly?: boolean } = {
    bounceable: true,
  };
  if (tonAddressFormat === 'MainnetBounceable' || tonAddressFormat === 'EQ') {
    args = { bounceable: true };
  } else if (tonAddressFormat === 'MainnetNonBounceable' || tonAddressFormat === 'UQ') {
    args = { bounceable: false };
  } else if (tonAddressFormat === 'TestnetBounceable' || tonAddressFormat === 'kQ') {
    args = { bounceable: true, testOnly: true };
  } else if (tonAddressFormat === 'TestnetNonBounceable' || tonAddressFormat === '0Q') {
    args = { bounceable: false, testOnly: true };
  } else {
    throw new Error('Invalid TON address format');
  }
  return addr.toString(args);
}

/**
 * Create jetton transfer message
 * https://github.com/ton-blockchain/token-contract/blob/main/wrappers/JettonWallet.ts
 * @param toAddress
 * @param comment
 * @returns
 */
export function createJettonTransferMessage(
  toAddress: Address,
  jettonAmount: string,
  responseAddress: Address,
  customPayload: Cell | null,
  forwardTonAmount: string,
  forwardPayload: Cell | null,
) {
  // Build jetton transfer cell
  return beginCell()
    .storeUint(0xf8a7ea5, 32) // set jetton transfer opcode
    .storeUint(0, 64) // op, queryId
    .storeCoins(toNano(jettonAmount)) // jetton amount
    .storeAddress(toAddress) // jetton recipient
    .storeAddress(responseAddress) // Excess recipient
    .storeMaybeRef(customPayload) // custom payload
    .storeCoins(toNano(forwardTonAmount)) // forward ton amount
    .storeMaybeRef(forwardPayload) // forward payload
    .endCell();
}

/**
 * Create a simple jetton transfer message with comment
 * @param toAddress
 * @param jettonAmount
 * @param responseAddress
 * @param commentString
 * @returns
 */
export function createSimpleJettonTransferMessageWithComment(
  toAddress: Address | string,
  jettonAmount: string,
  responseAddress: Address | string,
  commentString: string,
) {
  const toAddressObj = getValidTONAddress(toAddress);
  const responseAddressObj = getValidTONAddress(responseAddress);
  return createJettonTransferMessage(toAddressObj, jettonAmount, responseAddressObj, null, '0', comment(commentString));
}

export async function getAccountJettonWallet(
  tonClient: TonClient,
  jettonMaster: Address | string,
  accountAddress: Address | string,
) {
  const jettonMasterContract = tonClient.open(JettonMaster.create(getValidTONAddress(jettonMaster)));

  // find account's jetton wallet
  const jettonWalletAddress = await jettonMasterContract.getWalletAddress(getValidTONAddress(accountAddress));
  return jettonWalletAddress;
}
