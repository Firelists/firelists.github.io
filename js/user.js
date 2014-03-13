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
    var listRef = new Firebase(dbLists).child(this.get('model'));
    this.set('model', EmberFire.Object.create({ ref: listRef }));  
  }
});

window.App.User = EmberFire.Object.extend({
  saveList: function (list) {
    this.get('ref').child('lists').child(list.get('id')).set(list.get('id'));
  },
  removeList: function (listId) {
    this.get('lists').removeObject(listId);
  },
  hasList: function (listId) {
    return this.get('lists').contains(listId);
  }
});

window.App.AuthController = Ember.Controller.extend({
  authorized: false,
  currentUser: null,

  init: function () {
    this.client = new FirebaseSimpleLogin(dbRef, function (err, user) {
      if(err) { 
        this.set('authorized', false);
        this.set('currentUser', null);
        alert(err);
      }
      else if(user) {
        var userRef = new Firebase(dbUsers).child(user.uid);
        var properties = {
          ref: userRef,
          id: user.uid,
          username: user.provider === 'anonymous' ? user.id : 
                      user.provider === 'google' ? user.email : user.username,
          visited: new Date().getTime()
        };
        var controller = this;
        userRef.once('value', function (snapshot) {
          if(!snapshot.val()) {
            properties.created = new Date().getTime();
            properties.lists = EmberFire.Array.create({ref: userRef.child('lists')});
          }
          var user = App.User.create(properties);
          controller.set('currentUser', user);
          controller.set('authorized', true);
        });
      }
      else {
        this.set('authorized', false);
        this.set('currentUser', null);
      }
      Ember.$('.auth-cloak').show();
    }.bind(this));
  },
  loginAnonymously: function () { // Only for dev
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
