# Migrate from routes

Imagine we want to fetch and display a list of posts' title on your blog under `/posts` url.

## Routes approach

For that we are using Route's model and and ember's route [substates](https://guides.emberjs.com/release/routing/loading-and-error-substates/)

You have 4 files:
- app/routes/posts.js - where we define model hook
- app/templates/posts.hbs - where we define route template (display posts)
- app/templates/posts-loading.hbs - where we define posts loading state
- app/templates/posts-error.hbs - where we define posts error state

Let's get thorough all of them.

### Route

This is where we define `model` hook in which we are fetching our posts. (fetching definition is simplified)

```js
// app/routes/posts.js

import Route from '@ember/routing/route';

export default class PostsRoute extends Route {
  async model() {
    const response = await fetch('/posts');
    return response.json();
  }
}
```

### Template

In route's template we are using the `@model` argument which contains the result form `model()` hook, and iterate through every post to display its `title`.

```hbs
<!-- app/templates/posts.hbs -->

Latest posts:

{{#each @model as |post|}}
  {{post.title}}
{{/each}}
```

### Loading template

This is where we define a content which will show when route is loading (model hook).

```hbs
<!-- app/templates/posts-loading.hbs -->

Loading posts...
```

### Error template
This is where we define a content which will show when route has encountered on error (model hook).

```hbs
<!-- app/templates/posts-error.hbs -->

Sorry, your posts cannot be loaded
```
___

**Conclusion:**
- We need to define every state in a separate file
- Route is blocking page rendering until the `model()` hook is resolved
- When reloading `posts` data we will "refresh" the whole page

Now, let's do the same using **Ember Await**

## Ember Await approach

We can use a controller or a component where we define our `fetchPosts()` method. A `model()` like equivalent. For this case we chose component to learn how to encapsulate and isolate our app.

We gonna create 3 files:
- app/components/posts-list.js - a component file which will define fetch method for posts
- app/components/posts-list.hbs - a component's template which will render title for each post
- app/templates/posts.hbs - a posts route template which will render the component

### PostsList component

Here we define `fetchPosts` which looks identically to previous `model()` hook. In this case it is a function, however it can be a getter or just a property.

```js
// app/components/posts-list.js

import Component from '@glimmer/component';
import { action } from '@ember/object';

class PostsComponent extends Component {
  @action
  async fetchPosts() {
    const response = await fetch('/posts');
    return response.json();
  }
}

export default PostsComponent;
```

### PostsList template

In template, we are using `<Await />` component which provides us state components for pending, fulfilled and rejected state.
Thanks to them we can be sure that their content will be rendered only when promise reach proper state.

```hbs
<!-- app/components/posts-list.hbs -->

<Await @promise={{this.fetchPosts}} as |await|>
  Latest posts:

  <await.Pending>
    Loading posts...
  </await.Pending>

  <await.Fulfilled as |posts|>
    {{#each posts as |post|}}
      {{post.title}}
    {{/each}}
  </await.Fulfilled>

  <await.Rejected>
    Sorry, your posts cannot be loaded
  </await.Rejected>
</Await>
```

### Posts route template

In this file, we are rendering our `<PostsList />` component.

```hbs
<!-- app/templates/posts.hbs -->

<PostsList />
```
___

**Conclusion:**
- We can define state on-demand, inline or using another component.
- states can be used multiple times
- our content is async (not blocking whole page from rendering - just the small part that uses the data)
- When reloading only fragments in states components are "refreshed".
