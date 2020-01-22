import { Abortable } from 'abortable'
import React, { useState } from 'react'
import { useAsync, hasFailed, isLoading, hasSucceeded } from 'with-async'
import './App.css'

const delay = (milliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

const fetchUnreliably = (postId: string): Abortable<Post> => {
  const controller = new AbortController()
  const signal = controller.signal
  const shouldFail = Math.random() < 0.3
  const url = `https://jsonplaceholder.typicode.com/posts/${postId}`
  const request = new Promise((resolve, reject) => {
    if (shouldFail) {
      signal.addEventListener('abort', () => {
        reject(new DOMException('Pretend cancelation event', 'AbortError'))
      })
    }
    delay(3000).then(() => {
      if (shouldFail) {
        if (!signal.aborted) {
          reject(new Error('A Random failure'))
        }
      } else {
        fetch(url, { signal })
          .then(response => response.json())
          .then(
            (post: any): Post => {
              if (!post.title || !post.body) {
                return { post: null }
              }
              return { post }
            },
          )
          .then(post => resolve(post))
          .catch(error => reject(error))
      }
    })
  }) as Abortable<Post>

  request.abort = () => {
    controller.abort()
  }

  return request
}

const LabelledValue = (props: { label: string; children?: React.ReactNode }) => (
  <div className="LabelledValue">
    <label className="label">{props.label}</label>
    {props.children && <div className="value">{props.children}</div>}
  </div>
)

const ProgressIndicator = () => (
  <div className="ProgressIndicator">
    <div className="loader">Loading ...</div>
    <div>Loading</div>
  </div>
)

const ErrorMessage = () => (
  <div className="ErrorBox">
    <p>Request failed.</p>
  </div>
)

type Post = { post: { title: string; body: string } | null }

const AsyncComponent = () => {
  const [postId, setPostId] = useState('5')
  const async = useAsync(() => fetchUnreliably(postId), [postId])
  return (
    <>
      <LabelledValue label={'Post ID'}>
        <input
          className="post-id-input"
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => setPostId(event.target.value)}
          type="number"
          value={postId}
        />
        <button onClick={() => async.call(true)}>Fetch again with loading state</button>
        <button onClick={() => async.call()}>Fetch again in background</button>
      </LabelledValue>
      <div className="DisplayPost">
        {isLoading(async) && <ProgressIndicator />}
        {hasFailed(async) && <ErrorMessage />}
        {hasSucceeded(async) &&
          (async.result.post == null ? (
            <div>No post found with id {postId}</div>
          ) : (
            <>
              <LabelledValue label="Title">{async.result.post.title}</LabelledValue>
              <LabelledValue label="Body">
                <p>{async.result.post.body}</p>
              </LabelledValue>
            </>
          ))}
      </div>
    </>
  )
}

const conversionRateApi = () => delay(100).then(() => Math.random())

const LiveExample = () => {
  const async = useAsync(conversionRateApi, [], { pollInterval: 1000 })
  return (
    <div>
      {isLoading(async) && <ProgressIndicator />}
      {hasFailed(async) && <ErrorMessage />}
      {hasSucceeded(async) && <p>{async.result}</p>}
    </div>
  )
}

export const App = () => {
  return (
    <>
      <a href="https://github.com/Dean177/with-async">
        <img
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            border: 0,
          }}
          src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png"
          alt="Fork me on GitHub"
        />
      </a>
      <div className="App">
        <h1>with-async</h1>
        <p>
          You can view the code for these examples{' '}
          <a href="https://github.com/Dean177/async/tree/master/packages/with-async-demo">here</a>
        </p>
        <div className="example">
          <h2>Props</h2>
          <p>
            This example talks to{' '}
            <a href="https://jsonplaceholder.typicode.com/">jsonplaceholder.typicode.com</a> in
            order to fetch some JSON. The request will randomly fail. Try changing the post id.
          </p>
          <AsyncComponent />
        </div>
        <div className="example">
          <h2>Polling</h2>
          <p>
            This example generates a new random number every second, imaging polling an API for the
            latest data.
          </p>
          <LiveExample />
        </div>
      </div>
    </>
  )
}
