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

  /**
   * Tracks when the current/last task was started.
   *
   * @public
   * @type {Date|undefined}
   * @memberof AwaitComponent
   */
  @tracked startedAt;

  /**
   * Tracks when the current/last task was finished.
   *
   * @public
   * @type {Date|undefined}
   * @memberof AwaitComponent
   */
  @tracked finishedAt;

  /**
   * Last finished task instance.
   * ? We are using own property for that as `lastComplete` from EC is bugged and does not return correct task
   *
   * @private
   * @type {TaskInstance|undefined}
   * @memberof AwaitComponent
   */
  @tracked lastFinished;

  /**
   * Determines if we are running on FastBoot or not
   *
   * @private
   * @readonly
   * @returns {boolean} isFastBoot
   * @memberof AwaitComponent
   */
  get isFastBoot() {
    return this.fastboot && this.fastboot.isFastBoot;
  }

  /**
   * The number of times a promiseTask was started.
   *
   * @public
   * @readonly
   * @memberof AwaitComponent
   * @returns {number} counter
   */
  @computed('promiseTask.performCount')
  get counter() {
    return this.promiseTask.performCount;
  }

  /**
   * Last successful `promiseTask` data, or `initialValue` in case there was not completed task yet
   *
   * @public
   * @readonly
   * @returns {any} data
   * @memberof AwaitComponent
   */
  @computed('promiseTask.lastSuccessful.value', 'lastFinished.{isError,value}', 'isFulfilled', 'args.initialValue')
  get data() {
    const { lastSuccessful } = this.promiseTask;

    if (this.lastFinished && this.lastFinished.isError && lastSuccessful) return lastSuccessful.value;
    if (this.lastFinished) return this.lastFinished.value;

    return this.isFulfilled ? this.args.initialValue : undefined;
  }

  /**
   * Last known error of `promiseTask` or `initialValue` in case there was not completed task yet
   *
   * @public
   * @readonly
   * @returns {Error|undefined} error
   * @memberof AwaitComponent
   */
  @computed('promiseTask.lastErrored.error', 'lastFinished.error', 'isPending', 'isRejected', 'args.initialValue')
  get error() {
    const { lastErrored } = this.promiseTask;

    if (this.isPending && lastErrored) return lastErrored.error;
    if (this.lastFinished) return this.lastFinished.error;

    return this.isRejected ? this.args.initialValue : undefined;
  }

  /**
   * Last known value of `promiseTask`. Data or error
   *
   * @public
   * @readonly
   * @returns {any} value
   * @memberof AwaitComponent
   */
  @computed('lastFinished.isError', 'isFulfilled', 'error', 'data')
  get value() {
    const { lastFinished, isFulfilled, error, data } = this;

    if (lastFinished) return lastFinished.isError ? error : data;

    return isFulfilled ? data : error;
  }

  /**
   * Checks if promise is fulfilled- resolved successfully,
   * or `initialData` is not Error if promise has been never started
   *
   * @public
   * @readonly
   * @returns {boolean} isFulfilled
   * @memberof AwaitComponent
   */
  @computed('promiseTask.last.isSuccessful')
  get isFulfilled() {
    if (this.promiseTask.last) return this.promiseTask.last.isSuccessful;

    const { initialValue } = this.args;

    return isDefined(initialValue) && !(initialValue instanceof Error);
  }

  /**
   * Checks if promise is rejected,
   * or `initialValue` is Error if promise has been never started
   *
   * @public
   * @readonly
   * @returns {boolean} isRejected
   * @memberof AwaitComponent
   */
  @computed('promiseTask.last.isError')
  get isRejected() {
    if (this.promiseTask.last) return this.promiseTask.last.isError;

    const { initialValue } = this.args;

    return isDefined(initialValue) && initialValue instanceof Error;
  }

  /**
   * Checks if promise is settled- resolved or rejected
   *
   * @public
   * @readonly
   * @returns {boolean} isSettled
   * @memberof AwaitComponent
   */
  @computed('isFulfilled', 'isRejected')
  get isSettled() {
    return this.isFulfilled || this.isRejected;
  }

  /**
   * Checks if promise never started
   *
   * @public
   * @readonly
   * @returns {boolean} isInitial
   * @memberof AwaitComponent
   */
  @computed('isPending', 'isSettled', 'args.initialValue')
  get isInitial() {
    return !this.isPending && !this.isSettled && this.counter === 0;
  }

  /**
   * Checks if promise is pending (loading)
   *
   * @public
   * @readonly
   * @returns {boolean} isPending
   * @memberof AwaitComponent
   */
  @computed('promiseTask.isRunning')
  get isPending() {
    return this.promiseTask.isRunning;
  }

  /**
   * Status of current promise
   *
   * @public
   * @readonly
   * @returns {'rejected'|'fulfilled'|'pending'|'initial'|''} status
   * @memberof AwaitComponent
   */
  @computed('isInitial', 'isPending', 'isFulfilled', 'isRejected')
  get status() {
    if (this.isRejected) return 'rejected';
    if (this.isFulfilled) return 'fulfilled';
    if (this.isPending) return 'pending';
    if (this.isInitial) return 'initial';

    return '';
  }

  /**
   * Observes `promse` argument and triggers promiseTask in case of change
   * and during first initialization
   * @memberof AwaitComponent
   */
  constructor() {
    super(...arguments);

    if (this.args.promise && !isDefined(this.args.initialValue)) this._resolvePromise();

    addObserver(this, 'args.promise', this._resolvePromise);
  }

  /**
   * Cleanup `promise` observer
   *
   * @memberof AwaitComponent
   */
  willDestroy() {
    super.willDestroy(...arguments);

    removeObserver(this, 'args.promise', this._resolvePromise);
  }

  /**
   * ? Used for handling ember-concurrency events.
   * Sets `lastFinished` task, maintains callbacks and timestamps
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

  /**
   * @private
   * @param {any} value
   * @returns {Task} promiseTask
   * @memberof AwaitComponent
   */
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

  /**
   * @private
   * @param {*} value
   * @param {any[]} [args=[]]
   * @returns {Task} runTask
   * @memberof AwaitComponent
   */
  @task({ drop: true })
  *runTask(value, args = []) {
    const deferFn = isFunction(value) ? value : () => value;

    return yield this.promiseTask.perform((controller) => deferFn(args, controller));
  }

  /**
   * Runs the `runTask`, passing any arguments provided as an array.
   *
   * @public
   * @param {any[]} args
   * @returns {TaskInstance|undefined}
   * @memberof AwaitComponent
   */
  @action
  run(...args) {
    if (!isDefined(this.args.defer)) return;

    return this.runTask.perform(this.args.defer, args);
  }

  /**
   * Re-runs the `promiseTask` when invoked.
   *
   * @public
   * @returns {TaskInstance}
   * @memberof AwaitComponent
   */
  @action
  reload() {
    return this.promiseTask.perform(this.args.promise);
  }

  /**
   * Cancels the currently pending `promiseTask`
   *
   * @memberof AwaitComponent
   */
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
