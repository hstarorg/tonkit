export type TONShardingID =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

/**
 * TON address format
 * https://ton.org/address/
 */
export type TonAddressFormat =
  | 'MainnetBounceable' // Address format for mainnet, bounceable
  | 'EQ' // alias as MainnetBounceable
  | 'MainnetNonBounceable' // Address format for mainnet, non-bounceable
  | 'UQ' // alias as MainnetNonBounceable
  | 'TestnetBounceable' // Address format for testnet, bounceable
  | 'kQ' // alias as TestnetBounceable
  | 'TestnetNonBounceable' //   Address format for testnet, non-bounceable
  | '0Q' // alias as TestnetNonBounceable
  | 'RawString'; // Raw string format
