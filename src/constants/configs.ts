import { WalletContractV4, WalletContractV5R1 } from '@ton/ton';
import { WalletVersionEnum } from './enums';

export const WalletContractMap: Record<
  WalletVersionEnum,
  typeof WalletContractV4 | typeof WalletContractV5R1
> = {
  V4: WalletContractV4,
  V5R1: WalletContractV5R1,
};

export const APIEndpoints = {
  v2: {
    toncenter: {
      mainnet: 'https://toncenter.com/api/v2/jsonRPC',
      testnet: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    },
  },
  v4: {
    tonhub: {
      mainnet: 'https://mainnet-v4.tonhubapi.com',
      sandbox: 'https://sandbox-v4.tonhubapi.com',
    },
  },
};
