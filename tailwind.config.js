/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Azul Principal (Brand / Topo / Destaques)
        brand: {
          DEFAULT: '#3B3B98', // Azul Institucional
          dark: '#2B3990',
        },
        // Vermelho / Coral (Ação e Ofertas)
        accent: {
          DEFAULT: '#E30613', // Vermelho VBR / Destaque
          hover: '#EE3124',
        },
        // Fundos
        surface: '#FFFFFF',    // Fundo de Seções e Cards
        bgMain: '#F4F5F7',     // Fundo do E-commerce Neutro
        bgAlt: '#F8F9FA',
        // Textos
        textPrimary: '#333333',   // Grafite / Preto Suave
        textDark: '#2B2B2B',
        textSecondary: '#666666', // Cinza Médio
        textMuted: '#777777',
      },
      fontFamily: {
        sans: ['Roboto', 'Open Sans', 'sans-serif', 'Arial', 'Helvetica'],
        heading: ['Montserrat', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}