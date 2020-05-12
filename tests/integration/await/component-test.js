import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, click, find, settled, setupOnerror, resetOnerror } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { Promise, resolve, reject } from 'rsvp';
import { set } from '@ember/object';
import sinon from 'sinon';

const resolveIn = (ms, value) => new Promise((r) => setTimeout(r, ms, value));
const rejectIn = (ms, value) => new Promise((_r, r) => setTimeout(r, ms, value));

function FakePromise() {
  const promise = new Promise((resolvePromise, rejectPromise) => {
    this.resolve = resolvePromise;
    this.reject = rejectPromise;
  });

  promise.resolve = async(...args) => {
    const result = await this.resolve(...args);

    await settled();

    return result;
  };

  promise.reject = async(...args) => {
    const result = await this.reject(...args);

    await settled();

    return result;
  };

  return promise;
}

module('Integration | Component | await', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(() => {
    resetOnerror();
  });

  module('Arguments', function() {
    module('promise', function() {
      test('receives abort controller which can abort', async function(assert) {
        this.promise = () => new FakePromise();

        const spy = sinon.spy(this, 'promise');

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.status}}
            <button {{on "click" await.cancel }}></button>
          </Await>
        `);

        assert.strictEqual(spy.calledOnce, true);

        const [controller] = spy.firstCall.args;

        assert.strictEqual(controller instanceof AbortController, true);
        assert.strictEqual(controller.signal.aborted, false);

        await click('button');

        assert.strictEqual(controller.signal.aborted, true);
      });
    });

    module('initialValue', function() {
      test('promise is not called on render', async function(assert) {
        const spy = sinon.spy();

        this.promise = () => {
          spy();
          resolve();
        };

        this.initialValue = 'initialValue';

        await render(hbs`
          <Await @promise={{this.promise}} @initialValue={{this.initialValue}} />
        `);

        assert.ok(spy.notCalled);
      });

      test('state is resolved and data is equal to initialValue', async function(assert) {
        this.promise = () => resolve();
        this.initialValue = 'initialValue';

        await render(hbs`
          <Await @promise={{this.promise}} @initialValue={{this.initialValue}} as |await|>
            {{await.status}}

            <await.Initial>
              Initial
            </await.Initial>

            <await.Pending>
              Pending
            </await.Pending>

            <await.Fulfilled as |value|>
              Value: {{value}}
            </await.Fulfilled>

            <await.Rejected as |error|>
              Error: {{error.message}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('fulfilled Value: initialValue');
      });

      test('state is rejected and error is equal to initialValue if initialValue is Error', async function(assert) {
        this.promise = () => resolve();
        this.initialValue = new Error('initialValue');

        await render(hbs`
          <Await @promise={{this.promise}} @initialValue={{this.initialValue}} as |await|>
            {{await.status}}

            <await.Initial>
              Initial
            </await.Initial>

            <await.Pending>
              Pending
            </await.Pending>

            <await.Fulfilled as |value|>
              Value: {{value}}
            </await.Fulfilled>

            <await.Rejected as |error|>
              Error: {{error.message}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('rejected Error: initialValue');
      });
    });

    module('onCancel', function() {
      test('calls when task has been cancelled', async function(assert) {
        this.promise = new FakePromise();
        this.onCancel = sinon.spy();

        await render(hbs`
          <Await @promise={{this.promise}} @onCancel={{this.onCancel}} as |await|>
            <button {{on "click" await.cancel}}>cancel</button>
          </Await>
        `);

        assert.ok(this.onCancel.notCalled);

        await click('button');

        await settled();

        assert.ok(this.onCancel.calledOnce);
      });
    });

    module('onResolve', function() {
      test('calls when promise has been resolved', async function(assert) {
        this.promise = new FakePromise();
        this.onResolve = sinon.spy();

        await render(hbs`
          <Await @promise={{this.promise}} @onResolve={{this.onResolve}} />
        `);

        assert.ok(this.onResolve.notCalled);

        this.promise.resolve('works');

        await settled();

        assert.ok(this.onResolve.withArgs('works').calledOnce);
      });
    });

    module('onReject', function() {
      test('calls when promise has been rejected', async function(assert) {
        this.promise = new FakePromise();
        this.onReject = sinon.spy();

        await render(hbs`
          <Await @promise={{this.promise}} @onReject={{this.onReject}} />
        `);

        assert.ok(this.onReject.notCalled);

        setupOnerror(() => {});
        this.promise.reject(new Error('error'));

        await settled();

        assert.ok(this.onReject.calledOnce);
        assert.equal(this.onReject.firstCall.args[0].message, 'error');
      });
    });
  });

  module('Yielded properties', function() {
    module('data', function() {
      test('yields data', async function(assert) {
        this.promise = new FakePromise();

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.data}}
          </Await>
        `);

        assert.dom().hasText('');

        await this.promise.resolve('data');

        assert.dom().hasText('data');

        set(this, 'promise', new FakePromise());

        assert.dom().hasText('data');

        setupOnerror(() => {});
        await this.promise.reject('error');

        assert.dom().hasText('data');
      });
    });

    module('error', function() {
      test('yields error', async function(assert) {
        setupOnerror(() => {});
        this.promise = new FakePromise();

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.error}}
          </Await>
        `);

        assert.dom().hasText('');

        await this.promise.reject('error');

        assert.dom().hasText('error');

        set(this, 'promise', new FakePromise());

        assert.dom().hasText('error');

        await this.promise.resolve('data');

        assert.dom().hasText('');
      });
    });

    module('value', function() {
      test('yields value when error', async function(assert) {
        setupOnerror(() => {});
        set(this, 'promise', reject('error'));

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.value}}
          </Await>
        `);

        assert.dom().hasText('error');
      });

      test('yields value when fulfilled', async function(assert) {
        set(this, 'promise', resolve('data'));

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.value}}
          </Await>
        `);

        assert.dom().hasText('data');
      });
    });

    module('initialValue', function() {
      test('yields initialValue', async function(assert) {
        await render(hbs`
          <Await @initialValue='initialValue' as |await|>
            {{await.initialValue}}
          </Await>
        `);

        assert.dom().hasText('initialValue');
      });
    });

    module('dates', function() {
      test('yields dates', async function(assert) {
        this.promise = new FakePromise();

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            <span data-test-started>{{await.startedAt}}</span>
            <span data-test-finished>{{await.finishedAt}}</span>
          </Await>
        `);

        let started = await find('[data-test-started]').innerText;
        let finished = await find('[data-test-finished]').innerText;

        assert.ok(started);
        assert.notOk(finished);

        await resolveIn(1000);
        await this.promise.resolve();
        await settled();

        started = await find('[data-test-started]').innerText;
        finished = await find('[data-test-finished]').innerText;

        assert.ok(started);
        assert.ok(finished);

        const startedAt = new Date(started);
        const finishedAt = new Date(finished);

        assert.ok(startedAt.getTime() < finishedAt.getTime());
      });
    });

    module('promise states', function() {
      test('yields promise states', async function(assert) {
        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{if await.isInitial "isInitial"}}
            {{if await.isPending "isPending"}}
            {{if await.isLoading "isLoading"}}
            {{if await.isRejected "isRejected"}}
            {{if await.isFulfilled "isFulfilled"}}
            {{if await.isResolved "isResolved"}}
            {{if await.isSettled "isSettled"}}
          </Await>
        `);

        assert.dom().hasText('isInitial');

        let promise = new FakePromise();

        set(this, 'promise', promise);

        await settled();

        assert.dom().hasText('isPending isLoading');

        promise.resolve();

        await settled();

        assert.dom().hasText('isFulfilled isResolved isSettled');

        promise = new FakePromise();

        set(this, 'promise', promise);

        await settled();

        assert.dom().hasText('isPending isLoading');

        promise.reject();

        await settled();

        assert.dom().hasText('isRejected isSettled');
      });
    });

    module('status', function() {
      test('yields status', async function(assert) {
        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.status}}
          </Await>
        `);

        assert.dom().hasText('initial');

        let promise = new FakePromise();

        set(this, 'promise', promise);

        await settled();

        assert.dom().hasText('pending');

        promise.resolve();

        await settled();

        assert.dom().hasText('fulfilled');

        promise = new FakePromise();

        set(this, 'promise', promise);

        await settled();

        assert.dom().hasText('pending');

        promise.reject();

        await settled();

        assert.dom().hasText('rejected');
      });
    });

    module('counter', function() {
      test('yields counter', async function(assert) {
        set(this, 'promise', resolve());

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{await.counter}}
            {{if await.isFulfilled "isFulfilled"}}
          </Await>
        `);

        assert.dom().hasText('1 isFulfilled');
      });
    });

    module('task', function() {
      test('yields current task', async function(assert) {
        set(this, 'promise', resolve());

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{if await.task.isSuccessful "isSuccessful"}}
          </Await>
        `);

        assert.dom().hasText('isSuccessful');
      });
    });

    module('reload', function() {
      test('yields action', async function(assert) {
        let count = 0;

        set(this, 'promise', () => resolve(count += 1));

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            Counter: {{await.counter}}
            Data: {{await.data}}
            <button {{on "click" await.reload}}>Reload</button>
          </Await>
        `);

        assert.dom().containsText('Counter: 1');
        assert.dom().containsText('Data: 1');

        await click('button');

        assert.dom().containsText('Counter: 2');
        assert.dom().containsText('Data: 2');
      });
    });

    module('run', function() {
      test('yields action', async function(assert) {
        this.defer = () => resolveIn(10, 'data');

        await render(hbs`
          <Await @defer={{this.defer}} as |await|>
            <button {{on "click" await.run}}>
              {{await.status}}
              {{await.data}}
            </button>
          </Await>
        `);

        assert.dom().hasText('initial');

        await click('button');

        assert.dom().hasText('pending');

        await resolveIn(10);

        assert.dom().hasText('fulfilled data');
      });

      test('does not run defer if undefined', async function(assert) {
        this.promise = resolve('data');

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            <button {{on "click" await.run}}>
              {{await.status}}
              {{await.data}}
            </button>
          </Await>
        `);

        assert.dom().hasText('fulfilled data');

        await click('button');

        assert.dom().hasText('fulfilled data');
      });

      test('receives passed arguments', async function(assert) {
        this.defer = ([value]) => resolve(value);

        const spy = sinon.spy(this, 'defer');

        await render(hbs`
          <Await @defer={{this.defer}} as |await|>
            <button {{on "click" (fn await.run 'data')}}>
              {{await.status}}
              {{await.data}}
            </button>
          </Await>
        `);

        assert.dom().hasText('initial');

        await click('button');

        assert.dom().hasText('fulfilled data');

        assert.strictEqual(spy.calledOnce, true);
        assert.strictEqual(spy.firstCall.args[0][0], 'data');
        assert.strictEqual(spy.firstCall.args[0][1] instanceof Event, true);
        assert.strictEqual(spy.firstCall.args[1] instanceof AbortController, true);
      });
    });

    module('cancel', function() {
      test('yields action', async function(assert) {
        set(this, 'promise', new Promise(() => {}));

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            {{if await.isPending "isPending"}}
            <button {{on "click" await.cancel}}></button>
          </Await>
        `);

        assert.dom().hasText('isPending');

        await click('button');

        assert.dom().hasText('');
      });
    });
  });

  module('Yielded components', function() {
    module('Fulfilled', function() {
      test('renders only after the promise is resolved', async function(assert) {
        setupOnerror(() => {});
        this.promise = resolveIn(10, 'ok');
        this.defer = () => reject('fail');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <await.Pending>
              pending
            </await.Pending>

            <await.Fulfilled as |data|>
              <button {{on "click" await.run}}>{{data}}</button>
            </await.Fulfilled>

            <await.Rejected as |error|>
              {{error}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('ok');

        await click('button');
        assert.dom().hasText('fail');
      });

      test('with persist renders old data on error', async function(assert) {
        setupOnerror(() => {});
        this.promise = () => resolveIn(10, 'ok');
        this.defer = () => rejectIn(10, 'fail');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <await.Pending>
              pending
            </await.Pending>

            <await.Fulfilled @persist={{true}} as |data|>
              <button {{on "click" await.run}}>{{data}}</button>
            </await.Fulfilled>

            <await.Rejected as |error|>
              {{error}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('ok');

        await click('button');

        assert.dom().hasText('pending ok');
        await resolveIn(10);

        assert.dom().hasText('ok fail');
      });
    });

    module('Resolved', function() {
      test('renders only after the promise is resolved', async function(assert) {
        setupOnerror(() => {});
        this.promise = resolveIn(10, 'ok');
        this.defer = () => reject('fail');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <await.Pending>
              pending
            </await.Pending>

            <await.Resolved as |data|>
              <button {{on "click" await.run}}>{{data}}</button>
            </await.Resolved>

            <await.Rejected as |error|>
              {{error}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('ok');

        await click('button');
        assert.dom().hasText('fail');
      });

      test('with persist renders old data on error', async function(assert) {
        setupOnerror(() => {});
        this.promise = resolveIn(10, 'ok');
        this.defer = () => rejectIn(10, 'fail');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <await.Pending>
              pending
            </await.Pending>

            <await.Resolved @persist={{true}} as |data|>
              <button {{on "click" await.run}}>{{data}}</button>
            </await.Resolved>

            <await.Rejected as |error|>
              {{error}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('ok');

        await click('button');

        assert.dom().hasText('pending ok');
        await resolveIn(10);

        assert.dom().hasText('ok fail');
      });
    });

    module('Pending', function() {
      test('renders only while the promise is pending', async function(assert) {
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
      });

      test('with persist renders only on initial load (when data is undefined)', async function(assert) {
        setupOnerror(() => {});
        this.promise = () => resolveIn(10, 'ok');
        this.defer = () => resolveIn(10, 'ok2');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <button {{on "click" await.run}}></button>

            <await.Pending @initial={{true}}>
              pending
            </await.Pending>

            <await.Settled as |value|>
              {{value}}
            </await.Settled>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('ok');

        await click('button');

        assert.dom().hasText('');

        await resolveIn(10);

        assert.dom().hasText('ok2');
      });
    });

    module('Loading', function() {
      test('renders only while the promise is pending', async function(assert) {
        this.promise = resolveIn(10);

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            <await.Loading>pending</await.Loading>
            <await.Fulfilled>done</await.Fulfilled>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);
        assert.dom().hasText('done');
      });

      test('with persist renders only on initial load (when data is undefined)', async function(assert) {
        setupOnerror(() => {});
        this.promise = () => resolveIn(10, 'ok');
        this.defer = () => resolveIn(10, 'ok2');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <button {{on "click" await.run}}></button>

            <await.Loading @initial={{true}}>
              pending
            </await.Loading>

            <await.Settled as |value|>
              {{value}}
            </await.Settled>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('ok');

        await click('button');

        assert.dom().hasText('');

        await resolveIn(10);

        assert.dom().hasText('ok2');
      });
    });

    module('Rejected', function() {
      test('renders only after the promise is rejected', async function(assert) {
        setupOnerror(() => {});
        this.promise = reject('error');

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            <await.Rejected>{{await.error}}</await.Rejected>
          </Await>
        `);

        assert.dom().hasText('error');
      });

      test('with persist renders old error while loading', async function(assert) {
        setupOnerror(() => {});
        this.promise = rejectIn(10, 'fail');
        this.defer = () => resolveIn(10, 'ok');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <button {{on "click" await.run}}></button>

            <await.Pending>
              pending
            </await.Pending>

            <await.Fulfilled as |data|>
              {{data}}
            </await.Fulfilled>

            <await.Rejected @persist={{true}} as |error|>
              {{error}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('fail');

        await click('button');

        assert.dom().hasText('pending fail');

        await resolveIn(10);

        assert.dom().hasText('ok');
      });
    });

    module('Initial', function() {
      test('renders only while the deferred promise has not started yet', async function(assert) {
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
      });

      test('with persist renders as long as there is no data', async function(assert) {
        setupOnerror(() => {});
        this.promise = rejectIn(10, 'fail');
        this.defer = () => resolveIn(10, 'ok');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <button {{on "click" await.run}}></button>

            <await.Initial @persist={{true}}>
              initial
            </await.Initial>

            <await.Pending>
              pending
            </await.Pending>

            <await.Fulfilled as |data|>
              {{data}}
            </await.Fulfilled>

            <await.Rejected as |error|>
              {{error}}
            </await.Rejected>
          </Await>
        `);

        assert.dom().hasText('initial pending');
        await resolveIn(10);

        assert.dom().hasText('initial fail');

        await click('button');

        assert.dom().hasText('initial pending');

        await resolveIn(10);

        assert.dom().hasText('ok');
      });
    });

    module('Settled', function() {
      test('renders after the promise is fulfilled', async function(assert) {
        this.promise = () => resolve('settled');

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            <await.Settled>{{await.data}}</await.Settled>
          </Await>
        `);

        assert.dom().hasText('settled');
      });

      test('renders after the promise is rejected', async function(assert) {
        setupOnerror(() => {});
        this.promise = () => reject('error');

        await render(hbs`
          <Await @promise={{this.promise}} as |await|>
            <await.Settled>{{await.error}}</await.Settled>
          </Await>
        `);

        assert.dom().hasText('error');
      });

      test('with persist renders old value while loading', async function(assert) {
        setupOnerror(() => {});
        this.promise = rejectIn(10, 'fail');
        this.defer = () => resolveIn(10, 'ok');

        await render(hbs`
          <Await @promise={{this.promise}} @defer={{this.defer}} as |await|>
            <button {{on "click" await.run}}></button>

            <await.Pending>
              pending
            </await.Pending>

            <await.Settled @persist={{true}} as |value|>
              {{value}}
            </await.Settled>
          </Await>
        `);

        assert.dom().hasText('pending');
        await resolveIn(10);

        assert.dom().hasText('fail');

        await click('button');

        assert.dom().hasText('pending fail');

        await resolveIn(10);

        assert.dom().hasText('ok');
      });
    });
  });

  module('Behaviors', function() {
    test('it can be nested', async function(assert) {
      set(this, 'outerFn', resolveIn(0, 'outer'));
      set(this, 'innerFn', resolveIn(100, 'inner'));

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
    });

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

      assert.dom().hasText('John Snow');
    });
  });
});
