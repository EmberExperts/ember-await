import Component from '@glimmer/component';
import { computed, action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
// eslint-disable-next-line ember/no-observers
import { addObserver, removeObserver } from '@ember/object/observers';

class AwaitComponent extends Component {
  @computed('promiseTask.last')
  get lastPromiseTask() {
    return this.promiseTask.last;
  }

  @computed('promiseTask.performCount')
  get counter() {
    return this.promiseTask.performCount;
  }

  @computed('lastPromiseTask.value')
  get data() {
    return this.lastPromiseTask?.value;
  }

  @computed('lastPromiseTask.error')
  get error() {
    return this.lastPromiseTask?.error;
  }

  @computed('isRejected', 'error', 'data')
  get value() {
    const { isRejected, error, data } = this;

    return isRejected ? error : data;
  }

  @computed('lastPromiseTask.isSuccessful')
  get isFulfilled() {
    return Boolean(this.lastPromiseTask?.isSuccessful);
  }

  @computed('lastPromiseTask.isError')
  get isRejected() {
    return Boolean(this.lastPromiseTask?.isError);
  }

  @computed('lastPromiseTask.isFinished')
  get isSettled() {
    return Boolean(this.lastPromiseTask?.isFinished);
  }

  @computed('counter')
  get isInitial() {
    return this.counter === 0;
  }

  @computed('promiseTask.isRunning')
  get isPending() {
    return this.promiseTask.isRunning;
  }

  constructor() {
    super(...arguments);

    addObserver(this, 'args.promise', this.resolvePromise);

    if (this.args.promise) {
      this.resolvePromise();
    }
  }

  willDestroy() {
    removeObserver(this, 'args.promise', this.resolvePromise);
  }

  @task({ restartable: true })
  *promiseTask(promise) {
    return yield ((this.isFunction(promise) ? promise() : promise));
  }

  resolvePromise() {
    return this.promiseTask.perform(this.args.promise);
  }

  isFunction(promise) {
    return (typeof promise) === "function";
  }

  @action
  run() {
    const { promiseTask, args } = this;

    promiseTask.perform(args.defer);
  }

  @action
  reload() {
    this.resolvePromise();
  }

  @action
  cancel() {
    this.promiseTask.cancelAll();
  }
}

export default AwaitComponent;
