(function() {
  if (Ember.OAuth2 == undefined) {
    Ember.OAuth2 = Ember.Object.extend({

      calcState: function() {
        var rand = Math.random();
        var dateTime = new Date().getTime();
        return rand * dateTime;
      },

      requestObj: function() {
        var request = { 'response_type': 'token' };
        request.state = this.state;
        request.client_id = this.clientId;
        request.state = this.state;
        if (this.scope) request.scope = this.scope;
        return request;
      },

      authUri: function() {
        if (this.state == null) this.state = this.calcState();
        var uri = this.authBaseUri;
        uri += '?response_type=token' 
            + '&redirect_uri=' + encodeURIComponent(this.redirectUri)
            + '&client_id=' + encodeURIComponent(this.clientId)
            + '&state=' + encodeURIComponent(this.state);
        if (this.scope) uri += '&scope=' + encodeURIComponent(this.scope);
        return uri;
      },  

      authorize: function() {
        if (!this.clientId) throw new Error('No client id given.');
        if (!this.authBaseUri) throw new Error('No auth base uri given.');
        if (!this.redirectUri) throw new Error('No redirect uri given.');
        this.authorizeUri = this.authUri();
        this.saveState(this.state, this.requestObj());
        this.dialog = window.open(this.authorizeUri, 'Authorize', 'height=600, width=450');
        if (window.focus) this.dialog.focus();
      },

      authSuccess: function(params) {
        return params[this.access_token_name];
      },

      onRedirect: function(hash) {
        var params = this.parseCallback(hash);
        if (params['access_token']) {
          stateObj = this.getState(params.state);
          this.checkState(stateObj);
          this.onSuccess(stateObj);
        } else {
          this.onError(params);
        }
      },

      checkState: function(stateObj) {
        if (!stateObj) throw new Error("Could not find state.");
        if (stateObj.state != this.state) throw new Error("State returned from the server did not match the local saved state.");
      },
      
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

      getState: function(state) {
        var obj = JSON.parse(window.localStorage.getItem('state-' + state));
        window.localStorage.removeItem('state-' + state);
        return obj;
      },

      saveToken: function(provider, token) {
      },

      getToken: function(provider) {
      },

      onSuccess: function(params) {},
      onError: function() {}
    });
  }

  Ember.OAuth2.config = {}

})(this);
