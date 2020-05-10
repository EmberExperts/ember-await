import Component from '@glimmer/component';

class AwaitStateComponent extends Component {
  get shouldRender() {
    const { shouldRender, persist, value } = this.args;

    return shouldRender || persist && !value;
  }
}

export default AwaitStateComponent;
