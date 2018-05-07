import { makeThenable, Thenable } from './index';
import * as Abortable from './index';

describe('Abortable.abort', () => {
  it('iterates the thenables and calls the abort or cancel method if present', () => {
    const abortable = Promise.resolve(1) as Abortable.Abortable<number>;
    abortable.abort = jest.fn();
    const cancellable = Promise.resolve(2) as Abortable.Cancelable<number>;
    cancellable.cancel = jest.fn();

    Abortable.abort([abortable, cancellable]);

    expect(abortable.abort).toHaveBeenCalled();
    expect(cancellable.cancel).toHaveBeenCalled();
  });
});

describe('Abortable.all', () => {
  it('will call the onFulfilled handler once all Thenables have been resolved', () => {
    return Abortable.all([
      Promise.resolve(1),
      Promise.resolve(2),
      new Promise(resolve => resolve(Promise.resolve(3)))
    ]).then(results => {
      expect(results).toEqual([1, 2, 3]);
    });
  });

  it('can be aborted and will abort or cancel each of the values', () => {
    const abortable = Promise.resolve(1) as Abortable.Abortable<number>;
    abortable.abort = jest.fn();
    const cancellable = Promise.resolve(2) as Abortable.Cancelable<number>;
    cancellable.cancel = jest.fn();

    Abortable.all([abortable, cancellable]).abort();

    expect(abortable.abort).toHaveBeenCalled();
    expect(cancellable.cancel).toHaveBeenCalled();
  });

  it('will call abort on all of the passed abortables if one of the abortables throws', () => {
    const resolvedAbortable = Promise.resolve(456) as Abortable.Abortable<number>;
    resolvedAbortable.abort = jest.fn();

    const rejectedPromise = Promise.reject<number>(789) as Abortable.Abortable<number>;

    return Abortable.all([Promise.resolve(123), resolvedAbortable, rejectedPromise]).then(
      () => {
        throw new Error('Expected promise to be rejected');
      },
      reason => {
        expect(reason).toBe(789);
        expect(resolvedAbortable.abort).toHaveBeenCalled();
      }
    );
  });
});

describe('makeThenable', () => {
  it('will lift a non-thenable value into a promise', () =>
    makeThenable(1).then(res => expect(res).toBe(1)));

  it('will call then on thenable value', () => {
    const rawThenable = { then: jest.fn(() => Promise.resolve(1)) };
    const thenable = makeThenable(rawThenable);
    expect(rawThenable.then).toHaveBeenCalled();
    return thenable.then(res => {
      expect(res).toBe(1);
    });
  });
});

describe('Abortable.map', () => {
  it('returns a promise which resolves with a map of the resolved promise', () =>
    Abortable.map({ a: Promise.resolve(1), b: Promise.resolve('two') }).then(resolvedValue => {
      expect(resolvedValue).toEqual({ a: 1, b: 'two' });
    }));

  it('can be aborted and will abort or cancel each of the values', () => {
    const abortable = Promise.resolve(1) as Abortable.Abortable<number>;
    abortable.abort = jest.fn();
    const cancellable = Promise.resolve(2) as Abortable.Cancelable<number>;
    cancellable.cancel = jest.fn();

    Abortable.map({ a: abortable, b: cancellable }).abort();

    expect(abortable.abort).toHaveBeenCalled();
    expect(cancellable.cancel).toHaveBeenCalled();
  });

  it('will call abort on all of the passed abortables if one of the abortables throws', () => {
    const resolvedAbortable = Promise.resolve(456) as Abortable.Abortable<number>;
    resolvedAbortable.abort = jest.fn();

    const rejectedPromise = Promise.reject<number>(789);

    return Abortable.map({
      a: Promise.resolve(123),
      b: resolvedAbortable,
      c: rejectedPromise
    }).then(
      () => {
        throw new Error('Expected promise to be rejected');
      },
      reason => {
        expect(reason).toBe(789);
        expect(resolvedAbortable.abort).toHaveBeenCalled();
      }
    );
  });
});

describe('Abortable.race', () => {
  it('Will call the onFulfilled handler as soon as oneAbortablePromises has been resolved', () => {
    const testResolvedAbortablePromise = Promise.resolve('one') as Abortable.Abortable<string>;
    testResolvedAbortablePromise.abort = jest.fn();

    const testSlowResolvedAbortablePromise = new Promise(resolve =>
      setTimeout(resolve, 1000, 'two')
    ) as Abortable.Abortable<number>;
    testSlowResolvedAbortablePromise.abort = jest.fn();

    return Abortable.race([testResolvedAbortablePromise, testSlowResolvedAbortablePromise]).then(
      result => {
        expect(result).toEqual('one');
      }
    );
  });

  it('Will call abort on all of the passed abortables if one of the abortables throws', () => {
    const testSlowResolvedAbortablePromise = new Promise(resolve =>
      setTimeout(resolve, 2000, 'two')
    ) as Abortable.Abortable<number>;
    testSlowResolvedAbortablePromise.abort = jest.fn();

    const testRejectedAbortablePromise = Promise.reject<string>('reason') as Abortable.Abortable<
      string
    >;
    testRejectedAbortablePromise.abort = jest.fn();

    return Abortable.race([testRejectedAbortablePromise, testSlowResolvedAbortablePromise]).then(
      () => {
        throw new Error('Expected promise to be rejected');
      },
      reason => {
        expect(reason).toBe('reason');
        expect(testSlowResolvedAbortablePromise.abort).toHaveBeenCalled();
        expect(testRejectedAbortablePromise.abort).toHaveBeenCalled();
      }
    );
  });
});
