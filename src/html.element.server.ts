import { Element } from 'html-element';
globalThis.HTMLElement = Element;
// TODO? do we even need this, run the Elements on server-side?
// An empty class would do, if it's only about prerendering using jsx.
