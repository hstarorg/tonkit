import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { WalletVersionEnum } from './enums';

export const WalletContractMap: Record<WalletVersionEnum, typeof WalletContractV4 | typeof WalletContractV5R1> = {
  V4: WalletContractV4,
  V5R1: WalletContractV5R1,
};

export const APIV2Endpoints = {
  TONCENTER_MAINNET: 'https://toncenter.com/api/v2/jsonRPC',
  TONCENTER_TESTNET: 'https://testnet.toncenter.com/api/v2/jsonRPC',
};

/**
 * https://github.com/ton-blockchain/highload-wallet-contract-v3/blob/main/contracts/highload-wallet-v3.func
 */
export const HighloadWalletV3Errors = {
  33: 'invalid_signature',
  34: 'invalid_subwallet_id',
  35: 'invalid_created_at',
  36: 'already_executed',
  37: 'invalid_message_to_send',
  38: 'invalid_timeout',
};

/**
 * https://github.com/ton-blockchain/token-contract/blob/main/ft/jetton-wallet.fc
 */
export const JETTONTransferErrors = {
  705: 'sender address not equals owner address',
  706: 'not enough jetton balance',
  707: 'not enough TON balance',
  708: 'in msg body error',
  709: 'not enough TON balance',
};
