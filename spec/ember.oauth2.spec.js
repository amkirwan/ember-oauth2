describe("ember-oauth2", function() {

  window.App = Ember.Application.create({
    NAME: 'test-app'    
  });

  // beforeEach(function() {
  //   App.oauth = Ember.OAuth2.create();
  // });

  describe("Ember OAuth2 Object", function() {
    it("should create a OAuth2 object", function() {
      expect(Ember.OAuth2).toBeDefined();
    });
  });

  describe("Ember OAuth2", function() {
    it("should create a configuration object for Ember.OAuth2", function() {
      expect(Ember.OAuth2.configure).toBeDefined();
    });
  });

});
