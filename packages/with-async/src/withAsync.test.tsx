import { Abortable } from 'abortable'
import { mount } from 'enzyme'
import { interceptor } from 'props-interceptor'
import * as React from 'react'
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

const noop = () => {} // tslint:disable-line:no-empty

describe('useAsync', () => {
  afterAll(jest.useRealTimers)
  beforeAll(jest.useFakeTimers)

  type TestAsyncValue = { chocolate: number }
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

  it('executes its thennableProducer, passing the components props as an argument on mount', () => {
    const producerSpy = jest.fn(() => new Promise(noop))
    const EnhancedComponent = () => React.createElement(TestComponent, useAsync(producerSpy, []))

    mount(<EnhancedComponent />)

    expect(producerSpy).toHaveBeenCalled()
  })

  // it('provides a loading state of true when the value has not yet been resolved', () => {
  //   const producerSpy = jest.fn(() => new Promise(noop))
  //   const EnhancedComponent = () => React.createElement(TestComponent, useAsync(producerSpy, []))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //   const props = wrapper.find<Props>(TestComponent).props()
  //
  //   expect(isLoading(props)).toBe(true)
  //   expect(hasFailed(props)).toBe(false)
  //   expect(hasSucceeded(props)).toBe(false)
  // })
  //
  // it('displays its content, providing the promise resolution as a prop', () => {
  //   const result = { chocolate: 5 }
  //   const promise: Promise<TestAsyncValue> = new Promise(resolve => resolve(result))
  //   const EnhancedComponent = () => React.createElement(TestComponent, useAsync(() => promise, []))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //   jest.runOnlyPendingTimers()
  //
  //   return promise.then(() => {
  //     jest.runOnlyPendingTimers()
  //     wrapper.update()
  //     const props = wrapper.find<Props>(TestComponent).props()
  //
  //     expect(isLoading(props)).toBe(false)
  //     expect(hasFailed(props)).toBe(false)
  //     expect(hasSucceeded(props)).toBe(true)
  //     expect((props as Success<TestAsyncValue>).result).toEqual(result)
  //   })
  // })
  //
  // it('can accept raw data from its producer, returning sync', () => {
  //   const result = { chocolate: 5 }
  //   const EnhancedComponent = () => React.createElement(TestComponent, useAsync(() => result, []))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //   jest.runOnlyPendingTimers()
  //   wrapper.update()
  //   const props = wrapper.find<Props>(TestComponent).props()
  //   expect(isLoading(props)).toBe(false)
  //   expect(hasFailed(props)).toBe(false)
  //   expect(hasSucceeded(props)).toBe(true)
  //   expect((props as Success<TestAsyncValue>).result).toEqual(result)
  // })
  //
  // it('provides the error if the promise is rejected', () => {
  //   const reason = new Error('fail')
  //   const promise = new Promise((resolve, reject) => setTimeout(() => reject(reason), 0)) as any
  //   const EnhancedComponent = () => React.createElement(TestComponent, useAsync(() => promise, []))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //   wrapper.setState({ error: reason, isLoading: false })
  //
  //   const props = wrapper.find<Props>(TestComponent).props()
  //
  //   expect(isLoading(props)).toBe(false)
  //   expect(hasSucceeded(props)).toBe(false)
  //   expect(hasFailed(props)).toBe(true)
  //   expect((props as Failed).error).toEqual(reason)
  // })
  //
  // it('aborts the promise if the component is unmounted', () => {
  //   const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
  //   abortablePromise.abort = jest.fn()
  //   const EnhancedComponent = () =>
  //     React.createElement(TestComponent, useAsync(() => abortablePromise, []))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //
  //   wrapper.unmount()
  //   expect(abortablePromise.abort).toHaveBeenCalled()
  // })
  //
  // it('will re-call its promise producer if props are updated and the dependecies have changed', () => {
  //   const producerSpy = jest.fn(() => new Promise(noop))
  //   const EnhancedComponent = (props: { quantity: number }) =>
  //     React.createElement(TestComponent, useAsync(producerSpy, [props.quantity]))
  //
  //   const wrapper = mount(<EnhancedComponent quantity={1} />)
  //
  //   wrapper.setProps({ quantity: 2 })
  //
  //   expect(producerSpy).toHaveBeenCalledTimes(2)
  // })
  //
  // it('aborts any pending request if props are updated and the dependecies have changed', () => {
  //   const abortSpy = jest.fn()
  //   const producerSpy = jest.fn(() => {
  //     const promise = new Promise(noop) as Abortable<any>
  //     promise.abort = abortSpy
  //     return promise
  //   })
  //   const EnhancedComponent = (props: { quantity: number }) =>
  //     React.createElement(TestComponent, useAsync(producerSpy, [props.quantity]))
  //
  //   const wrapper = mount(<EnhancedComponent quantity={1} />)
  //   expect(producerSpy).toHaveBeenCalledTimes(1)
  //
  //   wrapper.setProps({ quantity: 6 })
  //   expect(abortSpy).toHaveBeenCalled()
  //   expect(producerSpy).toHaveBeenCalledTimes(2)
  // })
  //
  // it('will repeatedly perform requests when the pollInterval option is set', () => {
  //   const producerSpy = jest.fn(() => Promise.resolve(''))
  //   const EnhancedComponent = () =>
  //     React.createElement(TestComponent, useAsync(producerSpy, [], { pollInterval: 100 }))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //   runTimersToTime(1000)
  //
  //   expect(producerSpy).toHaveBeenCalledTimes(11)
  //   wrapper.unmount()
  // })
  //
  // it('will stop performing requests when the component is unmounted and pollInterval option is set', () => {
  //   const producerSpy = jest.fn(() => Promise.resolve(''))
  //   const EnhancedComponent = () =>
  //     React.createElement(TestComponent, useAsync(producerSpy, [], { pollInterval: 100 }))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //   runTimersToTime(1000)
  //
  //   expect(producerSpy).toHaveBeenCalledTimes(11)
  //
  //   wrapper.unmount()
  //   runTimersToTime(1000)
  //
  //   expect(producerSpy).toHaveBeenCalledTimes(11)
  // })
  //
  // it('provides an imperative API to re call the then producer', () => {
  //   const producerSpy = jest.fn(() => Promise.resolve(''))
  //   const EnhancedComponent = () => React.createElement(TestComponent, useAsync(producerSpy, []))
  //
  //   const wrapper = mount(<EnhancedComponent />)
  //
  //   const props = wrapper.find<Props & ImperativeApi>(TestComponent).props()
  //
  //   expect(producerSpy).toHaveBeenCalledTimes(1)
  //   props.call()
  //   expect(producerSpy).toHaveBeenCalledTimes(2)
  // })
})

// describe('withAsync', () => {
//   afterAll(jest.useRealTimers)
//   beforeAll(jest.useFakeTimers)
//
//   type TestAsyncValue = { chocolate: number }
//   type TestComponentOwnProps = { quantity: number }
//   type Props = TestComponentOwnProps & AsyncProps<TestAsyncValue>
//   const TestComponent = (props: Props) => {
//     if (isLoading(props.async)) {
//       return <div className="isLoading">{props.async.loading}</div>
//     } else if (hasFailed(props.async)) {
//       return <div className="error">{props.async.error == null}</div>
//     } else if (hasSucceeded(props.async)) {
//       return <div className="result">{props.async.result == null}</div>
//     } else {
//       throw new Error('Unexpected case')
//     }
//   }
//
//   it('executes its abortableProducer, passing the components props as an argument on mount', () => {
//     const producerSpy = jest.fn(() => new Promise(noop))
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
//       TestComponent,
//     )
//     mount(<EnhancedComponent quantity={1} />)
//
//     expect(producerSpy).toHaveBeenCalled()
//     expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 })
//   })
//
//   it('provides a loading state of true when the value has not yet been resolved', () => {
//     const producerSpy = jest.fn(() => new Promise(noop))
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
//       TestComponent,
//     )
//
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     const props = wrapper.find<Props>(TestComponent).props()
//
//     expect(props.quantity).toBe(1)
//     expect(isLoading(props.async)).toBe(true)
//     expect(hasFailed(props.async)).toBe(false)
//     expect(hasSucceeded(props.async)).toBe(false)
//   })
//
//   it('displays its content, providing the promise resolution as a prop', () => {
//     const result = { chocolate: 5 }
//     const promise: Promise<TestAsyncValue> = new Promise(resolve => resolve(result))
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => promise)(
//       TestComponent,
//     )
//
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     jest.runOnlyPendingTimers()
//
//     return promise.then(() => {
//       jest.runOnlyPendingTimers()
//       wrapper.update()
//       const props = wrapper.find<Props>(TestComponent).props()
//       expect(props.quantity).toBe(1)
//       expect(isLoading(props.async)).toBe(false)
//       expect(hasFailed(props.async)).toBe(false)
//       expect(hasSucceeded(props.async)).toBe(true)
//       expect((props.async as Success<TestAsyncValue>).result).toEqual(result)
//     })
//   })
//
//   it('Can accept raw data from its producer, returning sync', () => {
//     const result = { chocolate: 5 }
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => result)(
//       TestComponent,
//     )
//
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     jest.runOnlyPendingTimers()
//     wrapper.update()
//     const props = wrapper.find<Props>(TestComponent).props()
//     expect(props.quantity).toBe(1)
//     expect(isLoading(props.async)).toBe(false)
//     expect(hasFailed(props.async)).toBe(false)
//     expect(hasSucceeded(props.async)).toBe(true)
//     expect((props.async as Success<TestAsyncValue>).result).toEqual(result)
//   })
//
//   it('provides the error if the promise is rejected', () => {
//     const reason = new Error('fail')
//     const promise = new Promise((resolve, reject) => setTimeout(() => reject(reason), 0)) as any
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => promise)(
//       TestComponent,
//     )
//
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     wrapper.setState({ error: reason, isLoading: false })
//
//     const props = wrapper.find<Props>(TestComponent).props()
//
//     expect(props.quantity).toBe(1)
//     expect(isLoading(props.async)).toBe(false)
//     expect(hasSucceeded(props.async)).toBe(false)
//     expect(hasFailed(props.async)).toBe(true)
//     expect((props.async as Failed).error).toEqual(reason)
//   })
//
//   it('aborts the promise if the component is unmounted', () => {
//     const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
//     abortablePromise.abort = jest.fn()
//
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(
//       () => abortablePromise,
//     )(TestComponent)
//
//     const wrapper = mount(<EnhancedComponent quantity={3} />)
//
//     wrapper.unmount()
//     expect(abortablePromise.abort).toHaveBeenCalled()
//   })
//
//   it('will re-call its promise producer if props are updated and predicate is true', () => {
//     const producerSpy = jest.fn(() => new Promise(noop))
//     const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5)
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
//       shouldReProduce: reevaluateSpy,
//     })(TestComponent)
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//
//     wrapper.setProps({ quantity: 2 })
//
//     expect(reevaluateSpy).toHaveBeenCalled()
//     expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 })
//   })
//
//   it('aborts any pending request if props are updated and predicate is true', () => {
//     const abortSpy = jest.fn()
//     const producerSpy = jest.fn(() => {
//       const promise = new Promise(noop) as Abortable<any>
//       promise.abort = abortSpy
//       return promise
//     })
//     const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5)
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
//       shouldReProduce: reevaluateSpy,
//     })(TestComponent)
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 })
//
//     wrapper.setProps({ quantity: 6 })
//     expect(reevaluateSpy).toHaveBeenCalled()
//     expect(abortSpy).toHaveBeenCalled()
//     expect(producerSpy).toHaveBeenCalledWith({ quantity: 6 })
//   })
//
//   it('will not re-call its promise producer if props are updated and predicate is not provided', () => {
//     const producerSpy = jest.fn(() => new Promise(noop))
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
//       TestComponent,
//     )
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//
//     expect(producerSpy).toHaveBeenCalledTimes(1)
//
//     wrapper.setProps({ quantity: 10 })
//
//     expect(producerSpy).toHaveBeenCalledTimes(1)
//   })
//
//   it('will not re-call its promise producer if props are updated and predicate returns false', () => {
//     const producerSpy = jest.fn(() => new Promise(noop))
//     const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5)
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
//       shouldReProduce: reevaluateSpy,
//     })(TestComponent)
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//
//     expect(producerSpy).toHaveBeenCalledTimes(1)
//
//     wrapper.setProps({ quantity: 2 })
//
//     expect(reevaluateSpy).toHaveBeenCalled()
//     expect(producerSpy).toHaveBeenCalledTimes(1)
//     expect(producerSpy).not.toHaveBeenCalledWith({ quantity: 2 })
//   })
//
//   it('will repeatedly perform requests when the pollInterval option is set', () => {
//     const producerSpy = jest.fn(() => Promise.resolve(''))
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
//       pollInterval: 100,
//     })(TestComponent)
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     runTimersToTime(1000)
//
//     expect(producerSpy).toHaveBeenCalledTimes(11)
//     wrapper.unmount()
//   })
//
//   it('will stop performing requests when the component is unmounted and pollInterval option is set', () => {
//     const producerSpy = jest.fn(() => Promise.resolve(''))
//     const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
//       pollInterval: 100,
//     })(TestComponent)
//     const wrapper = mount(<EnhancedComponent quantity={1} />)
//     runTimersToTime(1000)
//
//     expect(producerSpy).toHaveBeenCalledTimes(11)
//
//     wrapper.unmount()
//     runTimersToTime(1000)
//
//     expect(producerSpy).toHaveBeenCalledTimes(11)
//   })
//
//   it('provides an imperative API to re call the then producer', () => {
//     const producerSpy = jest.fn(() => Promise.resolve(''))
//     let asyncProps: AsyncProps<string> = null!
//     const EnhancedComponent = withAsync<{}, string>(producerSpy)(interceptor<AsyncProps<string>>(
//       (props: AsyncProps<string>) => {
//         asyncProps = props
//       },
//     )(() => <div />) as any)
//
//     mount(<EnhancedComponent />)
//
//     expect(producerSpy).toHaveBeenCalledTimes(1)
//     asyncProps.async.call()
//     expect(producerSpy).toHaveBeenCalledTimes(2)
//   })
// })
//
describe('<WithAsync />', () => {
  afterAll(jest.useRealTimers)
  beforeAll(jest.useFakeTimers)

  type TestAsyncValue = { chocolate: number }
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
    const producerSpy = jest.fn(() => new Promise(noop))
    mount(
      <Async
        producer={producerSpy}
        render={(async: AsyncState<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />,
    )

    expect(producerSpy).toHaveBeenCalled()
  })

  it('provides a loading state of true when the value has not yet been resolved', () => {
    const wrapper = mount(
      <Async
        producer={() => new Promise(noop) as any}
        render={(async: AsyncState<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />,
    )
    const props = wrapper.find<Props>(TestComponent).props()

    expect(props.quantity).toBe(1)
    expect(isLoading(props)).toBe(true)
    expect(hasSucceeded(props)).toBe(false)
    expect(hasFailed(props)).toBe(false)
  })

  it('displays its content, providing the promise resolution as a prop', () => {
    const result = { chocolate: 5 }
    const promise: Promise<TestAsyncValue> = new Promise(resolve => resolve(result))

    const wrapper = mount(
      <Async
        producer={() => promise}
        render={(async: AsyncState<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />,
    )
    jest.runOnlyPendingTimers()

    return promise.then(() => {
      jest.runOnlyPendingTimers()
      wrapper.update()
      const props = wrapper.find<Props>(TestComponent).props()
      expect(props.quantity).toBe(1)
      expect(isLoading(props)).toBe(false)
      expect(hasFailed(props)).toBe(false)
      expect(hasSucceeded(props)).toBe(true)
      expect((props as Success<TestAsyncValue>).result).toEqual(result)
    })
  })

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>
    abortablePromise.abort = jest.fn()

    const wrapper = mount(
      <Async
        producer={() => abortablePromise}
        render={(async: AsyncState<TestAsyncValue>) => <TestComponent quantity={3} {...async} />}
      />,
    )

    wrapper.unmount()
    expect(abortablePromise.abort).toHaveBeenCalled()
  })

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy = jest.fn(() => Promise.resolve(''))
    let interceptedProps: AsyncState<TestAsyncValue> & ImperativeApi = null as any
    mount(
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
