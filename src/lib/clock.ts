export function getNow(): Date {
  const frozen = process.env.TEST_FROZEN_TIME
  if (frozen) {
    return new Date(frozen)
  }
  return new Date()
}
