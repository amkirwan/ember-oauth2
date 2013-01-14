describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'    
  });

  var authorizeUri;
  var callbackUri;
  beforeEach(function() {
    var authBaseUri = 'https://foobar.dev/oauth/authorize';
    var redirectUri = 'https://qux.dev/oauth/callback';
    var clientId = '12345';
    var scope = 'public';
    var state = '6789';
    Ember.OAuth2.config = {
      test_auth: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        scope: scope,
        state: state
      }
    };
    App.oauth = Ember.OAuth2.create(Ember.OAuth2.config.test_auth);
    authorizeUri = authBaseUri;
    authorizeUri += '?response_type=token' 
                 + '&redirect_uri=' + encodeURIComponent(redirectUri) 
                 + '&client_id=' + encodeURIComponent(clientId) 
                 + '&state=' + encodeURIComponent(state) 
                 + '&scope=' + encodeURIComponent(scope);

    callbackUri = redirectUri;
    callbackUri += '#access_token=' + ('12345abc')
                + '&token_type=' + 'Bearer' 
                + '&expires_in=' + '3600';
    callbackUriError = redirectUri;
  });

  afterEach(function() {
    authorizeUri = null;
  });

  describe("Create Namespaces and configure object", function() {
    it("should create a OAuth2 object", function() {
      expect(Ember.OAuth2).toBeDefined();
    });

    it("should create a configuration object for Ember.OAuth2", function() {
      expect(Ember.OAuth2.config).toBeDefined();
    });
  });

  describe("Errors when configuration is incomplete", function() {
    it("should require a clientId", function() {
      Ember.OAuth2.config.test_auth.clientId = null;
      App.oauth = Ember.OAuth2.create(Ember.OAuth2.config.test_auth);
      expect(function() {App.oauth.auth()}).toThrow(new Error("No client id given."));
    });

    it("should require a authorization base uri", function() {
      Ember.OAuth2.config.test_auth.authBaseUri = null;
      App.oauth = Ember.OAuth2.create(Ember.OAuth2.config.test_auth);
      expect(function() {App.oauth.auth()}).toThrow(new Error("No auth base uri given."));
    });

    it("should require a callback uri", function() {
      Ember.OAuth2.config.test_auth.redirectUri = null;
      App.oauth = Ember.OAuth2.create(Ember.OAuth2.config.test_auth);
      expect(function() {App.oauth.auth()}).toThrow(new Error("No redirect uri given."));
    });
  });

  describe("Generate OAuth2 providers url", function() {
    it("should create the url with the options", function() {
      expect(App.oauth.authUri()).toEqual(authorizeUri)
    });
  });

  describe("Handle the OAuth2 callback method", function() {
    describe("Parse the access token from the callback url", function() {
      it("should define a parseCallback function", function() {
        expect(Ember.OAuth2.parseCallback).toBeDefined();
      });

      it("should return the params from the callback url", function() {
        expect(Ember.OAuth2.parseCallback(callbackUri)).toEqual({ access_token : '12345abc', token_type : 'Bearer', expires_in : '3600' })
      });
    });

    describe("onRedirect", function() {
      it("should call onSuccess callback when access_token is definned in the callback", function() {
        var spy = sinon.spy(App.oauth, "onSuccess");
        App.oauth.onRedirect(callbackUri);
        expect(spy.called).toBeTruthy();
      });

      it("should call onError callback when access_token is not in the callback", function() {
        var spy = sinon.spy(App.oauth, "onError");
        App.oauth.onRedirect(callbackUriError);
        expect(spy.called).toBeTruthy();
      });
    });
  });

  describe("These methods need to be implemented by the OAuth2 application", function() {
    it("should define the onSuccess callback", function() {
      expect(App.oauth.onSuccess).toBeDefined();
    });

    it("should define the onError callback", function() {
      expect(App.oauth.onError).toBeDefined();
    });
  });
});
