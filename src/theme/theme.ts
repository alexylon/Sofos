'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const grey = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#eeeeee',
  300: '#e0e0e0',
  400: '#bdbdbd',
  500: '#9e9e9e',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    background: {
      default: '#ffffff',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#000000',
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

const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    grey,
    background: {
      default: '#080808', // general background
      paper: '#2B2B2B', // assistant bg color
    },
    text: {
      primary: '#D9D9D9', // text color
      secondary: '#B0B0B0',
    },
    primary: {
      main: '#aaaaaa',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#111111',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: '#444444',
        },
      },
    },
  },
  shape: { borderRadius: 4 },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Custom colors for messages that aren't part of MUI theme
export const messageColors = {
  light: {
    userMessage: '#a9d3ea',
    assistantMessage: '#f0f0f0',
    errorMessage: '#eaa9a9',
    attachmentBackground: '#a9eae0',
    sendMessageContainer: '#FFFFFF',
    inputBackground: '#FAFAFA',
    inputDisabled: '#F0F0F0',
  },
  dark: {
    userMessage: '#282828', // user background color
    assistantMessage: '#141414', // assistant bg color
    errorMessage: '#5C2626',
    attachmentBackground: '#1A4D45',
    sendMessageContainer: '#121212', // send message container bg color
    inputBackground: '#1E1E1E',
    inputDisabled: '#181818',
  },
};
