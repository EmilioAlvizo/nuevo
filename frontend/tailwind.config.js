/** @type {import('tailwindcss').Config} */
module.exports = {
  // 👇 ESTA LÍNEA es la que hace que Tailwind predomine sobre Bootstrap

  // Esto asegura que Tailwind busque clases en tus archivos HTML y TS
  content: [
    "./src/**/*.{html,ts}",
  ],
  important: true,

  theme: {
    extend: {},
  },

  plugins: [],

  // Opcional: Desactiva el "reset" de Tailwind para no romper los inputs de Bootstrap
  corePlugins: {
    preflight: false,
  }
}