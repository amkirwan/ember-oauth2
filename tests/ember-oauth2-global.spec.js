describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'
  });

  var authorizeUri;
  var callbackUri;
  var savedState;

  var providerId, authBaseUri, callbackUriError, redirectUri, clientId, scope, state;

  beforeEach(function() {
    providerId = 'test_auth';
    authBaseUri = 'https://foobar.dev/oauth/authorize';
    redirectUri = 'https://qux.dev/oauth/callback';
    clientId = '12345';
    scope = 'public';
    state = '12345';
    
    // Using old config using Ember.OAuth2 global instead of ENV
    
    Ember.OAuth2.config = {
      test_auth: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        scope: scope,
        state: state
      },
      test_auth_config: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        scope: scope,
        state: state,
        statePrefix: 'foo',
        tokenPrefix: 'bar'
      }
    };
    
    App.oauth = window.Ember.OAuth2.create({providerId: providerId});
    App.oauth_auth_config = Ember.OAuth2.create({providerId: 'test_auth_config'});
    authorizeUri = authBaseUri;
    authorizeUri += '?response_type=token' +
                 '&redirect_uri=' + encodeURIComponent(redirectUri) +
                 '&client_id=' + encodeURIComponent(clientId) +
                 '&state=' + encodeURIComponent(state) +
                 '&scope=' + encodeURIComponent(scope);

    callbackUri = redirectUri;
    callbackUri += '#access_token=' + ('12345abc') +
                '&token_type=' + 'Bearer' +
                '&expires_in=' + '3600' +
                '&state=' + state;
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

  var once = function(fn) {
    var returnValue, called = false;
    return function () {
      if (!called) {
          called = true;
          returnValue = fn.apply(this, arguments);
      }
      return returnValue;
    };
  };

  describe("Create namespaces and configure object", function() {
    it("should create a object", function() {
      expect(Ember.OAuth2).toBeDefined();
    });

    it("should define Ember.OAuth2.config object", function() {
      expect(Ember.OAuth2.config).toBeDefined();
    });
  });

describe("initialize", function() {
    it("should be initialized with the properties of provider", function() {
      expect(App.oauth.providerId).toEqual('test_auth');
      expect(App.oauth.clientId).toEqual(clientId);
      expect(App.oauth.authBaseUri).toEqual(authBaseUri);
      expect(App.oauth.redirectUri).toEqual(redirectUri);
      expect(App.oauth.scope).toEqual(scope);
      expect(App.oauth.state).toEqual(state);
      expect(App.oauth.statePrefix).toEqual('state');
      expect(App.oauth.tokenPrefix).toEqual('token');
    });

    it("should set a custom state prefix", function() {
      expect(App.oauth_auth_config.statePrefix).toEqual('foo');
    });

    it("should set a custom token prefix", function() {
      expect(App.oauth_auth_config.tokenPrefix).toEqual('bar');
    });
  });

  describe("get the localstorage items", function() {
    it('returns the state', function() {
      expect(App.oauth.stateKeyName()).toEqual('state-12345');
    });

    it('returns the provider', function() {
      expect(App.oauth.tokenKeyName()).toEqual('token-test_auth');
    });
  });

  describe("Errors when configuration is incomplete", function() {
    it("throws an error when there is no configuration", function() {
      Ember.OAuth2.config = undefined;
      expect(function() {Ember.OAuth2.create();}).toThrow(new Error('Cannot find the ember-oauth2 config.'));
    });

    it("should require a providerId in the config", function() {
      expect(function() {Ember.OAuth2.create({providerId: 'noProviderIdWithName'});}).toThrow(new Error("Cannot find the providerId: 'noProviderIdWithName' in the config."));
    });

    it("should require a clientId", function() {
      Ember.OAuth2.config.test_auth.clientId = null;
      App.oauth = Ember.OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize();}).toThrow(new Error("No client id given."));
    });

    it("should require a authorization base uri", function() {
      Ember.OAuth2.config.test_auth.authBaseUri = null;
      App.oauth = Ember.OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize();}).toThrow(new Error("No auth base uri given."));
    });

    it("should require a callback uri", function() {
      Ember.OAuth2.config.test_auth.redirectUri = null;
      App.oauth = Ember.OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize();}).toThrow(new Error("No redirect uri given."));
    });
  });

  describe("Dialog window returns an Ember.RSVP.Promise", function() {
    var promise;
    var errorMessage;
    beforeEach(function() {
      errorMessage = 'error message.';
      App.oauth = Ember.OAuth2.create({providerId: providerId});
    });

    it("should resolve on success", function(done){
      promise = App.oauth.openWindow();
      promise.then(function(dialog) {
        expect(dialog).toBeDefined();
        dialog.close();
      }, function(error) {
        expect(error.message).not.toBeDefined();
      }).finally(done);
    });

    it("should error when the dialog does not open", function(done) {
      var stub = sinon.stub(window, 'open').returns(false);
      promise = App.oauth.openWindow();
      promise.then(function(dialog) {
        expect(dialog).not.toBeDefined();
      }, function(error) {
        expect(error.message).toEqual('Opening dialog login window failed.');
      }).finally(done);
      stub.reset();
    });
  });

  describe("Generate OAuth2 providers url", function() {
    it("should create the url with the options", function() {
      expect(App.oauth.authUri()).toEqual(authorizeUri);
    });
  });

  describe("Handle the OAuth2 callback method", function() {
    describe("Parse the access token from the callback url", function() {
      it("should define a parseCallback function", function() {
        expect(App.oauth.parseCallback).toBeDefined();
      });

      it("should return the params from the callback url", function() {
        expect(App.oauth.parseCallback(callbackUri)).toEqual({ access_token : '12345abc', token_type : 'Bearer', expires_in : '3600', state : '12345' });
      });
    });

    describe("onRedirect", function() {
      it("should call onSuccess callback when access_token is definned in the callback", function() {
        App.oauth.onSuccess = function(){};
        var spy = sinon.spy(App.oauth, "onSuccess");
        var stub = sinon.stub(App.oauth, 'checkState', function() { return true; });
        App.oauth.onRedirect(callbackUri);
        expect(spy.called).toBeTruthy();
        spy.reset();
      });

      it("should call onError callback when access_token is not in the callback", function() {
        App.oauth.onError = function(){};
        var spy = sinon.spy(App.oauth, "onError");
        App.oauth.onRedirect(callbackUriError);
        expect(spy.called).toBeTruthy();
        spy.reset();
      });
    });

    describe("trigger('redirect')", function() {
      it("should trigger success event when access_token is defined in the callback", function() {
        var spy = sinon.spy();
        App.oauth.on('success', once(spy));
        var stub = sinon.stub(App.oauth, 'checkState', function() { return true; });
        App.oauth.trigger('redirect', callbackUri);
        expect(spy.called).toBeTruthy();
        spy.reset();
      });

      it("should trigger error event when access_token is not in the callback", function() {
        var spy = sinon.spy();
        App.oauth.on('error', once(spy));
        App.oauth.trigger('redirect', callbackUriError);
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

  // saving and removing state to localStorage
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

    it("should remove any saved states", function() {
      App.oauth.saveState(state, savedState);

      var newState = "99999";
      var newSavedState = $.extend(true, {}, savedState);
      newSavedState.state = newState;
      App.oauth.saveState(newState, newSavedState);

      App.oauth.clearStates();
      expect(App.oauth.getState(state)).toEqual(null);
      expect(App.oauth.getState(newState)).toEqual(null);
    });
  });

  // checkState checks that the state returned by the OAuth server is the same as the one sent
  describe("Check the state to make sure it is set", function() {
    it("should throw an error when there is no state set", function() {
      expect(function() {App.oauth.checkState(null);}).toThrow(new Error("Could not find state."));
    });

    it("should throw an Error when the states are not equal", function() {
      savedState.state = 'abcdefg';
      expect(function() {App.oauth.checkState(savedState);}).toThrow(new Error("State returned from the server did not match the local saved state."));
    });

    it("should not throw an Error when the states are equal", function() {
      expect(function() {App.oauth.checkState(savedState);}).toBeTruthy();
    });
  });

  describe("Handle the saving and getting the token", function() {
    var token;
    var spyExpires;
    beforeEach(function() {
      token = { provider_id: providerId, expires_in: '12345', scope: scope, access_token: '12345abc' };
      spyExpires = sinon.stub(App.oauth, 'expiresIn', function() { return '12345'; });
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
      spyExpires = sinon.stub(App.oauth, 'now', function() { return 5; });
      expect(App.oauth.accessTokenIsExpired()).toBeFalsy();
      spyExpires.reset();
    });

    it("expires the access token", function() {
      var new_time = App.oauth.now() + 10000;
      token.expires_in = new_time;
      App.oauth.saveToken(token);
      expect(App.oauth.accessTokenIsExpired()).toBeFalsy();
      App.oauth.expireAccessToken();
      expect(App.oauth.accessTokenIsExpired()).toBeTruthy();
    });
  });

  describe("Remove the state from localstorage", function() {
    beforeEach(function() {
      App.oauth.saveState(state, savedState);
    });

    it("removes the state", function() {
      App.oauth.removeState();
      expect(App.oauth.getState(state)).toEqual(null);
    });
  });

  describe("Remove the token from localstorage", function() {
    var token;
    beforeEach(function() {
      token = { provider_id: providerId, expires_in: '12345', scope: scope, access_token: '12345abc' };
      App.oauth.saveToken(token);
    });

    it('removes the toke from localstorage', function() {
      expect(App.oauth.getToken()).toEqual(token);
      App.oauth.removeToken();
      expect(App.oauth.getToken()).toEqual(null);
    });


  });
});
