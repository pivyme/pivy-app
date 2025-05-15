export const shortenAddress = (address, start = 4, end = 4) => {
  return address.slice(0, start) + "..." + address.slice(-end);
};

export const getExplorerTxLink = (txHash, chain = 'DEVNET') => {
  if (chain === 'DEVNET') {
    return `https://solscan.io/tx/${txHash}?cluster=devnet`;
  }
  return `https://solscan.io/tx/${txHash}`;
}
