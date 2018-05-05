import { abort, Thenable } from 'abortable';
import { Component, ComponentClass, ComponentType, createElement } from 'react';

export type State<T> = { error: Error | null, isLoading: boolean, result: T | null };
export type AsyncProps<T> = { async: State<T> };

const makeThenable = <T>(value: Thenable<T> | T): Thenable<T> =>
  value.hasOwnProperty('then')
    ? (value as Promise<T>)
    : Promise.resolve(value);

export type Milliseconds = number;

export type Options<OP> = {
  pollInterval?: Milliseconds,
  shouldReProduce?: (props: OP, nextProps: OP) => boolean,
}

export const withAsync = <OP, T>(thenableProducer: (props: OP) => Thenable<T>, options?: Options<OP>) =>
  (WrappedComponent: ComponentType<OP & AsyncProps<T>>): ComponentClass<OP> =>
    class AsyncResourceWrapper extends Component<OP, State<T>> {
      _isMounted = false;

      request = (null as Thenable<T> | null);

      pollLoop = (null as number | null);

      state = {
        error: null,
        isLoading: false,
        result: null,
      };

      onError = (error: Error): void => {
        if (this._isMounted)  {
          this.setState({error, isLoading: false});
        }
      };

      executeThenableProducer(props: OP): void {
        this.setState({ error: null, isLoading: true });
        this.executeThenableSilent(props)
      }

      executeThenableSilent(props: OP): void {
        this.request = makeThenable(thenableProducer(props));
        try {
          this.request
            .then((response: T): void => {
              if (!this._isMounted) {
                return;
              }
              setTimeout(() => this.setState({isLoading: false, result: response}));
            })
            .catch(this.onError)
            .then(() => {
              this.request = null;
            });
        } catch (err) {
          this.onError(err);
        }
      }

      componentDidMount() {
        this._isMounted = true;
        this.executeThenableProducer(this.props);
        if (options && options.pollInterval) {
          this.pollLoop = setInterval(() => this.executeThenableProducer(this.props), options.pollInterval) as any as number
        }
      }

      componentWillReceiveProps(nextProps: OP): void {
        if (options != null && options.shouldReProduce != null && options.shouldReProduce(this.props, nextProps)) {
          if (this.request != null) {
            abort([this.request]);
            this.request = null;
          }

          this.executeThenableProducer(nextProps);
        }
      }

      componentWillUnmount() {
        this._isMounted = false;
        if (this.request != null) {
          abort([this.request]);
          this.request = null;
        }
        if (this.pollLoop != null) {
          clearInterval(this.pollLoop)
        }
      }

      render() {
        const enhancedProps: OP & AsyncProps<T> = {
          // Typescript can't spread generic types yet
          ...(this.props as any),
          async: this.state
        };
        return createElement(WrappedComponent, enhancedProps);
      }
    };
