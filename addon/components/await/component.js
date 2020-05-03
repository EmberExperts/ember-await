import Component from '@glimmer/component';
import { computed, action, notifyPropertyChange } from '@ember/object';
import { task } from 'ember-concurrency-decorators';

class AwaitComponent extends Component {
  get isLoaded() {
    return this.args.isLoaded ?? true;
  }

  get isAsync() {
    return Boolean(this.args.promise?.then)
  }

  @computed('currentState.isError', 'isPending')
  get isFulfilled() {
    return !this.currentState.isError && !this.isPending
  }

  @computed('isAsync', 'currentState.isRunning', 'isLoaded')
  get isPending() {
    return (this.isAsync ? this.currentState.isRunning : false) || !this.isLoaded;
  }

  @computed('args.promise')
  get currentState() {
    return this.promiseTask.perform(this.args.promise);
  }

  @task({ restartable: true })
  *promiseTask(promise) {
    return yield promise;
  }

  @action
  reload() {
    notifyPropertyChange(this, 'currentState');
  }

  @action
  cancel() {
    this.currentState.cancel();
  }
}

export default AwaitComponent;
