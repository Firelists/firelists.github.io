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
  isEditing: false,
  newName: '',

  url: function () {
    return 'http://firelists.github.io/#/' + this.get('id');
  }.property('id'),
  userHasList: function () {
    var lists = this.get('auth').lists;
    return lists && lists.contains(this.get('id'));
  }.property('id', 'auth.currentUser.lists'),
  lastEdited: function () {
    var lastEdited = moment(new Date(this.get('edited')));
    return lastEdited.fromNow();
  }.property('edited'),

  actions: {
    removeItem: function (item) {
      this.get('items').removeObject(item);
      this.set('edited', new Date().getTime());
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
    },
    edit: function () {
      this.set('isEditing', true);
      this.set('newName', this.get('name'));
    },
    updateName: function () {
      this.set('name', this.get('newName'));
      this.set('isEditing', false);
      this.set('edited', new Date().getTime());
    },
    cancelEdit: function () {
      this.set('isEditing', false);
    }
  }
});
