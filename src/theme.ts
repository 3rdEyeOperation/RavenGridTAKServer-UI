import { createTheme, MantineColorsTuple } from '@mantine/core';

const tacticalBlue: MantineColorsTuple = [
  '#e6f4ff',
  '#c1e0ff',
  '#9acbff',
  '#6fb3ff',
  '#4a9eff',
  '#2d8cff',
  '#1a7fff',
  '#0066e3',
  '#0056ca',
  '#0046b0',
];

const tacticalCyan: MantineColorsTuple = [
  '#e0f9ff',
  '#c7f0ff',
  '#9ae3ff',
  '#6bd6ff',
  '#48cbff',
  '#31c4ff',
  '#1fbfff',
  '#00a8e4',
  '#0095cc',
  '#0081b4',
];

const tacticalGreen: MantineColorsTuple = [
  '#e6fff5',
  '#c7ffeb',
  '#9affd8',
  '#6bffc4',
  '#48ffb4',
  '#31ffa8',
  '#1fffa1',
  '#00e38a',
  '#00ca7a',
  '#00b069',
];

export const theme = createTheme({
  defaultRadius: 'sm',
  colors: {
    tacticalBlue,
    tacticalCyan,
    tacticalGreen,
  },
  primaryColor: 'tacticalCyan',
  black: '#0a0e14',
  white: '#e8eaed',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontFamilyMonospace: '"JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace',
  headings: {
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2rem', lineHeight: '1.3' },
      h2: { fontSize: '1.5rem', lineHeight: '1.35' },
      h3: { fontSize: '1.25rem', lineHeight: '1.4' },
      h4: { fontSize: '1.1rem', lineHeight: '1.45' },
    },
  },
  defaultGradient: {
    from: 'tacticalCyan',
    to: 'tacticalBlue',
    deg: 135,
  },
  components: {
    Paper: {
      defaultProps: {
        style: {
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(100, 255, 218, 0.15)',
        },
      },
    },
    Title: {
      defaultProps: {
        style: {
          color: '#e8eaed',
        },
      },
    },
    Text: {
      defaultProps: {
        style: {
          color: '#b4bcc8',
        },
      },
    },
    Button: {
      defaultProps: {
        style: {
          borderRadius: '4px',
        },
      },
    },
    Card: {
      defaultProps: {
        style: {
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(100, 255, 218, 0.2)',
        },
      },
    },
  },
});
