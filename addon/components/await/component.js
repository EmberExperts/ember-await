/* eslint-disable ember/no-observers */
/* eslint-disable ember/no-computed-properties-in-native-classes */
import Component from '@glimmer/component';
import { addObserver, removeObserver } from '@ember/object/observers';
import { action } from '@ember/object';
import Query from 'ember-await/utils/query';
import { task } from 'ember-concurrency-decorators';
import { callback } from 'ember-await/utils/support';

class AwaitComponent extends Component {
  query;

  /**
   * Observes `promise` argument and triggers promiseTask in case of change
   * and during first initialization
   * @memberof AwaitComponent
   */
  constructor() {
    super(...arguments);

    this.query = new Query(this.args);

    addObserver(this, 'args.promise', this.query.reload);
  }

  /**
   * Cleanup `promise` observer
   *
   * @memberof AwaitComponent
   */
  willDestroy() {
    super.willDestroy(...arguments);

    removeObserver(this, 'args.promise', this.query.reload);
  }

  @task({ drop: true })
  *runTask(runFn) {
    return yield this.query.run(runFn);
  }

  @action
  run(...args) {
    const { defer } = this.args;

    if (!('defer' in this.args)) return;

    return this.runTask.perform((controller) => callback(defer)(args, controller));
  }
}

export default AwaitComponent;
