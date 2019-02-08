import { abort, makeThenable, Thenable } from 'abortable'
import {
  Component,
  ComponentClass,
  ComponentType,
  createElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

function useInterval(callback: () => void, delay?: number) {
  const latestCallback = useRef<null | (() => void)>(null)
  useEffect(() => {
    latestCallback.current = callback
  })
  useEffect(() => {
    function tick() {
      if (latestCallback.current != null) {
        latestCallback.current()
      }
    }
    if (delay != null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
    return
  }, [delay])
}

export type Failed = { error: Error }
export type Loading = { loading: true }
export type Success<T> = { result: T }
export type AsyncState<T> = Failed | Loading | Success<T>

export const hasFailed = <T>(state: AsyncState<T>): state is Failed => 'error' in state
export const isLoading = <T>(state: AsyncState<T>): state is Loading =>
  'loading' in state && state.loading
export const hasSucceeded = <T>(state: AsyncState<T>): state is Success<T> => 'result' in state

export type ImperativeApi = { call: (setIsLoading?: boolean) => void }

export const useAsync = <T>(
  thenableProducer: () => T | Thenable<T>,
  dependencies: ReadonlyArray<any>,
  options?: { pollInterval: number },
): AsyncState<T> & ImperativeApi => {
  const activeThenable = useRef<Thenable<T> | null>(null)
  const [state, setState] = useState<AsyncState<T>>({ loading: true })
  const executeThenable = useCallback(() => {
    if (activeThenable.current != null) {
      abort([activeThenable.current])
    }
    const thenable = thenableProducer()
    if (!thenable.hasOwnProperty('then')) {
      return setState({ result: thenable as T })
    }
    activeThenable.current = makeThenable(thenable)
    activeThenable.current
      .then((response: T): void => setState({ result: response }))
      .catch(error => setState({ error }))
      .then(() => {
        activeThenable.current = null
      })
  }, dependencies)

  useEffect(() => {
    executeThenable()
    return () => {
      if (activeThenable.current != null) {
        abort([activeThenable.current])
      }
    }
  }, [dependencies])

  useInterval(executeThenable, options && options.pollInterval)

  return {
    ...state,
    call: (setIsLoading?: boolean) => {
      if (setIsLoading) {
        setState({ loading: true })
      }
      executeThenable()
    },
  }
}

export type AsyncProps<T> = { async: AsyncState<T> & ImperativeApi }

export type Options<OP> = {
  pollInterval?: number // In milliseconds
  shouldReProduce?: (props: OP, nextProps: OP) => boolean
}

export const withAsync = <OP, T>(
  thenableProducer: (props: OP) => T | Thenable<T>,
  options?: Options<OP>,
) => (WrappedComponent: ComponentType<OP & AsyncProps<T>>): ComponentClass<OP> =>
  class AsyncResourceWrapper extends Component<OP, AsyncState<T>> {
    mounted = false

    request = null as Thenable<T> | null

    pollLoop = null as number | null

    state = { loading: true as true }

    onError = (error: Error): void => {
      if (this.mounted) {
        this.setState({ error })
      }
    }

    executeThenableProducer(props: OP): void {
      this.setState({ error: null, isLoading: true })
      this.executeThenableSilent(props)
    }

    executeThenableSilent(props: OP): void {
      const thenable = thenableProducer(props)
      if (!thenable.hasOwnProperty('then')) {
        return this.setState({ result: thenable as T })
      }
      this.request = makeThenable(thenable)
      try {
        this.request
          .then(
            (response: T): void => {
              if (!this.mounted) {
                return
              }
              setTimeout(() => this.setState({ result: response }))
            },
          )
          .catch(this.onError)
          .then(() => {
            this.request = null
          })
      } catch (err) {
        this.onError(err)
      }
    }

    componentDidMount() {
      this.mounted = true
      this.executeThenableProducer(this.props)
      if (options && options.pollInterval) {
        this.pollLoop = (setInterval(
          () => this.executeThenableSilent(this.props),
          options.pollInterval,
        ) as any) as number
      }
    }

    componentWillReceiveProps(nextProps: OP): void {
      if (
        options != null &&
        options.shouldReProduce != null &&
        options.shouldReProduce(this.props, nextProps)
      ) {
        if (this.request != null) {
          abort([this.request])
          this.request = null
        }

        this.executeThenableProducer(nextProps)
      }
    }

    componentWillUnmount() {
      this.mounted = false
      if (this.request != null) {
        abort([this.request])
        this.request = null
      }
      if (this.pollLoop != null) {
        clearInterval(this.pollLoop)
      }
    }

    onCall = (setIsLoading: boolean = true) => {
      if (setIsLoading) {
        this.executeThenableProducer(this.props)
      } else {
        this.executeThenableSilent(this.props)
      }
    }

    render() {
      const enhancedProps: OP & AsyncProps<T> = {
        // Typescript can't spread generic types yet
        ...(this.props as any),
        async: {
          call: this.onCall,
          ...this.state,
        },
      }
      return createElement(WrappedComponent, enhancedProps)
    }
  }

type RenderProps<T> = {
  producer: () => Thenable<T>
  render: (async: AsyncState<T> & ImperativeApi) => ReactNode
}
export const Async = <T>({ render, producer }: RenderProps<T>) =>
  createElement(withAsync<{}, T>(producer)(((props: AsyncProps<T>) => render(props.async)) as any))
