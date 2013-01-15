describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'    
  });

  var authorizeUri;
  var callbackUri;
  var savedState;

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
                + '&expires_in=' + '3600'
                + '&state=' + state;
    callbackUriError = redirectUri;
    savedState = {
      response_type: 'token',
      state: state,
      client_id: clientId,
      scope: scope
    };
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
      expect(function() {App.oauth.authorize()}).toThrow(new Error("No client id given."));
    });

    it("should require a authorization base uri", function() {
      Ember.OAuth2.config.test_auth.authBaseUri = null;
      App.oauth = Ember.OAuth2.create(Ember.OAuth2.config.test_auth);
      expect(function() {App.oauth.authorize()}).toThrow(new Error("No auth base uri given."));
    });

    it("should require a callback uri", function() {
      Ember.OAuth2.config.test_auth.redirectUri = null;
      App.oauth = Ember.OAuth2.create(Ember.OAuth2.config.test_auth);
      expect(function() {App.oauth.authorize()}).toThrow(new Error("No redirect uri given."));
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
        expect(App.oauth.parseCallback).toBeDefined();
      });

      it("should return the params from the callback url", function() {
        expect(App.oauth.parseCallback(callbackUri)).toEqual({ access_token : '12345abc', token_type : 'Bearer', expires_in : '3600', state : '6789' })
      });
    });

    describe("onRedirect", function() {
      it("should call onSuccess callback when access_token is definned in the callback", function() {
        var spy = sinon.spy(App.oauth, "onSuccess");
        var stub = sinon.stub(App.oauth, 'checkState', function() { return true });
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

  describe("Check the state to make sure it is set", function() {
    it("should throw an error when there is no state set", function() {
      expect(function() {App.oauth.checkState(null)}).toThrow(new Error("Could not find state."));
    });

    it("should throw an Error when the states are not equal", function() {
      savedState.state = '12345';
      expect(function() {App.oauth.checkState(savedState)}).toThrow(new Error("State returned from the server did not match the local saved state."));
    });
  });

});
