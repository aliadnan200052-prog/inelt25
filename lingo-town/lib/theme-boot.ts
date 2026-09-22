export const THEME_KEY = "lingo-town:theme";

/** Inline script for <head>: applies the saved theme before first paint. */
export const themeBootScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;
