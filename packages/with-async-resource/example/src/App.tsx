import * as React from 'react';
import { AsyncProps, withAsyncResource } from 'with-async-resource';
import './App.css';

const delay = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const apiCall = (quantity: number): Promise<TestAsyncValue> =>
  delay(2000).then(() => ({ chocolate: quantity * 10 }));

const LabelledValue = (props: { label: string, children: React.ReactNode }) => (
  <div className="LabelledValue">
    <div className="label">{props.label}</div>
    <div className="value">{props.children}</div>
  </div>
);

type TestAsyncValue = { chocolate: number };
type TestComponentOwnProps = { quantity: number };
export const ExampleComponent = (props: TestComponentOwnProps & AsyncProps<TestAsyncValue>) => (
  <div className="ExampleComponent">
    <LabelledValue label="Has error">{(props.async.error != null) + ''}</LabelledValue>
    <LabelledValue label="Loading">{props.async.isLoading + ''}</LabelledValue>
    <LabelledValue label="Result">
      <pre>{JSON.stringify(props.async.result, null, 2)}</pre>
    </LabelledValue>
  </div>
);

const bareBonesEnhance =
  withAsyncResource((props: TestComponentOwnProps): Promise<TestAsyncValue> => apiCall(props.quantity));

export const BareBonesComponent: React.ComponentType<TestComponentOwnProps> = bareBonesEnhance(ExampleComponent);

type AsyncCustom<T> = { async: T };

const ProgressIndicator = () => (
  <div className="ProgressIndicator">
    <div className="loader">Loading ...</div>
    <div>Loading</div>
  </div>
);

const ErrorBox = (props: { error: Error }) => (
  <div className="ErrorBox">
    <p>Oh no, something has genuinely gone wrong. If this isn't intermittent please file an issue.</p>
    <pre>{JSON.stringify(props.error)}</pre>
  </div>
);

const withAsyncCustom =
  <OP, T>(promiseProducer: (props: OP) => Promise<T>, shouldReRequest?: (props: OP, nextProps: OP) => boolean) =>
    (WrappedComponent: React.ComponentType<OP & AsyncCustom<T>>): React.ComponentType<OP> =>
      withAsyncResource(promiseProducer, shouldReRequest)((props: OP & AsyncProps<T>) => {
        const { error, isLoading, result } = props.async;
        if (isLoading) {
          return React.createElement(ProgressIndicator);
        }

        if (error != null || result == null) {
          return React.createElement(ErrorBox, { error });
        }

        const enhancedProps: OP & AsyncCustom<T> =
          Object.assign<{}, OP, AsyncCustom<T>>({}, props, { async: result }); // TODO

        return React.createElement(WrappedComponent, enhancedProps);
      });

type Post = { post: { title: string, body: string } | null };
const realApi = (postId: string): Promise<Post> =>
  delay(3000)
    .then(() => fetch(`https://jsonplaceholder.typicode.com/posts/${postId}`))
    .then((response: Response) => response.json())
    .then((post: any): Post => { // tslint:disable-line:no-any
      if (!post.title || !post.body) {
        return { post: null };
      }
      return { post };
    });

type OwnProps = { postId: string };
const DisplayPost = (props: OwnProps & AsyncCustom<Post>) =>
  props.async.post == null ? <div>No post found with id {props.postId}</div> : (
    <div className="DisplayPost">
      <LabelledValue label="Title">{props.async.post.title}</LabelledValue>
      <LabelledValue label="Body">
        <p>{props.async.post.body}</p>
      </LabelledValue>
    </div>
  );

const enhance = withAsyncCustom(
  (props: OwnProps) => realApi(props.postId),
  (props: OwnProps, nextProps: OwnProps) => props.postId !== nextProps.postId,
);

const RealWorldIshExample: React.ComponentType<OwnProps> = enhance(DisplayPost);

class App extends React.Component<{}, {}> {
  state = { selectedPostId: '5' };
  render() {
    return (
      <div className="App">
        <h1>with-async-resource</h1>
        <div className="examples">
          <div className="example">
            <h2>Bare bones example</h2>
            <BareBonesComponent quantity={5} />
          </div>

          <div className="example">
            <h2>Real-world usage example</h2>
            <p>
              This example talks to <a href="https://jsonplaceholder.typicode.com/">jsonplaceholder.typicode.com</a> in
              order to fetch some JSON.
            </p>
            <label>Post id</label>
            <input
              className="post-id-input"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                this.setState({ selectedPostId: event.target.value })
              }
              type="number"
              value={this.state.selectedPostId}
            />
            <RealWorldIshExample postId={this.state.selectedPostId} />
          </div>
        </div>
      </div>
    );
  }
}

export default App;
