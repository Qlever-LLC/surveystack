
import 'vuetify/styles' // Global CSS has to be imported
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const lightTheme = {
  dark: false,
  colors: {
    primary: '#0E87CC',
    secondary: '#014D4E',
    accent: '#1FA774',
    error: '#f44336',
    warning: '#ffc107',
    info: '#82AF9C',
    success: '#8bc34a',
    appbar: '#f5f5f5',
    background: '#d9d9d9',
    heading: '#212121',
    focus: '#0E87CC',
  }
}

 export default createVuetify({
  components,
  directives,
  theme: {
    options: {
      customProperties: true,
    },
    defaultTheme: 'lightTheme',
    themes: {
      lightTheme,
    },
  },
})

