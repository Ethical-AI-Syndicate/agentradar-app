import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2E7D32',      // Dark Green - Professional real estate
    accent: '#FF6B35',       // Orange accent - Alert color
    background: '#FAFAFA',   // Light background
    surface: '#FFFFFF',      // Card backgrounds
    text: {
      primary: '#212121',    // Dark text
      secondary: '#757575',  // Gray text
      disabled: '#BDBDBD',   // Disabled text
    },
    border: '#E0E0E0',       // Border color
    success: '#4CAF50',      // Success green
    warning: '#FFC107',      // Warning yellow
    error: '#F44336',        // Error red
    info: '#2196F3',         // Info blue
    
    // Alert Priority Colors
    priority: {
      LOW: '#81C784',        // Light green
      MEDIUM: '#FFB74D',     // Orange
      HIGH: '#FF8A65',       // Light red
      URGENT: '#E57373',     // Red
    },

    // Alert Type Colors
    alertTypes: {
      POWER_OF_SALE: '#FF6B35',
      ESTATE_SALE: '#8E24AA',
      DEVELOPMENT_APPLICATION: '#1976D2',
      MUNICIPAL_PERMIT: '#388E3C',
      PROBATE_FILING: '#F57C00',
      TAX_SALE: '#D32F2F',
    },

    // Status Colors
    status: {
      ACTIVE: '#4CAF50',
      RESOLVED: '#9E9E9E',
      EXPIRED: '#757575',
      CANCELLED: '#F44336',
    }
  },

  // Typography
  fonts: {
    ...DefaultTheme.fonts,
    heading: {
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 32,
    },
    subheading: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    label: {
      fontSize: 12,
      fontWeight: '500',
      lineHeight: 16,
      letterSpacing: 0.5,
    }
  },

  // Spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  // Border Radius
  roundness: 8,
  borderRadius: {
    small: 4,
    medium: 8,
    large: 12,
    full: 50,
  },

  // Shadows
  shadows: {
    small: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.22,
      shadowRadius: 2.22,
      elevation: 3,
    },
    medium: {
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    large: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },

  // Component specific styles
  components: {
    card: {
      borderRadius: 12,
      padding: 16,
      backgroundColor: '#FFFFFF',
      marginBottom: 16,
    },
    button: {
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    input: {
      borderRadius: 8,
      borderWidth: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    alertCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      backgroundColor: '#FFFFFF',
    }
  }
};

export type AppTheme = typeof theme;