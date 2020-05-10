<p align="center">
  <img src="https://raw.githubusercontent.com/Exelord/ember-await/master/logo.png" />
</p>

# Introduction

Ember Await delivers a component for declarative promise resolution. Makes it easy to handle every state of the asynchronous process, without assumptions about the shape of your data or the type of request. Use it with fetch, Axios or other data fetching libraries, even GraphQL.

## Rationale

Ember Await works well even in larger applications with multiple or nested data dependencies. It encourages loading data on-demand and in parallel at component level instead of in bulk at the route/page level. It's entirely decoupled from your routes, so it works well in complex applications that have a dynamic routing model or don't use routes at all. It is promise-based, so you can resolve anything you want, not just `fetch` requests.

## Core features
- Works with promises, async/await and the Fetch API
- Expose states components for easier promise states handling
- Provides convenient metadata (`isPending`, `isFulfilled` etc.)
- Provides `cancel` and `reload` actions
- Accepts onResolve, onReject and onCancel callbacks
- Supports non-async data
- Highly inspired by [react-async](https://react-async.com)
- Takes advantage of [ember-concurrency](https://ember-concurrency.com/) to manage promise state (aborting, cancellation, etc.)
- ~~Written in TypeScript, ships with type definitions~~

>### **Disclaimer**
>
>**Ember Await aims to clone the functionality of [React Async](https://react-async.com) (a react library for handling async state) and bring the solution to Ember ecosystem. As we try to make is as close as possible, not all of them are ported 1:1 and not all of them make sense in Ember. Please keep that in mind.**
