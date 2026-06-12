export function runDeferredEffect(task: () => void | Promise<void>) {
  void Promise.resolve().then(task)
}
