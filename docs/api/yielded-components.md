# Yielded components

Ember Await provides several components you can use inside in `<Await />` and can use the same component many times.

## `<Await.Initial>`

Renders only while the deferred promise is still waiting to be run, or you have not provided any promise.

### Arguments

- ~~`persist` `boolean` Show until we have data, even while loading or when an error occurred. By default it hides as soon as the promise starts loading.~~

### Examples

```hbs
<Await defer={{this.deferFn}}>
  <Await.Initial>
    <p>This text is only rendered while `run` has not yet been invoked on `defer`.</p>
  </Await.Initial>
</Await>
```

## `<Await.Pending>`

This component renders only while the promise is pending \(loading / unsettled\).

~~Alias: `<Await.Loading>`~~

### Arguments

- ~~`initial` `boolean` Show only on initial load \(when `data` is `undefined`\).~~

### Examples

```hbs
<Await promise={{this.promise}}>
  <Await.Pending>
    <p>This text is only rendered while awaiting for promise resolution</p>
  </Await.Pending>
</Await>
```

## `<Await.Fulfilled>`

This component renders only when the promise is fulfilled \(resolved to a value, could be `undefined`\).

~~Alias: `<Await.Resolved>`~~

### Yielded properties

- `data` `any` Result from resolved promise

### Arguments

- ~~`persist` `boolean` Show old data while loading new data. By default it hides as soon as a new promise starts.~~

### Examples

```hbs
<Await promise={{this.promise}}>
  <Await.Fulfilled as |data|>
    The result is: {{data}}
  </Await.Fulfilled>
</Await>
```

## `<Await.Rejected>`

This component renders only when the promise is rejected.

### Yielded properties

- `error` `Error` Error from rejected promise

### Arguments

- ~~`persist` `boolean` Show old error while loading new data. By default it hides as soon as a new promise starts.~~

### Examples

```hbs
<Await promise={{this.promise}}>
  <Await.Rejected as |error|>
    The error is: {{error.message}}
  </Await.Rejected>
</Await>
```

## `<Await.Settled>`

This component renders only when the promise is settled (resolved or rejected).

### Arguments

- ~~`persist` `boolean` Show old error while loading new data. By default it hides as soon as a new promise starts.~~

### Examples

```hbs
<Await promise={{this.promise}}>
  <Await.Settled>
    Request has been settled
  </Await.Settled>
</Await>
```
