/* eslint-disable ember/no-observers */
/* eslint-disable ember/no-computed-properties-in-native-classes */
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
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
  @tracked startedAt;

  @tracked finishedAt;

  @computed('promiseTask.performCount')
  get counter() {
    return this.promiseTask.performCount;
  }

  @computed('promiseTask.lastComplete.value', 'isFulfilled', 'args.initialValue')
  get data() {
    if (this.promiseTask.lastComplete) return this.promiseTask.lastComplete.value;

    return this.isFulfilled ? this.args.initialValue : undefined;
  }

  @computed('promiseTask.lastSuccessful.value', 'isRejected', 'data')
  get persistedData() {
    if (this.isRejected && this.promiseTask.lastSuccessful) return this.promiseTask.lastSuccessful.value;

    return this.data;
  }

  @computed('promiseTask.lastComplete.error', 'isRejected', 'args.initialValue')
  get error() {
    if (this.promiseTask.lastComplete) return this.promiseTask.lastComplete.error;

    return this.isRejected ? this.args.initialValue : undefined;
  }

  @computed('promiseTask.lastErrored.value', 'isPending', 'error')
  get persistedError() {
    if (this.isPending && this.promiseTask.lastErrored) return this.promiseTask.lastErrored.error;

    return this.error;
  }

  @computed('isFulfilled', 'isPending', 'error', 'data')
  get value() {
    if (this.isPending) return undefined;

    const { isFulfilled, error, data } = this;

    return isFulfilled ? data : error;
  }

  @computed('promiseTask.lastComplete.isError', 'isPending', 'data')
  get persistedValue() {
    if (this.promiseTask.lastComplete) {
      return this.promiseTask.lastComplete.isError ? this.error : this.data;
    }

    return this.value;
  }

  @computed('promiseTask.last.isSuccessful')
  get isFulfilled() {
    if (this.promiseTask.last) {
      return this.promiseTask.last.isSuccessful;
    }

    const { initialValue } = this.args;

    return isDefined(initialValue) && !(initialValue instanceof Error);
  }

  @computed('promiseTask.last.isError')
  get isRejected() {
    if (this.promiseTask.last) {
      return this.promiseTask.last.isError;
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
   */
  trigger(name, currentTask) {
    if (this.promiseTask.last && currentTask !== this.promiseTask.last) return;

    if (name === 'promiseTask:started') {
      this.startedAt = new Date();
    }

    if (name === 'promiseTask:canceled') {
      callFunction(this.args.onCancel);
    }

    if (name === 'promiseTask:succeeded') {
      this.finishedAt = new Date();
      callFunction(this.args.onResolve, this.data);
    }

    if (name === 'promiseTask:errored') {
      this.finishedAt = new Date();
      callFunction(this.args.onReject, this.error);
    }
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
