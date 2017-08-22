import { Abortable } from 'abortable';
import { mount } from 'enzyme';
import * as React from 'react';
import { AsyncProps, withAsyncResource } from './withAsyncResource';

describe('withAsyncResource', () => {
  afterAll(jest.useRealTimers);
  beforeAll(jest.useFakeTimers);

  type TestAsyncValue = { chocolate: number };
  type TestComponentOwnProps = { quantity: number };
  type Props = TestComponentOwnProps & AsyncProps<TestAsyncValue>;
  const TestComponent = (props: Props) =>
    <div>
      <div className="quantity">{props.quantity}</div>
      <div className="error">{props.async.error == null}</div>
      <div className="isLoading">{props.async.isLoading}</div>
      <div className="result">{props.async.result == null}</div>
    </div>;

  it('executes its abortableProducer, passing the components props as an argument on mount', () => {
    const producerSpy = jest.fn(() => new Promise(() => {}));
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      producerSpy
    )(TestComponent);
    mount(<EnhancedComponent quantity={1} />);

    expect(producerSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 });
  });

  it('provides a loading state of true when the value has not yet been resolved', () => {
    const producerSpy = jest.fn(() => new Promise(() => {}));
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      producerSpy
    )(TestComponent);

    const wrapper = mount(<EnhancedComponent quantity={1} />);

    expect(wrapper.find<Props>(TestComponent).props().quantity).toBe(1);
    expect(wrapper.find<Props>(TestComponent).props().async.isLoading).toBe(true);
    expect(wrapper.find<Props>(TestComponent).props().async.error).toEqual(null);
    expect(wrapper.find<Props>(TestComponent).props().async.result).toEqual(null);
  });

  it('displays its content, providing the promise resolution as a prop', () => {
    const result = { chocolate: 5 };
    const promise: Promise<TestAsyncValue> = new Promise((resolve) => setTimeout(() => resolve(result), 0));
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(() => promise)(TestComponent);

    const wrapper = mount(<EnhancedComponent quantity={1} />);
    jest.runOnlyPendingTimers();

    return promise.then(() => {
      jest.runOnlyPendingTimers();
      expect(wrapper.find<Props>(TestComponent).props().quantity).toBe(1);
      expect(wrapper.find<Props>(TestComponent).props().async.isLoading).toBe(false);
      expect(wrapper.find<Props>(TestComponent).props().async.error).toEqual(null);
      expect(wrapper.find<Props>(TestComponent).props().async.result).toEqual(result);
    });
  });

  it('provides the error if the promise is rejected', () => {
    const reason = new Error('fail');
    const promise = new Promise((resolve, reject) => setTimeout(() => reject(reason), 0)) as any;
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(() => promise)(TestComponent);

    const wrapper = mount(<EnhancedComponent quantity={1} />);
    wrapper.setState({ error: reason, isLoading: false });

    expect(wrapper.find<Props>(TestComponent).props().quantity).toBe(1);
    expect(wrapper.find<Props>(TestComponent).props().async.isLoading).toBe(false);
    expect(wrapper.find<Props>(TestComponent).props().async.error).toEqual(reason);
    expect(wrapper.find<Props>(TestComponent).props().async.result).toEqual(null);
  });

  it('aborts the promise if the component is unmounted', () => {
    let abortablePromise = new Promise(() => {}) as Abortable<TestAsyncValue>;
    abortablePromise.abort = jest.fn();

    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      () => abortablePromise
    )(TestComponent);

    const wrapper = mount(<EnhancedComponent quantity={3} />);

    wrapper.unmount();
    expect(abortablePromise.abort).toHaveBeenCalled();
  });

  it('will re-call its promise producer if props are updated and predicate is true', () => {
    const producerSpy = jest.fn(() => new Promise(() => {}));
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5);
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      producerSpy,
      reevaluateSpy
    )(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);

    wrapper.setProps({ quantity: 2 });

    expect(reevaluateSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 });
  });

  it('aborts any pending request if props are updated and predicate is true', () => {
    const abortSpy = jest.fn();
    const producerSpy = jest.fn(() => {
      const promise = new Promise(() => {}) as Abortable<any>;
      promise.abort = abortSpy;
      return promise;

    });
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5);
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      producerSpy,
      reevaluateSpy
    )(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 });

    wrapper.setProps({ quantity: 6 });
    expect(reevaluateSpy).toHaveBeenCalled();
    expect(abortSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 6 });
  });

  it('will not re-call its promise producer if props are updated and predicate is not provided', () => {
    const producerSpy = jest.fn(() => new Promise(() => {}));
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      producerSpy
    )(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);

    expect(producerSpy).toHaveBeenCalledTimes(1);

    wrapper.setProps({ quantity: 10 });

    expect(producerSpy).toHaveBeenCalledTimes(1);
  });

  it('will not re-call its promise producer if props are updated and predicate returns false', () => {
    const producerSpy = jest.fn(() => new Promise(() => {}));
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5);
    const EnhancedComponent = withAsyncResource<TestComponentOwnProps, TestAsyncValue>(
      producerSpy,
      reevaluateSpy,
    )(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);

    expect(producerSpy).toHaveBeenCalledTimes(1);

    wrapper.setProps({ quantity: 2 });

    expect(reevaluateSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledTimes(1);
    expect(producerSpy).not.toHaveBeenCalledWith({ quantity: 2 });
  });
});