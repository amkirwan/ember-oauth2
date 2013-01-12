describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'    
  });

  // beforeEach(function() {
  //   App.oauth = Ember.OAuth2.create();
  // });

  describe("Create Namespaces and configure object", function() {
    it("should create a OAuth2 object", function() {
      expect(Ember.OAuth2).toBeDefined();
    });

    it("should create a configuration object for Ember.OAuth2", function() {
      expect(Ember.OAuth2.configure).toBeDefined();
    });
  });

});
