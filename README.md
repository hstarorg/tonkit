# tonkit
A toolkit for ton blockchain

## Functions

### TonChainSDK
**Read**
- [x] Check the TON balance at wallet address - `tonchainSDK.getAccountBalance`
- [x] Get the JETTON balance at wallet address - `tonchainSDK.getAccountJettonBalance`
- [x] Reading data from a contract - `tonchainSDK.readContractData`
- [ ] Fetching transactions from a single wallet in batches
- [ ] Filtering TON tranfer transactions in transaction list
- [ ] Filtering JETTON tranfer transactions in transaction list

**Write**

- [ ] Batch transfer TON with W5 wallet
- [ ] Batch transfer Jetton with W5 wallet
- [ ] Transfer TON
- [ ] Tranfer JETTON

### Utils
- [x] Create a separate wallet for each sharding, you can also specify a sharding to create(Each wallet is a separate mnemonic): `generateShardingWallets`
- [x] Generate a wallet with a specific sharding ID: `generateWalletWithShardingID`
- [x] Create a sub-wallet for each sharding by `walletId`, you can also specify a sharding to create(Each wallet share a same mnemonic): `generateShardingSubWallets`
- [x] Get the sharding ID of the TON address: `getTONAddressShardingID`
- [x] Judge whether the address is a valid TON address: `isValidTONAddress`
- [x] Get a valid TON address, return null if the address is invalid: `getValidTONAddress`
- [x] Get the TON address with specific format: `getTONAddressWithFormat`

## How to develop & publish
```bash
pnpm cs
```