import Ember from 'ember';

/**
 * @overview OAuth2 addon for Emberjs that stores tokens in the browsers localStorage
 * @license   Licensed under MIT license
 *            See https://raw.github.com/amkirwan/ember-oauth2/master/LICENSE
 * @version   2.0.4-beta
 *
 * @module ember-oauth2
 * @class ember-oauth2
 */
export default Ember.Service.extend(Ember.Evented, {
  VERSION: '2.0.4-beta',
  /**
   * initialize with the providerId to find in
   * EmberENV['ember-oauth2'] config
   */
  init() {
    this._super(...arguments);
    if (!window.EmberENV['ember-oauth2']) {
      window.EmberENV['ember-oauth2'] = {};
    }
    this.set('config', window.EmberENV['ember-oauth2']);

    this.set('statePrefix', 'state');
    this.set('tokenPrefix', 'token');
    this.set('responseType', 'token');
  },

  /**
   * Set the provider for the ember-oauth2 service with the providerId configured
   * in EmberENV['ember-oauth2'].
   *
   * @method setProvider
   * @param {String} providerId the provider Id configured in EmberENV['ember-oauth2']
   */
  setProvider(providerId) {
    this.set('providerId', providerId);
    // if the provider id doesn't exist in the config throw an error
    if (!this.get('config')[this.get('providerId')]) {
      throw new Error(
        `Cannot find the providerId: ${this.get('providerId')} in the config.`
      );
    } else {
      this.set('providerConfig', this.get('config')[this.get('providerId')]);
      this.setProperties(this.providerConfig);
      return this;
    }
  },

  /**
   * Open authorize window if the configuration object is valid.
   *
   * @method authorize
   * @return {Promise}
   */
  authorize() {
    if (!this.get('providerId')) {
      throw new Error('No provider id given.');
    }
    if (!this.get('clientId')) {
      throw new Error('No client id given.');
    }
    if (!this.get('authBaseUri')) {
      throw new Error('No auth base uri given.');
    }
    if (!this.get('redirectUri')) {
      throw new Error('No redirect uri given.');
    }
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
  openWindow(url) {
    let dialog = window.open(url, 'Authorize', 'height=600, width=450');
    if (window.focus && dialog) {
      dialog.focus();
    }
    return new Ember.RSVP.Promise(function(resolve, reject) {
      if (dialog) {
        resolve(dialog);
      } else {
        reject(new Error('Opening dialog login window failed.'));
      }
    });
  },

  /**
   *
   * Check if the token returned is valid and if so trigger `success` event else trigger `error`
   *
   * @method handleRedirect
   * @param {Object} hash The window location hash callback url
   * @param {Function} callback Optional callback
   */

  handleRedirect: Ember.on('redirect', function(hash, callback) {
    let self = this;
    let params = self.parseCallback(hash);

    if (self.authSuccess(params) && self.checkState(params.state)) {
      if (self.get('responseType') === 'token') {
        self.saveToken(self.generateToken(params));
        // verify the token on the client end
        self.verifyToken().then(
          function(result) {
            /*jshint unused:false*/
            self.trigger('success');
          },
          function(error) {
            /*jshint unused:false*/
            self.removeToken();
            self.trigger('error', 'Error: verifying token', params);
          }
        );
      } else {
        self.trigger('success', params.code);
      }
    } else {
      self.trigger('error', 'Error: authorization', params);
    }

    if (callback && typeof callback === 'function') {
      callback();
    }
  }),

  /**
   @method authSuccess
    @param {Object} The params returned from the OAuth2 callback
    @return {Boolean} True if success false otherwise
  */
  authSuccess: function(params) {
    return (
      (this.get('responseType') === 'token' && params.access_token) ||
      (this.get('responseType') === 'code' && params.code)
    );
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
    return window.localStorage.getItem(this.tokenKeyName());
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
    if (!state) {
      return false;
    }
    // check the state returned with state saved in localstorage
    if (state === this.readState().state) {
      this.removeState(this.stateKeyName());
      return true;
    } else {
      Ember.Logger.warn(
        'State returned from the server did not match the local saved state.'
      );
      return false;
    }
  },

  /**
   * Parse the callback function from the OAuth2 provider
   *
   * callback should have the following params if authentication is successful
   * state
   * access_token or code
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
   * @method authUri
   * @return {String} Authorization uri for generating an OAuth2 token
   */
  authUri: function() {
    var uri = this.get('authBaseUri');
    uri +=
      '?response_type=' +
      encodeURIComponent(this.get('responseType')) +
      '&redirect_uri=' +
      encodeURIComponent(this.get('redirectUri')) +
      '&client_id=' +
      encodeURIComponent(this.get('clientId')) +
      '&state=' +
      encodeURIComponent(this.get('state'));
    if (this.get('scope')) {
      uri +=
        '&scope=' + encodeURIComponent(this.get('scope')).replace('%20', '+');
    }
    return uri;
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
    request.clientId = this.get('clientId');
    request.state = this.generateState();
    if (this.get('scope')) {
      request.scope = this.get('scope');
    }
    return request;
  },

  /**
   * @method saveState
   * @param {Object} requestObj Properties of the request state to save in localStorage
   */
  saveState: function(requestObj) {
    window.localStorage.setItem(
      this.stateKeyName(),
      JSON.stringify(requestObj)
    );
  },

  /**
   * Remove any states from localStorage if they exist
   * @method clearStates
   * @return {Array} Keys used to remove states from localStorage
   */
  clearStates: function() {
    let regex = new RegExp('^' + this.get('statePrefix') + '-.*', 'g');

    let name;
    let toRemove = [];
    for (let i = 0, l = window.localStorage.length; i < l; i++) {
      name = window.localStorage.key(i);
      if (name.match(regex)) {
        toRemove.push(name);
      }
    }

    for (let j = 0, len = toRemove.length; j < len; j++) {
      name = toRemove[j];
      this.removeState(name);
    }
    return toRemove;
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
   * Return the saved state object from localStoage.
   *
   * @method getState
   * @return {Object} Properties of the request state
   */
  readState: function() {
    var stateObj = JSON.parse(window.localStorage.getItem(this.stateKeyName()));
    if (!stateObj) {
      return false;
    }

    return stateObj;
  },

  /**
   * @method uuid
   * @return {String} A pseudo random uuid
   */
  uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * @method now
   * @return {Number} The current time in seconds rounded
   */
  now() {
    return Math.round(new Date().getTime() / 1000.0);
  },

  /**
   * The key name to use for saving state to localstorage
   *
   * @method stateKeyName
   * @return {String} The state key name used for localstorage
   */
  stateKeyName() {
    if (!this.get('state')) {
      this.generateState();
    }
    return this.get('statePrefix') + '-' + this.get('state');
  },

  /**
   * @method generateState
   * @return {String} The state
   */
  generateState(clear = false) {
    if (!this.get('state') || clear === true) {
      this.set('state', this.uuid());
    }
    return this.get('state');
  },

  /**
   * @method getToken
   * @return {Object} The params from the OAuth2 response from localStorage with the key 'tokenPrefix-providerId'.
   */
  getToken: function() {
    var token = JSON.parse(window.localStorage.getItem(this.tokenKeyName()));
    if (!token) {
      return null;
    }
    if (!token.access_token) {
      return null;
    }
    return token;
  },

  /**
   * @method getAccessToken
   * @return {Object} The access_token param from the OAuth2 response from localStorage with the key 'tokenPrefix-providerId'.
   */
  getAccessToken: function() {
    var token = this.getToken();
    if (!token) {
      return null;
    }
    return token.access_token;
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
   * @method expiresIn
   * @param {String} expires lifetime left of token in seconds
   * @return {Number} When the token expires in seconds.
   */
  expiresIn: function(expires) {
    return this.now() + parseInt(expires, 10);
  },

  /**
   * @method accessTokenIsExpired
   * @return {Boolean} Check if the access_token is expired.
   */
  accessTokenIsExpired: function() {
    let token = this.getToken();
    if (!token) {
      return true;
    }
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
    if (!token) {
      return null;
    }
    token.expires_in = 0;
    this.saveToken(token);
  },
});
