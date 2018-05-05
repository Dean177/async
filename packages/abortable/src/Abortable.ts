const identity = <T>(t: T): T => t;

export type Abortable<T> = Promise<T> & { abort(): void };

export type Cancelable<T> = Promise<T> & { cancel(): void };

export type Thenable<T> = Abortable<T> | Cancelable<T> | Promise<T>;

export type AbortableLike<T> = Thenable<T> | T;

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

export function all<T>(abortables: [AbortableLike<T>]): Abortable<[T]>
export function all<T1, T2>(abortables: [AbortableLike<T1>, AbortableLike<T2>]): Abortable<[T1, T2]>
export function all<T1, T2, T3>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>]): Abortable<[T1, T2, T3]>
export function all<T1, T2, T3, T4>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>]): Abortable<[T1, T2, T3, T4]>
export function all<T1, T2, T3, T4, T5>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<[T1, T2, T3, T4, T5]>
export function all<T1, T2, T3, T4, T5, T6>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>, AbortableLike<T6>]): Abortable<[T1, T2, T3, T4, T5, T6]>
export function all<T1, T2, T3, T4, T5, T6, T7>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>, AbortableLike<T6>, AbortableLike<T7>]): Abortable<[T1, T2, T3, T4, T5, T6, T7]>
export function all<T1, T2, T3, T4, T5, T6, T7, T8>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>, AbortableLike<T6>, AbortableLike<T7>, AbortableLike<T8> ]): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8]>
export function all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>,  AbortableLike<T6>, AbortableLike<T7>, AbortableLike<T8>, AbortableLike<T9>]): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
export function all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>, AbortableLike<T6>, AbortableLike<T7>, AbortableLike<T8>, AbortableLike<T9>, AbortableLike<T10>]): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>
export function all(abortables: Array<any | Abortable<any>>): Abortable<Array<any>> {
  // If the abortable is a superagent request the request wont be sent until it has been then'd
  const initiatedRequests: Array<Promise<any>> = abortables.map((abortable): Promise<any> =>
    abortable.then ? abortable.then(identity) : Promise.resolve(abortable));

  const results: Array<any> = [];
  const mergedAbortable: Promise<any> = initiatedRequests.reduce(
    (chainedAbortables, abortable) =>
      chainedAbortables.then(() => abortable).then((result: any) => results.push(result)),
    Promise.resolve(0),
  );

  const result = new Promise((resolve, reject) =>
    mergedAbortable
      .then(() => resolve(results))
      .catch(reason => {
        abort(abortables);
        reject(reason);
      })
  ) as Abortable<any>;

  result.abort = () => abort(abortables);

  return result;
}

export function race<T>(abortables: [AbortableLike<T>]): Abortable<[T]>
export function race<T1, T2>(abortables: [AbortableLike<T1>, AbortableLike<T2>]): Abortable<T1 | T2>
export function race<T1, T2, T3>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>]): Abortable<T1 | T2 | T3>
export function race<T1, T2, T3, T4>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>]): Abortable<T1 | T2 | T3 | T4>
export function race<T1, T2, T3, T4, T5>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6, T7>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6, T7, T8>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(abortables: [AbortableLike<T1>, AbortableLike<T2> | AbortableLike<T3>, AbortableLike<T4>, AbortableLike<T5>]): Abortable<T1 | T2 | T3 | T4 | T5>
export function race(abortables: Array<Abortable<any>>): Abortable<any> {
  const result = new Promise((resolve, reject) => {
    for (const abortable of abortables) {
      abortable
        .then((result) => {
          abort(abortables);
          resolve(result);
        })
        .catch(reason => {
          abort(abortables);
          reject(reason);
        });
    }
  }) as Abortable<any>;

  result.abort = () => abort(abortables);
  return result as Abortable<any>;
}
