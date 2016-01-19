import Ember from 'ember';

/**
  * @overview OAuth2 library for Emberjs that stores tokens in the browsers localStorage
  * @license   Licensed under MIT license
  *            See https://raw.github.com/amkirwan/ember-oauth2/master/LICENSE
  * @version   1.0.1
  *
  * @module ember-oauth2
  * @class ember-oauth2
  */
export default Ember.Object.extend(Ember.Evented, {
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
     *  @property {String} providerConfig.providerId.responseType **Default:** "token", **Optional**
     *  @property {String} providerConfig.providerId.statePrefix **Default:** "state", **Optional**
     *  @property {String} providerConfig.providerId.tokenPrefix **Default:** "prefix", **Optional**
     *  @example
     *    App.oauth = Ember.OAuth2.create({providerId: 'google'});
     */

    // if Ember.OAuth2.config has keys use it instead of window.ENV
    if (Ember.OAuth2 && Ember.OAuth2.config && Object.keys(Ember.OAuth2.config).length) {
      Ember.Logger.warn("Ember.OAuth2.config is deprecated and will be removed in future versions. Set the config using window.ENV['ember-oauth2']");
      this.set('config', Ember.OAuth2.config);
    } else if (window.EmberENV && window.EmberENV['ember-oauth2']) {
      this.set('config', window.EmberENV['ember-oauth2']);
    } else if (window.ENV && window.ENV['ember-oauth2']) {
      this.set('config', window.ENV['ember-oauth2']);
    } else {
      throw new Error('Cannot find the ember-oauth2 config.');
    }

    if (!this.get('config')[this.get('providerId')]) {
      throw new Error("Cannot find the providerId: '" + this.get('providerId') + "' in the config.");
    }

    this.set('providerConfig', this.get('config')[this.get('providerId')]);

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
     * The response type for the authorization request.
     *
     * @property responseType
     * @type String
     * @default "token"
     */
    this.set('responseType', 'token');

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

    /**
     * @event redirect
     */
    this.on('redirect', this.handleRedirect);
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
    var request = {};
    request.response_type = this.get('responseType');
    request.providerId = this.get('providerId');
    request.client_id = this.get('clientId');
    request.state = this.generateState();
    if (this.get('scope')) request.scope = this.get('scope');
    return request;
  },

  /**
   * @method authUri
   * @return {String} Authorization uri for generating an OAuth2 token
   */
  authUri: function() {
    var uri = this.get('authBaseUri');
    uri += '?response_type=' + encodeURIComponent(this.get('responseType')) +
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
    this.clearStates();
    this.saveState(this.requestObj());
    return this.openWindow(this.authUri());
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
    return (this.get('responseType') === 'token' && params.access_token) ||
            (this.get('responseType') === 'code' && params.code);
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
   * @method generateState
   * @return {String} The state 
   */
  generateState: function() {
    // set the stats
    if (!this.get('state')) { this.set('state', this.uuid()); }
    return this.get('state');
  },

  /**
   * @method expiresIn
   * @param {String} expires Expires time string from params
   * @return {Number} When the token expires in seconds.
  */
  expiresIn: function(expires) {
    return this.now() + parseInt(expires, 10);
  },

  /**
   * proxy functions for old event handlers
   *
   * Check if the token returned is valid and if so trigger `success` event else trigger `error`
   *
   * @method handleRedirect
   * @param {Object} hash The window location hash callback url 
   * @param {Function} callback Optional callback
   */
  handleRedirect: function(hash, callback) {
    var self = this;
    var params = self.parseCallback(hash);

    if (self.authSuccess(params) && self.checkState(params.state)) {
      if (self.get('responseType') === 'token') {
        self.saveToken(self.generateToken(params));
        // verify the token on the client end 
        self.verifyToken().then(function(result) {
          /*jshint unused:false*/ 
          self.trigger('success', params);  
        }, function(error) {
          /*jshint unused:false*/ 
          self.removeToken();
          self.trigger('error', 'Error: verifying token', params);
        });
      } else {
        self.trigger('success', params.code);
      }
    } else {
      self.trigger('error', 'Error: authorization', params);
    }

    if (callback && typeof(callback) === 'function') {
      callback();
    }
  },

  /**
   * For Client-side flow verify the token with the endpoint. Mitigation for confused deputy.
   * This method should be replaced by the app using this library.
   *
   * @method verifyToken
   * @return {Promise} Checks with the endpoint if the token is valid
   */
  verifyToken: function() {
    return Ember.RSVP.Promise.resolve(true);
  },

  /**
   * Checks if the State returned from the server matches the state that was generated in the original request and saved in the browsers localStorage.
   *
   * @method checkState
   * @param {String} state The state to check
   * @return {Boolean} Will return true if the states false if they do not match
   */
  checkState: function(state) {
    if (!state) return false;
    // check the state returned with state saved in localstorage
    if (state === this.readState().state) {
      this.removeState(this.stateKeyName());
      return true;
    } else {
      Ember.Logger.warn("State returned from the server did not match the local saved state.");
      return false;
    }
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
    var queryString = locationHash.substring(locationHash.indexOf('?'));
    var regex = /([^#?&=]+)=([^&]*)/g;
    var match;
    while ((match = regex.exec(queryString)) !== null) {
      oauthParams[decodeURIComponent(match[1])] = decodeURIComponent(match[2]);
    }
    return oauthParams;
  },

  /**
   * @method saveState
   * @param {Object} requestObj Properties of the request state to save in localStorage
   */
  saveState: function(requestObj) {
    window.localStorage.setItem(this.stateKeyName(), JSON.stringify(requestObj));
  },

  /**
   * Return the saved state object from localStoage.
   *
   * @method getState
   * @return {Object} Properties of the request state
   */
  readState: function() {
    var stateObj = JSON.parse(window.localStorage.getItem(this.stateKeyName()));
    if (!stateObj) return null;

    return stateObj;
  },

  /**
   * Return the saved state object and remove it from the localStoage.
   *
   * @method getState
   * @return {Object} Properties of the request state
   */
  getState: function() {
    var stateObj = JSON.parse(window.localStorage.getItem(this.stateKeyName()));
    if (!stateObj) return null;

    this.removeState(this.stateKeyName());

    return stateObj;
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
      this.removeState(name);
    }
    return toRemove;
  },

  /**
   * The key name to use for saving state to localstorage
   *
   * @method stateKeyName
   * @return {String} The state key name used for localstorage
   */
  stateKeyName: function() {
    return this.get('statePrefix') + '-' + this.get('state');
  },


  /**
   * The key name to use for saving the token to localstorage
   *
   * @method tokenKeyName
   * @return {String} The token key name used for localstorage
   */
  tokenKeyName: function() {
    return this.get('tokenPrefix') + '-' + this.get('providerId');
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
    window.localStorage.setItem(this.tokenKeyName(), JSON.stringify(token));
  },

  /**
   * remove the state from localstorage
   *
   * @method removeState
   * @param {String} stateName The keyname of the state object in localstorage
   * @return {Object} The deleted state object from localstorage
   */
  removeState: function(stateName) {
    if (stateName) {
      return window.localStorage.removeItem(stateName);
    } else {
      return window.localStorage.removeItem(this.stateKeyName());
    }
  },

  /**
   * remove the token from localstorage
   *
   * @method removeToken
   * @return {Object} The token object in localstorage
   */
  removeToken: function() {
    return window.localStorage.removeItem(this.tokenKeyName());
  },

  /**
   * @method getToken
   * @return {Object} The params from the OAuth2 response from localStorage with the key 'tokenPrefix-providerId'.
   */
  getToken: function() {
    var token = JSON.parse(window.localStorage.getItem(this.tokenKeyName())); 
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
var VERSION = "1.0.1";

/**
 * @method version
 * @static
 */
if (Ember.OAuth2) { 
 Ember.OAuth2.version = VERSION;
}
