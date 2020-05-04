import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, settled, setupOnerror, resetOnerror } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Promise, resolve, reject } from 'rsvp';
import { set } from '@ember/object';

const resolveIn = (ms, value) => new Promise((resolve) => setTimeout(resolve, ms, value));

module('Integration | Component | await', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(() => {
    resetOnerror();
  })

  test('yields data', async function(assert) {
    set(this, 'promise', resolve('data'))

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{await.data}}
      </Await>
    `);

    assert.dom().hasText('data')
  })

  test('yields error', async function(assert) {
    setupOnerror(() => {});
    set(this, 'promise', reject('error'))

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{await.error}}
      </Await>
    `);

    assert.dom().hasText('error')
  })

  test('yields value when error', async function(assert) {
    setupOnerror(() => {});
    set(this, 'promise', reject('error'))

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{await.value}}
      </Await>
    `);

    assert.dom().hasText('error')
  })

  test('yields value when fulfilled', async function(assert) {
    set(this, 'promise', resolve('data'))

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{await.value}}
      </Await>
    `);

    assert.dom().hasText('data')
  })

  test('yields promise states', async function(assert) {
    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{if await.isInitial "isInitial"}}
        {{if await.isPending "isPending"}}
        {{if await.isRejected "isRejected"}}
        {{if await.isFulfilled "isFulfilled"}}
        {{if await.isSettled "isSettled"}}
      </Await>
    `);

    assert.dom().hasText('isInitial');

    let promiseResolve;

    set(this, 'promise', new Promise((resolve) => {
      promiseResolve = resolve;
    }))

    await settled();

    assert.dom().hasText('isPending');

    promiseResolve()

    await settled();

    assert.dom().hasText('isFulfilled isSettled');

    set(this, 'promise', reject())

    await settled();

    assert.dom().hasText('isRejected isSettled');
  })

  test('yields counter', async function(assert) {
    set(this, 'promise', resolve())

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{await.counter}}
        {{if await.isFulfilled "isFulfilled"}}
      </Await>
    `);

    assert.dom().hasText('1 isFulfilled')
  })

  test('yields current task', async function(assert) {
    set(this, 'promise', resolve())

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{if await.task.isSuccessful "isSuccessful"}}
      </Await>
    `);

    assert.dom().hasText('isSuccessful')
  })

  test('yields reload action', async function(assert) {
    let count = 0;
    set(this, 'promise', () => resolve(count += 1))

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        Counter: {{await.counter}}
        Data: {{await.data}}
        <button {{on "click" await.reload}}>Reload</button>
      </Await>
    `);

    assert.dom().containsText('Counter: 1')
    assert.dom().containsText('Data: 1')

    await click('button');

    assert.dom().containsText('Counter: 2')
    assert.dom().containsText('Data: 2')
  })

  test('yields cancel action', async function(assert) {
    set(this, 'promise', new Promise(() => {}))

    await render(hbs`
      <Await @promise={{this.promise}} as |await|>
        {{if await.isPending "isPending"}}
        <button {{on "click" await.cancel}}></button>
      </Await>
    `);

    assert.dom().hasText('isPending')

    await click('button');

    assert.dom().hasText('')
  })

  test("it can be nested", async function(assert) {
    set(this, 'outerFn', resolveIn(0, 'outer'))
    set(this, 'innerFn', resolveIn(100, 'inner'))

    await render(hbs`
      <Await @promise={{this.outerFn}} as |outer|>
        <Await @promise={{this.innerFn}} as |inner|>
          {{outer.data}} {{inner.data}}
        </Await>
      </Await>
    `);

    assert.dom().hasText('outer');

    await resolveIn(110);

    assert.dom().hasText('outer inner');
  })

  module('Fulfilled', function() {
    test("renders only after the promise is resolved", async function(assert) {
      setupOnerror(() => {});
      this.promise =  resolveIn(10, 'ok')
      this.defer = () => reject("fail")

      await render(hbs`
        <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
          <await.Fulfilled as |data|>
            <button {{on "click" await.run}}>{{data}}</button>
          </await.Fulfilled>

          <await.Rejected as |error|>
            {{error}}
          </await.Rejected>
        </Await>
      `);

      assert.dom().hasText('');
      await resolveIn(10);

      assert.dom().hasText('ok');

      await click('button');
      assert.dom().hasText('fail');
    })
  })

  module("Pending", function() {
    test("renders only while the promise is pending", async function(assert) {
      this.promise = resolveIn(10);

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Pending>pending</await.Pending>
          <await.Fulfilled>done</await.Fulfilled>
        </Await>
      `);

      assert.dom().hasText('pending');
      await resolveIn(10);
      assert.dom().hasText('done');
    })
  })

  module("Rejected", function() {
    test("renders only after the promise is rejected", async function(assert) {
      setupOnerror(() => {});
      this.promise = reject('error');

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Rejected>{{await.error}}</await.Rejected>
        </Await>
      `);

      assert.dom().hasText('error');
    })
  })

  module("Initial", function() {
    test("renders only while the deferred promise has not started yet", async function(assert) {
      this.defer = resolveIn(50, 'ok');

      await render(hbs`
        <Await @defer={{this.defer}} as |await|>
          <await.Initial>
            <button {{on "click" await.run}}>initial</button>
          </await.Initial>

          <await.Pending>pending</await.Pending>
          <await.Fulfilled>done</await.Fulfilled>
        </Await>
      `);

      assert.dom().hasText('initial');
      await click('button');
      assert.dom().hasText('pending');
      await resolveIn(100);
      assert.dom().hasText('done');
    })
  })

  module("Settled", function() {
    test("renders after the promise is fulfilled", async function(assert) {
      this.promise = () => resolve("settled")

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Settled>{{await.data}}</await.Settled>
        </Await>
      `);

      assert.dom().hasText('settled');
    })

    test("renders after the promise is rejected", async function(assert) {
      setupOnerror(() => {});
      this.promise = () => reject("error")

      await render(hbs`
        <Await @promise={{this.promise}} as |await|>
          <await.Settled>{{await.error}}</await.Settled>
        </Await>
      `);

      assert.dom().hasText('error');
    })
  })

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
});
