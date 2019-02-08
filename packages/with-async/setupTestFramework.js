const Enzyme = require("enzyme");
const Adapter = require("enzyme-adapter-react-16");
const { JSDOM } = require("jsdom");

// In tests, polyfill requestAnimationFrame since jsdom doesn't provide it yet.

require('raf').polyfill(global);
Enzyme.configure({ adapter: new Adapter() });

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = jsdom;

function copyProps(src, target) {
  const props = Object.getOwnPropertyNames(src)
    .filter(prop => typeof target[prop] === "undefined")
    .map(prop => Object.getOwnPropertyDescriptor(src, prop));
  Object.defineProperties(target, props);
}

global.window = window;
global.document = window.document;
global.navigator = {
  userAgent: "node.js"
};

copyProps(window, global);
