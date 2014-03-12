var dbRoot = "https://firelists.firebaseio.com/";
var dbLists = dbRoot + "lists/";
var dbUsers = dbRoot + "users/";
var dbRef = new Firebase(dbRoot);

window.App = Ember.Application.create({
  ready: function () {
    this.register('main:auth', App.AuthController);
    this.inject('route', 'auth', 'main:auth');
    this.inject('controller', 'auth', 'main:auth');
  }
});

window.App.Router.map(function() {
  this.resource('list', { path: '/:list_id' });
  this.resource('about');
});

window.App.ApplicationController = Ember.Controller.extend({
  shouldShowLogin: false,
  
  actions: {
    loginUsingTwitter: function () {
      this.get('auth').loginUsingTwitter();
    },
    loginUsingGoogle: function () {
      this.get('auth').loginUsingGoogle();
    },
    loginUsingGithub: function () {
      this.get('auth').loginUsingGithub();
    },
    logout: function () {
      this.get('auth').logout();
    },
    toHome: function () {
      this.transitionTo('index');
    },
    showLogin: function () {
      this.set('shouldShowLogin', true);
    }
  }
});

window.App.IndexController = Ember.Controller.extend({
  newListName: '',

  actions: {
    newList: function () {
      var newListRef = new Firebase(dbLists).push();
      var user = this.get('auth').currentUser;

      var list = EmberFire.Object.create({ 
        ref: newListRef, 
        id: newListRef.name(),
        name: this.get('newListName'),
        created: new Date().getTime(),
        edited: new Date().getTime(),
        user: user ? user.id : '',
        items: {_type: 'array'},
        nextOrderNo: 0
      });
      if(user) {
        user.saveList(list);
      }
      this.set('newListName', '');
      this.transitionToRoute('list', list.id);
    }
  }
});
