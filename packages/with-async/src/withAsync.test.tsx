import { Abortable } from 'abortable'
import { interceptor } from 'props-interceptor'
import { FunctionComponent } from 'react'
import * as React from 'react'
import { act, cleanup, render, testHook } from 'react-testing-library'
import {
  AsyncProps,
  ImperativeApi,
  AsyncState,
  withAsync,
  Async,
  isLoading,
  hasFailed,
  hasSucceeded,
  useAsync,
  Success,
  Failed,
} from './withAsync'
import runTimersToTime = jest.runTimersToTime

const noop = () => {} // tslint:disable-line:no-empty

type TestAsyncValue = { chocolate: number }
const testValue = { chocolate: 5 }

describe('useAsync', () => {
  afterAll(jest.useRealTimers)
  afterEach(cleanup)
  beforeAll(jest.useFakeTimers)

  type Props = AsyncState<TestAsyncValue>
  const TestComponent = (props: Props) => {
    if (isLoading(props)) {
      return <div className="isLoading">{props.loading}</div>
    } else if (hasFailed(props)) {
      return <div className="error">{props.error == null}</div>
    } else if (hasSucceeded(props)) {
      return <div className="result">{props.result == null}</div>
    } else {
      throw new Error('Unexpected case')
    }
  }

  it('executes its thenableProducer, passing the components props as an argument on mount', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    testHook(() => useAsync(producerSpy, []))
    expect(producerSpy).toHaveBeenCalled()
  })

  it('provides a loading state when the value has not yet been resolved', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    let props = null as any
    testHook(() => (props = useAsync(producerSpy, [])))

    expect(isLoading(props)).toBe(true)
    expect(hasFailed(props)).toBe(false)
    expect(hasSucceeded(props)).toBe(false)
  })

  it('displays its content, providing the promise resolution as a prop', () => {
    const promise: Promise<TestAsyncValue> = Promise.resolve(testValue)
    let props = null as any
    testHook(() => (props = useAsync(() => promise, [])))

    return promise.then(() => {
      expect(isLoading(props)).toBe(false)
      expect(hasFailed(props)).toBe(false)
      expect(hasSucceeded(props)).toBe(true)
      expect((props as Success<TestAsyncValue>).result).toEqual(testValue)
    })
  })

  it.skip('provides the error if the promise is rejected', () => {
    const reason = new Error('fail')
    const promise = Promise.reject(reason)

    let props = null as any
    const wrapper = testHook(() => (props = useAsync(() => promise, [])))

    return promise.catch(() => {
      wrapper.rerender()
      expect(isLoading(props)).toBe(false)
      expect(hasSucceeded(props)).toBe(false)
      expect(hasFailed(props)).toBe(true)
      expect((props as Failed).error).toEqual(reason)
    })
  })

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
    abortablePromise.abort = jest.fn()
    const wrapper = testHook(() => useAsync(() => abortablePromise, []))
    wrapper.unmount()
    expect(abortablePromise.abort).toHaveBeenCalled()
  })

  it('will re-call its promise producer if props are updated and the dependencies have changed', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    const EnhancedComponent = (props: { quantity: number }) =>
      React.createElement(TestComponent, useAsync(producerSpy, [props.quantity]))

    const wrapper = render(<EnhancedComponent quantity={1} />)

    wrapper.rerender(<EnhancedComponent quantity={1} />)

    expect(producerSpy).toHaveBeenCalledTimes(2)
  })

  it('aborts any pending request if props are updated and the dependencies have changed', () => {
    const abortSpy = jest.fn()
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => {
      const promise = new Promise(noop) as Abortable<any>
      promise.abort = abortSpy
      return promise
    })
    const EnhancedComponent = (props: { quantity: number }) =>
      React.createElement(TestComponent, useAsync(producerSpy, [props.quantity]))

    const wrapper = render(<EnhancedComponent quantity={1} />)

    wrapper.rerender(<EnhancedComponent quantity={1} />)
    expect(abortSpy).toHaveBeenCalled()
  })

  it.skip('will repeatedly perform requests when the pollInterval option is set', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    const EnhancedComponent = () =>
      React.createElement(TestComponent, useAsync(producerSpy, [], { pollInterval: 100 }))

    const wrapper = render(<EnhancedComponent />)
    runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)
    wrapper.unmount()
  })

  it.skip('will stop performing requests when the component is unmounted and pollInterval option is set', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    const EnhancedComponent = () =>
      React.createElement(TestComponent, useAsync(producerSpy, [], { pollInterval: 100 }))

    const wrapper = render(<EnhancedComponent />)
    runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)

    wrapper.unmount()
    runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)
  })

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))

    let props = null as any
    testHook(() => (props = useAsync(producerSpy, [])))

    expect(producerSpy).toHaveBeenCalledTimes(1)
    props.call()
    expect(producerSpy).toHaveBeenCalledTimes(2)
  })
})

describe('withAsync', () => {
  afterAll(jest.useRealTimers)
  beforeAll(jest.useFakeTimers)

  type TestComponentOwnProps = { quantity: number }
  type Props = TestComponentOwnProps & AsyncProps<TestAsyncValue>
  const TestComponent: FunctionComponent<Props> = props => {
    if (isLoading(props.async)) {
      return <div className="isLoading">{props.async.loading}</div>
    } else if (hasFailed(props.async)) {
      return <div className="error">{props.async.error == null}</div>
    } else if (hasSucceeded(props.async)) {
      return <div className="result">{props.async.result == null}</div>
    } else {
      throw new Error('Unexpected case')
    }
  }

  it('executes its abortableProducer, passing the components props as an argument on render', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
      TestComponent,
    )
    render(<EnhancedComponent quantity={1} />)

    expect(producerSpy).toHaveBeenCalled()
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 })
  })

  it('provides a loading state when the value has not yet been resolved', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    let props = null as any
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
      interceptor<Props>(p => (props = p))(TestComponent),
    )

    render(<EnhancedComponent quantity={1} />)

    expect(props.quantity).toBe(1)
    expect(isLoading(props.async)).toBe(true)
    expect(hasFailed(props.async)).toBe(false)
    expect(hasSucceeded(props.async)).toBe(false)
  })

  it('provides a success state once its promise has resolved', () => {
    const result = { chocolate: 5 }
    const promise: Promise<TestAsyncValue> = Promise.resolve(result)
    let props = null as any
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => promise)(
      interceptor<Props>(p => (props = p))(TestComponent),
    )

    const wrapper = render(<EnhancedComponent quantity={1} />)
    return promise.then(() => {
      jest.runOnlyPendingTimers()
      wrapper.rerender(<EnhancedComponent quantity={1} />)

      expect(props.quantity).toBe(1)
      expect(isLoading(props.async)).toBeFalsy()
      expect(hasFailed(props.async)).toBe(false)
      expect(hasSucceeded(props.async)).toBe(true)
      expect((props.async as Success<TestAsyncValue>).result).toEqual(result)
    })
  })

  xit('provides the error if the promise is rejected', () => {
    const reason = new Error('fail')
    const promise = Promise.reject(reason)
    let props = null as any
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => promise)(
      interceptor<Props>(p => (props = p))(TestComponent),
    )

    const wrapper = render(<EnhancedComponent quantity={1} />)
    jest.runOnlyPendingTimers()
    return promise.catch(() => {
      jest.runOnlyPendingTimers()
      wrapper.rerender(<EnhancedComponent quantity={1} />)

      expect(props.quantity).toBe(1)
      expect(isLoading(props.async)).toBeFalsy()
      expect(hasSucceeded(props.async)).toBe(false)
      expect(hasFailed(props.async)).toBe(true)
      expect((props.async as Failed).error).toEqual(reason)
    })
  })

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
    abortablePromise.abort = jest.fn()

    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(
      () => abortablePromise,
    )(TestComponent)

    const wrapper = render(<EnhancedComponent quantity={3} />)

    wrapper.unmount()
    expect(abortablePromise.abort).toHaveBeenCalled()
  })

  it('will re-call its promise producer if props are updated and predicate is true', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5)
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      shouldReProduce: reevaluateSpy,
    })(TestComponent)
    const wrapper = render(<EnhancedComponent quantity={1} />)

    wrapper.rerender(<EnhancedComponent quantity={2} />)

    expect(reevaluateSpy).toHaveBeenCalled()
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 })
  })

  it('aborts any pending request if props are updated and predicate is true', () => {
    const abortSpy = jest.fn()
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => {
      const promise = new Promise(noop) as Abortable<any>
      promise.abort = abortSpy
      return promise
    })
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5)
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      shouldReProduce: reevaluateSpy,
    })(TestComponent)
    const wrapper = render(<EnhancedComponent quantity={1} />)
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 })

    wrapper.rerender(<EnhancedComponent quantity={6} />)
    expect(reevaluateSpy).toHaveBeenCalled()
    expect(abortSpy).toHaveBeenCalled()
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 6 })
  })

  it('will not re-call its promise producer if props are updated and predicate is not provided', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
      TestComponent,
    )
    const wrapper = render(<EnhancedComponent quantity={1} />)

    expect(producerSpy).toHaveBeenCalledTimes(1)

    wrapper.rerender(<EnhancedComponent quantity={10} />)

    expect(producerSpy).toHaveBeenCalledTimes(1)
  })

  it('will not re-call its promise producer if props are updated and predicate returns false', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5)
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      shouldReProduce: reevaluateSpy,
    })(TestComponent)
    const wrapper = render(<EnhancedComponent quantity={1} />)

    expect(producerSpy).toHaveBeenCalledTimes(1)

    wrapper.rerender(<EnhancedComponent quantity={2} />)

    expect(reevaluateSpy).toHaveBeenCalled()
    expect(producerSpy).toHaveBeenCalledTimes(1)
    expect(producerSpy).not.toHaveBeenCalledWith({ quantity: 2 })
  })

  it('will repeatedly perform requests when the pollInterval option is set', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      pollInterval: 100,
    })(TestComponent)
    const wrapper = render(<EnhancedComponent quantity={1} />)
    runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)
    wrapper.unmount()
  })

  it('will stop performing requests when the component is unmounted and pollInterval option is set', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      pollInterval: 100,
    })(TestComponent)
    const wrapper = render(<EnhancedComponent quantity={1} />)
    runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)

    wrapper.unmount()
    runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)
  })

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    let asyncProps: AsyncProps<TestAsyncValue> = null!
    const EnhancedComponent = withAsync<{}, TestAsyncValue>(producerSpy)(interceptor<
      AsyncProps<TestAsyncValue>
    >((props: AsyncProps<TestAsyncValue>) => {
      asyncProps = props
    })(() => <div />) as any)

    render(<EnhancedComponent />)

    expect(producerSpy).toHaveBeenCalledTimes(1)
    asyncProps.async.call()
    expect(producerSpy).toHaveBeenCalledTimes(2)
  })
})

describe('<WithAsync />', () => {
  afterAll(jest.useRealTimers)
  beforeAll(jest.useFakeTimers)

  type TestComponentOwnProps = { quantity: number }
  type Props = TestComponentOwnProps & AsyncState<TestAsyncValue>
  const TestComponent = (props: Props) => {
    if (isLoading(props)) {
      return <div className="isLoading">{props.loading}</div>
    } else if (hasFailed(props)) {
      return <div className="error">{props.error == null}</div>
    } else if (hasSucceeded(props)) {
      return <div className="result">{props.result == null}</div>
    } else {
      throw new Error('Unexpected case')
    }
  }

  it('executes its abortableProducer, passing the components props as an argument on mount', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    render(
      <Async
        producer={producerSpy}
        render={(async: AsyncState<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />,
    )

    expect(producerSpy).toHaveBeenCalled()
  })

  it('provides a loading state when the value has not yet been resolved', () => {
    let asyncProps = null as any
    render(
      <Async
        producer={() => new Promise(noop) as any}
        render={(async: AsyncState<TestAsyncValue>) => {
          asyncProps = async
          return <TestComponent quantity={1} {...async} />
        }}
      />,
    )

    expect(isLoading(asyncProps)).toBe(true)
    expect(hasSucceeded(asyncProps)).toBe(false)
    expect(hasFailed(asyncProps)).toBe(false)
  })

  xit('provides a success state once its promise has resolved', () => {
    const result = { chocolate: 5 }
    const promise: Promise<TestAsyncValue> = new Promise(resolve => resolve(result))
    let asyncProps = null as any
    const wrapper = render(
      <Async
        producer={() => promise}
        render={(async: AsyncState<TestAsyncValue>) => {
          asyncProps = async
          return <TestComponent quantity={1} {...async} />
        }}
      />,
    )

    jest.runOnlyPendingTimers()

    return promise.then(() => {
      jest.runOnlyPendingTimers()
      wrapper.rerender(
        <Async
          producer={() => promise}
          render={(async: AsyncState<TestAsyncValue>) => {
            asyncProps = async
            return <TestComponent quantity={1} {...async} />
          }}
        />,
      )

      expect(isLoading(asyncProps)).toBe(false)
      expect(hasFailed(asyncProps)).toBe(false)
      expect(hasSucceeded(asyncProps)).toBe(true)
      expect((asyncProps as Success<TestAsyncValue>).result).toEqual(result)
    })
  })

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
    abortablePromise.abort = jest.fn()

    const wrapper = render(
      <Async
        producer={() => abortablePromise}
        render={(async: AsyncState<TestAsyncValue>) => <TestComponent quantity={3} {...async} />}
      />,
    )

    wrapper.unmount()
    expect(abortablePromise.abort).toHaveBeenCalled()
  })

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    let interceptedProps: AsyncState<TestAsyncValue> & ImperativeApi = null as any
    render(
      <Async
        producer={producerSpy}
        render={(async: AsyncState<TestAsyncValue> & ImperativeApi) => {
          interceptedProps = async
          return <TestComponent quantity={3} {...async} />
        }}
      />,
    )

    expect(producerSpy).toHaveBeenCalledTimes(1)
    interceptedProps.call()
    expect(producerSpy).toHaveBeenCalledTimes(2)
  })
})
