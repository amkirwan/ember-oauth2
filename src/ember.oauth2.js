(function() {
  if (Ember.OAuth2 == undefined) {
    Ember.OAuth2 = Ember.Object.extend({

      calcState: function() {
        var rand = Math.random();
        var dateTime = new Date().getTime();
        return rand * dateTime;
      },

      authUri: function() {
        var uri = this.authBaseUri;
        uri += '?response_type=token' 
            + '&redirect_uri=' + encodeURIComponent(this.redirectUri)
            + '&client_id=' + encodeURIComponent(this.clientId); 
        if (this.state) uri += '&state=' + encodeURIComponent(this.state);
        if (this.scope) uri += '&scope=' + encodeURIComponent(this.scope);
        return uri;
      },  

      auth: function() {
        if (!this.clientId) throw new Error('No client id given.');
        if (!this.authBaseUri) throw new Error('No auth base uri given.');
        if (!this.redirectUri) throw new Error('No redirect uri given.');
      },

      authSuccess: function(params) {
        return params[this.access_token_name];
      },

      onRedirect: function(hash) {
        var params = parseHash(hash);
      },

      onSuccess: function() {},
      onError: function() {}
    });
  }

  Ember.OAuth2.config = {}

  Ember.OAuth2.parseCallback = function(locationHash) {
    var oauthParams = {}, queryString = locationHash.substring(1),
    regex = /([^#?&=]+)=([^&]*)/g, m;
    while (m = regex.exec(queryString)) {
      oauthParams[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
    }
    return oauthParams;
  }

})(this);
