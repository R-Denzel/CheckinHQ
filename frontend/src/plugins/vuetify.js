import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'

/**
 * Vuetify configuration
 * Mobile-first, simple, clean theme
 */
export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi }
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#25D366', // WhatsApp green - main actions
          secondary: '#128C7E', // Darker WhatsApp green - secondary actions
          accent: '#DCF8C6', // Light green - highlights, active states
          background: '#FAFAFA', // Very light neutral background
          surface: '#FFFFFF', // White cards
          'on-surface': '#262626', // Dark text
          'text-secondary': '#667781', // Secondary text (WhatsApp gray)
          error: '#E63946',
          warning: '#F77F00',
          info: '#06BEE1',
          success: '#25D366'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none;',
      rounded: 'pill', // More friendly, WhatsApp-like
      elevation: 0, // Flat design
      size: 'large'
    },
    VCard: {
      elevation: 0,
      rounded: 'lg',
      border: 'sm',
      style: 'border-color: #E9EDEF;' // Subtle border like WhatsApp
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg'
    },
    VChip: {
      rounded: 'lg',
      elevation: 0
    }
  }
})
