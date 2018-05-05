// In tests, polyfill requestAnimationFrame since jsdom doesn't provide it yet.
require('raf').polyfill(global);