import { abort, makeThenable, Thenable } from 'abortable'
import { useCallback, useEffect, useRef, useState } from 'react'

function useInterval(callback: () => void, delay?: number) {
  const latestCallback = useRef<null | (() => void)>(null)
  useEffect(() => {
    latestCallback.current = callback
  })
  function tick() {
    if (latestCallback.current != null) {
      latestCallback.current()
    }
  }
  useEffect(() => {
    if (delay != null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
    return
  }, [delay])
}

export type Loading = { loading: true }
export type Failed = { error: Error }
export type Success<T> = { result: T }
export type AsyncState<T> =
  | Loading
  | Failed
  | (Failed & Loading)
  | Success<T>
  | (Success<T> & Loading)

export const isLoading = <T>(state: AsyncState<T>): state is Loading => !!(state as Loading).loading

export const hasFailed = <T>(state: AsyncState<T>): state is Failed =>
  'error' in state && state.error !== null

export const hasSucceeded = <T>(state: AsyncState<T>): state is Success<T> => 'result' in state

export type ImperativeApi = { call: (setIsLoading?: boolean) => void }

export type AsyncProps<T> = AsyncState<T> & ImperativeApi

export const useAsync = <T>(
  thenableProducer: () => Thenable<T>,
  dependencies: ReadonlyArray<any>,
  options?: { pollInterval: number },
): AsyncProps<T> => {
  const activeThenable = useRef<Thenable<T> | null>(null)
  const [state, setState] = useState<AsyncState<T>>({ loading: true } as Loading)
  const executeThenable = useCallback(() => {
    if (activeThenable.current != null) {
      abort([activeThenable.current])
    }
    activeThenable.current = makeThenable(thenableProducer())
    activeThenable.current
      .then((response: T): void => setState({ result: response } as Success<T>))
      .catch(error => {
        setState({ error } as Failed)
      })
      .then(() => (activeThenable.current = null))
  }, dependencies)

  useEffect(() => {
    executeThenable()
    return () => {
      if (activeThenable.current != null) {
        abort([activeThenable.current])
      }
    }
  }, dependencies)

  useInterval(executeThenable, options && options.pollInterval)

  return {
    ...state,
    call: (setIsLoading?: boolean) => {
      if (setIsLoading) {
        setState(previousState => ({ ...previousState, loading: true }))
      }
      executeThenable()
    },
  }
}
