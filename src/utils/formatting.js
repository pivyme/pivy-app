import { formatCurrency } from "@coingecko/cryptoformat";
import numeral from "numeral";

export const formatStringToNumericDecimals = (val, maxDecimals = 6) => {
  const cleanedValue = val.replace(/[^0-9.]/g, "");

  const parts = cleanedValue.split(".");

  if (parts.length > 2) {
    return parts.slice(0, 2).join(".");
  }

  parts[0] = parts[0].replace(/^0+(?=\d)/, "");

  if (parts[0] === "") {
    parts[0] = "0";
  }

  if (parts[1] !== undefined) {
    parts[1] = parts[1].substring(0, maxDecimals);
  }

  const formattedIntegerPart = parts[0]
    .split("")
    .reverse()
    .join("")
    .replace(/(\d{3}(?!$))/g, "$1,")
    .split("")
    .reverse()
    .join("");

  return formattedIntegerPart + (parts[1] !== undefined ? `.${parts[1]}` : "");
};

export const serializeFormattedStringToFloat = (val) => {
  try {
    return parseFloat(val.replace(/,/g, ""));
  } catch (error) {
    return 0;
  }
};

export const humanizeFileSize = (bytes) => {
  return numeral(bytes).format("0.0 b");
};

export const formatNumberToKMB = (num) => {
  try {
    if (num >= 1_000_000_000) {
      return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1_000_000) {
      return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1_000) {
      return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  } catch (error) {
    return "-";
  }
};

const SUPERSCRIPTS = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "-": "⁻",
  "+": "⁺",
};

const toSuperscript = (num) => {
  return num
    .toString()
    .split("")
    .map((char) => SUPERSCRIPTS[char] || char)
    .join("");
};

/**
 * @typedef {Object} FormatOptions
 * @property {boolean} round - Whether to round the number
 * @property {boolean} exactDecimals - Whether to show exact decimal places
 * @property {number} maxDecimals - Maximum number of decimal places
 * @property {number} [defaultDecimals] - Default number of decimal places
 * @property {boolean} humanize - Whether to humanize large numbers
 * @property {number} humanizeThreshold - Threshold for humanizing numbers
 */

export const formatUiNumber = (num, currency = "", options = {
  round: false,
  exactDecimals: false,
  maxDecimals: 9,
  defaultDecimals: 2,
  humanize: false,
  humanizeThreshold: 10000,
}) => {
  try {
    const { round, exactDecimals, maxDecimals, defaultDecimals, humanize, humanizeThreshold } = options;
    
    const value = typeof num === "string" ? parseFloat(num) : num || 0;
    const currencyStr = currency ? ` ${currency.trim()}` : "";

    if (Math.abs(value) < 1e-9) {
      return defaultDecimals
        ? `0.${"0".repeat(defaultDecimals)}${currencyStr}`
        : `0${currencyStr}`;
    }

    if (Math.abs(value) < 1e-6) {
      return `${value.toExponential(2)}${currencyStr}`;
    }

    if (humanize && Math.abs(value) >= humanizeThreshold) {
      return `${numeral(value).format("0.[00]a")}${currencyStr}`;
    }

    if (exactDecimals) {
      const stringValue = value.toString();
      if (stringValue.includes(".")) {
        const [wholePart, decimalPart] = stringValue.split(".");
        const formattedWholePart = wholePart.replace(
          /\B(?=(\d{3})+(?!\d))/g,
          ","
        );
        const trimmedDecimalPart = decimalPart
          .slice(0, maxDecimals)
          .replace(/0+$/, "");
        return trimmedDecimalPart
          ? `${formattedWholePart}.${trimmedDecimalPart}${currencyStr}`
          : `${formattedWholePart}${currencyStr}`;
      }
      return `${value
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${currencyStr}`;
    }

    if (round) {
      const significantFigures = value > 1_000_000 ? 10 : 5;
      return `${formatCurrency(value, "", "en", false, {
        significantFigures: significantFigures,
      })}${currencyStr}`;
    }

    // Determine the number of decimal places to show
    let decimalsToShow = defaultDecimals !== undefined ? defaultDecimals : 2;

    // For very small numbers, ensure we show enough decimal places
    if (Math.abs(value) < 1 && Math.abs(value) > 0) {
      // Count leading zeros after decimal point
      const valueStr = value.toString();
      if (valueStr.includes('e-')) {
        // Handle scientific notation
        const exponent = parseInt(valueStr.split('e-')[1]);
        decimalsToShow = Math.min(Math.max(exponent, decimalsToShow), maxDecimals);
      } else if (valueStr.includes('.')) {
        const decimalPart = valueStr.split('.')[1];
        let leadingZeros = 0;
        for (let i = 0; i < decimalPart.length; i++) {
          if (decimalPart[i] === '0') {
            leadingZeros++;
          } else {
            break;
          }
        }
        decimalsToShow = Math.min(Math.max(leadingZeros + 1, decimalsToShow), maxDecimals);
      }
    }

    const fixedValue = value.toFixed(decimalsToShow);
    const [wholePart, decimalPart] = fixedValue.split(".");
    const formattedWholePart = wholePart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    // Remove trailing zeros after decimal point if they're all zeros
    const trimmedDecimalPart = decimalPart ? decimalPart.replace(/0+$/, "") : "";

    return trimmedDecimalPart
      ? `${formattedWholePart}.${trimmedDecimalPart}${currencyStr}`
      : defaultDecimals
        ? `${formattedWholePart}.${"0".repeat(defaultDecimals)}${currencyStr}`
        : `${formattedWholePart}${currencyStr}`;
  } catch (error) {
    const fallbackValue = num?.toString() || "0";
    return currency ? `${fallbackValue} ${currency.trim()}` : fallbackValue;
  }
};