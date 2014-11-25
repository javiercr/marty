var React = require('react');
var sinon = require('sinon');
var expect = require('chai').expect;
var ActionStore = require('./lib/actionStore');
var diagnostics = require('../lib/diagnostics');
var ActionCreators = require('../lib/actionCreators');
var TestUtils = require('react/addons').addons.TestUtils;

describe('ActionCreators', function () {
  var actionCreators, dispatcher, testConstant = 'TEST';

  beforeEach(function () {
    dispatcher = {
      dispatch: sinon.spy()
    };

    actionCreators = new ActionCreators({
      dispatcher: dispatcher,
      test: function (message) {
        this.dispatch(testConstant, message);
      }
    });
  });

  describe('#mixins', function () {
    var mixin1, mixin2;

    beforeEach(function () {
      mixin1 = {
        foo: function () { return 'bar'; }
      };

      mixin2 = {
        bar: function () { return 'baz'; }
      };

      actionCreators = new ActionCreators({
        dispatcher: dispatcher,
        mixins: [mixin1, mixin2]
      });
    });

    it('should allow you to mixin object literals', function () {
      expect(actionCreators.foo()).to.equal('bar');
      expect(actionCreators.bar()).to.equal('baz');
    });
  });

  describe('#dispatch()', function () {
    var message = 'Hello World';

    beforeEach(function () {
      actionCreators.test(message);
    });

    it('should call dispatcher#dispatch', function () {
      expect(dispatcher.dispatch).to.have.been.calledOnce;
    });

    it('should pass the action type and data to the dispatcher', function () {
      expect(dispatcher.dispatch).to.have.been.calledOnce;
    });
  });

  describe('tracing', function () {
    var Marty = require('../index');
    var actions, actionType, foo, store, fooView, barView;

    beforeEach(function () {
      foo = {bar: 'baz'};
      actionType = 'RECEIVE_FOO';
      diagnostics.enabled = true;
      actions = new ActionStore();
      store = Marty.createStore({
        name: 'Foo Store',
        handlers: {
          receiveFoo: actionType
        },
        receiveFoo: function (foo) {
          this.state.push(foo);
          this.hasChanged();
        },
        getInitialState: function () {
          return [];
        }
      });
      actionCreators = Marty.createActionCreators({
        name: 'FooActions',
        addFoo: function (foo) {
          this.dispatchViewAction(actionType, foo);
        }
      });
      fooView = renderClassWithState({
        name: 'Foos',
        foos: store
      });
      barView = renderClassWithState({
        name: 'Bars',
        bars: store
      });
    });

    afterEach(function () {
      actions.dispose();
      diagnostics.enabled = false;
    });

    describe('when I dispatch an action', function () {
      var first;

      beforeEach(function () {
        actionCreators.addFoo(foo);
        first = actions.first;
      });

      it('should trace all function calls', function () {
        expect(first.toJSON()).to.eql({
          type: actionType,
          source: 'VIEW',
          arguments: [foo],
          creator: {
            name: actionCreators.name,
            type: 'ActionCreator',
            action: 'addFoo',
            arguments: [foo]
          },
          handlers: [{
            store: store.name,
            type: 'Store',
            name: 'receiveFoo',
            error: null,
            state: {
              before: [],
              after: [foo]
            },
            views: [{
              name: 'Foos',
              error: null,
              state: {
                before: {
                  foos: []
                },
                after: {
                  foos: [foo]
                }
              }
            }, {
              name: 'Bars',
              error: null,
              state: {
                before: {
                  bars: []
                },
                after: {
                  bars: [foo]
                }
              }
            }]
          }]
        });
      });
    });
  });

  describe('#dispatchViewAction()', function () {
    it('should dispatch the action');
    it('should set the view source to being VIEW');
  });

  describe('#dispatchServerAction()', function () {
    it('should dispatch the action');
    it('should set the view source to being SERVER');
  });

  function renderClassWithState(stateProps) {
    var state = require('../index').createStateMixin(stateProps);

    return TestUtils.renderIntoDocument(React.createElement(React.createClass({
      mixins: [state],
      render: function () {
        return React.createElement('div', null, this.state.name);
      }
    })));
  }
});