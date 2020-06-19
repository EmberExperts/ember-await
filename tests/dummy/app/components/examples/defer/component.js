import Component from '@glimmer/component';
import { action } from '@ember/object';

import { inject as service } from '@ember/service';

class DeferComponent extends Component {
  @service fetch;

  @action
  async clickAction({ signal }) {
    return this.fetch.request(`https://jsonplaceholder.typicode.com/posts/1`, {
      signal,
      method: 'PUT',
      body: JSON.stringify({
        title: 'Async title'
      })
    });
  }

  @action
  successAlert() {
    alert('Updated!');
  }

  @action
  errorAlert() {
    alert('Error while updating! Please try again');
  }
}

export default DeferComponent;
