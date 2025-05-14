export const shortenAddress = (address, start = 4, end = 4) => {
  return address.slice(0, start) + "..." + address.slice(-end);
};
