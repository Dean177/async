import { Abortable } from 'abortable'
import * as React from 'react'
import { cleanup, render } from 'react-testing-library'
import { renderHook, act } from '@testing-library/react-hooks'
import {
  AsyncProps,
  AsyncState,
  isLoading,
  hasFailed,
  hasSucceeded,
  useAsync,
  Success,
  Failed,
} from './useAsync'

const noop = () => {} // tslint:disable-line:no-empty

type TestAsyncValue = { chocolate: number }
const testValue = { chocolate: 5 }

describe('useAsync', () => {
  afterAll(jest.useRealTimers)
  afterEach(cleanup)
  beforeAll(jest.useFakeTimers)

  const TestComponent = (props: AsyncProps<TestAsyncValue>) => {
    if (isLoading(props)) {
      return <div>{props.loading}</div>
    } else if (hasFailed(props)) {
      return <div>{props.error == null}</div>
    } else if (hasSucceeded(props)) {
      return <div>{props.result == null}</div>
    } else {
      throw new Error('Unexpected case')
    }
  }

  describe('state tests', () => {
    const errorStates = [{ error: new Error() }, { error: new Error(), loading: true }]
    const successStates = [{ result: 2 }, { result: 2, loading: true }]

    test.each(errorStates)('hasFailed returns true when the state has an error key', state => {
      expect(hasFailed(state)).toBe(true)
    })

    test.each(successStates)('hasFailed returns false when the state has no error key', state => {
      expect(hasFailed(state)).toBe(false)
    })

    test.each(successStates)('hasSucceeded returns true when the state has a result key', state => {
      expect(hasSucceeded(state)).toBe(true)
    })

    test.each(errorStates)('hasSucceeded returns false when the state has no result key', state => {
      expect(hasSucceeded(state)).toBe(false)
    })

    test.each(errorStates)(
      'hasSucceeded returns false when the state does not have a result key',
      state => {
        expect(hasSucceeded(state)).toBe(false)
      },
    )

    test.each(([
      { loading: true },
      { error: new Error(), loading: true },
      { result: 2, loading: true },
    ] as any) as Array<[AsyncState<number>]>)(
      'isLoading returns true when the state has an loading key which is true',
      state => {
        expect(isLoading(state)).toBe(true)
      },
    )

    test.each(([
      { loading: false },
      { error: new Error(), loading: false },
      { result: 2, loading: false },
    ] as any) as Array<[AsyncState<number>]>)(
      'isLoading returns false when the state is missing a loading key',
      state => {
        expect(isLoading(state)).toBe(false)
      },
    )
  })

  it('executes its thenableProducer, passing the components props as an argument on mount', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    renderHook(() => useAsync(producerSpy, []))
    expect(producerSpy).toHaveBeenCalled()
  })

  it('provides a loading state when the value has not yet been resolved', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    let props = null as any
    renderHook(() => (props = useAsync(producerSpy, [])))

    expect(isLoading(props)).toBe(true)
    expect(hasFailed(props)).toBe(false)
    expect(hasSucceeded(props)).toBe(false)
  })

  it('provides a success state once its promise has resolved', () => {
    const promise: Promise<TestAsyncValue> = Promise.resolve(testValue)
    let props = null as any
    renderHook(() => (props = useAsync(() => promise, [])))

    return promise.then(() => {
      expect(isLoading(props)).toBe(false)
      expect(hasFailed(props)).toBe(false)
      expect(hasSucceeded(props)).toBe(true)
      expect((props as Success<TestAsyncValue>).result).toEqual(testValue)
    })
  })

  it('provides the error if the promise is rejected', () => {
    expect.assertions(4)
    const reason = new Error('fail')
    const promise = Promise.reject(reason)

    let props = null as any

    return new Promise(resolve => {
      renderHook(() => {
        props = useAsync(() => {
          resolve()
          return promise
        }, [])
      })
    }).then(() => {
      return promise.catch(() => {
        expect(isLoading(props)).toBe(false)
        expect(hasSucceeded(props)).toBe(false)
        expect(hasFailed(props)).toBe(true)
        expect((props as Failed).error).toEqual(reason)
      })
    })
  })

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
    abortablePromise.abort = jest.fn()
    const wrapper = renderHook(() => useAsync(() => abortablePromise, []))
    wrapper.unmount()
    expect(abortablePromise.abort).toHaveBeenCalled()
  })

  it('will re-call its promise producer if props are updated and the dependencies have changed', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => new Promise(noop))
    const EnhancedComponent = (props: { quantity: number }) => {
      const _ = useAsync(producerSpy, [props.quantity])
      return <div />
    }

    const wrapper = render(<EnhancedComponent quantity={1} />)
    wrapper.rerender(<EnhancedComponent quantity={2} />)

    expect(producerSpy).toHaveBeenCalledTimes(2)
  })

  it('aborts any pending request if props are updated and the dependencies have changed', () => {
    const abortSpy = jest.fn()
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => {
      const promise = new Promise(noop) as Abortable<any>
      promise.abort = abortSpy
      return promise
    })
    const EnhancedComponent = (props: { quantity: number }) => {
      const async = useAsync(producerSpy, [props.quantity])
      return <TestComponent {...async} />
    }

    const wrapper = render(<EnhancedComponent quantity={1} />)

    wrapper.rerender(<EnhancedComponent quantity={2} />)
    expect(abortSpy).toHaveBeenCalled()
  })

  it('will repeatedly perform requests when the pollInterval option is set', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    const EnhancedComponent = () => {
      const async = useAsync(producerSpy, [], { pollInterval: 100 })
      return <TestComponent {...async} />
    }

    const wrapper = render(<EnhancedComponent />)
    jest.runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)
    wrapper.unmount()
  })

  it('will stop performing requests when the component is unmounted and pollInterval option is set', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))
    const EnhancedComponent = () => {
      const async: AsyncProps<TestAsyncValue> = useAsync<TestAsyncValue>(producerSpy, [], {
        pollInterval: 100,
      })
      return <TestComponent {...async} />
    }

    const wrapper = render(<EnhancedComponent />)
    jest.runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)

    wrapper.unmount()
    jest.runTimersToTime(1000)

    expect(producerSpy).toHaveBeenCalledTimes(11)
  })

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy: () => Promise<TestAsyncValue> = jest.fn(() => Promise.resolve(testValue))

    let props = null as any
    renderHook(() => (props = useAsync(producerSpy, [])))

    expect(producerSpy).toHaveBeenCalledTimes(1)
    props.call()
    expect(producerSpy).toHaveBeenCalledTimes(2)
  })
})
