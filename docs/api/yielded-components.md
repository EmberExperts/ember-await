# Yielded components

Ember Await provides several components you can use inside in `<Await />` and can use the same component many times.

## `Initial`

Renders only while the deferred promise is still waiting to be run, or you have not provided any promise.

### Arguments

- ~~`persist` `boolean` Show until we have data, even while loading or when an error occurred. By default it hides as soon as the promise starts loading.~~

### Examples

```hbs
<Await defer={{this.deferFn}} as |await|>
  <await.Initial>
    <p>This text is only rendered while `run` has not yet been invoked on `defer`.</p>
  </await.Initial>
</Await>
```

## `Pending`

This component renders only while the promise is pending \(loading / unsettled\).

~~Alias: `<Await.Loading>`~~

### Arguments

- ~~`initial` `boolean` Show only on initial load \(when `data` is `undefined`\).~~

### Examples

```hbs
<Await promise={{this.promise}} as |await|>
  <await.Pending>
    <p>This text is only rendered while awaiting for promise resolution</p>
  </await.Pending>
</Await>
```

## `Fulfilled`

This component renders only when the promise is fulfilled \(resolved to a value, could be `undefined`\).

~~Alias: `<Await.Resolved>`~~

### Yielded properties

- `data` `any` Result from resolved promise

### Arguments

- ~~`persist` `boolean` Show old data while loading new data. By default it hides as soon as a new promise starts.~~

### Examples

```hbs
<Await promise={{this.promise}} as |await|>
  <await.Fulfilled as |data|>
    The result is: {{data}}
  </await.Fulfilled>
</Await>
```

## `Rejected`

This component renders only when the promise is rejected.

### Yielded properties

- `error` `Error` Error from rejected promise

### Arguments

- ~~`persist` `boolean` Show old error while loading new data. By default it hides as soon as a new promise starts.~~

### Examples

```hbs
<Await promise={{this.promise}} as |await|>
  <await.Rejected as |error|>
    The error is: {{error.message}}
  </await.Rejected>
</Await>
```

## `Settled`

This component renders only when the promise is settled (resolved or rejected).

### Arguments

- ~~`persist` `boolean` Show old error while loading new data. By default it hides as soon as a new promise starts.~~

### Examples

```hbs
<Await promise={{this.promise}} as |await|>
  <await.Settled>
    Request has been settled
  </await.Settled>
</Await>
```
