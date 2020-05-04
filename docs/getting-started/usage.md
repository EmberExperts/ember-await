# Usage

Use `<Await />` component to load your data in your components. You can take advantage of [Yielded Components](../api/yielded-components.md), like `Pending`, `Fulfilled` or `Rejected` to define your UI based on promise state, example:

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

You can also control the state yourself using [Yielded properties](../api/yielded-properties.md), where you can access `isPending`, `isRejected` etc...

```hbs
  <Await @promise={{this.fetchPosts}} as |await|>
    <div class={{if await.isPending "loading"}}>
      Hey there :) This text will spin when content is loading.
    </div>
  </Await>
```

Your `@promise` can be anything. A promise, function which returns promise, a task (from ember-concurrency) or normal string. Sky is the limit.

___

You can also load the promise on demand using `@defer`:

```hbs
  <Await @defer={{this.fetchPosts}} as |await|>
    <button {{on "click" await.run}}>Load posts</button>

    <await.Fulfilled as |posts|>
      {{#each posts as |post|}}
        {{post.title}}
      {{/each}}
    </await.Fulfilled>
  </Await>
```

For more useful patterns in Ember Await check out the rest of the documentation and visit [React Async](https://react-async.com) for reference.

**More Guides are coming soon!**
