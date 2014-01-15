(function() {
  if (Ember.OAuth2 === undefined) {
    Ember.OAuth2 = Ember.Object.extend({

      init: function() {
        this._super();
        this.providerConfig = Ember.OAuth2.config[this.get('providerId')];
        this.set('statePrefix', 'state');
        this.set('tokenPrefix', 'token');
        this.setProperties(this.providerConfig);
      },

      version: function() {
        return Ember.OAuth2.version;
      },

      uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                  return v.toString(16);
        });
      },

      now: function() {
        return Math.round(new Date().getTime()/1000.0);
      },

      requestObj: function() {
        var request = { 'response_type': 'token' };
        request.providerId = this.providerId;
        request.state = this.state;
        request.client_id = this.clientId;
        request.state = this.state;
        if (this.scope) request.scope = this.scope;
        return request;
      },

      authUri: function() {
        if (this.state === null) this.state = this.uuid();
        var uri = this.authBaseUri;
        uri += '?response_type=token' + 
            '&redirect_uri=' + encodeURIComponent(this.redirectUri) +
            '&client_id=' + encodeURIComponent(this.clientId) +
            '&state=' + encodeURIComponent(this.state);
        if (this.scope) uri += '&scope=' + encodeURIComponent(this.scope).replace('%20', '+');
        return uri;
      },  

      /*
       * Open authorize window if configuration is correct
       */
      authorize: function() {
        if (!this.providerId) throw new Error('No provider id given.');
        if (!this.clientId) throw new Error('No client id given.');
        if (!this.authBaseUri) throw new Error('No auth base uri given.');
        if (!this.redirectUri) throw new Error('No redirect uri given.');
        var authorizeUri = this.authUri();
        this.clearStates();
        this.saveState(this.state, this.requestObj());
        var dialog = window.open(authorizeUri, 'Authorize', 'height=600, width=450');
        if (window.focus) dialog.focus();
      },

      authSuccess: function(params) {
        return params.access_token;
      },

      /*
       * Token properties
       * providerId
       * expiresIn
       * scope
       * token
       *
       * params returned by callback
       */
      generateToken: function(params) {
        var token = {};
        token.provider_id = this.providerId;
        token.expires_in = this.expiresIn(params.expires_in);
        token.scope = this.scope;
        token.access_token = params.access_token;
        return token;     
      },

      expiresIn: function(expires) {
        return this.now() + parseInt(expires, 10);
      },

      /*
       * call on redirect from OAuth2 provider response
       */
      onRedirect: function(hash, callback) {
        var params = this.parseCallback(hash);
        if (this.authSuccess(params)) {
          var stateObj = this.getState(params.state);
          this.checkState(stateObj);
          this.saveToken(this.generateToken(params));
          this.onSuccess(stateObj);
        } else {
          this.onError(params);
        }
        if (callback && typeof(callback) === "function") {
          callback();
        }
      },

      /*
       * Check if the state returned from the OAuth2 server matches the saved state.
       */
      checkState: function(stateObj) {
        if (!stateObj) throw new Error("Could not find state.");
        if (stateObj.state !== this.state) throw new Error("State returned from the server did not match the local saved state.");
      },
      
      /*
       * Parse the callback function from the OAuth2 provider
       *
       * callback should have the following params if authentication is successful
       * state
       * access_token
       * token_type
       * expires_in 
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

      saveState: function(state, requestObj) {
        window.localStorage.setItem(this.statePrefix + '-' + state, JSON.stringify(requestObj));
      },

      /*
       * return the saved state and remove it from the localStoage.
       */ 
      getState: function(state) {
        var obj = JSON.parse(window.localStorage.getItem(this.statePrefix + '-'  + state));
        window.localStorage.removeItem(this.statePrefix + '-' + state);

        return obj;
      },

      // remove any extra states if they exist
      clearStates: function() {
        var regex = new RegExp( '^' + this.statePrefix + '-.*', 'g');

        for(var i = 0; i < window.localStorage.length; i++) {
          var name = window.localStorage.key(i);
          while (regex.exec(name)) {
            window.localStorage.removeItem(name);
          }
        }
      },

      /*
       * saveToken stores the token by the provider
       * expires : time that the token expires
       * providerId: the providerId
       * scopes: array of scopes
       */
      saveToken: function(token) {
        window.localStorage.setItem(this.tokenPrefix + '-' + this.providerId, JSON.stringify(token));
      },

      getToken: function() {
        var token = JSON.parse(window.localStorage.getItem( this.tokenPrefix + '-' + this.providerId));
        if (!token) return null;
        if (!token.access_token) return null;
        return token;
      },

      getAccessToken: function() {
        var token = this.getToken();
        if (!token) return null;
        return token.access_token;
      },

      accessTokenIsExpired: function() {
        var token = this.getToken();
        if (!token) return true;
        if (this.now() >= token.expires_in) {
          return true;
        } else {
          return false;
        }
      },

      expireAccessToken: function() {
        var token = this.getToken();
        if (!token) return null;
        token.expires_in = 0;
        this.saveToken(token);
      },

      onSuccess: function(params) {},
      onError: function() {}
    });
  }

  var VERSION = "0.2.2";
  Ember.OAuth2.version = VERSION;
  Ember.OAuth2.config = {};

})(this);
