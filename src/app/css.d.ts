// A style sheet imported as its text (the app's bundles load `.css` so: scripts/build-app.mjs), for a shadow root.
declare module '*.css' {
  const text: string;
  export default text;
}
