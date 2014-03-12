window.App.ListItemsController = Ember.ArrayController.extend({
  itemController: 'listItem',
  sortProperties: ['done', 'order', 'title', 'edited'],
  sortAscending: true,

  remaining: function () {
    return this.filterBy('done', false).get('length');
  }.property('this.@each.done')
});

window.App.ListItemController = Ember.ObjectController.extend({
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

window.App.NewListItemController = Ember.ObjectController.extend({
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
