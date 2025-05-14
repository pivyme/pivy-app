import { heroui } from "@heroui/react";
import defaultTheme from "tailwindcss/defaultTheme";

const COLORS = {
  primary: {
    DEFAULT: "#7efe9f",
    '50': '#edfff3',
    '100': '#d5ffe4',
    '200': '#aeffcb',
    '300': '#6fffa3',
    '400': '#1bff6a',
    '500': '#00e950',
    '600': '#00c23e',
    '700': '#009834',
    '800': '#04772e',
    '900': '#066128',
    '950': '#003713',
    'foreground': '#373737',
  },
  secondary: {
    DEFAULT: "#344CB7",
    50: "#EBEEF9",
    100: "#D3D9F3",
    200: "#A8B3E6",
    300: "#8091DB",
    400: "#546BCE",
    500: "#344CB7",
    600: "#2A3D93",
    700: "#202E6F",
    800: "#141E47",
    900: "#0A0F24",
    950: "#060814",
  },
  tertiary: {
    DEFAULT: "#52733A",
    50: "#9ABF80",
    100: "#91B974",
    200: "#81AF60",
    300: "#719F50",
    400: "#638B46",
    500: "#52733A",
    600: "#435F30",
    700: "#354B26",
    800: "#27361B",
    900: "#161F0F",
    950: "#0E140A",
  },
  background: {
    DEFAULT: "#404040",
    50: "#737373",
    100: "#6E6E6E",
    200: "#616161",
    300: "#575757",
    400: "#4A4A4A",
    500: "#404040",
    600: "#333333",
    700: "#292929",
    800: "#1C1C1C",
    900: "#121212",
    950: "#0D0D0D",
  },
  danger: {
    '50': '#fff1f3',
    '100': '#ffe3e7',
    '200': '#ffccd5',
    '300': '#ffa1b3',
    '400': '#ff6d8b',
    '500': '#f92758',
    '600': '#e71752',
    '700': '#c30d44',
    '800': '#a30e40',
    '900': '#8c0f3e',
    '950': '#4e031d',
    DEFAULT: '#f92758'
  },
  warning: {
    '50': '#fffbeb',
    '100': '#fff3c6',
    '200': '#ffe788',
    '300': '#fed34b',
    '400': '#fec431',
    '500': '#f89e08',
    '600': '#dc7603',
    '700': '#b65207',
    '800': '#943f0c',
    '900': '#79350e',
    '950': '#461a02',
    DEFAULT: '#fec431'
  },
  success: {
    '50': '#eafff4',
    '100': '#ccffe3',
    '200': '#9dfdce',
    '300': '#5ef7b5',
    '400': '#16d98c',
    '500': '#00d083',
    '600': '#00a96b',
    '700': '#00885a',
    '800': '#006b48',
    '900': '#00583d',
    '950': '#003223',
    DEFAULT: '#16D98C'
  },
  info: {
    '50': '#f0f3fe',
    '100': '#dde4fc',
    '200': '#c3d0fa',
    '300': '#9ab3f6',
    '400': '#6a8cf0',
    '500': '#3a5ae9',
    '600': '#3146df',
    '700': '#2934cc',
    '800': '#272ca6',
    '900': '#252a83',
    '950': '#1b1d50',
    DEFAULT: '#3A5AE9'
  },
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ...COLORS,
      },
      fontFamily: {
        sans: ["'Inter Variable'", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      defaultTheme: "light",
    }),
  ],
};
