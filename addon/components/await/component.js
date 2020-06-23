/* eslint-disable ember/no-observers */
/* eslint-disable ember/no-computed-properties-in-native-classes */
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { computed, action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
import { addObserver, removeObserver } from '@ember/object/observers';
import { inject as service } from '@ember/service';

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
  @service fastboot;

  @tracked startedAt;

  @tracked finishedAt;

  @tracked lastFinished;

  get isFastBoot() {
    return this.fastboot && this.fastboot.isFastBoot;
  }

  @computed('promiseTask.performCount')
  get counter() {
    return this.promiseTask.performCount;
  }

  @computed('promiseTask.lastSuccessful.value', 'lastFinished.{isError,value}', 'isFulfilled', 'args.initialValue')
  get data() {
    const { lastSuccessful } = this.promiseTask;

    if (this.lastFinished && this.lastFinished.isError && lastSuccessful) return lastSuccessful.value;
    if (this.lastFinished) return this.lastFinished.value;

    return this.isFulfilled ? this.args.initialValue : undefined;
  }

  @computed('promiseTask.lastErrored.error', 'lastFinished.error', 'isPending', 'isRejected', 'args.initialValue')
  get error() {
    const { lastErrored } = this.promiseTask;

    if (this.isPending && lastErrored) return lastErrored.error;
    if (this.lastFinished) return this.lastFinished.error;

    return this.isRejected ? this.args.initialValue : undefined;
  }

  @computed('lastFinished.isError', 'isFulfilled', 'error', 'data')
  get value() {
    const { lastFinished, isFulfilled, error, data } = this;

    if (lastFinished) return lastFinished.isError ? error : data;

    return isFulfilled ? data : error;
  }

  @computed('promiseTask.last.isSuccessful')
  get isFulfilled() {
    if (this.promiseTask.last) return this.promiseTask.last.isSuccessful;

    const { initialValue } = this.args;

    return isDefined(initialValue) && !(initialValue instanceof Error);
  }

  @computed('promiseTask.last.isError')
  get isRejected() {
    if (this.promiseTask.last) return this.promiseTask.last.isError;

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

    if (this.args.promise && !isDefined(this.args.initialValue)) this._resolvePromise();
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
    if (name === 'promiseTask:started') this.startedAt = new Date();
    if (name === 'promiseTask:canceled') callFunction(this.args.onCancel);

    if (name === 'promiseTask:succeeded') {
      this.finishedAt = new Date();
      this.lastFinished = currentTask;
      callFunction(this.args.onResolve, this.data);
    }

    if (name === 'promiseTask:errored') {
      this.finishedAt = new Date();
      this.lastFinished = currentTask;
      callFunction(this.args.onReject, this.error);
    }
  }

  @task({ restartable: true, evented: true })
  *promiseTask(value) {
    const controller = new window.AbortController();
    const promiseFn = isFunction(value) ? value : () => value;

    try {
      return yield promiseFn(controller);
    } finally {
      controller.abort();
    }
  }

  @task({ drop: true })
  *runTask(value, args = []) {
    const deferFn = isFunction(value) ? value : () => value;

    return yield this.promiseTask.perform((controller) => deferFn(args, controller));
  }

  @action
  run(...args) {
    if (isDefined(this.args.defer)) {
      return this.runTask.perform(this.args.defer, args);
    }
  }

  @action
  reload() {
    return this._resolvePromise();
  }

  @action
  cancel() {
    this.promiseTask.cancelAll();
  }

  _resolvePromise() {
    if (this.isFastBoot) return;

    return this.promiseTask.perform(this.args.promise);
  }
}

export default AwaitComponent;
