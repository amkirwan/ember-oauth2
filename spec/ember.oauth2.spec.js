describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'    
  });

  var authorizeUri;
  var callbackUri;
  var savedState;

  var providerId, bauthBaseUri, redirectUri, clientId, scope, state;

  beforeEach(function() {
    providerId = 'test_auth';
    authBaseUri = 'https://foobar.dev/oauth/authorize';
    redirectUri = 'https://qux.dev/oauth/callback';
    clientId = '12345';
    scope = 'public';
    state = '6789';
    Ember.OAuth2.config = {
      test_auth: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        scope: scope,
        state: state
      }
    };
    App.oauth = Ember.OAuth2.create({providerId: providerId});
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
      provider_id: providerId,
      response_type: 'token',
      state: state,
      client_id: clientId,
      scope: scope
    };
  });

  afterEach(function() {
    authorizeUri = null;
  });

  describe("initialize", function() {
    it("should be initialized with the properties of provider", function() {
      expect(App.oauth.providerId).toEqual('test_auth');
      expect(App.oauth.clientId).toEqual(clientId);
      expect(App.oauth.authBaseUri).toEqual(authBaseUri);
      expect(App.oauth.redirectUri).toEqual(redirectUri);
      expect(App.oauth.scope).toEqual(scope);
      expect(App.oauth.state).toEqual(state);
    });
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
    it("should require a providerId", function() {
      App.oauth = Ember.OAuth2.create();
      expect(function() {App.oauth.authorize()}).toThrow(new Error('No provider id given.'));
    });

    it("should require a clientId", function() {
      Ember.OAuth2.config.test_auth.clientId = null;
      App.oauth = Ember.OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize()}).toThrow(new Error("No client id given."));
    });

    it("should require a authorization base uri", function() {
      Ember.OAuth2.config.test_auth.authBaseUri = null;
      App.oauth = Ember.OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize()}).toThrow(new Error("No auth base uri given."));
    });

    it("should require a callback uri", function() {
      Ember.OAuth2.config.test_auth.redirectUri = null;
      App.oauth = Ember.OAuth2.create({providerId: providerId});
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
        spy.reset();
      });

      it("should call onError callback when access_token is not in the callback", function() {
        var spy = sinon.spy(App.oauth, "onError");
        App.oauth.onRedirect(callbackUriError);
        expect(spy.called).toBeTruthy();
        spy.reset();
      });
    });

    it("should call the callback if defined", function() {
      var callback = sinon.spy();
      App.oauth.onRedirect(callbackUriError, callback);
      expect(callback.called).toBeTruthy();
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

  describe("localStorage state", function() {
    it("should save the state to localStorage", function() {
      var spy = sinon.spy(localStorage, 'setItem');
      App.oauth.saveState(state, savedState);
      expect(spy.called).toBeTruthy();
      spy.reset();
    });

    it("should return the localStorage by state", function() {
      App.oauth.saveState(state, savedState);
      expect(App.oauth.getState(state)).toEqual(savedState);
    });

    it("should remove the localStorage state after retreiving", function() {
      App.oauth.saveState(state, savedState);
      App.oauth.getState(state);
      expect(App.oauth.getState(state)).toEqual(null);
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

  describe("Handle the saving and getting the token", function() {
    var token;
    var spyExpires;
    beforeEach(function() {
      token = { provider_id: providerId, expires_in: '12345', scope: scope, access_token: '12345abc' };
      spyExpires = sinon.stub(App.oauth, 'expiresIn', function() { return '12345' });
      App.oauth.saveToken(token); 
    });

    afterEach(function() {
      spyExpires.reset();
    });

    it("should generate the token that will be saved to the localStorage", function() {
      var params = App.oauth.parseCallback(callbackUri);
      expect(App.oauth.generateToken(params, savedState)).toEqual(token);
    });

    it("should save the token to the localStorage", function() {
      var spy = sinon.spy(localStorage, 'getItem');
      expect(App.oauth.getToken()).toEqual(token);
      spy.reset();
    });

    it("should return the access_token from the localStorage", function() {
      expect(App.oauth.getAccessToken()).toEqual('12345abc');
    });

    it("access token is expired", function() {
      expect(App.oauth.accessTokenIsExpired()).toBeTruthy();
      spyExpires.reset();
    });

    it("access token is not expired", function() {
      spyExpires = sinon.stub(App.oauth, 'now', function() { return 5 });
      expect(App.oauth.accessTokenIsExpired()).toBeFalsy();
      spyExpires.reset();
    });

    it("expires the access token", function() {
      var new_time = App.oauth.now() + 10000
      token.expires_in = new_time
      App.oauth.saveToken(token); 
      expect(App.oauth.accessTokenIsExpired()).toBeFalsy();
      App.oauth.expireAccessToken();
      expect(App.oauth.accessTokenIsExpired()).toBeTruthy();
    });
  });

});
