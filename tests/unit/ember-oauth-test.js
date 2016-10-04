import Ember from 'ember';
import { moduleFor, test } from 'ember-qunit';
import sinon from 'sinon';


let responseType, clientId, authBaseUri, redirectUri, scopes;

moduleFor('service:ember-oauth2', 'Unit | Service | EmberOAuth2', {
  unit: true,
  beforeEach: function() {
    responseType = 'token';
    clientId = 'abcd';
    authBaseUri = 'https://foobar.dev/oauth/authorize';
    redirectUri = 'https://qux.dev/oauth/authorize/callback';
    scopes = 'public';
    // would be defined in the initializer of the app
    window.EmberENV['ember-oauth2'] = {
      model: 'user',
      test_auth: {
        clientId: clientId,
        authBaseUri: authBaseUri,
        redirectUri: redirectUri,
        scope: scopes
      }
    };
  }
});

test('EmberENV defined', function(assert) {
  assert.ok(window.EmberENV);
});

test('adds ember-oauth2 object to EmberENV', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.expect(2);
  assert.ok(window.EmberENV['ember-oauth2']);
  assert.equal(window.EmberENV['ember-oauth2'], service.get('config'));
});

test('checks the providerId is in the config', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.deepEqual(window.EmberENV['ember-oauth2']['test_auth'], service.get('config.test_auth'));
});

test('it sets the providerConfig', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.deepEqual(window.EmberENV['ember-oauth2']['test_auth'], service.get('providerConfig'));
});

test('throws an error if the providerId is not in the config', function(assert) {
  assert.throws(function() {
    this.subject({providerId: 'qux'});
  });
});

test('it returns the version', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.ok(service.VERSION);
});

test("base properties token configuration", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.ok(service.get('statePrefix'));
  assert.ok(service.get('tokenPrefix'));
  assert.ok(service.get('responseType'));
});

test("set properties from the providerConfig", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.ok(service.get('clientId'));
  assert.ok(service.get('authBaseUri'));
  assert.ok(service.get('redirectUri'));
});

test('#uuid returns a version 4 formatted uuid', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let re = /[\d\w]{8}-[\d\w]{4}-4[\d\w]{3}-[\d\w]{4}-[\d\w]{12}/;
  assert.ok(re.test(service.uuid()));
});

test('#now returns the time rounded to the closest second', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let stub = sinon.stub(Date.prototype, 'getTime', function() { return '1000'; });
  assert.equal(service.now(), 1);
  stub.reset();
});

// tests #stateKeyName
test('#statKeyName calls generateState if state empty', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'generateState');
  service.stateKeyName();
  assert.ok(spy.calledOnce);
});

test('#statKeyName returns the name for saving state to localstorage', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  service.set('state', '12345');
  assert.equal(service.stateKeyName(), 'state-12345');
});

// tests #generateState
test('#generateState creates a new state', function(assert) {
  assert.expect(3);
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'uuid');
  assert.notOk(service.get('state'));
  service.generateState();
  assert.ok(service.get('state'));
  assert.ok(spy.calledOnce);
});

// #expiresIn
test('#expiresIn returns when the token will expires', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let stub = sinon.stub(service, 'now', function() { return 1000; });
  assert.equal(service.expiresIn('3600'), 4600);
  stub.reset();
});


test('#saveState', function(assert) {
  assert.expect(2);
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'stateKeyName');
  let obj = {foo: 'bar'};
  service.saveState(obj);
  assert.ok(spy.calledOnce);
  assert.equal(window.localStorage.getItem(service.stateKeyName()), JSON.stringify(obj));
});

test('#removeState', function(assert) {
  assert.expect(4);
  let service = this.subject({providerId: 'test_auth'});

  window.localStorage.setItem('foobar', {});
  assert.ok(window.localStorage.getItem('foobar'));
  service.removeState('foobar'); 
  assert.notOk(window.localStorage.getItem('foobar'));

  // without stateName use saved stateKeyName;
  let obj = {foo: 'bar'};
  service.saveState(obj);
  assert.ok(window.localStorage.getItem(service.stateKeyName()));
  service.removeState();
  assert.notOk(window.localStorage.getItem(service.stateKeyName()));
});

// clearStates all states with prefix
test('remove any saved states with prefix', function(assert) {
  assert.expect(2);
  let service = this.subject({providerId: 'test_auth'});
  let obj = {foo: 'bar'};

  service.saveState(obj);
  assert.equal(window.localStorage.getItem(service.stateKeyName()), JSON.stringify(obj));

  service.clearStates();
  let count = 0;
  let regex = new RegExp( '^' + service.get('statePrefix') + '-.*', 'g');
  for(let i = 0, l = window.localStorage.length; i < l; i++) {
    let name = window.localStorage.key(i);
    if (name.match(regex)) {
      count += 1;
    }
  }
  assert.equal(count, 0);
});

// requestObj
test('#requestObj', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let obj = service.requestObj();
  
  assert.equal(obj.response_type, 'token');
  assert.equal(obj.providerId, 'test_auth');
  assert.equal(obj.clientId, 'abcd');
  assert.equal(obj.state, service.get('state'));
  assert.equal(obj.scope, 'public');
});

test('#authUri generates the authorization uri', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let uri = service.get('authBaseUri');
  uri += '?response_type=' + encodeURIComponent(responseType) +
               '&redirect_uri=' + encodeURIComponent(redirectUri) +
               '&client_id=' + encodeURIComponent(clientId) +
               '&state=' + encodeURIComponent(service.get('state')) +
               '&scope=' + encodeURIComponent(scopes);

  assert.equal(service.authUri(), uri);
});

// #authorize
test("#authorize success", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let spyClearState = sinon.spy(service, 'clearStates');
  let spySaveState = sinon.spy(service, 'saveState');
  let spyOpenWindow = sinon.spy(service, 'openWindow');
  let prom = service.authorize();
  assert.ok(prom.constructor.name === 'Promise');
  assert.ok(spyClearState.calledOnce);
  assert.ok(spySaveState.calledOnce);
  assert.ok(spyOpenWindow.calledOnce);
  // close the popup window
  prom.then(function(win) {
    win.close();
  });
});

// #authorize config errors
test("should require a providerId in the config", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  service.set('providerId', null);
  assert.throws(function() {
    service.authorize();
  }, /No provider id given./);
});

test("should require a clientId in the config", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  service.set('clientId', null);
  assert.throws(function() {
    service.authorize();
  }, /No client id given./);
});

test("should require an authBaseUri in the config", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  service.set('authBaseUri', null);
  assert.throws(function() {
    service.authorize();
  }, /No auth base uri given./);
});

test("should require a redirectUri in the config", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  service.set('redirectUri', null);
  assert.throws(function() {
    service.authorize();
  }, /No redirect uri given./);
});

test("should error when dialog does not open", function(assert) {
  var stub = sinon.stub(window, 'open').returns(false);
  let service = this.subject({providerId: 'test_auth'});
  let prom = service.authorize();
  prom.then(function(){},function(error) {
    assert.equal(error.message, 'Opening dialog login window failed.');
  });
  stub.reset();
});

// parse callback
test('#parseCallback', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let callbackUri = redirectUri;
  let state = service.generateState();
  callbackUri += '#access_token=' + ('12345abc') +
              '&token_type=' + 'Bearer' +
              '&expires_in=' + '3600' +
              '&state=' + state;

  assert.deepEqual(service.parseCallback(callbackUri), { access_token : '12345abc', token_type : 'Bearer', expires_in : '3600', state : state });
});

test('#authSuccess', function(assert) {
  assert.expect(3);
  let service = this.subject({providerId: 'test_auth'});
  let params = { access_token: '12345abc' };
  assert.ok(service.authSuccess(params));

  service.set('responseType', 'code');
  params = { code: 'abcdefg' };
  assert.ok(service.authSuccess(params));

  // response and type do not match
  params = { access_token: '12345abc' };
  service.set('responseType', 'code');
  assert.notOk(service.authSuccess(params));
});

test('#checkState', function(assert) {
  assert.expect(3);
  let service = this.subject({providerId: 'test_auth'});
  assert.notOk(service.checkState());

  let state = '12345abcd';
  service.generateState();
  assert.notOk(service.checkState(state));

  state = service.generateState();
  service.saveState(service.requestObj());
  assert.ok(service.checkState(state));
});

test('#readState', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  assert.notOk(service.readState());

  let data = {foo: 'bar'};
  service.generateState();
  service.saveState(data);
  assert.deepEqual(service.readState(), data);
});

test("#generateToken should generate the token that will be saved to the localStorage", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let stub = sinon.stub(service, 'expiresIn', function() { return 1000; });
  let params = {expires_in: 1000, scope: scopes, access_token: 'abcd12345'};
  let token = { provider_id: 'test_auth', expires_in: 1000, scope: scopes, access_token: 'abcd12345' };
 
  assert.deepEqual(service.generateToken(params), token);
  stub.reset();
});

test("#tokenKeyName returns tokenPrefx with providerId", function(assert) {
  // should return token-google
  let service = this.subject({providerId: 'test_auth'});
  assert.equal(service.tokenKeyName(), 'token-test_auth');
});

test("#saveToken should generated the token localStorage", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let token = { provider_id: 'test_auth', expires_in: 1000, scope: scopes, access_token: 'abcd12345' };
  assert.deepEqual(service.saveToken(token), window.localStorage.getItem('token-test_auth'));
});

// handle redirect
// success Implicit client-side flow
test('#handleRedirect - success', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'handleRedirect');
  let triggerSpy = sinon.spy(service, 'trigger');

  // create stubbed callback return
  let callbackUri = redirectUri;
  let state = service.generateState();
  service.saveState(service.requestObj({}));
  callbackUri += '#access_token=' + ('12345abc') +
              '&token_type=' + 'Bearer' +
              '&expires_in=' + '3600' +
              '&state=' + state;
 
  let parsed = { access_token : '12345abc', token_type : 'Bearer', expires_in : '3600', state : state };
  let stub = sinon.stub(service, 'parseCallback', function() { return parsed; });

  service.trigger('redirect', callbackUri);
  assert.ok(spy.calledOnce);
  assert.ok(triggerSpy.withArgs('success', parsed));
  stub.reset();
});

// failure Implicit client-side flow
// verifyToken failure
test('#handleRedirect - verifyToken failure', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'handleRedirect');
  let triggerSpy = sinon.spy(service, 'trigger');
  let verifyStub = sinon.stub(service, 'verifyToken', function() { return new Ember.RSVP.reject('error'); });

  // create stubbed callback return
  let callbackUri = redirectUri;
  let state = service.generateState();
  service.saveState(service.requestObj({}));
  callbackUri += '#access_token=' + ('12345abc') +
              '&token_type=' + 'Bearer' +
              '&expires_in=' + '3600' +
              '&state=' + state;
 
  let parsed = { access_token: '12345abc', token_type : 'Bearer', expires_in : '3600', state : state };
  let stub = sinon.stub(service, 'parseCallback', function() { return parsed; });

  service.trigger('redirect', callbackUri);
  assert.ok(spy.calledOnce);
  assert.ok(triggerSpy.withArgs('error', 'Error: authorization', parsed));
  stub.reset();
  verifyStub.reset();
});

// failure Implicit client-side flow
// state does not match failure
test('#handleRedirect - failure state does not match', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'handleRedirect');
  let triggerSpy = sinon.spy(service, 'trigger');

  // create stubbed callback return
  let callbackUri = redirectUri;
  let state = service.generateState();
  service.saveState(service.requestObj({}));
  callbackUri += '#access_token=' + ('12345abc') +
              '&token_type=' + 'Bearer' +
              '&expires_in=' + '3600' +
              '&state=' + '12345';
 
  let parsed = { access_token: '12345abc', token_type : 'Bearer', expires_in : '3600', state : state };
  let stub = sinon.stub(service, 'parseCallback', function() { return parsed; });

  service.trigger('redirect', callbackUri);
  assert.ok(spy.calledOnce);
  assert.ok(triggerSpy.withArgs('error', 'Error: authorization', parsed));
  stub.reset();
});

// failure Implicit client-side flow
// responseType is 'token' but response of the 
// callbackUri is 'code' instead of 'token'
test('#handleRedirect - tokenType is incorrect', function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let spy = sinon.spy(service, 'handleRedirect');
  let triggerSpy = sinon.spy(service, 'trigger');

  // create stubbed callback return
  let callbackUri = redirectUri;
  let state = service.generateState();
  service.saveState(service.requestObj({}));
  callbackUri += '#code=' + ('12345abc') +
              '&token_type=' + 'Bearer' +
              '&expires_in=' + '3600' +
              '&state=' + state;
 
  let parsed = { code: '12345abc', token_type : 'Bearer', expires_in : '3600', state : state };
  let stub = sinon.stub(service, 'parseCallback', function() { return parsed; });

  service.trigger('redirect', callbackUri);
  assert.ok(spy.calledOnce);
  assert.ok(triggerSpy.withArgs('error', 'Error: authorization', parsed));
  stub.reset();
});

// success authorization flow
test('#handleRedirect - success authorization flow', function(assert) {
  let service = this.subject({providerId: 'test_auth', responseType: 'code'});
  let spy = sinon.spy(service, 'handleRedirect');
  let triggerSpy = sinon.spy(service, 'trigger');

  // create stubbed callback return
  let callbackUri = redirectUri;
  let state = service.generateState();
  service.saveState(service.requestObj({}));
  callbackUri += '#code=' + ('12345abc') +
              '&token_type=' + 'Bearer' +
              '&expires_in=' + '3600' +
              '&state=' + state;
 
  let parsed = { code: '12345abc', token_type : 'Bearer', expires_in : '3600', state : state };
  let stub = sinon.stub(service, 'parseCallback', function() { return parsed; });

  service.trigger('redirect', callbackUri);
  assert.ok(spy.calledOnce);
  assert.ok(triggerSpy.withArgs('success', parsed.code));
  stub.reset();
});

test("#getToken should return the token from localStorage", function(assert) {
  assert.expect(3);
  let service = this.subject({providerId: 'test_auth' });
  let invalidToken = {foo: 'bar'};
  let validToken = {access_token: 'abcd', foo: 'bar'};
  window.localStorage.removeItem(service.tokenKeyName());
  assert.notOk(service.getToken());

  service.saveToken(invalidToken);
  assert.notOk(service.getToken());

  service.saveToken(validToken);
  assert.deepEqual(service.getToken(), validToken);
});

test("#getAccessToken should return the access_token from the localStorage", function(assert) {
  assert.expect(2);
  let service = this.subject({providerId: 'test_auth' });
  let token = {access_token: 'abcd', foo: 'bar'};
  window.localStorage.removeItem(service.tokenKeyName());
  assert.notOk(service.getAccessToken());

  service.saveToken(token);
  assert.deepEqual(service.getAccessToken(), token.access_token);
});

test("#accessTokenIsExpired", function(assert) {
  assert.expect(3);
  let service = this.subject({providerId: 'test_auth'});
  let expiredToken = { access_token: 'abcd', foo: 'bar', expires_in: 3600 };
  let validToken = { access_token: 'abcd', foo: 'bar', expires_in: 3600 };
  window.localStorage.removeItem(service.tokenKeyName());
  let stub = sinon.stub(service, 'now');
  stub.onCall(0).returns(4200);
  stub.onCall(1).returns(1);
  // no tokens
  assert.ok(service.accessTokenIsExpired());

  service.saveToken(expiredToken);
  assert.ok(service.accessTokenIsExpired());

  service.saveToken(validToken);
  assert.notOk(service.accessTokenIsExpired());
  stub.reset();
});

test("#expiresIn", function(assert) {
  let service = this.subject({providerId: 'test_auth'});
  let stub = sinon.stub(service, 'now', function() { return 1000; });
  
  assert.equal(service.expiresIn(3600), 4600);
  stub.reset();
});

test("#removeToken", function(assert) {
  assert.expect(2);
  let service = this.subject({providerId: 'test_auth'});
  window.localStorage.removeItem(service.tokenKeyName());
  let token = {access_token: 'abcd', foo: 'bar'};
  service.saveToken(token);  
  assert.equal(window.localStorage.getItem(service.tokenKeyName()), JSON.stringify(token));
  service.removeToken();
  assert.equal(window.localStorage.getItem(service.tokenKeyName()), undefined);
});
