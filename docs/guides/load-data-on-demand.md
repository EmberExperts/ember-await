# Load data on-demand

With Ember Await you can load your data on-demand (eg. on button click). To do it, we need to use [`@defer=`](api/arguments.md#defer) argument and call the promise using [`run`](api/yielded-properties.md#run) property.

**Remember! `this.fetchPosts` needs to return a function**

```hbs
<Await @defer={{this.fetchPosts}} as |await|>
  <button {{on "click" await.run}}>Fetch posts</button>

  <await.Initial>
    No posts are loaded yet
  </await.Initial>

  <await.Fulfilled as |posts|>
    {{#each posts as |post|}}
      {{post.title}}
    {{/each}}
  </await.Fulfilled>
</Await>
```

This way, the content from `await.Initial` will be displayed until we click the `button` and posts will load.
