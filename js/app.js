var dbRoot = "https://firelists.firebaseio.com/";
var dbLists = dbRoot + "lists/";
var dbUsers = dbRoot + "users/";
var dbRef = new Firebase(dbRoot);

App = Ember.Application.create({
  ready: function () {
    this.register('main:auth', App.AuthController);
    this.inject('route', 'auth', 'main:auth');
    this.inject('controller', 'auth', 'main:auth');
  }
});

App.Router.map(function() {
  this.resource('list', { path: '/:list_id' });
  this.resource('about');
});

App.ApplicationController = Ember.Controller.extend({
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
      alert('here');
      this.set('shouldShowLogin', true);
    }
  }
});

App.IndexController = Ember.Controller.extend({
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

App.ListRoute = Ember.Route.extend({
  model: function (params) {
    return new Firebase(dbLists + params.list_id);
  },
  setupController: function (controller, dbRef) {
    var route = this;
    dbRef.once('value', function (snapshot) {
      if(snapshot.val()) {
        var list = EmberFire.Object.create({ref: dbRef});
        list.set('viewed', new Date().getTime());
        controller.set('model', list);
      }
      else {
        route.transitionTo('index');
      }
    });
  }
});

App.ListController = Ember.ObjectController.extend({
  url: function () {
    return 'http://firelist.github.io/#/' + this.get('id');
  }.property('id'),
  userHasList: function () {
    var lists = this.get('auth').lists;
    return lists && lists.contains(this.get('id'));
  }.property('id', 'auth.currentUser.lists'),

  actions: {
    removeItem: function (item) {
      this.get('items').removeObject(item);
    },
    saveList: function () {
      var user = this.get('auth').currentUser;
      if(user) {
        user.saveList(this.get('model'));
      }
    },
    removeList: function () {
      var lists = this.get('auth').lists;
      if(lists) {
        lists.removeObject(this.get('id'));
      }
    }
  }
});

App.ListItemsController = Ember.ArrayController.extend({
  itemController: 'listItem',
  sortProperties: ['done', 'order', 'title', 'edited'],
  sortAscending: true,

  remaining: function () {
    return this.filterBy('done', false).get('length');
  }.property('this.@each.done')
});

App.ListItemController = Ember.ObjectController.extend({
  isEditing: false,
  newTitle: '',

  actions: {
    toggleDone: function () {
      var isDone = this.get('done');
      this.set('done', !isDone);
      this.set('edited', new Date().getTime());
    },
    edit: function () {
      this.set('isEditing', true);
      this.set('newTitle', this.get('title'));
      App.ListsController.cancelAllItems();
    },
    updateTitle: function () {
      this.set('title', this.get('newTitle'));
      this.set('isEditing', false);
      this.set('edited', new Date().getTime());
    },
    cancelEdit: function () {
      this.set('isEditing', false);
    }
  }
});

App.NewListItemController = Ember.ObjectController.extend({
  newListItemTitle: '',

  actions: {
    newItem: function () {
      var newItemRef = new Firebase(dbLists + this.get('id') + '/items/').push();
      var item = EmberFire.Object.create({ref: newItemRef});
      var user = this.get('auth').currentUser;
      item.setProperties({
        user: user ? user.id : 'anonymous',
        created: new Date().getTime(),
        edited: new Date().getTime(),
        done: false,
        title: this.get('newListItemTitle'),
        order: this.get('nextOrderNo')
      });   
      this.incrementProperty('nextOrderNo', 1);
      this.set('newListItemTitle', '');
      this.set('edited', new Date().getTime());
    }
  }
});

App.MyListsController = Ember.ArrayController.extend({
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

App.SavedListController = Ember.ObjectController.extend({
  init: function () {
    var listRef = new Firebase(dbLists + this.get('model'));
    this.set('model', EmberFire.Object.create({ ref: listRef }));  
  }
});

App.User = EmberFire.Object.extend({
  saveList: function (list) {
    this.get('ref').child('/lists/' + list.get('id')).set(list.get('id'));
  }
});

App.AuthController = Ember.Controller.extend({
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
          username: user.id
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

App.FocusInputComponent = Ember.TextField.extend({
  becomeFocused: function() {
    this.$().focus();
  }.on('didInsertElement')
});
