import { createTheme, ThemeOptions } from '@mui/material/styles';

/**
 * Bariisaa Tv Admin — modern design system (purple + gold, matching mobile).
 *
 * Legacy palette keys (`deepTeal`, `warmGray`, …) are intentionally kept as
 * aliases to the brand palette so every existing `palette.*` reference across
 * the app re-themes in place without touching individual pages.
 */
export const palette = {
  // Text
  ink: '#1E1B2E',
  inkLight: '#3A3657',
  inkMuted: '#6E6A85',
  // Surfaces
  paper: '#F5F4FA', // app background
  parchment: '#FFFFFF', // cards / surfaces
  warmGray: '#E4E1F0', // borders / dividers
  warmGrayLight: '#F0EEF8', // subtle hover / neutral fills
  // Primary (brand purple)
  deepTeal: '#402083',
  deepTealDark: '#3D2081',
  deepTealLight: '#EEE8FA',
  // Accent (gold)
  gold: '#FFD75A',
  goldDark: '#E3B92F',
  goldLight: '#FFF3C4',
  // Semantic
  coral: '#E5484D',
  coralLight: '#FDE8E8',
  amber: '#B45309',
  amberLight: '#FEF3C7',
  emerald: '#059669',
  emeraldLight: '#D1FAE5',
};

export const typography = {
  serif: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
  sans: '"Inter", "Roboto", "Helvetica Neue", "Arial", sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    background: {
      default: palette.paper,
      paper: palette.parchment,
    },
    text: {
      primary: palette.ink,
      secondary: palette.inkMuted,
    },
    primary: {
      main: palette.deepTeal,
      dark: palette.deepTealDark,
      light: palette.deepTealLight,
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: palette.gold,
      dark: palette.goldDark,
      light: palette.goldLight,
      contrastText: palette.ink,
    },
    error: {
      main: palette.coral,
      light: palette.coralLight,
    },
    warning: {
      main: palette.amber,
      light: palette.amberLight,
    },
    success: {
      main: palette.emerald,
      light: palette.emeraldLight,
    },
    divider: palette.warmGray,
  },
  typography: {
    fontFamily: typography.sans,
    h1: { fontFamily: typography.sans, fontWeight: 800, letterSpacing: '-0.02em' },
    h2: { fontFamily: typography.sans, fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontFamily: typography.sans, fontWeight: 800, letterSpacing: '-0.01em' },
    h4: { fontFamily: typography.sans, fontWeight: 800, letterSpacing: '-0.01em' },
    h5: { fontFamily: typography.sans, fontWeight: 700 },
    h6: { fontFamily: typography.sans, fontWeight: 700 },
    subtitle1: { fontFamily: typography.sans, fontWeight: 600 },
    subtitle2: { fontFamily: typography.sans, fontWeight: 600 },
    body1: { fontFamily: typography.sans },
    body2: { fontFamily: typography.sans },
    button: { fontFamily: typography.sans, fontWeight: 600, textTransform: 'none' },
    caption: { fontFamily: typography.sans, color: palette.inkMuted },
    overline: { fontFamily: typography.mono, textTransform: 'uppercase', letterSpacing: '0.08em' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: `${palette.warmGray} transparent`,
        },
        '::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '::-webkit-scrollbar-thumb': {
          backgroundColor: palette.warmGray,
          borderRadius: '3px',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          boxShadow: 'none',
          transition: 'all 150ms ease',
        },
        containedPrimary: {
          backgroundImage: `linear-gradient(135deg, ${palette.deepTeal} 0%, ${palette.deepTealDark} 100%)`,
          '&:hover': {
            backgroundImage: `linear-gradient(135deg, ${palette.deepTealDark} 0%, #2E1760 100%)`,
            boxShadow: '0 6px 16px rgba(64, 32, 131, 0.3)',
          },
        },
        outlined: {
          borderColor: palette.warmGray,
          color: palette.ink,
          '&:hover': {
            backgroundColor: palette.warmGrayLight,
            borderColor: palette.deepTeal,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.inkMuted,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: palette.deepTeal,
            borderWidth: 2,
          },
        },
        notchedOutline: {
          borderColor: palette.warmGray,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '13px',
          fontWeight: 500,
          color: palette.inkMuted,
          '&.Mui-focused': { color: palette.deepTeal },
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: { marginLeft: 2, marginTop: 4, fontSize: '11.5px' },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: palette.warmGray,
          '&.Mui-checked': { color: palette.deepTeal },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: palette.warmGray,
          '&.Mui-checked': { color: palette.deepTeal },
          '&.Mui-checked + .MuiSwitch-track': { backgroundColor: palette.deepTeal },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: { color: palette.warmGray, '&.Mui-checked': { color: palette.deepTeal } },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { paddingTop: '16px !important' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(30, 27, 46, 0.06), 0 8px 24px rgba(30, 27, 46, 0.04)',
          border: `1px solid ${palette.warmGrayLight}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          color: palette.ink,
          boxShadow: 'none',
          borderBottom: `1px solid ${palette.warmGrayLight}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: palette.parchment,
          borderRight: `1px solid ${palette.warmGrayLight}`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '10px',
          transition: 'all 150ms ease',
          '&.Mui-selected': {
            backgroundColor: palette.deepTealLight,
            color: palette.deepTealDark,
            '& .MuiListItemIcon-root': {
              color: palette.deepTeal,
            },
          },
          '&:hover': {
            backgroundColor: palette.warmGrayLight,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '999px',
          fontWeight: 600,
          fontSize: '12px',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${palette.warmGrayLight}`,
          fontFamily: typography.sans,
        },
        head: {
          fontFamily: typography.sans,
          fontWeight: 600,
          color: palette.inkMuted,
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.05em',
          backgroundColor: palette.warmGrayLight,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: palette.warmGrayLight,
          borderRadius: '8px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.ink,
          fontSize: '12px',
          borderRadius: '6px',
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

export default theme;
