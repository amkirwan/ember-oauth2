(function() {
  if (Ember.OAuth2 == undefined) {
    Ember.OAuth2 = Ember.Object.extend({

      init: function() {
        this._super();
        this.providerConfig = Ember.OAuth2.config[this.providerId];
        this.setProperties(this.providerConfig);
      },

      uuid: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
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
        if (this.state == null) this.state = this.uuid();
        var uri = this.authBaseUri;
        uri += '?response_type=token' 
            + '&redirect_uri=' + encodeURIComponent(this.redirectUri)
            + '&client_id=' + encodeURIComponent(this.clientId)
            + '&state=' + encodeURIComponent(this.state);
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
        this.authorizeUri = this.authUri();
        this.saveState(this.state, this.requestObj());
        this.dialog = window.open(this.authorizeUri, 'Authorize', 'height=600, width=450');
        if (window.focus) this.dialog.focus();
      },

      authSuccess: function(params) {
        return params['access_token'];
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
        var token = {}
        token.provider_id = this.providerId;
        token.expires_in = this.expiresIn(params.expires_in);
        token.scope = this.scope;
        token.access_token = params.access_token;
        return token;     
      },

      expiresIn: function(expires) {
        return this.now() + parseInt(expires);
      },

      /*
       * call on redirect from OAuth2 provider response
       */
      onRedirect: function(hash, callback) {
        var params = this.parseCallback(hash);
        if (this.authSuccess(params)) {
          stateObj = this.getState(params.state);
          this.checkState(stateObj);
          this.saveToken(this.generateToken(params));
          this.onSuccess(stateObj);
        } else {
          this.onError(params);
        }
        if (callback && typeof(callback) == "function") {
          callback();
        }
      },

      /*
       * Check if the state returned from the OAuth2 server matches the saved state.
       */
      checkState: function(stateObj) {
        if (!stateObj) throw new Error("Could not find state.");
        if (stateObj.state != this.state) throw new Error("State returned from the server did not match the local saved state.");
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
        var oauthParams = {}, queryString = locationHash.substring(1),
        regex = /([^#?&=]+)=([^&]*)/g, m;
        while (m = regex.exec(queryString)) {
          oauthParams[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
        }
        return oauthParams;
      },

      saveState: function(state, requestObj) {
        window.localStorage.setItem('state-' + this.state, JSON.stringify(requestObj));
      },

      /*
       * return the saved state and remove it from the localStoage.
       */ 
      getState: function(state) {
        var obj = JSON.parse(window.localStorage.getItem('state-' + state));
        window.localStorage.removeItem('state-' + state);
        return obj;
      },

      /*
       * saveToken stores the token by the provider
       * expires : time that the token expires
       * providerId: the providerId
       * scopes: array of scopes
       */
      saveToken: function(token) {
        window.localStorage.setItem('token-' + this.providerId, JSON.stringify(token));
      },

      getToken: function() {
        var token = JSON.parse(window.localStorage.getItem('token-' + this.providerId));
        if (!token) return null;
        if (!token['access_token']) return null;
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

  Ember.OAuth2.config = {}

})(this);
