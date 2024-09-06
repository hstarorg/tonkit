import { Address } from '@ton/core';
import { WalletVersionEnum } from '../src/constants';
import { generateShardingWallets } from '../src/index';

generateShardingWallets(WalletVersionEnum.V4).then((wallets) => {
  console.log(
    wallets.map((x) => ({
      mnemonic: x.mnemonic.join(' '),
      rawAddress: x.rawAddress,
      uqAddress: Address.parse(x.rawAddress).toString({ bounceable: false }),
    }))
  );
});
