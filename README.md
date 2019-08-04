[![Build Status](https://travis-ci.org/amkirwan/ember-oauth2.png)](https://travis-ci.org/amkirwan/ember-oauth2)

ember-oauth2
============

JavaScript library for using OAuth 2.0 Implicit Grant flow (Client-Side Flow) or Authorization Grant flow (Server-Side Flow) for Ember.js

This creates an OAuth 2.0 Ember object class for handling authentication with OAuth 2.0 providers.

Current Version: **[2.0.5-beta](https://github.com/amkirwan/ember-oauth2/releases/tag/v2.0.5-beta)**

The EmberCli addon [EmberTokenAuth](https://github.com/amkirwan/ember-token-auth) demonstrates how to use Ember-OAuth2 library for authentication.

## Dependencies

Ember-OAuth2 requires Ember and jQuery.


## Browser Support

Ember-OAuth2 uses localStorage for saving the tokens, localStorage is supported in Firefox 3.5+, Safari 4+, IE9+, and Chrome.

The latest version of Ember-OAuth2 is an Ember Addon and uses the ES6 modules. This allows Ember-OAuth2 to be used in projects like [EmberCLI](https://github.com/stefanpenner/ember-cli) easier.


## Installation

Ember-OAuth2 is an Ember Addon that can be installed with the following command from your ember project.

```javascript
$ ember install ember-oauth2
```

Ember-OAuth2 is an Ember [service](https://guides.emberjs.com/v2.8.0/applications/services/) that you can inject to different parts of your app using the inject syntax

```javascript
import Ember from 'ember';

export default DS.Model.extend({
  emberOauth2: Ember.inject.service();
});
```



## Configure

First you must configure your OAuth provider. For Google you would configure it like this.

```
window.EmberENV['ember-oauth2'] = {
  google: {
    clientId: "xxxxxxxxxxxx",
    authBaseUri: 'https://accounts.google.com/o/oauth2/auth',
    redirectUri: 'https://oauth2-login-demo.appspot.com/oauth/callback',
    scope: 'public write'
  }
}
```

If using ember-cli, you can add the configuration to `config/environment.js`:

```
EmberENV: {
  FEATURES: {
    // Here you can enable experimental features on an ember canary build
    // e.g. 'with-controller': true
  },
  'ember-oauth2': {
    google: {
      clientId: "xxxxxxxxxxxx",
      authBaseUri: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri: 'https://oauth2-login-demo.appspot.com/oauth/callback',
      scope: 'public write'
    }
  }
}
```

The example above sets *google* as a *providerId* along with configuration information for the provider. The following params are required for configuring a valid provider *clientId*, *authBaseUri* and *redirectUri*. Depending on the provider you might need to provide additional and/or optional configuration key/values.

The configuration object allows you to also customize the prefix for the state and token that are stored in the browsers localStorage. The default value for the state prefix is *state* and the default for token is *token*. Using the previous example you can customize the prefixes by doing the following.

```javascript
window.ENV['ember-oauth2'] = {
  google: {
    clientId: "xxxxxxxxxxxx",
    authBaseUri: 'https://accounts.google.com/o/oauth2/auth',
    redirectUri: 'https://oauth2-login-demo.appspot.com/oauth/callback',
    scope: 'public write',
    statePrefix: 'foobar',
    tokenPrefix: 'qux'
  }
}
```

The following are the options available for configuring a provider:

* `clientId`: (required) The client identifier that is used by the provider. Ember-OAuth2 uses the Implicit Grant flow (Client-Side Flow).
* `authBaseUri`: (required) The authorization url for the OAuth2 provider.
* `redirectUri`: (required) The URI that the OAuth2 provider will redirect back to when completed.
* `scope`: Access your application is requesting from the OAuth2 provider.
* `responseType`: The type of authorization your application is requesting. The default is `token` but can be set to `code` if using the Authorization Grant flow.
* `statePrefix`: The prefix name for state key stored in the localStorage. The default value is `state` and the key would be `state-the_state_number`
* `tokenPrefix`: The prefix name for token key stored in the localStorage. The default value is `token` and the key would be `token-the_provider_id`



## Authorization

To sign into the OAuth2 provider create by injecting the service, set the provider with `setProvider` and call the `authorize`. You can inject this addon into your route for example and when the user clicks a button fire the action to handle the request and set the service providerId and call authorize. This is a simple example and you would probably want to wrap this functionality in a session model. Checkout [ember-token-auth](https://github.com/amkirwan/ember-token-auth) for a full example.

```javascript
// login route
import Ember from 'ember';
export default Ember.Route.extend({
  emberOauth2: Ember.inject.service(),
  action: {
    authenticate(providerId) {
      this.get('emberOauth2').setProvider(providerId);
      return this.get('emberOauth2').authorize().then(function(response) {
        this.get('emberOauth2').get('auth').trigger('redirect', response.location.hash);
      }, function(error) {
        this.get('emberOauth2').get('auth').trigger('error', error);
      })
    }
  }

});
```

Calling `authorize()` will open a new window and the OAuth provider's OAuth dialog will be displayed. If the user chooses to authenticate with your website upon authorization by OAuth provider the user will be redirected back to the redirectUri with the params access_token, token_type and state.

At the redirectURI add the following to process the params returned from the OAuth provider

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Authorize</title>
    <script>
      var hash = window.location.hash;
      window.opener.emberOauth2.trigger('redirect', hash);
      window.close();
    </script>
  </head>
</html>
```




## Implicit Grant Flow (Client-side flow)

This will process the returned params and save the `provider_id`, `access_token`, `scope` and `expires_in` (the time the access_token will expire) to the localStorage. This localStorage can be accessed with the key `token-the_provider_id`.


After successful authorization and saving the access_token to the localStorage the `success` event will be called. This will allow the user to do any cleanup necessary or to retrieve user information from the OAuth provider. To configure the callback bind event handlers to the `success` and `error` events.

The `authorize` call returns a `Ember.RSVP.Promise`. Authorize will `resolve` with a reference to the dialog window when it opens successfully and `rejects` with an error when the window fails to open.

})

When using the client-side flow it is vital to validate the token received from the endpoint, failure to do so will make your application vulnerable to the [confused deputy problem](https://en.wikipedia.org/wiki/Confused_deputy_problem). As of version `v1.0.2` Ember-OAuth2 supports the `verifyToken` method for validating tokens when using the client-side flow. The user will need to override this method for validating the different server endpoints.

Here is an example of how this might be accomplished in an Ember-CLI instance initializer using the Google token validation endpoint.

```javascript
import Ember from 'ember';
import EmberOAuth2 from 'ember-oauth2';
import env from 'ember-pacu/config/environment';

export function initialize(app) {
  verifyTokenInit(app);
}

function verifyTokenInit(app) {
  EmberOAuth2.reopen({
    // mitigate confused deputy
    verifyToken: function() {
      return new Ember.RSVP.Promise((resolve, reject) => {
        // implement the adapter with the url to the google tokeinfo endpoint
        var adapter = app.lookup('adapter:session');
        adapter.google_tokeninfo().then(function(response) {
          if (response.audience === env.APP.GOOGLE_CLIENT_ID) {
            resolve(response);
          } else {
            reject('app uid does not match');
          }
        }, function(error) {
          reject(error);
        });
      });
    }
  });
}

export default {
  name: 'ember-oauth2',
  initialize: initialize
};
```





## Authorization Grant flow

If using the Authorization Grant flow with your provider your backend server will need to handle the final steps of authorizing your application. Your success handler will need to send the `AUTHORIZATON_CODE` returned from OAuth2 provider to your backend server which can then retrieve an access token using the client_id, client_secret, and authorization_code.

To enable the Authorization Grant flow for a provider set the `responseType` value to `code`.

```javascript
window.ENV = window.ENV || {};
window.ENV['ember-oauth2'] = {
  google: {
    clientId: "xxxxxxxxxxxx",
    authBaseUri: 'https://accounts.google.com/o/oauth2/auth',
    redirectUri: 'https://oauth2-login-demo.appspot.com/oauth/callback',
    responseType: 'code'
  }
}
```

To build Ember.Oauth2 on your system you will need to have [Node.js](http://nodejs.org), and [npm](https://npmjs.org) installed.

```bash
$ git clone https://github.com/amkirwan/ember-oauth2
$ cd ember-oauth2
$ npm install
$ bower install
```

## Tests

To run the tests you can run one of the following commands.

```bash
$ ember test
$ ember test --serve
$ npm test
```

## Building API Docs

The API Docs provide a detailed collection of methods and properties for Ember.OAuth2. To build the documentation for the project from the project directory run the following command.

Requires node.js and yuidocjs to build. Follow the steps in [build](https://github.com/amkirwan/ember-oauth2#building) to install the dependencies before buiding the docs.

```bash
$ yuidoc .
```


## Contributors

[Contributors](https://github.com/amkirwan/ember-oauth2/graphs/contributors) to this project.


## Credits

#### Thanks to the following projects for ideas on how to make this work.

* [backbone-oauth](http://github.com/ptnplanet/backbone-oauth)
