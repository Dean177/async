import * as React from "react";
import * as CodeMirror from "react-codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/monokai.css";
import "./App.css";

require("codemirror/mode/javascript/javascript");
require("codemirror/mode/jsx/jsx");
type ErrorBoundaryProps = { className: string };
type ErrorBoundaryState = { error: Error | null; info: React.ErrorInfo | null };
class DevErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state = { error: null, info: null };
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ error, info });
  }
  render() {
    if (this.state.error != null) {
      return (
        <div className="ErrorBoundary">
          <h2>Error</h2>
          <p>
            If you are seeing this please create an issue on{" "}
            <a href="https://github.com/Dean177/with-notification-system/issues">
              Github
            </a>{" "}
            which includes the following information:
          </p>
          <pre>{JSON.stringify(this.state.error, null, 2)}</pre>
          <h2>Component</h2>
          <pre>{(this.state.info! as React.ErrorInfo).componentStack}</pre>
        </div>
      );
    }

    return <div className={this.props.className}>{this.props.children}</div>;
  }
}

const SyntaxHighlight = (props: { mode?: { name: string }; code: string }) => (
  <CodeMirror
    options={{
      mode: props.mode || {
        name: "jsx",
        base: { name: "javascript", typescript: true }
      },
      theme: "monokai"
    }}
    value={props.code}
  />
);

export const App = () => (
  <DevErrorBoundary className="App">
    <div className="App-header">
      <h1>Welcome to React</h1>
    </div>
    <div className="content">
      <div className="status-icons github-buttons">
        <a
          className="status-icon github-button"
          href="https://github.com/dean177/higher-order-form"
          data-size="mega"
          data-icon="octicon-star"
          data-count-href="/dean177/higher-order-form/stargazers"
          data-show-count="true"
          data-count-aria-label="# stargazers on GitHub"
          aria-label="Star dean177/higher-order-form on GitHub"
        >
          Star
        </a>
        <a
          className="status-icon"
          href="https://circleci.com/gh/Dean177/higher-order-form"
        >
          <img src="https://circleci.com/gh/Dean177/higher-order-form.svg?style=svg" />
        </a>
        <a
          className="status-icon"
          href="https://www.npmjs.com/package/with-form"
        >
          <img
            src="https://badge.fury.io/js/with-form.svg"
            alt="npm version"
            height="18"
          />
        </a>
      </div>
      <h2>Installation</h2>
      <p>Install the dependencies</p>
      <SyntaxHighlight
        code={`yarn install with-async`}
        mode={{ name: "shell" }}
      />

      <p>Or via npm</p>
      <SyntaxHighlight
        code={`npm install --save with-async`}
        mode={{ name: "shell" }}
      />

      <section>
        <h2>Usage</h2>
        <p>Create a type represent your form</p>
        <SyntaxHighlight
          code={`
type BasicFormModel = {
booleanField: boolean,
stringField: string,
numericField: number | string,
}
      `}
        />

        <p>
          Decide what the initial values should be and provide callback for form
          submission
        </p>
        <SyntaxHighlight
          code={`
const enhance = withForm<{}, BasicFormModel>({
initialValues: (): BasicFormModel => ({
  booleanField: false,
  stringField: '',
  numericField: '',
}),
onSubmit: () => (formValues: BasicFormModel) => {
  alert(JSON.stringify(formValues))
},
})
      `}
        />

        <p>Wire up some UI</p>
        <SyntaxHighlight
          code={`
const BasicFormExample = enhance((props: BasicFormProps) => (
<form onSubmit={props.form.submit}>
  <h4>Basic form</h4>
  <label>Boolean field</label>
  {props.form.controlFor.booleanField(<input type="checkbox" />)}

  <label>String field</label>
  {props.form.controlFor.stringField(<input />)}

  <label>Numeric field</label>
  {props.form.controlFor.numericField(<input type="number" />)}

  <button type="submit" onClick={props.form.submit}>Submit</button>
</form>
)
      `}
        />

        <p>
          And here is what it looks like, try entering some data and submitting
          the form
        </p>
        <SyntaxHighlight code={``} />
      </section>
    </div>
  </DevErrorBoundary>
);
