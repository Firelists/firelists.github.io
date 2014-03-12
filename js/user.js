window.App.MyListsController = Ember.ArrayController.extend({
  itemController: 'savedList',
  sortAscending: true,

  actions: {
    removeSavedList: function (list) {
      this.get('model').removeObject(list.get('id'));
    },
    gotoList: function (list) {
      this.transitionToRoute('list', list.get('id'));
    }
  }
});

window.App.SavedListController = Ember.ObjectController.extend({
  init: function () {
    var listRef = new Firebase(dbLists + this.get('model'));
    this.set('model', EmberFire.Object.create({ ref: listRef }));  
  }
});

window.App.User = EmberFire.Object.extend({
  saveList: function (list) {
    this.get('ref').child('/lists/' + list.get('id')).set(list.get('id'));
  }
});

window.App.AuthController = Ember.Controller.extend({
  authorized: false,
  currentUser: null,
  lists: null,

  whatever: function () {
    alert('here');
  }.property('currentUser.lists'),

  init: function () {
    this.client = new FirebaseSimpleLogin(dbRef, function (err, user) {
      if(err) { 
        alert(err);
      }
      else if(user) {
        var userRef = new Firebase(dbUsers + "/" + user.uid);
        var properties = {
          ref: userRef,
          id: user.uid,
          username: user.provider === 'anonymous' ? user.id : 
                      user.provider === 'google' ? user.email : user.username
        };
        var controller = this;
        userRef.once('value', function (snapshot) {
          if(!snapshot.val()) {
            properties.created = new Date().getTime();
          }
          var user = App.User.create(properties);
          controller.set('currentUser', user);
          controller.get('currentUser').set('visited', new Date().getTime());
          controller.set('authorized', true);
          controller.set('lists', EmberFire.Array.create({ref: user.get('ref').child('/lists')}));
        });
      }
      else {
        this.set('authorized', false);
      }
      Ember.$('.auth-cloak').show();
    }.bind(this));
  },
  loginAnonymously: function () {
    this.client.login('anonymous');
  },
  loginUsingTwitter: function () {
    this.client.login('twitter', { rememberMe: true });
  },
  loginUsingGithub: function () {
    this.client.login('github', { rememberMe: true });
  },
  loginUsingGoogle: function () {
    this.client.login('google', { rememberMe: true });
  },
  logout: function () {
    this.client.logout();
  }
});
