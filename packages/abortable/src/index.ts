const identity = <T>(t: T): T => t

export type Abortable<T extends {}> = Promise<T> & { abort(): void }

export type Cancelable<T extends {}> = Promise<T> & { cancel(): void }

export type Thenable<T extends {}> = Abortable<T> | Cancelable<T> | Promise<T>

export const makeThenable = <T extends {}>(thenable: Thenable<T> | T): Thenable<T> =>
  thenable.hasOwnProperty('then')
    ? // If the abortable is a `superagent` request the request wont be sent until it has been then'd
      (thenable as Promise<T>).then(identity)
    : Promise.resolve(thenable)

const abortPrivate = <T extends {}>(thenable: Thenable<T>): void => {
  if (thenable.hasOwnProperty('abort')) {
    ;(thenable as Abortable<any>).abort()
  } else {
    if (thenable.hasOwnProperty('cancel')) {
      ;(thenable as Cancelable<any>).cancel()
    }
  }
}

export const abort = <T>(thenables: Thenable<T> | Array<Thenable<T>>): void => {
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
    Thenable<T7>,
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
    Thenable<T8>,
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
    Thenable<T9>,
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
    Thenable<T10>,
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
  thenablesMap: { [TKey in keyof T]: Thenable<T[TKey]> },
): Abortable<T> {
  type Key = keyof T
  const keys = Object.keys(thenablesMap) as Array<Key>
  const thenables: Array<Thenable<T[Key]>> = keys.map((k): Thenable<T[Key]> => thenablesMap[k])
  const keyValuePairsThenable = all<[Key, T[Key]]>(
    keys.map(key => {
      const thenable: Thenable<T[Key]> = makeThenable(thenablesMap[key])

      return thenable
        .then((value: T[Key]): [Key, T[Key]] => [key, value])
        .catch((reason: any) => {
          abort(thenables)
          throw reason
        })
    }),
  )
  const result = keyValuePairsThenable.then(
    (keyValuePairs: Array<[Key, T[Key]]>): T =>
      keyValuePairs.reduce((t: T, [key, value]) => {
        t[key] = value
        return t
      }, {} as T),
  ) as Abortable<T>
  result.abort = () => abort(thenables)
  return result
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
    Thenable<T7>,
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
    Thenable<T8>,
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
    Thenable<T9>,
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
    Thenable<T10>,
  ],
): Abortable<T1 | T2 | T3 | T4 | T5 | T6 | T7 | T8 | T9 | T10>
export function race<T>(thenables: Array<Thenable<T>>): Abortable<Array<T>>
export function race(thenables: Array<Thenable<any>>): Abortable<any> {
  const result = new Promise((resolve, reject) => {
    for (const thenable of thenables) {
      thenable
        .then((firstResolvedResult: any) => {
          abort(thenables)
          resolve(firstResolvedResult)
        })
        .catch((reason: any) => {
          abort(thenables)
          reject(reason)
        })
    }
  }) as Abortable<any>

  result.abort = () => abort(thenables)
  return result as Abortable<any>
}
