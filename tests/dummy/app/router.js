import EmberRouter from '@ember/routing/router';
import config from 'dummy/config/environment';

export default class Router extends EmberRouter {
  location = config.locationType;

  rootURL = config.rootURL;
}

// eslint-disable-next-line array-callback-return
Router.map(function() {
  this.route('default');
  this.route('with-getter');
  this.route('defer');
});
