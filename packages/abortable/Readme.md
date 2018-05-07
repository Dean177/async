# Abortable

Provides [all](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) and [race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) for working with abortable promises.

## Installation

`yarn add abortable`

or for npm

`npm install abortable --save`

## Usage

```javascript
import { all, race } from 'abortable';

const allAbortable = all([requestOne, requestTwo])
allAbortable.then(([resultOne, resultTwo]) => {
  console.log(resultOne, resultTwo);
})

allAbortable.abort();

const mapAbortable = map({ a: requestA, b: requestB })
mapAbortable.then(result => {
  console.log(result.a, result.b);
});

allAbortable.abort();

const raceAbortable = race([requestOne, requestTwo])
raceAbortable.then((result) => {
  console.log(result);
})

raceAbortable.abort();
```