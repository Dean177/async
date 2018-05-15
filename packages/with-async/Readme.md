# with-async

Avoid boilerplate and a common pitfalls when working with promise producing functions in react

## Installation

`yarn add with-async-resource`

Or if using npm

`npm install --save with-async-resource`

## Usage

Check out the [demo](https://dean177.github.io/higher-order-async/) and the [example](https://github.com/Dean177/higher-order-async/tree/master/packages/with-async-resource/example) folder.

Using typescript

```typescript jsx
// ExampleComponent.tsx
import * as React from 'react';
import { AsyncProps, withAsyncResource } from 'with-async-resource';
import { apiCall } from './api';

type TestAsyncValue = { chocolate: number };
type TestComponentOwnProps = { quantity: number };
export const ExampleComponent = (props: TestComponentOwnProps & AsyncProps<TestAsyncValue>) =>
  <div>
    <div className="quantity">{props.quantity}</div>
    <div className="error">{props.async.error == null}</div>
    <div className="isLoading">{props.async.isLoading}</div>
    <div className="result">{props.async.result == null}</div>
  </div>;

const enhance = withAsyncResource((props: TestComponentOwnProps): Promise<TestAsyncValue> => apiCall(props.quantity))     
    
export const EnhancedComponent: React.ComponentType<TestComponentOwnProps> = enhance(ExampleComponent)

// ExampleOtherComponent.tsx
import * as React from 'react';
import { EnhancedComponent } from './ExampleComponent';

export const ExampleOtherComponent = () =>
  <div>
    <h1>Using the component</h1>  
    <EnhancedComponent quantity={3} />
  </div>
```

Or using javascript

```javascript
// ExampleComponent.jsx
import React from 'react';
import { withAsyncResource } from 'with-async-resource';

export const ExampleComponent = (props) =>
  <div>
    <div className="quantity">{props.quantity}</div>
    <div className="error">{props.async.error == null}</div>
    <div className="isLoading">{props.async.isLoading}</div>
    <div className="result">{props.async.result == null}</div>
  </div>;

export const EnhancedComponent = 
  withAsyncResource((props) => apiCall(props.quantity))(TestComponent);

// ExampleOtherComponent.jsx
import * as React from 'react';
import { EnhancedComponent } from './ExampleComponent';

export const ExampleOtherComponent = () =>
  <div>
    <h1>Using the component</h1>  
    <EnhancedComponent quantity={3} />
  </div>
```

## With recompose

## Polling for changes

## Imperative api