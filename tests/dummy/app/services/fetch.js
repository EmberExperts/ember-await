import Service from '@ember/service';

class FetchService extends Service {
  async request(url, options) {
    const response = await fetch(url, options);

    if (response.ok) return response.json();

    throw new Error(`${response.statusText || response.status} - ${response.url}`);
  }
}

export default FetchService;
