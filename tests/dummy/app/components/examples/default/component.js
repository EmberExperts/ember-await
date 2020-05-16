import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

class DefaultComponent extends Component {
  @service fetch;

  @action
  async fetchPosts({ signal }) {
    return this.fetch.request('https://jsonplaceholder.typicode.com/posts', { signal });
  }
}

export default DefaultComponent;
