import { Abortable } from 'abortable';
import { mount, shallow } from 'enzyme';
import { interceptor } from 'props-interceptor';
import * as React from 'react';
import { AsyncProps, ImperativeApi, State, withAsync, Async } from './withAsync';
import runTimersToTime = jest.runTimersToTime;

const noop = () => {}; // tslint:disable-line

describe('withAsync', () => {
  afterAll(jest.useRealTimers);
  beforeAll(jest.useFakeTimers);

  type TestAsyncValue = { chocolate: number };
  type TestComponentOwnProps = { quantity: number };
  type Props = TestComponentOwnProps & AsyncProps<TestAsyncValue>;
  const TestComponent = (props: Props) => (
    <div>
      <div className="quantity">{props.quantity}</div>
      <div className="error">{props.async.error == null}</div>
      <div className="isLoading">{props.async.isLoading}</div>
      <div className="result">{props.async.result == null}</div>
    </div>
  );

  it('executes its abortableProducer, passing the components props as an argument on mount', () => {
    const producerSpy = jest.fn(() => new Promise(noop));
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
      TestComponent
    );
    mount(<EnhancedComponent quantity={1} />);

    expect(producerSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 });
  });

  it('provides a loading state of true when the value has not yet been resolved', () => {
    const producerSpy = jest.fn(() => new Promise(noop));
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
      TestComponent
    );

    const wrapper = mount(<EnhancedComponent quantity={1} />);

    expect(wrapper.find<Props>(TestComponent).props().quantity).toBe(1);
    expect(wrapper.find<Props>(TestComponent).props().async.isLoading).toBe(true);
    expect(wrapper.find<Props>(TestComponent).props().async.error).toBeNull();
    expect(wrapper.find<Props>(TestComponent).props().async.result).toBeNull();
  });

  it('displays its content, providing the promise resolution as a prop', () => {
    const result = { chocolate: 5 };
    const promise: Promise<TestAsyncValue> = new Promise(resolve => resolve(result));
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => promise)(
      TestComponent
    );

    const wrapper = mount(<EnhancedComponent quantity={1} />);
    jest.runOnlyPendingTimers();

    return promise.then(() => {
      jest.runOnlyPendingTimers();
      wrapper.update();
      const props = wrapper.find<Props>(TestComponent).props();
      expect(props.quantity).toBe(1);
      expect(props.async.isLoading).toBe(false);
      expect(props.async.error).toBeNull();
      expect(props.async.result).toEqual(result);
    });
  });

  it('provides the error if the promise is rejected', () => {
    const reason = new Error('fail');
    const promise = new Promise((resolve, reject) => setTimeout(() => reject(reason), 0)) as any;
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(() => promise)(
      TestComponent
    );

    const wrapper = mount(<EnhancedComponent quantity={1} />);
    wrapper.setState({ error: reason, isLoading: false });

    const props = wrapper.find<Props>(TestComponent).props();

    expect(props.quantity).toBe(1);
    expect(props.async.isLoading).toBe(false);
    expect(props.async.error).toEqual(reason);
    expect(props.async.result).toBeNull();
  });

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>;
    abortablePromise.abort = jest.fn();

    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(
      () => abortablePromise
    )(TestComponent);

    const wrapper = mount(<EnhancedComponent quantity={3} />);

    wrapper.unmount();
    expect(abortablePromise.abort).toHaveBeenCalled();
  });

  it('will re-call its promise producer if props are updated and predicate is true', () => {
    const producerSpy = jest.fn(() => new Promise(noop));
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5);
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      shouldReProduce: reevaluateSpy
    })(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);

    wrapper.setProps({ quantity: 2 });

    expect(reevaluateSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 });
  });

  it('aborts any pending request if props are updated and predicate is true', () => {
    const abortSpy = jest.fn();
    const producerSpy = jest.fn(() => {
      const promise = new Promise(noop) as Abortable<any>;
      promise.abort = abortSpy;
      return promise;
    });
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5);
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      shouldReProduce: reevaluateSpy
    })(TestComponent);
    const wrapper = shallow(<EnhancedComponent quantity={1} />, { lifecycleExperimental: true });
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 1 });

    wrapper.setProps({ quantity: 6 });
    expect(reevaluateSpy).toHaveBeenCalled();
    expect(abortSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledWith({ quantity: 6 });
  });

  it('will not re-call its promise producer if props are updated and predicate is not provided', () => {
    const producerSpy = jest.fn(() => new Promise(noop));
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy)(
      TestComponent
    );
    const wrapper = mount(<EnhancedComponent quantity={1} />);

    expect(producerSpy).toHaveBeenCalledTimes(1);

    wrapper.setProps({ quantity: 10 });

    expect(producerSpy).toHaveBeenCalledTimes(1);
  });

  it('will not re-call its promise producer if props are updated and predicate returns false', () => {
    const producerSpy = jest.fn(() => new Promise(noop));
    const reevaluateSpy = jest.fn((props, nextProps) => nextProps.quantity > 5);
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      shouldReProduce: reevaluateSpy
    })(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);

    expect(producerSpy).toHaveBeenCalledTimes(1);

    wrapper.setProps({ quantity: 2 });

    expect(reevaluateSpy).toHaveBeenCalled();
    expect(producerSpy).toHaveBeenCalledTimes(1);
    expect(producerSpy).not.toHaveBeenCalledWith({ quantity: 2 });
  });

  it('will repeatedly perform requests when the pollInterval option is set', () => {
    const producerSpy = jest.fn(() => Promise.resolve(''));
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      pollInterval: 100
    })(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);
    runTimersToTime(1000);

    expect(producerSpy).toHaveBeenCalledTimes(11);
    wrapper.unmount();
  });

  it('will stop performing requests when the component is unmounted and pollInterval option is set', () => {
    const producerSpy = jest.fn(() => Promise.resolve(''));
    const EnhancedComponent = withAsync<TestComponentOwnProps, TestAsyncValue>(producerSpy, {
      pollInterval: 100
    })(TestComponent);
    const wrapper = mount(<EnhancedComponent quantity={1} />);
    runTimersToTime(1000);

    expect(producerSpy).toHaveBeenCalledTimes(11);

    wrapper.unmount();
    runTimersToTime(1000);

    expect(producerSpy).toHaveBeenCalledTimes(11);
  });

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy = jest.fn(() => Promise.resolve(''));
    let asyncProps: AsyncProps<string> = null!;
    const Component = interceptor((props: AsyncProps<string>) => {
      asyncProps = props;
    })(() => <div />);
    const EnhancedComponent = withAsync<{}, string>(producerSpy)(Component);
    mount(<EnhancedComponent />);

    expect(producerSpy).toHaveBeenCalledTimes(1);
    asyncProps.async.call();
    expect(producerSpy).toHaveBeenCalledTimes(2);
  });
});

describe('<WithAsync />', () => {
  afterAll(jest.useRealTimers);
  beforeAll(jest.useFakeTimers);

  type TestAsyncValue = { chocolate: number };
  type TestComponentOwnProps = { quantity: number };
  type Props = TestComponentOwnProps & State<TestAsyncValue>;
  const TestComponent = (props: Props) => (
    <div>
      <div className="quantity">{props.quantity}</div>
      <div className="error">{props.error == null}</div>
      <div className="isLoading">{props.isLoading}</div>
      <div className="result">{props.result == null}</div>
    </div>
  );

  it('executes its abortableProducer, passing the components props as an argument on mount', () => {
    const producerSpy = jest.fn(() => new Promise(noop));
    mount(
      <Async
        producer={producerSpy}
        render={(async: State<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />
    );

    expect(producerSpy).toHaveBeenCalled();
  });

  it('provides a loading state of true when the value has not yet been resolved', () => {
    const wrapper = mount(
      <Async
        producer={() => new Promise(noop) as any}
        render={(async: State<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />
    );

    expect(wrapper.find<Props>(TestComponent).props().quantity).toBe(1);
    expect(wrapper.find<Props>(TestComponent).props().isLoading).toBe(true);
    expect(wrapper.find<Props>(TestComponent).props().error).toBeNull();
    expect(wrapper.find<Props>(TestComponent).props().result).toBeNull();
  });

  it('displays its content, providing the promise resolution as a prop', () => {
    const result = { chocolate: 5 };
    const promise: Promise<TestAsyncValue> = new Promise(resolve => resolve(result));

    const wrapper = mount(
      <Async
        producer={() => promise}
        render={(async: State<TestAsyncValue>) => <TestComponent quantity={1} {...async} />}
      />
    );
    jest.runOnlyPendingTimers();

    return promise.then(() => {
      jest.runOnlyPendingTimers();
      wrapper.update();
      const props = wrapper.find<Props>(TestComponent).props();
      expect(props.quantity).toBe(1);
      expect(props.isLoading).toBe(false);
      expect(props.error).toBeNull();
      expect(props.result).toEqual(result);
    });
  });

  it('aborts the promise if the component is unmounted', () => {
    const abortablePromise = new Promise(noop) as Abortable<TestAsyncValue>;
    abortablePromise.abort = jest.fn();

    const wrapper = mount(
      <Async
        producer={() => abortablePromise}
        render={(async: State<TestAsyncValue>) => <TestComponent quantity={3} {...async} />}
      />
    );

    wrapper.unmount();
    expect(abortablePromise.abort).toHaveBeenCalled();
  });

  it('provides an imperative API to re call the then producer', () => {
    const producerSpy = jest.fn(() => Promise.resolve(''));
    let interceptedProps: State<TestAsyncValue> & ImperativeApi = null!;
    const wrapper = mount(
      <Async
        producer={producerSpy}
        render={(async: State<TestAsyncValue> & ImperativeApi) => {
          interceptedProps = async;
          return <TestComponent quantity={3} {...async} />;
        }}
      />
    );

    expect(producerSpy).toHaveBeenCalledTimes(1);
    interceptedProps.call();
    expect(producerSpy).toHaveBeenCalledTimes(2);
  });
});
