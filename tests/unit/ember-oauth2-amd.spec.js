import sinon from 'sinon';

describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'
  });

  var authorizeUri;
  var callbackUri;
  var savedState;

  var providerId, authBaseUri, redirectUri, clientId, scope, state;

  var OAuth2;

  beforeEach(function() {
    providerId = 'test_auth';
    authBaseUri = 'https://foobar.dev/oauth/authorize';
    redirectUri = 'https://qux.dev/oauth/callback';
    clientId = '12345';
    scope = 'public';
    state = '12345';
    
    window.EmberENV = {};
    window.ENV = window.ENV || {};
    window.ENV['ember-oauth2'] = {
      test_auth: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        scope: scope,
        state: state
      },
      test_auth_code: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        responseType: 'code',
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

    OAuth2 = require('ember-oauth2')['default'];

    // setup test_auth
    App.oauth = OAuth2.create({providerId: providerId});

    // setup test_auth_config
    App.oauth_auth_config = OAuth2.create({providerId: 'test_auth_config'});

    // setup test_auth_code
    App.oauth_auth_code = OAuth2.create({providerId: 'test_auth_code'});

    callbackUri = redirectUri;
    callbackUri += '#access_token=' + ('12345abc') +
                '&token_type=' + 'Bearer' +
                '&expires_in=' + '3600' +
                '&state=' + state;

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

  /* config test */
  describe("ENV['ember-oauth2'] namespace should exist", function() {
    it("should create a ENV object", function() {
      expect(window.ENV).toBeDefined();
    });

    it("should create a ENV['ember-oauth2] ", function() {
      expect(window.ENV['ember-oauth2']).toBeDefined();
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
      expect(App.oauth.responseType).toEqual('token');
      expect(App.oauth.statePrefix).toEqual('state');
      expect(App.oauth.tokenPrefix).toEqual('token');
      expect(App.oauth.config).toEqual(window.ENV['ember-oauth2']);
      expect(App.oauth.providerConfig).toEqual(window.ENV['ember-oauth2']['test_auth']);
    });

    it("should set a custom state prefix", function() {
      expect(App.oauth_auth_config.statePrefix).toEqual('foo');
    });

    it("should set a custom token prefix", function() {
      expect(App.oauth_auth_config.tokenPrefix).toEqual('bar');
    });

    it("set the responseType to 'code'", function() {
      expect(App.oauth_auth_code.responseType).toEqual('code');
    });
  });

  // config errors
  describe("Errors when configuration is incomplete", function() {
    it("throws an error when there is no configuration", function() {
      window.ENV = undefined;
      expect(function() {OAuth2.create();}).toThrow(new Error('Cannot find the ember-oauth2 config.'));
    });

    it("should require a providerId in the config", function() {
      expect(function() {OAuth2.create({providerId: 'noProviderIdWithName'});}).toThrow(new Error("Cannot find the providerId: 'noProviderIdWithName' in the config."));
    });

    it("should require a clientId", function() {
      window.ENV['ember-oauth2'].test_auth.clientId = null;
      App.oauth = OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize();}).toThrow(new Error("No client id given."));
    });

    it("should require a authorization base uri", function() {
      window.ENV['ember-oauth2'].test_auth.authBaseUri = null;
      App.oauth = OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize();}).toThrow(new Error("No auth base uri given."));
    });

    it("should require a callback uri", function() {
      window.ENV['ember-oauth2'].test_auth.redirectUri = null;
      App.oauth = OAuth2.create({providerId: providerId});
      expect(function() {App.oauth.authorize();}).toThrow(new Error("No redirect uri given."));
    });
  });

  // dialog window
  describe("Dialog window returns an Ember.RSVP.Promise", function() {
    var promise;
    var errorMessage;
    beforeEach(function() {
      errorMessage = 'error message.';
      App.oauth = OAuth2.create({providerId: providerId});
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

    it("should error when dialog does not open", function(done) {
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

  // generate oauth2 url 
  describe("Generate OAuth2 providers url", function() {
    describe("Implicit Grant authorize uri", function() {
      beforeEach(function() {
        authorizeUri = authBaseUri;
        authorizeUri += '?response_type=' + encodeURIComponent(App.oauth.responseType) +
                     '&redirect_uri=' + encodeURIComponent(redirectUri) +
                     '&client_id=' + encodeURIComponent(clientId) +
                     '&state=' + encodeURIComponent(state) +
                     '&scope=' + encodeURIComponent(scope);
      });

      it("should create the url with the options", function() {
        expect(App.oauth.authUri()).toEqual(authorizeUri);
      });
    });
    
    describe("Authorization Grant authorize uri", function() {
      beforeEach(function() {
        authorizeUri = authBaseUri;
        authorizeUri += '?response_type=' + encodeURIComponent(App.oauth_auth_code.responseType) +
                     '&redirect_uri=' + encodeURIComponent(redirectUri) +
                     '&client_id=' + encodeURIComponent(clientId) +
                     '&state=' + encodeURIComponent(state) +
                     '&scope=' + encodeURIComponent(scope);
      });

      it("should create the url with the options", function() {
        expect(App.oauth_auth_code.authUri()).toEqual(authorizeUri);
      });
    });
  });

  describe("handleRedirect", function() {
    // implicit grant flow
    describe("Implicit grant", function() {
      describe("parse the access token from the callback url", function() {
        it("should return the params from the callback url", function() {
          expect(App.oauth.parseCallback(callbackUri)).toEqual({ access_token : '12345abc', token_type : 'Bearer', expires_in : '3600', state : '12345' });
        });
      });

      describe("redirect", function() {
        it("should checkState, verify the token and trigger success", function(done) {
          var callback = sinon.spy();
          App.oauth.on('success', callback);
          var saveToken = sinon.spy(App.oauth, "saveToken");
          var stub = sinon.stub(App.oauth, 'checkState', function() { return true; });

          App.oauth.trigger('redirect', callbackUri);

          expect(saveToken.called).toBeTruthy();
          window.setTimeout(function() {
            expect(callback.called).toBeTruthy();
            stub.reset();
            done();
          }, 250);
        });
      });

      describe("errors", function() {
        var callback;

        beforeEach(function() {
          callback = sinon.spy();
          App.oauth.on('error', callback);
          App.oauth.saveState(savedState);
        });

        afterEach(function() {
          callback.reset();
        });

        it("should trigger error when the response type of access_token is returned but EmberOAuth2 is expecting code", function() {
          var callbackUriError = redirectUri + '#access_token=' + ('12345abc') + 
                                               '&token_type=' + 'Bearer' + 
                                               '&expires_in=' + '3600' + 
                                               '&state=' + state;

          App.oauth.set('responseType', 'code');

          App.oauth.trigger('redirect', callbackUri);
          expect(callback.called).toBeTruthy();
        });

        it("should trigger error when the states do not match", function() {
          var callbackUriError = redirectUri + '#access_token=' + ('12345abc') + 
                                               '&token_type=' + 'Bearer' + 
                                               '&expires_in=' + '3600' + 
                                               '&state=' + 'error';

          App.oauth.trigger('redirect', callbackUriError);
          expect(callback.called).toBeTruthy();
        });

        it("should trigger error when access_token is not in the callback", function() {
          var callbackUriError = redirectUri + '#access_token=' +
                                               '&token_type=' + 'Bearer' + 
                                               '&expires_in=' + '3600' + 
                                               '&state=' + state;

          App.oauth.trigger('redirect', callbackUriError);
          expect(callback.called).toBeTruthy();
        });

        it("should trigger error when verifyToken rejects", function(done) {
          var removeToken = sinon.spy(App.oauth, "removeToken");
          App.oauth.verifyToken = function() { return new Ember.RSVP.reject('error'); };

          App.oauth.trigger('redirect', callbackUri);

          window.setTimeout(function() {
            expect(removeToken.called).toBeTruthy();
            expect(callback.called).toBeTruthy();
            done();
          }, 250);
        });
      });
    });

    describe("Authorization Grant", function() {
      beforeEach(function() {
        App.oauth.set('responseType', 'code');
        callbackUri = redirectUri + '#code=12345abcd&state=12345';
      }); 

      describe("parse the code and state from the callback url", function() {
        it("should return the params from the callback url", function() {
          expect(App.oauth.parseCallback(callbackUri)).toEqual({ code: '12345abcd', state: state });
        });
      });

      describe("redirect", function() {
        it("should checkState and trigger success", function() {
          var callback = sinon.spy();
          App.oauth.on('success', callback);
          var stub = sinon.stub(App.oauth, 'checkState', function() { return true; });

          App.oauth.trigger('redirect', callbackUri);

          expect(callback.called).toBeTruthy();
          stub.reset();
          callback.reset();
        });

        describe("errors", function() {
          var callback;
          beforeEach(function() {
            callback = sinon.spy();
            App.oauth.on('error', callback);
            App.oauth.saveState(savedState);
          });

          afterEach(function() {
            callback.reset();
          });

          it("should trigger error when the states do not match", function() {
            var callbackUriError = redirectUri + '#code=12345abcd&state=error';

            App.oauth.trigger('redirect', callbackUriError);
            expect(callback.called).toBeTruthy();
          });

          it("should trigger error when code not in the callback", function() {
            var callbackUriError = redirectUri + '#token=12345abcd' + '&state=' + state;

            App.oauth.trigger('redirect', callbackUriError);
            expect(callback.called).toBeTruthy();
          });

          it("should trigger error when the response type of code is returned but EmberOAuth2 is expecting a token ", function() {
            App.oauth.set('responseType', 'token');

            App.oauth.trigger('redirect', callbackUri);
            expect(callback.called).toBeTruthy();
          });
        });
      });
    });

    describe("Redirect callback", function() {
      it("should call the callback if defined", function() {
        var callback = sinon.spy();
        App.oauth.trigger('redirect', callbackUri, callback);
        expect(callback.called).toBeTruthy();
      });
    });
  });

  //gnerateState
  describe("generateState", function() {
    it("returns a new state", function() { 
      var stub = sinon.stub(App.oauth, 'uuid', function() { return '12345'; });

      var state = App.oauth.generateState();
      expect(state).toEqual('12345');
      stub.reset();
    });

    it("returns the state if one is already set on the oauth2 object", function() {
      App.oauth.set('state', 'abcdefg');
      var state = App.oauth.generateState();
      expect(state).toEqual('abcdefg');
    });
  });

  // saving and removing state to localStorage
  describe("localStorage state", function() {
    it("should save the state to localStorage", function() {
      var oldSetItem = window.localStorage.setItem;
      window.localStorage.setItem = function() { return true; };

      var spy = sinon.spy(localStorage, 'setItem');
      App.oauth.saveState(savedState);
      expect(spy.called).toBeTruthy();
      spy.restore();

      window.localStorage.setItem = oldSetItem;
    });

    it("reads the localStorage by state and does not remove it", function() {
      App.oauth.saveState(savedState);
      expect(App.oauth.readState()).toEqual(savedState);
      expect(App.oauth.readState()).toEqual(savedState);
    });

    it("returns the localStorage by state", function() {
      App.oauth.saveState(savedState);
      expect(App.oauth.getState()).toEqual(savedState);
    });

    it("returns null if there is no state object in the localStorage", function() {
      expect(App.oauth.getState()).toEqual(null);
    });

    it("should remove the localStorage state after retreiving", function() {
      App.oauth.saveState(savedState);
      App.oauth.getState();
      expect(App.oauth.getState()).toEqual(null);
    });

    it("should remove any saved states", function() {
      App.oauth.saveState(savedState);

      var newState = "99999";
      var newSavedState = $.extend(true, {}, savedState);
      newSavedState.state = newState;
      App.oauth.saveState(newSavedState);

      App.oauth.clearStates();
      expect(App.oauth.getState()).toEqual(null);
    });
  });

  // checkState checks that the state returned by the OAuth server is the same as the one sent
  describe("Check the state to make sure it is set", function() {
    it("should return false when there is no state set", function() {
      expect(App.oauth.checkState(null)).toBeFalsy();
    });

    it("should return false when the states are not equal", function() {
      App.oauth.saveState(savedState);
      var badState = '999999';
      expect(App.oauth.checkState(badState)).toBeFalsy();
    });

    it("should not throw an Error when the states are equal", function() {
      App.oauth.saveState(savedState);

      expect(App.oauth.checkState(savedState.state)).toBeTruthy();
    });
  });

  describe("verify the token wth the endpoint to mitigate the confused deputy", function() {
    it("default implimentation returns true", function() {
      expect(function() {App.oauth.verifyToken().then(function(value) { return value; }); }).toBeTruthy();
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
      var oldGetItem = window.localStorage.getItem;
      window.localStorage.getItem = function() { return JSON.stringify(token); };

      var spy = sinon.spy(localStorage, 'getItem');
      expect(App.oauth.getToken()).toEqual(token);
      spy.reset();

      window.localStorage.getItem = oldGetItem;
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

});
