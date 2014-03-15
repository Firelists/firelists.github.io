window.App.List = EmberFire.Object.extend({
  removeItem: function (item) {
    this.get('items').removeObject(item);
    this.set('edited', new Date().getTime());
  },
  setName: function (newName) {
    this.set('name', newName);
    this.set('edited', new Date().getTime());
  },
  toggleLock: function () {
    this.set('locked', this.get('locked') === true ? false : true);
  }
});

window.App.ListRoute = Ember.Route.extend({
  model: function (params) {
    return new Firebase(dbLists).child(params.list_id);
  },
  setupController: function (controller, dbRef) {
    var route = this;
    dbRef.once('value', function (snapshot) {
      if(snapshot.val()) {
        var list = window.App.List.create({ref: dbRef});
        list.set('viewed', new Date().getTime());
        controller.set('model', list);
      }
      else {
        route.replaceWith('index'); // TODO: Add message why transition happened
      }
    });
  }
});

window.App.ListController = Ember.ObjectController.extend({
  isEditing: false,
  newName: '',

  isLocked: function () {
    return this.get('locked') === true;
  }.property('locked'),
  url: function () {
    return 'http://firelists.github.io/#/' + this.get('id');
  }.property('id'),
  userHasList: function () {
    var user = this.get('auth').currentUser;
    return user && user.hasList(this.get('id'));
  }.property('id', 'auth.currentUser.lists'),
  userIsCreator: function () {
    var currentUser = this.get('auth').currentUser;
    return currentUser && currentUser.get('id') === this.get('user');
  }.property('user', 'auth.currentUser.id'),
  canEditList: function () {
    return this.get('userIsCreator') || this.get('locked') !== true;
  }.property('userIsCreator', 'locked'),
  lastEdited: function () {
    var lastEdited = moment(new Date(this.get('edited')));
    return lastEdited.fromNow();
  }.property('edited'),

  actions: {
    removeItem: function (item) {
      this.get('model').removeItem(item);
    },
    saveList: function () {
      var user = this.get('auth').currentUser;
      if(user) {
        user.saveList(this.get('model'));
      }
    },
    removeList: function () {
      var user = this.get('auth').currentUser;
      if(user) {
        user.removeList(this.get('id'));
      }
    },
    edit: function () {
      if(this.get('canEditList')) {
        this.set('isEditing', true);
        this.set('newName', this.get('name'));
      }
    },
    updateName: function () {
      this.get('model').setName(this.get('newName'));
      this.set('isEditing', false);
    },
    cancelEdit: function () {
      this.set('isEditing', false);
    },
    toggleLock: function () {
      this.get('model').toggleLock();
    }
  }
});
