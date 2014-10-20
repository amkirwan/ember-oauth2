define("ember-oauth2", 
  ["ember","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var Ember = __dependency1__["default"];

    /**
      * @overview OAuth2 library for Emberjs that stores tokens in the browsers localStorage
      * @license   Licensed under MIT license
      *            See https://raw.github.com/amkirwan/ember-oauth2/master/LICENSE
      * @version   0.5.1
      *
      * @module ember-oauth2
      * @class ember-oauth2
      */
    __exports__["default"] = Ember.Object.extend(Ember.Evented, {
      /**
       * Initializes the Ember.OAuth2 object when using Ember.OAuth2.create({providerId: 'providerId'}). The following options are available for the configuring a provider: clientId, authBaseUri, redirectUri, scope, statePrefix and tokenPrefix. The clientId, authBaseUri and redirectUri are required. The statePrefix has a default value of 'state' and the tokenPrefix has a default value of 'token'.
       *
       * @method init
       */
      init: function() {
        this._super();
        /**
         * The configuration object for the given provider id.
         *  @property {Object} providerConfig
         *  @property {Object} providerConfig.providerId **Required**
         *  @property {String} providerConfig.providerId.clientId **Required**
         *  @property {String} providerConfig.providerId.authBaseUri **Required**
         *  @property {String} providerConfig.providerId.redirectUri **Required**
         *  @property {String} providerConfig.providerId.scope **Optional**
         *  @property {String} providerConfig.providerId.statePrefix **Default:** "state", **Optional**
         *  @property {String} providerConfig.providerId.tokenPrefix **Default:** "prefix", **Optional**
         *  @example
         *    App.oauth = Ember.OAuth2.create({providerId: 'google'});
         */

        // if Ember.OAuth2.config has keys use it instead of window.ENV
        if (Ember.OAuth2 && Ember.OAuth2.config && Object.keys(Ember.OAuth2.config).length) {
          Ember.Logger.warn("Ember.OAuth2.config is deprecated and will be removed in future versions. Set the config using window.ENV['ember-oauth2']");
          this.providerConfig = Ember.OAuth2.config[this.get('providerId')];
        } else {
          this.providerConfig = window.ENV['ember-oauth2'][this.get('providerId')];
        }
        /**
         * The prefix name for the state key stored in the localStorage.
         *
         * @property statePrefix
         * @type String
         * @default "state"
         */
        this.set('statePrefix', 'state');
        /**
         * The prefix name for the token key stored in the localStorage.
         *
         * @property tokenPrefix
         * @type String
         * @default "token"
         */
        this.set('tokenPrefix', 'token');

        /**
         * @property {String} clientId
         */
        /**
         * @property {String} authBaseUri
         */
        /**
         * @property {String} redirectUri
         */
        /**
         * @property {String} scope
         */
        // sets the properties from the providerConfig and overrides any default settings.
        this.setProperties(this.providerConfig);

        // Bind deprecated event handlers
        /**
         * @event redirect
         * @param {function} The function that handles the redirect.
         */
        this.on('redirect', this.handleRedirect);

        /**
         * @event success
         * @param {function} The function that handles the success callback.
         */
        this.on('success', this._onSuccess);

        /**
         * @event error
         * @param {function} The function that handles the error callback.
         */
        this.on('error', this._onError);
      },

      /**
       * @method version
       * @return {String} The current version number of Ember.OAuth2
       */
      version: function() {
        return VERSION;
      },

      /**
       * @method uuid
       * @return {String} A pseudo random uuid
       */
      uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                  return v.toString(16);
        });
      },

      /**
       * @method now
       * @return {Number} The current time in seconds rounded
       */
      now: function() {
        return Math.round(new Date().getTime()/1000.0);
      },

      /**
       * Creates and returns the request object.
       *
       * @method requestObj
       * @return {Object} request object
       */
      requestObj: function() {
        var request = { 'response_type': 'token' };
        request.providerId = this.get('providerId');
        request.state = this.get('state');
        request.client_id = this.get('clientId');
        request.state = this.get('state');
        if (this.get('scope')) request.scope = this.get('scope');
        return request;
      },

      /**
       * @method authUri
       * @return {String} Authorization uri for generating an OAuth2 token
       */
      authUri: function() {
        if (!this.get('state')) { this.set('state', this.uuid()); }
        var uri = this.get('authBaseUri');
        uri += '?response_type=token' +
            '&redirect_uri=' + encodeURIComponent(this.get('redirectUri')) +
            '&client_id=' + encodeURIComponent(this.get('clientId')) +
            '&state=' + encodeURIComponent(this.get('state'));
        if (this.get('scope')) uri += '&scope=' + encodeURIComponent(this.get('.scope')).replace('%20', '+');
        return uri;
      },

      /**
       * Open authorize window if the configuration object is valid.
       *
       * @method authorize
       * @return {Promise}
       */
      authorize: function() {
        if (!this.get('providerId')) throw new Error('No provider id given.');
        if (!this.get('clientId')) throw new Error('No client id given.');
        if (!this.get('authBaseUri')) throw new Error('No auth base uri given.');
        if (!this.get('redirectUri')) throw new Error('No redirect uri given.');
        var authorizeUri = this.authUri();
        this.clearStates();
        this.saveState(this.get('state'), this.requestObj());
        return this.openWindow(authorizeUri);
      },

      /**
       * Isolated function responsible for opening windows, to make it
       * easier to override this part in some environments (e.g. Phonegap)

        @param {String} url
        @return {Object} On resolve returns reference to the opened window.
                        On reject returns Object with reference to dialog and error.
       */
      openWindow: function(url) {
        var dialog = window.open(url, 'Authorize', 'height=600, width=450');
        if (window.focus && dialog) { dialog.focus(); }
        var self = this;
        return new Ember.RSVP.Promise(function(resolve, reject) {
          if (dialog) { resolve(dialog); } 
          else { reject(new Error('Opening dialog login window failed.')); } 
        });
      },

      /**
       @method authSuccess
        @param {Object} The params returned from the OAuth2 callback
        @return {String} the access_token from the params
      */
      authSuccess: function(params) {
        return params.access_token;
      },

      /**
       * Token properties
       * providerId
       * expiresIn
       * scope
       * token

        @method generateToken
        @return {Object} The access_token object with info about the token
       */
      generateToken: function(params) {
        var token = {};
        token.provider_id = this.get('providerId');
        token.expires_in = this.expiresIn(params.expires_in);
        token.scope = this.get('scope');
        token.access_token = params.access_token;
        return token;
      },

      /**
        @method expiresIn
        @return {Number} When the token expires in seconds.
      */
      expiresIn: function(expires) {
        return this.now() + parseInt(expires, 10);
      },

      /**
       * call on redirect from OAuth2 provider response
        @method onRedirect
        @deprecated Use `.trigger('redirect')` instead.
       */
      onRedirect: function(hash, callback) {
        Ember.Logger.warn("Ember.OAuth2.onRedirect is deprecated and will be removed in future versions. Please use .trigger('redirect') instead.");
        this.trigger('redirect', hash, callback);
      },

      /*
       * proxy functions for old event handlers
       *
       * Check if the token returned is valid and if so trigger `success` event else trigger `error`
       *
       * @method handleRedirect
       */
      handleRedirect: function(hash, callback) {
        var params = this.parseCallback(hash);
        if (this.authSuccess(params)) {
          var stateObj = this.getState(params.state);
          this.checkState(stateObj);
          this.saveToken(this.generateToken(params));
          this.trigger('success', stateObj);
        } else {
          this.trigger('error', params);
        }
        if (callback && typeof(callback) === "function") {
          callback();
        }
      },

      /**
       * This method will call the old onSuccess callback when using the old API: Ember.OAuth2.reopen({ onSuccess: function() { return 'hello, onSuccess' } });
       *
       * The old onSuccess method will only be called when onSuccess is defined as a function on the Ember.OAuth2 instance
       *
       * @method _onSuccess
       * @param {Object} stateObj
       * @private
       */
      _onSuccess: function(stateObj) {
        if (typeof(this.onSuccess) !== 'function')
          return;

        Ember.Logger.warn("Ember.OAuth2.onSuccess is deprecated and will be removed in future versions. Bind your callbacks using .on('success', fn) instead.");
        this.onSuccess(stateObj);
      },

      /**
       * This method will call the old onError callback when using the old API: Ember.OAuth2.reopen({ onError: function() { return 'hello, onError' } });
       *
       * The old onSuccess method will only be called when onError is defined as a function on the Ember.OAuth2 instance
       *
       * @method _onError
       * @param {Object} err object
       * @private
       */
      _onError: function(err) {
        if (typeof(this.onError) !== 'function')
          return;

        Ember.Logger.warn("Ember.OAuth2.onError is deprecated and will be removed in furture versions. Bind your callbacks using .on('error', fn) instead.");
        this.onError(err);
      },

      /**
       * Checks if the State returned from the server matches the state that was generated in the original request and saved in the browsers localStorage.
       *
       * @method checkState
       * @param {Object} stateObj The object returned from localStorage
       */
      checkState: function(stateObj) {
        if (!stateObj) throw new Error("Could not find state.");
        if (stateObj.state !== this.get('state')) throw new Error("State returned from the server did not match the local saved state.");
      },

      /**
       * Parse the callback function from the OAuth2 provider
       *
       * callback should have the following params if authentication is successful
       * state
       * access_token
       * token_type
       * expires_in
       *
       * @method parseCalback
       * @param {String} locationHash
       * @return {Object} The params returned from the OAuth2 provider
       */
      parseCallback: function(locationHash) {
        var oauthParams = {};
        var queryString = locationHash.substring(1);
        var regex = /([^#?&=]+)=([^&]*)/g;
        var match;
        while ((match = regex.exec(queryString)) !== null) {
          oauthParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
        }
        return oauthParams;
      },

      /**
       * @method saveState
       * @param {String} state The state uuid
       * @param {Object} requestObj Properties of the request state to save in localStorage
       */
      saveState: function(state, requestObj) {
        window.localStorage.setItem(this.get('statePrefix') + '-' + state, JSON.stringify(requestObj));
      },

      /**
       * Return the saved state and remove it from the localStoage.
       *
       * @method getState
       * @param {String} state The state uuid to retreive from localStorage
       * @return {Object} Properties of the request state
       */
      getState: function(state) {
        var obj = JSON.parse(window.localStorage.getItem(this.get('statePrefix') + '-'  + state));
        window.localStorage.removeItem(this.get('statePrefix') + '-' + state);

        return obj;
      },

      /**
        * Remove any states from localStorage if they exist
        * @method clearStates
        * @return {Array} Keys used to remove states from localStorage
        */
      clearStates: function() {
        var regex = new RegExp( '^' + this.get('statePrefix') + '-.*', 'g');

        var name;
        var toRemove = [];
        for(var i = 0, l = window.localStorage.length; i < l; i++) {
          name = window.localStorage.key(i);
          if (name.match(regex)) {
            toRemove.push(name);
          }
        }

        for(var j = 0, len = toRemove.length; j < len; j++) {
          name = toRemove[j];
          window.localStorage.removeItem(name);
        }
        return toRemove;
      },

      /**
       * saveToken stores the token by the tokenPrefix and the providerId
       * access_token
       * expires : time that the token expires
       * providerId: the providerId
       * scopes: array of scopes
       *
       * @method saveToken
       * @param {Object} token Saves the params in the response from the OAuth2 server to localStorage with the key 'tokenPrefix-providerId
       */
      saveToken: function(token) {
        window.localStorage.setItem(this.get('tokenPrefix') + '-' + this.get('providerId'), JSON.stringify(token));
      },

      /**
       * @method getToken
       * @return {Object} The params from the OAuth2 response from localStorage with the key 'tokenPrefix-providerId'.
       */
      getToken: function() {
        var token = JSON.parse(window.localStorage.getItem( this.get('tokenPrefix') + '-' + this.get('providerId')));
        if (!token) return null;
        if (!token.access_token) return null;
        return token;
      },

      /**
       * @method getAccessToken
       * @return {Object} The access_token param from the OAuth2 response from localStorage with the key 'tokenPrefix-providerId'.
       */
      getAccessToken: function() {
        var token = this.getToken();
        if (!token) return null;
        return token.access_token;
      },

      /**
       * @method accessTokenIsExpired
       * @return {Boolean} Check if the access_token is expired.
       */
      accessTokenIsExpired: function() {
        var token = this.getToken();
        if (!token) return true;
        if (this.now() >= token.expires_in) {
          return true;
        } else {
          return false;
        }
      },

      /**
       * Sets the access token expires_in time to 0 and saves the token to localStorage
       * @method expireAccessToken
       */
      expireAccessToken: function() {
        var token = this.getToken();
        if (!token) return null;
        token.expires_in = 0;
        this.saveToken(token);
      }
    });

    /**
     * @property {String} VERSION
     * @final
    */
    var VERSION = "0.5.1";

    /**
     * @method version
     * @static
     */
    if (Ember.OAuth2) { 
     Ember.OAuth2.version = VERSION;
    }
  });