import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Promise, resolve, reject } from 'rsvp';
import { task } from 'ember-concurrency';
import { defineProperty, set } from '@ember/object';
import Component from '@ember/component';

module('Integration | Component | await', function(hooks) {
  setupRenderingTest(hooks);

  test('it shows block content when promise argument is empty', async function(assert) {
    assert.expect(1);

    await render(hbs`
      <Await as |await|>
        <await.Fulfilled>
          Block Content
        </await.Fulfilled>
      </Await>
    `);

    assert.dom().hasText('Block Content');
  });

  test('it does not rerender when promise is changing from async to sync value', async function(assert) {
    assert.expect(3);

    set(this, 'logRender', () => {
      assert.ok(true);
    });

    set(this, 'promise', resolve('async value'));

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        <await.Fulfilled as |value|>
          <div {{did-insert this.logRender}}>{{value}}</div>
        </await.Fulfilled>
      </Await>
    `);

    assert.dom().hasText('async value')

    set(this, 'promise', 'sync value');

    await settled();

    assert.dom().hasText('sync value')
  });

  module('non-promise', function() {
    test('it allows for custom loading state', async function(assert) {
      assert.expect(1);

      this.owner.register('component:custom-loading', Component.extend({
        tagName: '',
        layout: hbs`<div data-test-custom-loading></div>`
      }));

      this.set('promise', 'non-promise');

      await render(hbs`
        <Await @promise={{this.promise}} @isLoaded={{false}} as |await|>
          <await.Pending>
            <CustomLoading />
          </await.Pending>
        </Await>
      `);

      assert.dom('[data-test-custom-loading]').exists();
    });

    test('it returns value as param', async function(assert) {
      assert.expect(1);

      this.set('promise', 'John Doe');

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Fulfilled as |value|>
            {{value}}
          </await.Fulfilled>
        </Await>
      `);

      assert.dom().hasText('John Doe');
    });
  });

  module('promise', function() {
    test('it reacts to promise change', async function(assert) {
      assert.expect(2);

      this.set('promise', resolve('John Doe'));

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Fulfilled as |value|>
            {{value}}
          </await.Fulfilled>
        </Await>
      `);

      assert.dom().hasText('John Doe');
      this.set('promise', resolve('John Snow'));

      await settled();

      assert.dom().hasText('John Snow')
    });

    test('it allows for custom loading state', async function(assert) {
      assert.expect(1);

      this.owner.register('component:custom-loading', Component.extend({
        layout: hbs`<div data-test-custom-loading></div>`
      }));

      this.set('promise', new Promise(() => {}));

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Pending>
            <CustomLoading />
          </await.Pending>
        </Await>
      `);

      assert.dom('[data-test-custom-loading]').exists();
    });

    test('it allows for custom error state', async function(assert) {
      assert.expect(1);

      this.owner.register('component:custom-error', Component.extend({
        layout: hbs`<div data-test-custom-error></div>`
      }));

      this.set('promise', reject());

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Rejected>
            <CustomError />
          </await.Rejected>
        </Await>
      `);

      assert.dom('[data-test-custom-error]').exists();
    });

    test('it returns value as param', async function(assert) {
      assert.expect(1);

      this.set('promise', resolve('John Doe'));

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Fulfilled as |value|>
            {{value}}
          </await.Fulfilled>
        </Await>
      `);

      assert.dom().hasText('John Doe');
    });
  });

  module('task', function() {
    test('it allows for custom loading state', async function(assert) {
      assert.expect(1);

      this.owner.register('component:custom-loading', Component.extend({
        layout: hbs`<div data-test-custom-loading></div>`
      }));

      defineProperty(this, 'task', task(function *() {
        return yield new Promise(() => {});
      }).restartable());

      this.set('promise', this.task.perform());

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Pending>
            <CustomLoading />
          </await.Pending>
        </Await>
      `);

      assert.dom('[data-test-custom-loading]').exists();
    });

    test('it allows for custom error state', async function(assert) {
      assert.expect(1);

      this.owner.register('component:custom-error', Component.extend({
        layout: hbs`<div data-test-custom-error></div>`
      }));

      defineProperty(this, 'task', task(function *() {
        return yield reject();
      }).restartable());

      this.set('promise', this.task.perform());

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Rejected>
            <CustomError />
          </await.Rejected>
        </Await>
      `);

      assert.dom('[data-test-custom-error]').exists();
    });

    test('it returns value as param', async function(assert) {
      assert.expect(1);

      defineProperty(this, 'task', task(function *() {
        return yield resolve('John Doe');
      }).restartable());

      this.set('promise', this.task.perform());

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Fulfilled as |value|>
            {{value}}
          </await.Fulfilled>
        </Await>
      `);

      assert.dom().hasText('John Doe');
    });

    test('it shows block content when task is cancelled', async function(assert) {
      assert.expect(2);

      defineProperty(this, 'task', task(function *() {
        yield new Promise(() => {});

        return yield resolve('John Doe');
      }).restartable());

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Fulfilled as |value|>
            {{value}}
            My content
          </await.Fulfilled>
        </Await>
      `);

      this.set('promise', this.task.perform());
      await this.promise.cancel();

      await settled();

      assert.dom().hasText('My content');
      assert.dom().doesNotIncludeText('John Doe');
    });
  });
});
