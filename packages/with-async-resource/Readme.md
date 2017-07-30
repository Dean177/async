# with-async-resource

Avoid boilerplate and a common pitfalls when working with promise producing functions in react

## Installation

`yarn add with-async-resource`

Or if using npm

`npm install --save with-async-resource`

## Usage

Using typescript

```typescript jsx
// ExampleComponent.tsx
import * as React from 'react';
import { AsyncProps, withAsyncResource } from 'with-async-resource';

type TestAsyncValue = { chocolate: number };
type TestComponentOwnProps = { quantity: number };
type Props = TestComponentOwnProps & AsyncProps<TestAsyncValue>;
export const ExampleComponent = (props: Props) =>
  <div>
    <div className="quantity">{props.quantity}</div>
    <div className="error">{props.async.error == null}</div>
    <div className="isLoading">{props.async.isLoading}</div>
    <div className="result">{props.async.result == null}</div>
  </div>;

export const EnhancedComponent = withAsyncResource(
  (props: TestComponentOwnProps): Promise<TestAsyncValue> => apiCall(props.quantity)
)(TestComponent)

// ExampleOtherComponent.tsx
import * as React from 'react';
import { EnhancedComponent } from './TestComponent';

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

