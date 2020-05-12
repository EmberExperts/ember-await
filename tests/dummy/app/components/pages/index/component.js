import Component from '@glimmer/component';
import { action } from '@ember/object';

async function request(url, options) {
  const response = await fetch(url, options);

  if (response.ok) return response.json();

  throw new Error(`${response.statusText || response.status} - ${response.url}`);
}

class IndexPageComponent extends Component {
  @action
  async fetchPosts({ signal }) {
    return request('https://jsonplaceholder.typicode.com/posts', { signal });
  }
}

export default IndexPageComponent;
