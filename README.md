# Stagetime ⏲

Stagetime keeps your meetings on track by giving every voice a fair shot at the floor.

Add your speakers, set a total time limit, and hit Start when someone begins talking. Each person gets their own timer that counts up in real time, color-coded, so you can read the room at a glance.
  
A shared progress bar at the top shows who's spoken and for how long, in the order it actually happened, so the whole group can see how the conversation is unfolding.

When time runs low, the bar turns red. When someone runs over, it keeps counting, no hard stops, just honest visibility. Shuffle the speaker order with one tap, reset individual timers between rounds, and adjust the lineup on the fly from the settings panel.

# Demo

https://github.com/user-attachments/assets/fa916f59-c2ec-4ab0-b67b-6dfb017d2ef9


# Live Version
You can give it a try [here](https://antoniocosentino.github.io/stagetime/)

---



## Project settings

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
