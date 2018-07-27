import { abort, makeThenable, Thenable } from 'abortable';
import {
  Component,
  ComponentClass,
  ComponentType,
  createElement,
  ComponentElement,
  ReactNode
} from 'react';

export type State<T> = {
  error: Error | null;
  isLoading: boolean;
  result: T | null;
};

export type ImperativeApi = { call: (setIsLoading?: boolean) => void };

export type AsyncProps<T> = {
  async: State<T> & ImperativeApi;
};

export type Milliseconds = number;

export type Options<OP> = {
  pollInterval?: Milliseconds;
  shouldReProduce?: (props: OP, nextProps: OP) => boolean;
};

export const withAsync = <OP, T>(
  thenableProducer: (props: OP) => Thenable<T>,
  options?: Options<OP>
) => (WrappedComponent: ComponentType<OP & AsyncProps<T>>): ComponentClass<OP> =>
  class AsyncResourceWrapper extends Component<OP, State<T>> {
    mounted = false;

    request = null as Thenable<T> | null;

    pollLoop = null as number | null;

    state = {
      error: null,
      isLoading: true,
      result: null
    };

    onError = (error: Error): void => {
      if (this.mounted) {
        this.setState({ error, isLoading: false });
      }
    };

    executeThenableProducer(props: OP): void {
      this.setState({ error: null, isLoading: true });
      this.executeThenableSilent(props);
    }

    executeThenableSilent(props: OP): void {
      this.request = makeThenable(thenableProducer(props));
      try {
        this.request
          .then((response: T): void => {
            if (!this.mounted) {
              return;
            }
            setTimeout(() => this.setState({ isLoading: false, result: response }));
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
      this.mounted = true;
      this.executeThenableProducer(this.props);
      if (options && options.pollInterval) {
        this.pollLoop = (setInterval(
          () => this.executeThenableSilent(this.props),
          options.pollInterval
        ) as any) as number;
      }
    }

    componentWillReceiveProps(nextProps: OP): void {
      if (
        options != null &&
        options.shouldReProduce != null &&
        options.shouldReProduce(this.props, nextProps)
      ) {
        if (this.request != null) {
          abort([this.request]);
          this.request = null;
        }

        this.executeThenableProducer(nextProps);
      }
    }

    componentWillUnmount() {
      this.mounted = false;
      if (this.request != null) {
        abort([this.request]);
        this.request = null;
      }
      if (this.pollLoop != null) {
        clearInterval(this.pollLoop);
      }
    }

    onCall = (setIsLoading: boolean = true) => {
      if (setIsLoading) {
        this.executeThenableProducer(this.props);
      } else {
        this.executeThenableSilent(this.props);
      }
    };

    render() {
      const enhancedProps: OP & AsyncProps<T> = {
        // Typescript can't spread generic types yet
        ...(this.props as any),
        async: {
          call: this.onCall,
          ...this.state
        }
      };
      return createElement(WrappedComponent, enhancedProps);
    }
  };

type RenderProps<T> = {
  producer: () => Thenable<T>;
  render: (async: State<T> & ImperativeApi) => ReactNode;
};
export const Async = <T>({ render, producer }: RenderProps<T>) =>
  createElement(withAsync<{}, T>(producer)(((props: AsyncProps<T>) => render(props.async)) as any));
