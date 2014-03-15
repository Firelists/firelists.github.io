window.App.ListItemsController = Ember.ArrayController.extend({
  itemController: 'listItem',
  sortProperties: ['done', 'order', 'title', 'edited'],
  sortAscending: true,
  showAll: false,

  filtered: function () {
    if(this.get('showAll')) {
      return this;
    }
    else {
      return this.filterBy('done', false);
    }
  }.property('this.showAll', 'this.@each.done'),
  remaining: function () {
    return this.filterBy('done', false).get('length');
  }.property('this.@each.done'),

  actions: {
    toggleShowAll: function () {
      this.set('showAll', this.get('showAll') ? false : true);
    }
  }
});

window.App.ListItemController = Ember.ObjectController.extend({
  isEditing: false,
  newTitle: '',
  needs: "list",
  canEditItem: function () {
    return this.get('controllers.list').get('locked') !== true || this.get('controllers.list').get('userIsCreator');
  }.property('controllers.list.locked', 'controllers.list.userIsCreator'),

  actions: {
    toggleDone: function () {
      if(this.get('canEditItem')) {
        var isDone = this.get('done');
        this.set('done', !isDone);
        this.set('edited', new Date().getTime());
        this.set('controllers.list.edited', new Date().getTime());
      }
    },
    edit: function () {
      if(this.get('canEditItem')) {
        this.set('isEditing', true);
        this.set('newTitle', this.get('title'));
      }
    },
    updateTitle: function () {
      this.set('title', this.get('newTitle'));
      this.set('isEditing', false);
      this.set('edited', new Date().getTime());
      this.set('controllers.list.edited', new Date().getTime());
    },
    cancelEdit: function () {
      this.set('isEditing', false);
    }
  }
});

window.App.NewListItemController = Ember.ObjectController.extend({
  newListItemTitle: '',

  actions: {
    newItem: function () {
      var input = this.get('newListItemTitle').trim();
      if(input.length > 0) {
        var newItemRef = new Firebase(dbLists + this.get('id') + '/items/').push();
        var item = EmberFire.Object.create({ref: newItemRef});
        var user = this.get('auth').currentUser;
        item.setProperties({
          user: user ? user.id : 'anonymous',
          created: new Date().getTime(),
          edited: new Date().getTime(),
          done: false,
          title: input,
          order: this.get('nextOrderNo')
        });   
        this.incrementProperty('nextOrderNo', 1);
        this.set('newListItemTitle', '');
        this.set('edited', new Date().getTime());
      }
    }
  }
});