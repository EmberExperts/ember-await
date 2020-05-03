import Component from '@glimmer/component';

class AwaitComponent extends Component {
  isLoaded = true;

  get isRunning() {
    return (this.isAsync ? this.resolveTask.isRunning : false) || !this.isLoaded;
  }

  get isError() {
    return this.isAsync ? this.resolve.last.isError : false;
  }

  get isAsync() {
    return Boolean(this.args.promise?.then)
  }

  get value() {
    return this.isAsync ? this.resolveTask.last.value : this.promise;
  }

  get error() {
    return this.resolveTask.last.value;
  }

  // @task({ restartable: true })
  *resolveTask() {
    return yield promise;
  }
}

export default AwaitComponent;
