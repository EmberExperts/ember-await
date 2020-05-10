import Component from '@glimmer/component';

class AwaitPendingComponent extends Component {
  get shouldRender() {
    const { shouldRender, initial, value } = this.args;

    return shouldRender && (!initial || !value);
  }
}

export default AwaitPendingComponent;
