function isFunction(fn) {
  return typeof fn === 'function';
}

export function callback(value) {
  return isFunction(value) ? value : () => value;
}
