import Component from '@glimmer/component';
import { computed, action } from '@ember/object';
import { task } from 'ember-concurrency-decorators';
// eslint-disable-next-line ember/no-observers
import { addObserver, removeObserver } from '@ember/object/observers';

class AwaitComponent extends Component {
  @computed('promiseTask.performCount')
  get counter() {
    return this.promiseTask.performCount
  }

  @computed('promiseTask.last.value')
  get data() {
    return this.promiseTask.last?.value
  }

  @computed('promiseTask.last.error')
  get error() {
    return this.promiseTask.last?.error
  }

  @computed('isRejected', 'error', 'data')
  get value() {
    return this.isRejected ? this.error : this.data;
  }

  @computed('promiseTask.last.isSuccessful')
  get isFulfilled() {
    return !!this.promiseTask.last?.isSuccessful
  }

  @computed('promiseTask.last.isError')
  get isRejected() {
    return !!this.promiseTask.last?.isError
  }

  @computed('promiseTask.last.isFinished')
  get isSettled() {
    return !!this.promiseTask.last?.isFinished
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
    super(...arguments)
    addObserver(this, 'args.promise', this.resolvePromise)

    if (this.args.promise) {
      this.resolvePromise();
    }
  }

  willDestroy() {
    removeObserver(this, 'args.promise', this.resolvePromise)
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
    this.promiseTask.perform(this.args.defer)
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
