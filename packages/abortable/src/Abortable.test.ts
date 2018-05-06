import * as Abortable from './abortable';

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
  it('will call the onFulfilled handler once all AbortablePromises have been resolved', () => {
    return Abortable.all([
      1,
      Promise.resolve(2),
      new Promise(resolve => resolve(Promise.resolve(3)))
    ]).then(results => {
      expect(results).toEqual([1, 2, 3]);
    });
  });

  it('will call abort on all of the passed abortables if one of the abortables throws', () => {
    const testResolvedAbortablePromise = Promise.resolve(456) as Abortable.Abortable<number>;
    testResolvedAbortablePromise.abort = jest.fn();

    const testRejectedAbortablePromise = Promise.reject<number>(789) as Abortable.Abortable<number>;

    return Abortable.all([123, testResolvedAbortablePromise, testRejectedAbortablePromise]).then(
      () => {
        throw new Error('Expected promise to be rejected');
      },
      reason => {
        expect(reason).toBe(789);
        expect(testResolvedAbortablePromise.abort).toHaveBeenCalled();
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
