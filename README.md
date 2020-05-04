<p align="center">
  <img src="https://raw.githubusercontent.com/Exelord/ember-await/master/logo.png" />
</p>

# ember-await

Ember component for declarative promise resolution. Makes it easy to handle every state of the asynchronous process, without assumptions about the shape of your data or the type of request. Use it with fetch, Axios or other data fetching libraries, even GraphQL.

- Expose states components for easier promise states handling
- Provides convenient metadata (`isPending`, `isFulfilled` etc.)
- Provides `cancel` and `reload` actions
- Supports non-async data
- Highly inspired by [react-async](https://react-async.com)
- Takes advantage of [ember-concurrency](https://ember-concurrency.com/) to manage promise state (aborting, cancellation, etc.)

## Documentation

For full documentation visit: **https://exelord.gitbook.io/ember-await**

## Compatibility

* Ember.js v3.16 or above
* Ember CLI v2.13 or above
* Node.js v10 or above

## Installation

```text
ember install ember-await
```

## Basic usage

```hbs
  <Await @promise={{this.fetchPosts}} as |await|>
    <await.Pending>
      Loading posts...
    </await.Pending>

    <await.Fulfilled as |posts|>
      {{#each posts as |post|}}
        {{post.title}}
      {{/each}}
    </await.Fulfilled>

    <await.Rejected>
      Something went wrong :(
    </await.Rejected>
  </Await>
```

For full documentation visit: **https://exelord.gitbook.io/ember-await**

## Contributing

See the [Contributing](misc/contributing.md) guide for details.

## License

This project is licensed under the [MIT License](misc/license.md).

