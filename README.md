[![Build Status](https://travis-ci.org/amkirwan/ember-oauth2.png)](https://travis-ci.org/amkirwan/ember-oauth2) [![Code Climate](https://codeclimate.com/github/amkirwan/ember-oauth2.png)](https://codeclimate.com/github/amkirwan/ember-oauth2)

ember-oauth2
============

JavaScript library for using OAuth 2.0 Implicit Grant flow (Client-Side Flow) for Ember.js

This creates an OAuth 2.0 Ember object class for handling authentication with OAuth 2.0 providers.

Current Version: **[0.3.3](https://github.com/amkirwan/ember-oauth2/releases/tag/v0.3.3)**

## Dependencies

Ember-OAuth2 requires jQuery.

## Browser Support

Ember-OAuth2 uses localStorage for saving the tokens, localStorage is supported in Firefox 3.5+, Safari 4+, IE8+, and Chrome.

## Configure

First you must configure your OAuth provider. For Google you would configure it like this.

```javascript
  Ember.OAuth2.config = {
    google: {
      clientId: "xxxxxxxxxxxx",
      authBaseUri: 'https://accounts.google.com/o/oauth2/auth',
      redirectUri: 'https://oauth2-login-demo.appspot.com/oauth/callback',
      scope: 'public write'
    }
  }
```

The example above sets *google* as a *providerId* along with configuration information for the provider. The following params are required for configuring a valid provider *clientId*, *authBaseUri* and *redirectUri*. Depending on the provider you might need to provide additional and/or optional configuration key/values.

The configuration object allows you to also customize the prefix for the state and token that are stored in the browsers localStorage. The default value for the state prefix is *state* and the default for token is *token*. Using the previous example you can customize the prefixes by doing the following.

```javascript
  Ember.OAuth2.config = {
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
* `statePrefix`: the prefix name for state key stored in the localStorage. The default value is `state` and the key would be `state-the_state_number`
* `tokenPrefix`: the prefix name for token key stored in the localStorage. The default value is `token` and the key would be `token-the_provider_id`

## Authorization

To sign into the OAuth2 provider create an auth object using the providerId and call the authorize method. Using the previous Google configuration example you would call it like this:

```javascript
  App.oauth = Ember.OAuth2.create({providerId: 'google'});
  App.oauth.authorize();
```

Calling `authorize()` will open a new window and the OAuth provider's OAuth dialog will be displayed. If the user chooses to authenticate with your website upon authorization by OAuth provider the user will be redirected back to the redirectUri with the params access_token, token_type and state.

**Note:** The API changes in the examples below. The latest version of the library use Ember.Evented class to subsribe and emit events. The old API is used in versions <= 0.2.3. While the old methods still work in the current version they are depricated and will be removed in future versions.

At the redirectURI add the following to process the params returned from the OAuth provider

New API for handling the redirect in versions >= 0.2.4

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Authorize</title>
    <script>
      var hash = window.location.hash;
      window.opener.App.oauth.trigger('redirect', hash);
      window.close();
    </script>
  </head>
</html>
```

Old API for handling the redirect in version <= 0.2.3 that does not use Ember.Evented for binding events.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Authorize</title>
    <script>
      var hash = window.location.hash;
      window.opener.App.oauth.onRedirect(hash);
      window.close();
    </script>
  </head>
</html>
```

This will process the returned params and save the `provider_id`, `access_token`, `scope` and `expires_in` (the time the access_token will expire) to the localStorage. This localStorage can be accessed with the key `token-the_provider_id`.


After successful authorization and saving the access_token to the localStorage the `success` event will be called. This will allow the user to do any cleanup necessary or to retrieve user information from the OAuth provider. To configure the callback bind event handlers to the `success` and `error` events.

As of version 0.4.0 the `authorize` call will return a `Ember.RSVP.Promise`. This will make it easier to handle callbacks

```javascript
App.oauth.authorize().then(function(stateObj){
  // Handle the successful authorization here
  console.log('hello, success');
}).fail(function(err){
  // Handle any errors within this block
  console.error(err)
});
```

New API for the callbacks in versions >= 0.2.4

```javascript
App.oauth.on('success', function(stateObj) { return 'hello, success' } });
App.oauth.on('error', function(err) { return 'hello, error' } });
```

Old API for the callbacks version <= 0.2.3 that does not use Ember.Evented for binding events.

```javascript
Ember.OAuth2.reopen({ onSuccess: function() { return 'hello, onSuccess' } });
Ember.OAuth2.reopen({ onError: function() { return 'hello, onError' } });
```


## Installation

To install Ember.OAuth2 in your Ember.js application there are several options listed below:

- If you are using Bower add it to your bower.json file:

```javascript
{
  "dependencies": {
    "ember-oauth2": "https://github.com/amkirwan/ember-oauth2.git"
  }
}
```

- Download a prebuilt version from the [releases page](https://github.com/amkirwan/ember-oauth2/releases)
- [Build](/amkirwan/ember-oauth2#building) the project on your system

## Building

To build Ember.Oauth2 you need to have [Node.js](http://nodejs.org), and [npm](https://npmjs.org) installed on your system. Once those are installed you need to install the projects dependencies by running:

```bash
$ git clone https://github.com/amkirwan/ember-oauth2
$ cd ember-oauth2
$ npm install
$ bower install
```

Once the dependencies are installed for Ember.OAuth2 the you can run the following [grunt](http://gruntjs.com/getting-started) tasks.

- The default grunt task, checks the files for errors with jshint, runs the jasmine, creates a minified version of ember.oauth2.js with uglify and copies a non-minified version of ember.oauth2.js and places them in the dist directory.

```bash
$ grunt
```
- The grunt test task runs the jasmine tests against ember.oauth2.js

```bash
$ grunt test
```
- The grunt build task runs creates a minified version of ember.oauth2.js with uglify and copies a non-minified version of ember.oauth2.js and places them in the dist directory.

```bash
$ grunt build
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
* [jso](http://github.com/andreassolberg/jso)
