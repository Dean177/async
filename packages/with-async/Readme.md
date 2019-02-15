# with-async

Avoid boilerplate and a common pitfalls when working with asynchronous data in react.

A soon to be obsolete way of dealing with asynchronous data in react components. Provides a [hook](https://reactjs.org/docs/hooks-intro.html), [higher-order component](https://reactjs.org/docs/higher-order-components.html) and [render prop](https://reactjs.org/docs/render-props.html) so you can pick your favorite flavor.

## Installation

`yarn add with-async`

Or if using npm

`npm install --save with-async`

## Usage

Check out the [demo](https://dean177.github.io/higher-order-async/) and the [code that drives it](https://github.com/Dean177/higher-order-async/tree/master/packages/with-async-demo) folder.

```typescript jsx
import React from 'react';
import { useAsync, isLoading, hasFailed, hasSucceeded } from 'with-async';
import { fetchJsonPlaceholderPost } from './remote-api';

export const AsyncComponent = (props) => {
  const async = useAsync(() => fetchJsonPlaceholderPost(props.postId), [props.postId])
  return (
    <div className="DisplayPost">
      {isLoading(async) && <ProgressIndicator />}
      {hasFailed(async) && <ErrorMessage />}
      {hasSucceeded(async) &&
        (async.result.post == null ? (
          <div>No post found with id {props.postId}</div>
        ) : (
          <>
            <LabelledValue label="Title">{async.result.post.title}</LabelledValue>
            <LabelledValue label="Body">
              <p>{async.result.post.body}</p>
            </LabelledValue>
          </>
        ))}
      <button onClick={() => async.call(true)}>Fetch again with loading state</button>
      <button onClick={() => async.call()}>Fetch again in background</button>
    </div>
  )
}
```

## Polling for changes

```typescript jsx
import React from 'react';
import { useAsync, hasSucceeded } from 'with-async';
import { fetchJsonPlaceholderPost } from './remote-api';

export const PollingComponent = (props) => {
  const async = useAsync(
    () => fetchJsonPlaceholderPost(props.postId), 
    [props.postId], 
    { pollInterval: 1000 }
  )
  return (
    <div className="DisplayPost">
      {hasSucceeded(async) &&
        (async.result.post == null ? (
          <>
            <LabelledValue label="Title">{async.result.post.title}</LabelledValue>
            <LabelledValue label="Body">
              <p>{async.result.post.body}</p>
            </LabelledValue>
          </>
        )}
    </div>
  )
}
```

## Imperative api

```typescript jsx
import React from 'react';
import { useAsync, hasFailed } from 'with-async';
import { fetchJsonPlaceholderPost } from './remote-api';

export const RetryComponent = (props) => {
  const async = useAsync(() => fetchJsonPlaceholderPost(props.postId), [props.postId])
  return (
    <div className="DisplayPost">
      {hasFailed(async) && (    
        <>
          <button onClick={() => async.call(true)}>Retry with a loading state</button>
          <button onClick={() => async.call()}>Retry silently</button>
        </>
      )}
    </div>
  )
}
```
