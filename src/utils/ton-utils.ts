import { Address } from '@ton/core';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';

import { TONShardingID, TonAddressFormat } from '../types';
import { WalletContractMap, WalletVersionEnum } from '../constants';
import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';

/**
 * Get a valid TON address, return null if the address is invalid
 * @param address
 * @returns
 */
export function getValidTONAddress(address: string): Address | null {
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
export function getTONAddressShardingID(address: string): TONShardingID {
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
  shardingId: TONShardingID
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
  walletVersion: WalletVersionEnum
): Promise<{ mnemonic: string[]; rawAddress: string }[]> {
  const promises = new Array(16)
    .fill(0)
    .map((_, idx) =>
      generateWalletWithShardingID(walletVersion, idx as TONShardingID)
    );
  const wallets = await Promise.all(promises);
  return wallets;
}

function createWallet(
  walletVersion: WalletVersionEnum,
  publicKey: Buffer,
  walletId: number
) {
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
  mnemonic: string[]
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
  address: string,
  tonAddressFormat: TonAddressFormat // Why use type instead of enum here, ensure the caller can only pass value simple
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
  } else if (
    tonAddressFormat === 'MainnetNonBounceable' ||
    tonAddressFormat === 'UQ'
  ) {
    args = { bounceable: false };
  } else if (
    tonAddressFormat === 'TestnetBounceable' ||
    tonAddressFormat === 'kQ'
  ) {
    args = { bounceable: true, testOnly: true };
  } else if (
    tonAddressFormat === 'TestnetNonBounceable' ||
    tonAddressFormat === '0Q'
  ) {
    args = { bounceable: false, testOnly: true };
  } else {
    throw new Error('Invalid TON address format');
  }
  return addr.toString(args);
}
