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
          primary: '#2196F3', // Blue - trustworthy, professional
          secondary: '#4CAF50', // Green - success, confirmed
          accent: '#FF9800', // Orange - pending, attention
          error: '#F44336',
          warning: '#FFC107',
          info: '#00BCD4',
          success: '#4CAF50'
        }
      }
    }
  },
  defaults: {
    VBtn: {
      style: 'text-transform: none;', // Remove uppercase
      rounded: 'lg',
      size: 'large' // Large buttons for mobile
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable'
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable'
    }
  }
})
