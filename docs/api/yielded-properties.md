# Yielded properties

These are yielded properties by `<Await />` component:

- [`data`](#data) Last resolved promise value, maintained when new error arrives.
- [`error`](#error) Rejected promise reason, cleared when new data arrives.
- [`value`](#value) The value of `data` or `error`, whichever was last updated.
- [`initialValue`](#initialvalue) The data or error that was provided through the `initialValue` argument.
- [`startedAt`](#startedat) When the current/last promise was started.
- [`finishedAt`](#finishedat) When the last promise was fulfilled or rejected.
- [`status`](#status) One of: `initial`, `pending`, `fulfilled`, `rejected`.
- [`isInitial`](#isinitial) true when no promise has ever started, or one started but was cancelled.
- [`isPending`](#ispending) true when a promise is currently awaiting settlement. Alias: `isLoading`
- [`isFulfilled`](#isfulfilled) true when the last promise was fulfilled. Alias: `isResolved`
- [`isRejected`](#isrejected) true when the last promise was rejected.
- [`isSettled`](#issettled) true when the last promise was fulfilled or rejected \(not initial or pending\).
- [`counter`](#counter) The number of times a promise was started.
- [`query`](#query) An reference to the internal Query wrapper, which can be chained on.
- [`run`](#run) Invokes the `defer`.
- [`reload`](#reload) Re-runs the promise when invoked.
- [`cancel`](#cancel) Cancel any pending promise.

## `data`

> `any`

Last resolved promise value, maintained when new error arrives.

## `error`

> `Error`

Rejected promise reason, cleared when new data arrives.

## `value`

> `any | Error`

The data or error that was last provided \(either through `initialValue` or by settling a promise\).

## `initialValue`

> `any | Error`

The data or error that was originally provided through the `initialValue` argument.

## `startedAt`

> `Date`

Tracks when the current/last promise was started.

## `finishedAt`

> `Date`

Tracks when the last promise was resolved or rejected.


## `status`

> `string`

One of: `initial`, `pending`, `fulfilled`, `rejected`.

## `isInitial`

> `boolean`

`true` while no promise has started yet, or one was started but cancelled.

## `isPending`

> `boolean`

`true` while a promise is pending \(loading\), `false` otherwise.

Alias: `isLoading`

## `isFulfilled`

> `boolean`

`true` when the last promise was fulfilled \(resolved to a value\).

Alias: `isResolved`

## `isRejected`

> `boolean`

`true` when the last promise was rejected.

## `isSettled`

> `boolean`

`true` when the last promise was either fulfilled or rejected \(i.e. not initial or pending\)

## `counter`

> `number`

The number of times a promise was started.

## `query`

> `Query`

A reference to the internal wrapper `Query` created when initializing the component.
It contains all the internal API, exposed as public by this component. More about Query, soon.

Useful as a chainable alternative to the `onResolve` / `onReject` callbacks.

## `run`

> `function(...args: any[]): Query`

Runs the `defer`, passing any arguments provided as an array.

## `reload`

> `function(): Query`

Re-runs the promise when invoked.

## `cancel`

> `function(): void`

Cancels the currently pending promise by ignoring its result.
