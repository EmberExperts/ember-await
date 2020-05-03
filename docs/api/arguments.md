# Arguments

These can be passed to `<Await />` component.

- [`promise`](#promise) An already started Promise instance or function that returns a Promise, automatically invoked..
- [`defer`](#defer) Function that returns a Promise, manually invoked with `run`.
- ~~[`initialValue`](#initialvalue) Provide initial data or error for server-side rendering.~~
- ~~[`onResolve`](#onresolve) Callback invoked when Promise resolves.~~
- ~~[`onReject`](#onreject) Callback invoked when Promise rejects.~~
- ~~[`onCancel`](#oncancel) Callback invoked when a Promise is cancelled.~~
- ~~[`json`](#json) Enable JSON parsing of the response.~~

## `promise`

> `Promise | function(): Promise`

A Promise instance which has already started or a function that returns a promise Changing the value of `promise` will cancel any pending promise and listen to the new one. The promise function is automatically invoked during component construction. If `promise` is initially undefined, the Ember Await state will be `pending`.

> Note that `reload` will not do anything when `promise` has been passed as property not a function.

## `defer`

> `function(...args): Promise`

A function that returns a promise. This is invoked only by manually calling `run(...args)`. The `defer` is commonly used to send data to the server following a user action, such as submitting a form. You can use this in conjunction with `promise` to fill the form with existing data, then updating it on submit with `defer`.

> Be aware that when using both `promise` and `defer`, the shape of their fulfilled value should match, because they both update the same `data`.
