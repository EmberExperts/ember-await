/* eslint-disable ember/no-observers */
/* eslint-disable ember/no-computed-properties-in-native-classes */
import Component from '@glimmer/component';
import { computed, action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
import { addObserver, removeObserver } from '@ember/object/observers';

function isFunction(fn) {
  return typeof fn === 'function';
}

function callFunction(fn, ...args) {
  if (isFunction(fn)) fn(...args);
}

function isDefined(value) {
  return value !== undefined;
}

class AwaitComponent extends Component {
  @computed('promiseTask.last')
  get lastPromiseTask() {
    return this.promiseTask.last;
  }

  @computed('promiseTask.performCount')
  get counter() {
    return this.promiseTask.performCount;
  }

  @computed('lastPromiseTask.value', 'isFulfilled', 'args.initialValue')
  get data() {
    if (this.lastPromiseTask) return this.lastPromiseTask.value;

    return this.isFulfilled ? this.args.initialValue : undefined;
  }

  @computed('lastPromiseTask.error', 'isRejected', 'args.initialValue')
  get error() {
    if (this.lastPromiseTask) return this.lastPromiseTask.error;

    return this.isRejected ? this.args.initialValue : undefined;
  }

  @computed('isFulfilled', 'error', 'data')
  get value() {
    const { isFulfilled, error, data } = this;

    return isFulfilled ? data : error;
  }

  @computed('lastPromiseTask.isSuccessful')
  get isFulfilled() {
    if (this.lastPromiseTask) {
      return this.lastPromiseTask.isSuccessful;
    }

    const { initialValue } = this.args;

    return isDefined(initialValue) && !(initialValue instanceof Error);
  }

  @computed('lastPromiseTask.isError')
  get isRejected() {
    if (this.lastPromiseTask) {
      return this.lastPromiseTask.isError;
    }

    const { initialValue } = this.args;

    return isDefined(initialValue) && initialValue instanceof Error;
  }

  @computed('isFulfilled', 'isRejected')
  get isSettled() {
    return this.isFulfilled || this.isRejected;
  }

  @computed('isPending', 'isSettled', 'args.initialValue')
  get isInitial() {
    return !this.isPending && !this.isSettled && this.counter === 0;
  }

  @computed('promiseTask.isRunning')
  get isPending() {
    return this.promiseTask.isRunning;
  }

  @computed('isInitial', 'isPending', 'isFulfilled', 'isRejected')
  get status() {
    if (this.isRejected) return 'rejected';
    if (this.isFulfilled) return 'fulfilled';
    if (this.isPending) return 'pending';
    if (this.isInitial) return 'initial';

    return '';
  }

  constructor() {
    super(...arguments);

    addObserver(this, 'args.promise', this._resolvePromise);

    if (this.args.promise && !isDefined(this.args.initialValue)) {
      this._resolvePromise();
    }
  }

  willDestroy() {
    super.willDestroy(...arguments);

    removeObserver(this, 'args.promise', this._resolvePromise);
  }

  /**
   * Used for handling ember-concurrency events
   *
   * @protected
   * @param {*} name
   * @memberof AwaitComponent
   */
  trigger(name) {
    if (name === 'promiseTask:canceled') callFunction(this.args.onCancel);
    if (name === 'promiseTask:succeeded') callFunction(this.args.onResolve, this.data);
    if (name === 'promiseTask:errored') callFunction(this.args.onReject, this.error);
  }

  @task({ restartable: true, evented: true })
  *promiseTask(promise) {
    return yield isFunction(promise) ? promise() : promise;
  }

  @action
  run() {
    const { promiseTask, args } = this;

    promiseTask.perform(args.defer);
  }

  @action
  reload() {
    this._resolvePromise();
  }

  @action
  cancel() {
    this.promiseTask.cancelAll();
  }

  _resolvePromise() {
    return this.promiseTask.perform(this.args.promise);
  }
}

export default AwaitComponent;
