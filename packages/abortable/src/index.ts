const identity = <T>(t: T): T => t;

export type Abortable<T> = Promise<T> & { abort(): void };

export type Cancelable<T> = Promise<T> & { cancel(): void };

export type Thenable<T> = Abortable<T> | Cancelable<T> | Promise<T>;

export type ThenableOrValue<T> = Thenable<T> | T;

export const makeThenable = <T>(thenable: Thenable<T> | T): Thenable<T> =>
  thenable.hasOwnProperty('then')
    ? // If the abortable is a superagent request the request wont be sent until it has been then'd
      (thenable as Promise<T>).then(identity)
    : Promise.resolve(thenable);

export const abort = (thenables: Array<Thenable<any>>): void => {
  for (const thenable of thenables) {
    if (thenable.hasOwnProperty('abort')) {
      (thenable as Abortable<any>).abort();
    }
    if (thenable.hasOwnProperty('cancel')) {
      (thenable as Cancelable<any>).cancel();
    }
  }
};

export function all<T>(thenables: [ThenableOrValue<T>]): Abortable<[T]>;
export function all<T1, T2>(
  thenables: [ThenableOrValue<T1>, ThenableOrValue<T2>]
): Abortable<[T1, T2]>;
export function all<T1, T2, T3>(
  thenables: [ThenableOrValue<T1>, ThenableOrValue<T2> | ThenableOrValue<T3>]
): Abortable<[T1, T2, T3]>;
export function all<T1, T2, T3, T4>(
  thenables: [ThenableOrValue<T1>, ThenableOrValue<T2> | ThenableOrValue<T3>, ThenableOrValue<T4>]
): Abortable<[T1, T2, T3, T4]>;
export function all<T1, T2, T3, T4, T5>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<[T1, T2, T3, T4, T5]>;
export function all<T1, T2, T3, T4, T5, T6>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>,
    ThenableOrValue<T6>
  ]
): Abortable<[T1, T2, T3, T4, T5, T6]>;
export function all<T1, T2, T3, T4, T5, T6, T7>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>,
    ThenableOrValue<T6>,
    ThenableOrValue<T7>
  ]
): Abortable<[T1, T2, T3, T4, T5, T6, T7]>;
export function all<T1, T2, T3, T4, T5, T6, T7, T8>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>,
    ThenableOrValue<T6>,
    ThenableOrValue<T7>,
    ThenableOrValue<T8>
  ]
): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8]>;
export function all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>,
    ThenableOrValue<T6>,
    ThenableOrValue<T7>,
    ThenableOrValue<T8>,
    ThenableOrValue<T9>
  ]
): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>;
export function all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>,
    ThenableOrValue<T6>,
    ThenableOrValue<T7>,
    ThenableOrValue<T8>,
    ThenableOrValue<T9>,
    ThenableOrValue<T10>
  ]
): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>;
export function all(thenables: Array<any | Abortable<any>>): Abortable<Array<any>> {
  const initiatedRequests: Array<Promise<any>> = thenables.map(makeThenable);
  const results: Array<any> = [];
  const mergedAbortable: Promise<any> = initiatedRequests.reduce(
    (chainedAbortables, abortable) =>
      chainedAbortables.then(() => abortable).then((nextResult: any) => results.push(nextResult)),
    Promise.resolve(0)
  );

  const result = new Promise((resolve, reject) =>
    mergedAbortable.then(() => resolve(results)).catch(reason => {
      abort(thenables);
      reject(reason);
    })
  ) as Abortable<any>;

  result.abort = () => abort(thenables);

  return result;
}

export function race<T>(thenables: [ThenableOrValue<T>]): Abortable<[T]>;
export function race<T1, T2>(
  thenables: [ThenableOrValue<T1>, ThenableOrValue<T2>]
): Abortable<T1 | T2>;
export function race<T1, T2, T3>(
  thenables: [ThenableOrValue<T1>, ThenableOrValue<T2> | ThenableOrValue<T3>]
): Abortable<T1 | T2 | T3>;
export function race<T1, T2, T3, T4>(
  thenables: [ThenableOrValue<T1>, ThenableOrValue<T2> | ThenableOrValue<T3>, ThenableOrValue<T4>]
): Abortable<T1 | T2 | T3 | T4>;
export function race<T1, T2, T3, T4, T5>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<T1 | T2 | T3 | T4 | T5>;
export function race<T1, T2, T3, T4, T5, T6>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<T1 | T2 | T3 | T4 | T5>;
export function race<T1, T2, T3, T4, T5, T6, T7>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<T1 | T2 | T3 | T4 | T5>;
export function race<T1, T2, T3, T4, T5, T6, T7, T8>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<T1 | T2 | T3 | T4 | T5>;
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<T1 | T2 | T3 | T4 | T5>;
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  thenables: [
    ThenableOrValue<T1>,
    ThenableOrValue<T2> | ThenableOrValue<T3>,
    ThenableOrValue<T4>,
    ThenableOrValue<T5>
  ]
): Abortable<T1 | T2 | T3 | T4 | T5>;
export function race(thenables: Array<Abortable<any>>): Abortable<any> {
  const result = new Promise((resolve, reject) => {
    for (const thenable of thenables) {
      thenable
        .then(firstResolvedResult => {
          abort(thenables);
          resolve(firstResolvedResult);
        })
        .catch(reason => {
          abort(thenables);
          reject(reason);
        });
    }
  }) as Abortable<any>;

  result.abort = () => abort(thenables);
  return result as Abortable<any>;
}
