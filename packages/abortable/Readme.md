# Abortable

Provides [all](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise/all), [props](http://bluebirdjs.com/docs/api/promise.props.html) and [race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race) for working with promises which can be `abort()`ed or `.cancel()`ed.

## Installation

`yarn add abortable`

or for npm

`npm install abortable --save`

## Usage

```javascript
import { all, props, race } from 'abortable';
import { requestOne } from './abortableOperation'
import { requestTwo } from './cancelableRequest'

const allAbortable = all([requestOne, requestTwo])
allAbortable.then(([resultOne, resultTwo]) => {
  console.log(resultOne, resultTwo);
})
allAbortable.abort();

const mapAbortable = props({ one: requestOne, two: requestTwo })
mapAbortable.then(({ one, two }) => {
  console.log(one, two);
});
mapAbortable.abort();

const raceAbortable = race([requestOne, requestTwo])
raceAbortable.then((oneOrTwo) => {
  console.log(oneOrTwo);
})
raceAbortable.abort();
```