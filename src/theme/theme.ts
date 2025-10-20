'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    background: {
      default: '#F0F0F0',
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
          backgroundColor: '#1976d2', // Keep top bar the same for both themes
        },
      },
    },
  },
};

const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    background: {
      default: '#181818', // general background
      paper: '#2B2B2B', // assistant bg color
    },
    text: {
      primary: '#D9D9D9', // text color
      secondary: '#B0B0B0',
    },
    primary: {
      main: '#1976d2',
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1976d2', // Keep top bar the same for both themes
        },
      },
    },
  },
};

export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Custom colors for messages that aren't part of MUI theme
export const messageColors = {
  light: {
    userMessage: '#a9d3ea',
    assistantMessage: '#d5d5d5',
    errorMessage: '#eaa9a9',
    attachmentBackground: '#a9eae0',
    sendMessageContainer: '#FFFFFF',
    inputBackground: '#FAFAFA',
    inputDisabled: '#F0F0F0',
  },
  dark: {
    userMessage: '#153C52', // user background color
    assistantMessage: '#2B2B2B', // assistant bg color
    errorMessage: '#5C2626',
    attachmentBackground: '#1A4D45',
    sendMessageContainer: '#121212', // send message container bg color
    inputBackground: '#1E1E1E',
    inputDisabled: '#181818',
  },
};
