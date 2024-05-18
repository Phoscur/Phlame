import { Element } from 'html-element';
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
globalThis.HTMLElement = Element;
// TODO? do we even need this, run the Elements on server-side?
// An empty class would do, if it's only about prerendering using jsx.

// simple window emulation
const window = Object.create(globalThis);
window.name = 'globalThis';
globalThis.window = window;
