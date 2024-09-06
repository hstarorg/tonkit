import { TONShardingID } from '../src/types';
import {
  getValidTONAddress,
  isValidTONAddress,
  getTONAddressShardingID,
  getTONAddressWithFormat,
} from '../src/utils/ton-utils';

describe('ton-utils', () => {
  it('getValidTONAddress', () => {
    [
      'EQAo92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75iCN',
      '0:28f760d832893182129cabe0a40864a4fcc817639168d523d6db4824bd997be6',
      'UQB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEN1X',
      'kQB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEDsY',
      '0QB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEGbd',
    ].forEach((address) => {
      expect(getValidTONAddress(address)).not.toBe(null);
    });

    ['', 'afdas', '0x8C919e14C3A450aba0590D9e24Bb788Ab5183689'].forEach(
      (address) => {
        expect(getValidTONAddress(address)).toBe(null);
      }
    );
  });

  it('isValidTONAddress', () => {
    [
      'EQAo92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75iCN',
      '0:28f760d832893182129cabe0a40864a4fcc817639168d523d6db4824bd997be6',
      'UQB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEN1X',
      'kQB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEDsY',
      '0QB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEGbd',
    ].forEach((address) => {
      expect(isValidTONAddress(address)).toBe(true);
    });

    ['', 'afdas', '0x8C919e14C3A450aba0590D9e24Bb788Ab5183689'].forEach(
      (address) => {
        expect(isValidTONAddress(address)).toBe(false);
      }
    );
  });

  it('getTONAddressShardingID', () => {
    const caseMap: Record<string, TONShardingID> = {
      'EQAI92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75rkm': 0,
      '0:1b44ec553616b0e4551037038834bdf0bdaa1f0440e10f3331d9841585612a68': 1,
      'EQAo92DYMokxghKcq-CkCGSk_MgXY5Fo1SPW20gkvZl75iCN': 2,
      UQBJpDx2dFtSAkHr8AMB4by3KeON_5GA0fC_rBYkWljFLvsl: 4,
      UQBQ2yzRvLSZQpyiRCDkwVvaegvl3X1Gsg9nE9P52v8dLlzo: 5,
      UQB3ut3lcrbuIdNBjrcsDOSCnLl5d7KDpnza_5sm7MbwEN1X: 7,
      'UQCXrZNESRUInoEiOP8Qq-kGbQsD6j26KoYw-5yfiKpFXKdd': 9,
      'EQDHzjmTXWD_jdMp_l-DfWannIPSoSpSMEun1ppWW7E9WX4n': 12,
      UQDdSGhxqCJTXXZuQlRRx1jCC6d6q8JLDuks4pzPi95lwszG: 13,
      'UQD6kZyIwlzI09-C-CmAVP_hmEup9cpJpIMocynF0Gq0KW7V': 15,
    };

    Object.entries(caseMap).forEach(([address, shardingID]) => {
      expect(getTONAddressShardingID(address)).toBe(shardingID);
    });

    expect(() => getTONAddressShardingID('')).toThrow('Invalid TON address');
  });

  it('getTONAddressWithFormat', () => {
    let source = 'UQD6kZyIwlzI09-C-CmAVP_hmEup9cpJpIMocynF0Gq0KW7V';
    // https://ton.org/address/
    const target = {
      UQ: 'UQD6kZyIwlzI09-C-CmAVP_hmEup9cpJpIMocynF0Gq0KW7V',
      EQ: 'EQD6kZyIwlzI09-C-CmAVP_hmEup9cpJpIMocynF0Gq0KTMQ',
      kQ: 'kQD6kZyIwlzI09-C-CmAVP_hmEup9cpJpIMocynF0Gq0KYia',
      '0Q': '0QD6kZyIwlzI09-C-CmAVP_hmEup9cpJpIMocynF0Gq0KdVf',
      hex: '0:fa919c88c25cc8d3df82f8298054ffe1984ba9f5ca49a483287329c5d06ab429',
    };
    expect(getTONAddressWithFormat(source, 'UQ')).toBe(target.UQ);
    expect(getTONAddressWithFormat(source, 'MainnetNonBounceable')).toBe(
      target.UQ
    );

    expect(getTONAddressWithFormat(source, 'EQ')).toBe(target.EQ);
    expect(getTONAddressWithFormat(source, 'MainnetBounceable')).toBe(
      target.EQ
    );

    expect(getTONAddressWithFormat(source, '0Q')).toBe(target['0Q']);
    expect(getTONAddressWithFormat(source, 'TestnetNonBounceable')).toBe(
      target['0Q']
    );

    expect(getTONAddressWithFormat(source, 'kQ')).toBe(target.kQ);
    expect(getTONAddressWithFormat(source, 'TestnetBounceable')).toBe(
      target.kQ
    );

    expect(getTONAddressWithFormat(source, 'RawString')).toBe(target.hex);

    // cases for invalid format
    expect(() => getTONAddressWithFormat(source, 'hex' as any)).toThrow();
    expect(() => getTONAddressWithFormat('source', 'hex' as any)).toThrow();
  });
});
