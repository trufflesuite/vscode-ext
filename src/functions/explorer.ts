// Copyright (c) 2022. Consensys Software Inc. All rights reserved.
// Licensed under the MIT license.

import {ChainId} from '@/Constants';

const explorers = {
  etherscan: (link: string, data: string, type: 'transaction' | 'token' | 'address' | 'block') => {
    switch (type) {
      case 'transaction':
        return `${link}/tx/${data}`;
      default:
        return `${link}/${type}/${data}`;
    }
  },
};

interface ChainObject {
  name: string;
  link: string;
  builder: (chainName: string, data: string, type: 'transaction' | 'token' | 'address' | 'block') => string;
}

interface Chains {
  [chainId: number]: ChainObject;
}

const UnknownChain: ChainObject = {
  name: 'Unknown/Truffle',
  link: '',
  builder: (_) => '',
};

const chains: Chains = {
  [ChainId.ETHEREUM]: {
    name: 'Mainnet',
    link: 'https://etherscan.io',
    builder: explorers.etherscan,
  },
  [ChainId.GOERLI]: {
    name: 'Goerli',
    link: 'https://goerli.etherscan.io',
    builder: explorers.etherscan,
  },
  [ChainId.SEPOLIA]: {
    name: 'Sepolia',
    link: 'https://sepolia.etherscan.io',
    builder: explorers.etherscan,
  },
  [ChainId.MATIC]: {
    name: 'Matic',
    link: 'https://polygonscan.com',
    builder: explorers.etherscan,
  },
  [ChainId.MATIC_TESTNET]: {
    name: 'Matic Testnet',
    link: 'https://mumbai.polygonscan.com',
    builder: explorers.etherscan,
  },
  [ChainId.FANTOM]: {
    name: 'Fantom',
    link: 'https://ftmscan.com',
    builder: explorers.etherscan,
  },
  [ChainId.FANTOM_TESTNET]: {
    name: 'Fantom Testnet',
    link: 'https://testnet.ftmscan.com',
    builder: explorers.etherscan,
  },
  //   [ChainId.KILN]: {
  //     name: 'Kiln',
  //     link: 'https://explorer.kiln.themerge.dev/',
  //     builder: explorers.etherscan,
  //   },
  //   [ChainId.BSC]: {
  //     link: 'https://bscscan.com',
  //     builder: explorers.etherscan,
  //   },
  //   [ChainId.BSC_TESTNET]: {
  //     link: 'https://testnet.bscscan.com',
  //     builder: explorers.etherscan,
  //   },
  //   [ChainId.ARBITRUM]: {
  //     link: 'https://arbiscan.io',
  //     builder: explorers.etherscan,
  //   },
  //   [ChainId.AVALANCHE]: {
  //     link: 'https://cchain.explorer.avax.network',
  //     builder: explorers.blockscout,
  //   },
  //   [ChainId.AVALANCHE_TESTNET]: {
  //     link: 'https://cchain.explorer.avax-test.network',
  //     builder: explorers.etherscan,
  //   },
};

/**
 * Return blockexplorer URL, if you are on a chainID it doesn't know it will return a response.
 * @param chainId
 * @param data
 * @param type
 */
export function getExplorerLink(
  chainId: number | undefined,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block'
): string | undefined {
  if (!chainId) return '';
  const chain = chains[chainId];
  return chain ? chain.builder(chain.link, data, type) : undefined;
}

// handy way to get chains or a default one.
export const getChain = (chainId: number | undefined): ChainObject => {
  if (!chainId) return UnknownChain;
  return chains[chainId] ? chains[chainId] : UnknownChain;
};

export function getChainId(networkName: string): string | undefined {
  return Object.entries(chains).find((chain) => chain[1].name === networkName)?.[0];
}
