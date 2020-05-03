# Introduction

>## Disclaimer
>
>**Ember Await aims to clone the functionality of [React Async](react-async.com) (a react library for handling async state) and bring the solution to Ember ecosystem. As we try to make is as close as possible, not all the features are implemented yet, and not all of them are ported 1:1. Please keep in in mind.**

___ 

Ember Await delivers a component for declarative promise resolution. Makes it easy to handle every state of the asynchronous process, without assumptions about the shape of your data or the type of request. Use it with fetch, Axios or other data fetching libraries, even GraphQL.

## Rationale

Ember Await works well even in larger applications with multiple or nested data dependencies. It encourages loading data on-demand and in parallel at component level instead of in bulk at the route/page level. It's entirely decoupled from your routes, so it works well in complex applications that have a dynamic routing model or don't use routes at all. It is promise-based, so you can resolve anything you want, not just `fetch` requests.

## Core features
- Expose states components for easier promise states handling
- Provides convenient metadata (`isPending`, `isFulfilled` etc.)
- Provides `cancel` and `reload` actions
- Supports non-async data
- Highly inspired by [react-async](react-async.com)
- Takes advantage of [ember-concurrency](http://ember-concurrency.com/) to manage promise state (aborting, cancellation, etc.)
