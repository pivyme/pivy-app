export const shortenAddress = (address, start = 4, end = 4) => {
  return address.slice(0, start) + "..." + address.slice(-end);
};

export const getSuiExplorerTxLink = (txHash, chain = 'TESTNET') => {
  if (chain === 'TESTNET') {
    return `https://suiscan.xyz/testnet/tx/${txHash}`;
  }
  return `https://suiscan.xyz/mainnet/tx/${txHash}`;
}

export const getExplorerTxLink = (txHash, chain = 'DEVNET') => {
  // Handle SUI chain
  if (chain === 'SUI_TESTNET' || chain === 'SUI_MAINNET') {
    return getSuiExplorerTxLink(txHash, chain === 'SUI_TESTNET' ? 'TESTNET' : 'MAINNET');
  }

  // Handle Solana chain
  if (chain === 'DEVNET') {
    return `https://solscan.io/tx/${txHash}?cluster=devnet`;
  }
  return `https://solscan.io/tx/${txHash}`;
}

export const getSuiExplorerAccountLink = (address, chain = 'TESTNET') => {
  if (chain === 'TESTNET') {
    return `https://suiscan.xyz/testnet/address/${address}`;
  }
  return `https://suiscan.xyz/mainnet/address/${address}`;
}

export const getExplorerAccountLink = (address, chain = 'DEVNET') => {
  // Handle SUI chain
  if (chain === 'SUI_TESTNET' || chain === 'SUI_MAINNET') {
    return getSuiExplorerAccountLink(address, chain === 'SUI_TESTNET' ? 'TESTNET' : 'MAINNET');
  }

  // Handle Solana chain
  if (chain === 'DEVNET') {
    return `https://solscan.io/account/${address}?cluster=devnet`;
  }
  return `https://solscan.io/account/${address}`;
}