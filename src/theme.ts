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

const tacticalRed: MantineColorsTuple = [
  '#ffe8e8',
  '#ffcece',
  '#ff9b9b',
  '#ff6b6b',
  '#ff4747',
  '#ff3030',
  '#ff2222',
  '#e61414',
  '#cc0a0a',
  '#b00000',
];

const tacticalOrange: MantineColorsTuple = [
  '#fff4e6',
  '#ffe8cc',
  '#ffd09b',
  '#ffb866',
  '#ffa43d',
  '#ff9721',
  '#ff8f0f',
  '#e37900',
  '#ca6a00',
  '#b05a00',
];

export const theme = createTheme({
  defaultRadius: 'sm',
  colors: {
    tacticalBlue,
    tacticalCyan,
    tacticalGreen,
    tacticalRed,
    tacticalOrange,
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
        color: 'tacticalCyan',
        variant: 'light',
      },
      styles: {
        root: {
          borderRadius: '6px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontSize: '0.875rem',
          border: '1px solid rgba(100, 255, 218, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 0 20px rgba(100, 255, 218, 0.4), 0 0 40px rgba(100, 255, 218, 0.2)',
            borderColor: 'rgba(100, 255, 218, 0.6)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          '&[data-variant="filled"]': {
            backgroundColor: 'rgba(100, 255, 218, 0.15)',
            border: '1px solid rgba(100, 255, 218, 0.5)',
            color: '#64ffda',
            '&:hover': {
              backgroundColor: 'rgba(100, 255, 218, 0.25)',
              boxShadow: '0 0 25px rgba(100, 255, 218, 0.5), 0 0 50px rgba(100, 255, 218, 0.3), inset 0 0 15px rgba(100, 255, 218, 0.2)',
            },
          },
          '&[data-variant="light"]': {
            backgroundColor: 'rgba(100, 255, 218, 0.08)',
            border: '1px solid rgba(100, 255, 218, 0.3)',
            color: '#64ffda',
            '&:hover': {
              backgroundColor: 'rgba(100, 255, 218, 0.15)',
            },
          },
          '&[data-color="tacticalRed"]': {
            borderColor: 'rgba(255, 71, 71, 0.4)',
            '&:hover': {
              boxShadow: '0 0 20px rgba(255, 71, 71, 0.4), 0 0 40px rgba(255, 71, 71, 0.2)',
              borderColor: 'rgba(255, 71, 71, 0.6)',
            },
          },
          '&[data-color="tacticalGreen"]': {
            borderColor: 'rgba(0, 227, 138, 0.4)',
            '&:hover': {
              boxShadow: '0 0 20px rgba(0, 227, 138, 0.4), 0 0 40px rgba(0, 227, 138, 0.2)',
              borderColor: 'rgba(0, 227, 138, 0.6)',
            },
          },
          '&[data-color="tacticalOrange"]': {
            borderColor: 'rgba(255, 151, 33, 0.4)',
            '&:hover': {
              boxShadow: '0 0 20px rgba(255, 151, 33, 0.4), 0 0 40px rgba(255, 151, 33, 0.2)',
              borderColor: 'rgba(255, 151, 33, 0.6)',
            },
          },
        },
      },
    },
    ActionIcon: {
      styles: {
        root: {
          border: '1px solid rgba(100, 255, 218, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1) rotate(5deg)',
            boxShadow: '0 0 15px rgba(100, 255, 218, 0.4)',
            borderColor: 'rgba(100, 255, 218, 0.6)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
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
    Table: {
      styles: {
        table: {
          borderCollapse: 'separate',
          borderSpacing: 0,
        },
        thead: {
          backgroundColor: 'rgba(10, 14, 20, 0.8)',
          borderBottom: '2px solid rgba(100, 255, 218, 0.4)',
        },
        th: {
          color: '#64ffda',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          fontSize: '0.75rem',
          padding: '16px 12px',
          borderBottom: '2px solid rgba(100, 255, 218, 0.3)',
        },
        tr: {
          transition: 'all 0.2s ease',
          borderBottom: '1px solid rgba(100, 255, 218, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(100, 255, 218, 0.05)',
            boxShadow: 'inset 0 0 20px rgba(100, 255, 218, 0.1)',
          },
        },
        td: {
          padding: '12px',
          color: '#e8eaed',
        },
      },
    },
    Badge: {
      styles: {
        root: {
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          fontWeight: 700,
          border: '1px solid currentColor',
          boxShadow: '0 0 10px currentColor',
        },
      },
    },
    Modal: {
      styles: {
        content: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(100, 255, 218, 0.3)',
          boxShadow: '0 0 40px rgba(100, 255, 218, 0.2), 0 0 80px rgba(26, 127, 255, 0.15)',
        },
        header: {
          backgroundColor: 'rgba(10, 14, 20, 0.95)',
          borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
          color: '#64ffda',
        },
        title: {
          color: '#64ffda',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        },
      },
    },
    Drawer: {
      styles: {
        content: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(100, 255, 218, 0.3)',
        },
        header: {
          backgroundColor: 'rgba(10, 14, 20, 0.95)',
          borderBottom: '1px solid rgba(100, 255, 218, 0.3)',
          color: '#64ffda',
        },
        title: {
          color: '#64ffda',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        },
      },
    },
    Input: {
      styles: {
        input: {
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(100, 255, 218, 0.3)',
          color: '#e8eaed',
          transition: 'all 0.3s ease',
          '&:focus': {
            borderColor: 'rgba(100, 255, 218, 0.6)',
            boxShadow: '0 0 15px rgba(100, 255, 218, 0.3)',
          },
        },
      },
    },
    Switch: {
      styles: {
        track: {
          cursor: 'pointer',
          border: '1px solid rgba(100, 255, 218, 0.3)',
        },
      },
    },
  },
});
