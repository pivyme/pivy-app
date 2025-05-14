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
    DEFAULT: "#43b1ff",
    '50': '#eff7ff',
    '100': '#dfefff',
    '200': '#b8dfff',
    '300': '#78c6ff',
    '400': '#43b1ff',
    '500': '#068ff1',
    '600': '#0070ce',
    '700': '#0059a7',
    '800': '#024b8a',
    '900': '#084072',
    '950': '#06284b',
  },
  tertiary: {
    '50': '#eefff3',
    '100': '#d6ffe4',
    '200': '#b0ffcb',
    '300': '#73ffa4',
    '400': '#2ff974',
    '500': '#04d84d',
    '600': '#00bd3f',
    '700': '#019435',
    '800': '#08732e',
    '900': '#085f29',
    '950': '#003514',
    DEFAULT: '#04D84D'
  },
  background: {
    DEFAULT: "#FAFBFC",
    50: "#FFFFFF",
    100: "#FFFFFF",
    200: "#FCFCFD",
    300: "#FCFCFD",
    400: "#FCFCFD",
    500: "#FAFBFC",
    600: "#f4f4f5",
    700: "#D6DEE6",
    800: "#C2CFDB",
    900: "#B3C2D1",
    950: "#A9BACB"
  },
  danger: {
    '50': '#fff7ec',
    '100': '#ffedd3',
    '200': '#ffd7a5',
    '300': '#ffba6d',
    '400': '#ff9132',
    '500': '#ff710a',
    '600': '#ff5700',
    '700': '#cc3d02',
    '800': '#a1300b',
    '900': '#822a0c',
    '950': '#461204',
    DEFAULT: '#ff5700'
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
    '50': '#eefff3',
    '100': '#d6ffe4',
    '200': '#b0ffcb',
    '300': '#73ffa4',
    '400': '#2ff974',
    '500': '#04d84d',
    '600': '#00bd3f',
    '700': '#019435',
    '800': '#08732e',
    '900': '#085f29',
    '950': '#003514',
    DEFAULT: '#04D84D'
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
