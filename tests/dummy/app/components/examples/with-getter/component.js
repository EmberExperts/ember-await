import Component from '@glimmer/component';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

import { inject as service } from '@ember/service';

class DefaultComponent extends Component {
  @service fetch;

  @tracked postId;

  get post() {
    if (!this.postId) return undefined;

    return async({ signal }) => this.fetch.request(`https://jsonplaceholder.typicode.com/posts/${this.postId}`, { signal });
  }

  @action
  setPostId(event) {
    this.postId = event.target.value;
  }
}

export default DefaultComponent;
