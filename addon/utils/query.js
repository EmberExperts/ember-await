/* eslint-disable ember/no-computed-properties-in-native-classes */
import { tracked } from '@glimmer/tracking';
import { computed, action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
import { callback } from 'ember-await/utils/support';
import { AbortController } from 'fetch';

class Query {
  options = {};

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
  @tracked _lastFinished;

  /**
   * The number of times a _promiseTask was started.
   *
   * @public
   * @readonly
   * @memberof AwaitComponent
   * @returns {number} counter
   */
  @computed('_promiseTask.performCount')
  get counter() {
    return this._promiseTask.performCount;
  }

  /**
   * Last successful `_promiseTask` data, or `initialValue` in case there was not completed task yet
   *
   * @public
   * @readonly
   * @returns {any} data
   * @memberof AwaitComponent
   */
  @computed('_promiseTask.lastSuccessful.value', '_lastFinished.{isError,value}', 'isFulfilled', 'options.initialValue')
  get data() {
    const { lastSuccessful } = this._promiseTask;

    if (this._lastFinished && this._lastFinished.isError && lastSuccessful) return lastSuccessful.value;
    if (this._lastFinished) return this._lastFinished.value;

    return this.isFulfilled ? this.options.initialValue : undefined;
  }

  /**
   * Last known error of `_promiseTask` or `initialValue` in case there was not completed task yet
   *
   * @public
   * @readonly
   * @returns {Error|undefined} error
   * @memberof AwaitComponent
   */
  @computed('_promiseTask.lastErrored.error', '_lastFinished.error', 'isPending', 'isRejected', 'options.initialValue')
  get error() {
    const { lastErrored } = this._promiseTask;

    if (this.isPending && lastErrored) return lastErrored.error;
    if (this._lastFinished) return this._lastFinished.error;

    return this.isRejected ? this.options.initialValue : undefined;
  }

  /**
   * Last known value of `_promiseTask`. Data or error
   *
   * @public
   * @readonly
   * @returns {any} value
   * @memberof AwaitComponent
   */
  @computed('_lastFinished.isError', 'isFulfilled', 'error', 'data')
  get value() {
    const { _lastFinished, isFulfilled, error, data } = this;

    if (_lastFinished) return _lastFinished.isError ? error : data;

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
  @computed('_promiseTask.last.isSuccessful')
  get isFulfilled() {
    if (this._promiseTask.last) return this._promiseTask.last.isSuccessful;

    const { initialValue } = this.options;

    return initialValue !== undefined && !(initialValue instanceof Error);
  }

  /**
   * @alias('isFulfilled')
   */
  @computed('isFulfilled')
  get isResolved() {
    return this.isFulfilled;
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
  @computed('_promiseTask.last.isError')
  get isRejected() {
    if (this._promiseTask.last) return this._promiseTask.last.isError;

    const { initialValue } = this.options;

    return initialValue !== undefined && initialValue instanceof Error;
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
  @computed('isPending', 'isSettled', 'options.initialValue')
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
  @computed('_promiseTask.isRunning')
  get isPending() {
    return this._promiseTask.isRunning;
  }

  /**
   * @alias('isPending')
   */
  @computed('isPending')
  get isLoading() {
    return this.isPending;
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
   * Internal Query Promise
   *
   * @private
   * @readonly
   * @memberof Query
   */
  @computed('_promiseTask.last', 'isRejected', 'data', 'error')
  get _promise() {
    return new Promise((resolve, reject) => {
      if (this._promiseTask.last) {
        return this._promiseTask.last.then((data) => resolve(data), () => {
          if (this.isRejected) {
            reject(this.error);
          } else {
            resolve(this.data);
          }
        });
      }

      if (this.isRejected) return reject(this.error);

      resolve(this.data);
    });
  }

  constructor(options = {}) {
    this.options = options;

    if (this.options.promise && !('initialValue' in this.options)) {
      this.run(this.options.promise);
    }
  }

  then(onfulfilled, onrejected) {
    return this._promise.then(onfulfilled, onrejected);
  }

  catch(onrejected) {
    return this._promise.catch(onrejected);
  }

  finally(onfinally) {
    return this._promise.finally(onfinally);
  }

  /**
   * ? Used for handling ember-concurrency events.
   * Sets `_lastFinished` task, maintains callbacks and timestamps
   *
   * @protected
   */
  trigger(name, currentTask) {
    if (this._promiseTask.last && currentTask !== this._promiseTask.last) return;
    if (name === '_promiseTask:started') this.startedAt = new Date();
    if (name === '_promiseTask:canceled') callback(this.options.onCancel)();

    if (name === '_promiseTask:succeeded') {
      this.finishedAt = new Date();
      this._lastFinished = currentTask;
      callback(this.options.onResolve)(this.data);
    }

    if (name === '_promiseTask:errored') {
      this.finishedAt = new Date();
      this._lastFinished = currentTask;
      callback(this.options.onReject)(this.error);
    }
  }

  /**
   * Runs the value through `_promiseTask`
   *
   * @public
   * @param {any} value
   * @returns {Query}
   * @memberof AwaitComponent
   */
  @action
  run(value) {
    this._promiseTask.perform(value);

    return this;
  }

  /**
   * Re-runs the `_promiseTask` when invoked.
   *
   * @public
   * @returns {Query}
   * @memberof AwaitComponent
   */
  @action
  reload() {
    return this.run(this.options.promise);
  }

  /**
   * Cancels the currently pending `_promiseTask`
   *
   * @memberof AwaitComponent
   */
  @action
  cancel() {
    this._promiseTask.cancelAll();
  }

  /**
   * @private
   * @param {any} value
   * @returns {Task} _promiseTask
   * @memberof AwaitComponent
   */
  @task({ restartable: true, evented: true })
  *_promiseTask(value) {
    const controller = new AbortController();

    try {
      return yield callback(value)(controller);
    } finally {
      controller.abort();
    }
  }
}

export default Query;
