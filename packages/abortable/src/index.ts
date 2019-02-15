const identity = <T>(t: T): T => t

export type Abortable<T> = Promise<T> & { abort(): void }

export type Cancelable<T> = Promise<T> & { cancel(): void }

export type Thenable<T> = Abortable<T> | Cancelable<T> | Promise<T>

export const makeThenable = <T>(thenable: Thenable<T> | T): Thenable<T> =>
  thenable.hasOwnProperty('then')
    ? // If the abortable is a `superagent` request the request wont be sent until it has been then'd
      (thenable as Promise<T>).then(identity)
    : Promise.resolve(thenable)

const abortPrivate = <T>(thenable: T | Thenable<T>): void => {
  if (thenable.hasOwnProperty('abort')) {
    ;(thenable as Abortable<any>).abort()
  }
  if (thenable.hasOwnProperty('cancel')) {
    ;(thenable as Cancelable<any>).cancel()
  }
}

export const abort = <T>(thenables: T | Thenable<T> | Array<Thenable<T>>): void => {
  if (!Array.isArray(thenables)) {
    abortPrivate(thenables)
    return
  }
  for (const thenable of thenables) {
    abortPrivate(thenable)
  }
}

export function all<T>(thenables: [Thenable<T>]): Abortable<[T]>
export function all<T1, T2>(thenables: [Thenable<T1>, Thenable<T2>]): Abortable<[T1, T2]>
export function all<T1, T2, T3>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>],
): Abortable<[T1, T2, T3]>
export function all<T1, T2, T3, T4>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>, Thenable<T4>],
): Abortable<[T1, T2, T3, T4]>
export function all<T1, T2, T3, T4, T5>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>, Thenable<T4>, Thenable<T5>],
): Abortable<[T1, T2, T3, T4, T5]>
export function all<T1, T2, T3, T4, T5, T6>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>, Thenable<T4>, Thenable<T5>, Thenable<T6>],
): Abortable<[T1, T2, T3, T4, T5, T6]>
export function all<T1, T2, T3, T4, T5, T6, T7>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>
  ],
): Abortable<[T1, T2, T3, T4, T5, T6, T7]>
export function all<T1, T2, T3, T4, T5, T6, T7, T8>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>,
    Thenable<T8>
  ],
): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8]>
export function all<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>,
    Thenable<T8>,
    Thenable<T9>
  ],
): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>
export function all<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>,
    Thenable<T8>,
    Thenable<T9>,
    Thenable<T10>
  ],
): Abortable<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]>
export function all<T>(thenables: Array<Thenable<T>>): Abortable<Array<T>>
export function all(thenables: Array<Thenable<any>>): Abortable<Array<any>> {
  const initiatedRequests: Array<Promise<any>> = thenables.map(makeThenable)
  const results: Array<any> = []
  const mergedAbortable: Promise<any> = initiatedRequests.reduce(
    (chainedAbortables, abortable) =>
      chainedAbortables.then(() => abortable).then((nextResult: any) => results.push(nextResult)),
    Promise.resolve(0),
  )

  const result = new Promise((resolve, reject) =>
    mergedAbortable
      .then(() => resolve(results))
      .catch(reason => {
        abort(thenables)
        reject(reason)
      }),
  ) as Abortable<any>

  result.abort = () => abort(thenables)

  return result
}

export function props<T extends {}>(
  thenablesMap: { [K in keyof T]: Thenable<T[K]> | T[K] },
): Abortable<T> {
  const thenables = Object.keys(thenablesMap).map(k => thenablesMap[k as keyof T])
  const keyPromiseValuePairs = Object.keys(thenablesMap).map(
    (key: string): Promise<[string, any]> =>
      makeThenable(thenablesMap[key as keyof T])
        .then((value: any): [string, any] => [key, value])
        .catch(reason => {
          abort(thenables)
          throw reason
        }),
  )
  const keyValuePairsPromise: Abortable<Array<[string, any]>> = all<[string, any]>(
    keyPromiseValuePairs,
  )
  const initialValue = {} as { [keys: string]: any }
  const result = keyValuePairsPromise.then(
    (
      keyValuePairs: Array<[string, any]>,
    ): {
      [keys: string]: any
    } =>
      keyValuePairs.reduce((obj: { [keys: string]: any }, [key, val]): { [keys: string]: any } => {
        obj[key] = val
        return obj
      }, initialValue),
  ) as Abortable<{}>
  result.abort = () => abort(thenables)
  return result as Abortable<T>
}

export function race<T>(thenables: [Thenable<T>]): Abortable<[T]>
export function race<T1, T2>(thenables: [Thenable<T1>, Thenable<T2>]): Abortable<T1 | T2>
export function race<T1, T2, T3>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>],
): Abortable<T1 | T2 | T3>
export function race<T1, T2, T3, T4>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>, Thenable<T4>],
): Abortable<T1 | T2 | T3 | T4>
export function race<T1, T2, T3, T4, T5>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>, Thenable<T4>, Thenable<T5>],
): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6>(
  thenables: [Thenable<T1>, Thenable<T2>, Thenable<T3>, Thenable<T4>, Thenable<T5>, Thenable<T6>],
): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6, T7>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>
  ],
): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7>
export function race<T1, T2, T3, T4, T5, T6, T7, T8>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>,
    Thenable<T8>
  ],
): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8>
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>,
    Thenable<T8>,
    Thenable<T9>
  ],
): Abortable<T1 | T2 | T3 | T4 | T5>
export function race<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(
  thenables: [
    Thenable<T1>,
    Thenable<T2>,
    Thenable<T3>,
    Thenable<T4>,
    Thenable<T5>,
    Thenable<T6>,
    Thenable<T7>,
    Thenable<T8>,
    Thenable<T9>,
    Thenable<T10>
  ],
): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>
export function race<T>(thenables: Array<Thenable<T>>): Abortable<Array<T>>
export function race(thenables: Array<Thenable<any>>): Abortable<any> {
  const result = new Promise((resolve, reject) => {
    for (const thenable of thenables) {
      thenable
        .then(firstResolvedResult => {
          abort(thenables)
          resolve(firstResolvedResult)
        })
        .catch(reason => {
          abort(thenables)
          reject(reason)
        })
    }
  }) as Abortable<any>

  result.abort = () => abort(thenables)
  return result as Abortable<any>
}
