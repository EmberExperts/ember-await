# ember-await

\[Short description of the addon.\]

## Documentation

For full documentation visit: **https://exelord.gitbook.io/ember-await**

## Compatibility

* Ember.js v3.12 or above
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

