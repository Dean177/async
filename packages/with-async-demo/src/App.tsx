import React, { useState } from 'react'
import { useAsync, hasFailed, isLoading, hasSucceeded } from 'with-async'
import './App.css'

const delay = (milliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, milliseconds))

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
const jsonPlaceholderPosts = (postId: string): Promise<Post> =>
  delay(3000)
    .then(() => {
      const success = Math.random() > 0.3
      return success
        ? fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`)
        : Promise.reject(new Error('A Random failure'))
    })
    .then((response: Response) => response.json())
    .then(
      (post: any): Post => {
        if (!post.title || !post.body) {
          return { post: null }
        }
        return { post }
      },
    )

type OwnProps = { postId: string }
const AsyncComponent = (props: OwnProps) => {
  const async = useAsync(() => jsonPlaceholderPosts(props.postId), [props.postId])
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
  const [selectedPostId, setPostId] = useState('5')
  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => setPostId(event.target.value)

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
          You can view the code for these examples <a href="">here</a>
        </p>
        <div className="example">
          <h2>Props</h2>
          <p>
            This example talks to{' '}
            <a href="https://jsonplaceholder.typicode.com/">jsonplaceholder.typicode.com</a> in
            order to fetch some JSON. The request will randomly fail. Try changing the post id.
          </p>
          <LabelledValue label={'Post ID'}>
            <input
              className="post-id-input"
              onChange={onChange}
              type="number"
              value={selectedPostId}
            />
          </LabelledValue>
          <AsyncComponent postId={selectedPostId} />
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
