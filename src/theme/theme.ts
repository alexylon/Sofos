'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

export type ThemeColors = {
  light: {
    userMessage: string;
    userText?: string;
    assistantMessage: string;
    errorMessage: string;
    attachmentBackground: string;
    sendMessageContainer: string;
    inputBackground: string;
    inputDisabled: string;
  };
  dark: {
    userMessage: string;
    userText?: string;
    assistantMessage: string;
    errorMessage: string;
    attachmentBackground: string;
    sendMessageContainer: string;
    inputBackground: string;
    inputDisabled: string;
  };
};

export type Grey = {
  50: string;
  100: string;
  150: string;
  200: string;
  250: string;
  300: string;
  350: string;
  400: string;
  450: string;
  500: string;
  550: string;
  600: string;
  650: string;
  700: string;
  750: string;
  800: string;
  850: string;
  900: string;
  950: string;
}

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    background: {
      default: '#FFFFFF', // general background
      paper: '#F0F0F0',
    },
    text: {
      primary: '#000000', // general text color
      secondary: '#7d7d7d',
    },
    primary: {
      main: '#1976d2',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2',
        },
      },
    },
  },
  shape: { borderRadius: 4 },
};

// @ts-ignore
const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: {
      default: '#000000', // general background
      paper: '#2B2B2B',
    },
    text: {
      primary: '#E6E6E6',// general text color
      secondary: '#C0C0C0',
    },
    primary: {
      main: '#4DA3FF',
      contrastText: '#000000',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#161B22',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: '#2B2B2B',
        },
      },
    },
  },
  shape: { borderRadius: 4 },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Custom colors for messages that aren't part of MUI theme
export const themeColors: ThemeColors = {
  light: {
    userMessage: '#D2E4FA', // user background color
    userText: lightThemeOptions.palette?.text?.primary,
    assistantMessage: '#ECECF1', // assistant bg color
    errorMessage: '#eaa9a9',
    attachmentBackground: '#a9eae0',
    sendMessageContainer: '#FFFFFF',
    inputBackground: '#FAFAFA',
    inputDisabled: '#F0F0F0',
  },
  dark: {
    userMessage: '#243240', // user background color
    userText: darkThemeOptions.palette?.text?.primary,
    assistantMessage: '#262629', // assistant bg color
    errorMessage: '#5C2626',
    attachmentBackground: '#1A4D45',
    sendMessageContainer: '#121212', // send message container bg color
    inputBackground: '#1E1E1E',
    inputDisabled: '#181818',
  },
};

export const grey: Grey = {
  50: '#FAFAFA',
  100: '#EDEDED',
  150: '#E1E1E1',
  200: '#D5D5D5',
  250: '#C9C9C9',
  300: '#BEBEBE',
  350: '#B3B3B3',
  400: '#A8A8A8',
  450: '#9E9E9E',
  500: '#939393',
  550: '#8A8A8A',
  600: '#808080',
  650: '#777777',
  700: '#6E6E6E',
  750: '#666666',
  800: '#5D5D5D',
  850: '#555555',
  900: '#4D4D4D',
  950: '#3F3F3F',
};
