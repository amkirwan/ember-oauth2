(function() {
  if (Ember.OAuth2 == undefined) {
    Ember.OAuth2 = Ember.Object.extend({
      calcState: function() {
        var rand = Math.random();
        var dateTime = new Date().getTime();
        return rand * dateTime;
      },

      authUri: function() {
        var url = this.authBaseUri + '?response_type=token' + '&redirect_uri=' + this.redirectUri + '&client_id=' + this.clientId; 
        if (this.state) url += '&state=' + this.state;
        if (this.scope) url += '&scope=' + this.scope;
        return url;
      },  

      auth: function() {
        if (!this.clientId) throw new Error('No client id given.');
        if (!this.authBaseUri) throw new Error('No auth base uri given.');
        if (!this.redirectUri) throw new Error('No redirect uri given.');
      }
    });
  }

  Ember.OAuth2.config = {}



})(this);
