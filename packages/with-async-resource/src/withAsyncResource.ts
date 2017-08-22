import { Abortable, AbortableLike } from 'abortable';
import { assign } from 'lodash';
import { Component, ComponentClass, ComponentType, createElement } from 'react';

export type State<T> = { error: Error | null, isLoading: boolean, result: T | null };
export type AsyncProps<T> = { async: State<T> };

type Decorator<Props, EnhancedProps> = (component: ComponentType<EnhancedProps>) => ComponentType<Props>;

type Thenable<T> = Abortable<T> | Promise<T>;
const makeThenable = <T>(value: AbortableLike<T>): Thenable<T> =>
  value.hasOwnProperty('then')
    ? (value as Promise<T>)
    : Promise.resolve(value);

const abort = <T>(thenable: Thenable<T>): void => {
  thenable.hasOwnProperty('abort') && (thenable as Abortable<T>).abort();
};


export const withAsyncResource = <OP, T>(
  abortableProducer: (props: OP) => AbortableLike<T>,
  shouldReProduce?: (props: OP, nextProps: OP) => boolean,
): Decorator<OP, OP & AsyncProps<T>> =>
  (WrappedComponent: ComponentType<OP & AsyncProps<T>>): ComponentClass<OP> =>
    class AsyncResourceWrapper extends Component<OP, State<T>> {
      _isMounted = false;

      request = (null as Abortable<T> | Promise<T> | null);

      state = {
        error: null,
        isLoading: false,
        result: null,
      };

      onError = (error: Error): void => {
        this._isMounted && this.setState({error, isLoading: false});
      }

      executeAbortableProducer(props: OP) {
        this.setState({ error: null, isLoading: true });
        this.request = makeThenable(abortableProducer(props));
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
        this.executeAbortableProducer(this.props);
      }

      componentWillReceiveProps(nextProps: OP): void {
        if (shouldReProduce != null && shouldReProduce(this.props, nextProps)) {
          if (this.request != null) {
            abort(this.request);
            this.request = null;
          }

          this.executeAbortableProducer(nextProps);
        }
      }

      componentWillUnmount() {
        this._isMounted = false;
        if (this.request != null) {
          abort(this.request);
          this.request = null;
        }
      }

      render() {
        const enhancedProps: OP & AsyncProps<T> = assign({}, this.props, { async: this.state });
        return createElement(WrappedComponent as ComponentClass<OP & AsyncProps<T>>, enhancedProps);
      }
    };
