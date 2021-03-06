(function($) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

  /*
   * some helpers...
   */
  var getBoundEventList = function ($element) {
      var allBoundEvents = $._data($element[0], 'events');
      var list = [];

      for (var e in allBoundEvents) {
        if (allBoundEvents.hasOwnProperty(e)) {
            list.push(e);
        }
      }

      return list;
  },
  getBoundEventNamespaces = function ($element) {
        var namespaces = [];
        var eventsCollectionObj = $._data($element[0], "events");

        var eventType;
        for (eventType in eventsCollectionObj) {
            if (eventsCollectionObj.hasOwnProperty(eventType)) {

                var eventsArray = eventsCollectionObj[eventType];
                for (var i=0; i<eventsArray.length; i++) {
                    var evt = eventsArray[i];
                    var evtNamespace = evt.namespace;

                    if (-1 === namespaces.indexOf(evtNamespace)) {
                        namespaces.push(evtNamespace);
                    }
                }
            }
        }

        return namespaces;
  },
  countElementBoundEvents = function ($element) {
      return getBoundEventList($element).length;
  },
  buildSlider = function ($sliderDom, sliderDataAttributes, options) {
      if (typeof options === 'undefined') {
          options = {};
      }

      var attribute;
      for (attribute in sliderDataAttributes) {
          if (sliderDataAttributes.hasOwnProperty(attribute)) {

              notEqual(typeof $sliderDom.attr('data-' + attribute), 'undefined', 'buildSlider attribute ' + attribute + ' exists in markup');

              $sliderDom.attr('data-' + attribute, sliderDataAttributes[attribute]);
              $sliderDom.data(attribute, sliderDataAttributes[attribute]);
          }
      }

      return $sliderDom.nstSlider(options);
  };

  var _initialEventsBoundToDocument = getBoundEventList($(document));
  var _initialNumberOfEventsBoundToDocument = _initialEventsBoundToDocument.length;

  module('jQuery#nstSlider', {
    // This will run before each test in this module.
    setup: function() {
      this.sliders = {
          manyBasicSliders : $('#manyBasicSliders').children(),
          basicSliderWithParameters : $('#basicSliderWithParameters'),
          basicSliderWithNoParameters : $('#basicSliderWithNoParameters'),
          basicSliderWithParametersAndNonDefaultLeftGrip : $('#basicSliderWithParametersAndNonDefaultLeftGrip'),
          basicSliderWithParametersAndNonDefaultRightGrip : $('#basicSliderWithParametersAndNonDefaultRightGrip'),
          basicSliderWithCrossingLimits : $('#basicSliderWithCrossingLimits'),
          sliderWithRounding : $('#sliderWithRounding'),
          sliderWithLimitsAndRounding : $('#sliderWithLimitsAndRounding')
      };
    },
    // This will run after each test in this module.
    teardown : function () {

      // tear down all plugins initialized on the various elements

      var countBeforeTearDown = countElementBoundEvents($(document));

      var slider;
      for (slider in this.sliders) {

        if (typeof slider === 'string' && this.sliders.hasOwnProperty(slider)) {

            var $slider = this.sliders[slider];

            if (typeof $slider.data('initialized') !== 'undefined') {

                $slider.nstSlider('teardown');

                var totalAttr = 0;
                var totalData = 0;

                var gotData = $slider.data();
                if (typeof gotData !== 'undefined') {
                    // check that all existing data after the teardown are the one
                    // specified in the markup
                    for (var k in gotData) {
                        if (gotData.hasOwnProperty(k)) {
                            totalData++;
                            if (typeof $slider.attr('data-' + k) !== 'undefined') {
                                // check the value is the same
                                if ("" + gotData[k] === $slider.attr('data-' + k)) {
                                    totalAttr++;
                                }
                                else {
                                    ok(false, 'failed to tear down slider ' + slider + ' data attribute ' + k + ' should have the expected value ' + $slider.attr('data-' + k) + ' as per markup');
                                }
                            }
                        }
                    }
                }

                // if the values returned by .data() can be found in markup,
                // with the same values, then we can say the slider is teared
                // down.
                ok(totalAttr <= totalData, slider + ' slider was teared down');
            }
        }
      }

      var countAfterTearDown = countElementBoundEvents($(document));

      // make sure no event is bound to the document
      equal(countAfterTearDown, _initialNumberOfEventsBoundToDocument,
        'test cleans up events bound to the document. From ' + countBeforeTearDown + ' to ' + countAfterTearDown
      );
    }
  });

  test('is chainable', function() {
    ok(this.sliders.manyBasicSliders.nstSlider().addClass('ourSlider'), 'add class from chaining');
    equal(this.sliders.manyBasicSliders.hasClass('ourSlider'), true, 'class was added from chaining');
  });

  test('validates input parameters', function () {
      var that = this;

      // throws an error on a slider with no parametes
      var sliderThatThrowsErrors = this.sliders.basicSliderWithNoParameters;
      throws(function () {
         sliderThatThrowsErrors.nstSlider();
      }, /data-/, 'throws data- related exception if no parameters are provided');

      // does not throw an error on a basic slider with all the required data-
      // parameters specified
      try {
          this.sliders.basicSliderWithParameters.nstSlider();
          ok(true, "did not throw an exception with necessary data- parameters specified");
      } catch(e) {
          ok(false, "an exception was thrown with necessary data- parameters specified: " + e);
      }


      /*
       * Now test that validation is performed until ALL the required data-
       * attributes are added to the slider on which the error was thrown.
       */
      var sliderDataAttributes = {
          'rounding' : 10,
          'range_min' : 10,
          'range_max' : 110,
          'cur_min' : 20
      };

      var required_attributes = [
          'rounding', 'range_min', 'range_max', 'cur_min'
      ];

      // throw an exception until all parameters are set
      var total = required_attributes.length;
      var mayThrowErrorFunc = function () {
          $(sliderThatThrowsErrors).nstSlider();
      };
      for (var i=0; i<total; i++) {

          throws(mayThrowErrorFunc, /data-/, 'throws a data- related exception ' + (i+1) + '/' + (total));

          // add a parameter
          var req_attr = required_attributes[i];
          $(sliderThatThrowsErrors).attr('data-' +  req_attr, sliderDataAttributes[req_attr]);
      }

      // now shouldn't throw an error anymore - as all attributes have been added
      try {
          $(sliderThatThrowsErrors).nstSlider();
          ok(true, "did not throw an exception with all necessary data- parameters specified");
      } catch(e) {
          ok(false, "an exception was thrown with necessary data- parameters specified: " + e);
      }

      //
      // Check for more exception messages
      //

      throws(function (){
          $(that.sliders.basicSliderWithParametersAndNonDefaultLeftGrip).nstSlider({
              left_grip_selector : '.not-existing-selector'
          });
      }, /.not-existing-selector/, 'throws exception related to left grip');

      try {
          $(that.sliders.basicSliderWithParametersAndNonDefaultLeftGrip).nstSlider({
              left_grip_selector : '.the-left-grip'
          });
          ok(true, 'did not throw exception when selector was specified');
      }
      catch (e) {
          ok(false, 'did throw exception when selector was specified');
      }

      throws(function (){
          $(that.sliders.basicSliderWithParametersAndNonDefaultRightGrip).nstSlider({
              right_grip_selector : '.not-existing-selector'
          });
      }, /.not-existing-selector/, 'throws exception related to right grip');


      throws(function () {
          $(that.sliders.basicSliderWithParameters).nstSlider({
              value_bar_selector: '.not-existing-selector'
          });
      }, /value_bar_selector/, 'throws exception when value_bar_selector is specified but not existing');


      throws(function () {
          $(that.sliders.basicSliderWithCrossingLimits).nstSlider();
      }, /Invalid data-lower-limit or data-upper-limit/, 'throws error on crossing upper/lower limits');
  });


  test('event binding is performed correctly', function () {
    // initially no events are bound to the document
    var $document = $(document);
    var boundEventList = getBoundEventList($document);

    if (boundEventList.length === 0) {
        ok(true, 'no events bound to the document');
    }
    else {
        ok(false, 'no events bound to the document, but got ' +
            boundEventList.join(', '));
    }

    // if a slider is created, then the events get bound to the document
    this.sliders.basicSliderWithParameters.nstSlider();

    equal(getBoundEventList($document).length, 2, 'some events are bound to the document');

    // check all events bound are namespaced
    var nss = getBoundEventNamespaces($document);
    equal(nss.length, 1, 'only one namespace was found for the events');
    equal(nss[0], 'nstSlider', 'namespace is nstSlider');

  });

  test('can get ranges', function () {
    var $slider = buildSlider(this.sliders.sliderWithRounding, {
        'rounding' : 10, 'range_min' : 5, 'range_max' : 95,
        'cur_min' : 30, 'cur_max' : 60
    });

    equal($slider.nstSlider('get_range_min'), 5);
    equal($slider.nstSlider('get_range_max'), 95);
  });

  test('can get values', function () {

    var $slider = buildSlider(this.sliders.sliderWithRounding, {
        'rounding' : 10, 'range_min' : 5, 'range_max' : 95,
        'cur_min' : 30, 'cur_max' : 60
    });

    equal($slider.nstSlider('get_current_min_value'), 30);
    equal($slider.nstSlider('get_current_max_value'), 60);
  });

  test("tells limits are not reached when handles are far away from extremities", function () {
      // no limits defined
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 10,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 30,
          'cur_max' : 60
      });
      equal($slider.nstSlider('is_handle_to_left_extreme'), false);
      equal($slider.nstSlider('is_handle_to_right_extreme'), false);
  });

  test("tells left limit reached, not right as only left slider is stuck to min value", function () {
        // no limits defined
        var $slider = buildSlider(this.sliders.sliderWithRounding, {
            'rounding' : 5,
            'range_min' : 5,
            'range_max' : 95,
            'cur_min' : 5,
            'cur_max' : 60
        });
        equal($slider.nstSlider('is_handle_to_left_extreme'), true);

  });

  test("tells right limit is reached, not left, as right handle is stuck to the right extreme", function () {
      // no limits defined
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 1,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 6,
          'cur_max' : 95
      });

      equal($slider.nstSlider('is_handle_to_left_extreme'), false);
      equal($slider.nstSlider('is_handle_to_right_extreme'), true);
  });


  test("tells you when upper limit hasn't been reached", function () {

      // no limits defined
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 5,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 30,
          'cur_max' : 60
      });
      equal($slider.nstSlider('is_handle_to_right_extreme'), false);

      $slider.nstSlider('teardown');

      // no limits defined
      $slider = buildSlider($slider, {
          'rounding' : 5,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 5,
          'cur_max' : 95
      });
      equal($slider.nstSlider('is_handle_to_right_extreme'), true);
  });

  test("detects limits for non exact roundings", function () {
      // no limits defined
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 7,
          'range_min' : 2,
          'range_max' : 10,
          'cur_min' : 2,
          'cur_max' : 10
      });
      equal($slider.nstSlider('is_handle_to_right_extreme'), true);
      equal($slider.nstSlider('is_handle_to_left_extreme'), true);
  });


  test("lets you access min/max range", function () {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 10,
          'range_min' : 5, 'range_max' : 95,
          'cur_min' : 30,  'cur_max' : 60,
          'upper-limit' : 100, 'lower-limit' : 1
      });

      equal($slider.nstSlider('get_range_min'), 5);
      equal($slider.nstSlider('get_range_max'), 95);
  });

  test("lets you access current min/max values", function () {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 10,
          'range_min' : 5, 'range_max' : 95,
          'cur_min' : 30,  'cur_max' : 60,
          'upper-limit' : 100, 'lower-limit' : 1
      });

      equal($slider.nstSlider('get_current_min_value'), 30);
      equal($slider.nstSlider('get_current_max_value'), 60);

      $slider.nstSlider('teardown');
  });

  test("tells you when lower limit hasn't been reached", function () {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 10,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 30,
          'cur_max' : 60,
          'upper-limit' : 100,
          'lower-limit' : 1
      });
      equal($slider.nstSlider('is_handle_to_left_extreme'), false);

      // teardown
      $slider.nstSlider('teardown');

      buildSlider(($slider), {
          'rounding' : 5,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 5,
          'cur_max' : 60,
          'upper-limit' : 100,
          'lower-limit' : 1
      });
      equal($slider.nstSlider('get_current_min_value'), 1);
      equal($slider.nstSlider('is_handle_to_left_extreme'), true);

      $slider.nstSlider('teardown');
  });

  test("tells you when upper limit hasn't been reached", function () {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 5,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 30,
          'cur_max' : 60,
          'upper-limit' : 100,
          'lower-limit' : 1
      });
      equal($slider.nstSlider('is_handle_to_right_extreme'), false);

      $slider.nstSlider('teardown');

      buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 5,
          'range_min' : 5,
          'range_max' : 95,
          'cur_min' : 5,
          'cur_max' : 95,
          'upper-limit' : 1000,
          'lower-limit' : 1
      });

      equal($slider.nstSlider('is_handle_to_right_extreme'), true);
      equal($slider.nstSlider('get_current_max_value'), 1000);

      $slider.nstSlider('teardown');
  });

  test("detects limits for non exact roundings", function () {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 7,
          'range_min' : 2,
          'range_max' : 10,
          'cur_min' : 2,
          'cur_max' : 10,
          'upper-limit' : 100,
          'lower-limit' : 1
      });
      equal($slider.nstSlider('is_handle_to_right_extreme'), true);
      equal($slider.nstSlider('is_handle_to_left_extreme'), true);

      $slider.nstSlider('teardown');
  });

  test("rounds the position of the slider to the closest integer according to the rounding", function () {
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 0,
          'range_max' : 1000,
          'cur_min' : 10,
          'cur_max' : 500
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      $slider.nstSlider('set_position', 150, 400.1);

      equal($slider.nstSlider('get_current_min_value'), 100);
      equal($slider.nstSlider('get_current_max_value'), 400);

      $slider.nstSlider('teardown');
  });

  test("rounds the position of the slider to the next integer according to the rounding", function () {
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 0,
          'range_max' : 1000,
          'cur_min' : 10,
          'cur_max' : 500
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      $slider.nstSlider('set_position', 151, 560);

      equal($slider.nstSlider('get_current_min_value'), 200);
      equal($slider.nstSlider('get_current_max_value'), 600);

      $slider.nstSlider('teardown');
  });

  test("rounds the position of the slider to minRange for values close to it", function () {
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 0,
          'range_max' : 1000,
          'cur_min' : 10,
          'cur_max' : 500
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      $slider.nstSlider('set_position', 2, 7);

      equal($slider.nstSlider('get_current_min_value'), 0);
      equal($slider.nstSlider('get_current_max_value'), 0);

      $slider.nstSlider('teardown');
  });
  test("performs rounding only for values in the middle of the range", function () {
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 10,
          'range_min' : 3,
          'range_max' : 37,
          'cur_min' : 3,
          'cur_max' : 3
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      // initial state
      equal($slider.nstSlider('get_current_min_value'), 3);
      equal($slider.nstSlider('get_current_max_value'), 3);

      $slider.nstSlider('set_position', 3, 37);

      // can select min max
      equal($slider.nstSlider('get_current_min_value'), 3);
      equal($slider.nstSlider('get_current_max_value'), 37);

      $slider.nstSlider('set_position', 10, 30);

      // can select a value rounded according to rounding
      equal($slider.nstSlider('get_current_min_value'), 10);
      equal($slider.nstSlider('get_current_max_value'), 30);

      $slider.nstSlider('set_position', 15, 23);

      // values are rounded according to rounding regardless odd min/max range
      equal($slider.nstSlider('get_current_min_value'), 10);
      equal($slider.nstSlider('get_current_max_value'), 20);
  });
  test ("keeps the handles within the range handles are moved too far apart", function () {
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 100,
          'range_max' : 1000,
          'cur_min' : 10,
          'cur_max' : 500
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      $slider.nstSlider('set_position', 50, 2000);

      equal($slider.nstSlider('get_current_min_value'), 100);
      equal($slider.nstSlider('get_current_max_value'), 1000);
  });
  test ("keeps the handles within the limits if they are moved too far apart", function () {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 100,
          'range_min' : 100,
          'range_max' : 1000,
          'cur_min' : 10,
          'cur_max' : 500,
          'lower-limit' : 80,
          'upper-limit' : 1100
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      $slider.nstSlider('set_position', 50, 2000);

      equal($slider.nstSlider('get_current_min_value'), 80);
      equal($slider.nstSlider('get_current_max_value'), 1100);
  });
  test ("accepts that grips can cross (i.e., max/min values can swap)", function() {
      var $slider = buildSlider(this.sliders.sliderWithLimitsAndRounding, {
          'rounding' : 100,
          'range_min' : 100,
          'range_max' : 1000,
          'cur_min' : 10,
          'cur_max' : 500,
          'lower-limit' : 80,
          'upper-limit' : 1100
      },{
          right_grip_selector : '.nst-slider-grip-right'
      });

      // note: swap max with min
      $slider.nstSlider('set_position', 2000, 50);

      equal($slider.nstSlider('get_current_min_value'), 80);
      equal($slider.nstSlider('get_current_max_value'), 1100);

      // another movement, within the range
      $slider.nstSlider('set_position', 500, 200);
  });

  test("changes the position of the handles based on the range", function () {

      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 500,
          'range_max' : 800,
          'cur_min' : 500,
          'cur_max' : 800
      });

      var expectCause = 'init';

      $slider.nstSlider({
          value_changed_callback : function (cause/*, minV, maxV */) {
              equal(cause, expectCause, "Got expected cause " + cause + " in value_changed_callback");
          }
      });

      var checkInitialState = function () {
          equal($slider.nstSlider('get_current_min_value'), 500);
          equal($slider.nstSlider('get_current_max_value'), 800);
          equal($slider.nstSlider('get_range_min'), 500);
          equal($slider.nstSlider('get_range_max'), 800);
      };

      checkInitialState();

      // ** from now on we will be calling set range **
      expectCause = 'set_range';

      $slider.nstSlider('set_range', 0, 1000);

      equal($slider.nstSlider('get_range_min'), 0);
      equal($slider.nstSlider('get_range_max'), 1000);
      equal($slider.nstSlider('get_current_min_value'), 500);
      equal($slider.nstSlider('get_current_max_value'), 800);

      $slider.nstSlider('set_range', 500, 800);

      checkInitialState();

      $slider.nstSlider('set_range', 700, 800);

      equal($slider.nstSlider('get_range_min'), 700);
      equal($slider.nstSlider('get_range_max'), 800);
      equal($slider.nstSlider('get_current_min_value'), 700);
      equal($slider.nstSlider('get_current_max_value'), 800);
  });
  test("detects constrained values since construction", function () {

      var expectCause = 'init';

      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 500,
          'range_max' : 800,
          'cur_min' : 500,
          'cur_max' : 1000
      });

      $slider.nstSlider({
          value_changed_callback : function (cause/* , vMin, vMax */) {
             equal(cause, expectCause, "Got expected cause " + cause + " in value_changed_callback");
          }
      });

      equal($slider.nstSlider('get_range_min'), 500);
      equal($slider.nstSlider('get_range_max'), 800);
      equal($slider.nstSlider('get_current_min_value'), 500);
      equal($slider.nstSlider('get_current_max_value'), 800);
  });

  test("detects constrained values within callback", function () {

      var expectCause = 'init';

      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 20,
          'range_min' : 750,
          'range_max' : 1395,
          'cur_min' : 750,
          'cur_max' : 1395
      });

      $slider.nstSlider({
          value_changed_callback : function (cause/*, vMin, vMax*/) {
             equal(cause, expectCause, "Got expected cause " + cause + " in value_changed_callback");
          }
      });

      // check initial state
      equal($slider.nstSlider('get_range_min'), 750);
      equal($slider.nstSlider('get_range_max'), 1395);
      equal($slider.nstSlider('get_current_min_value'), 750);
      equal($slider.nstSlider('get_current_max_value'), 1395);

      // now prepare for next interaction in which we reduce the range...

      expectCause = 'set_range';

      $slider.nstSlider('set_range', 795, 1250);
  });

  test("notifies when slider is constructed", function () {

      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 100,
          'range_min' : 500,
          'range_max' : 800,
          'cur_min' : 500,
          'cur_max' : 800
      });

      $slider.nstSlider({
          value_changed_callback : function (cause, vMin, vMax) {
             equal(cause, 'init', "callback called with init cause");
             equal(vMin, 500, "Got notified with correct min value");
             equal(vMax, 800, "Got notified with correct min value");
          }
      });
  });

  test("Step-based value rounding", function () {

      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'rounding' : 10,
          'range_min' : 3,
          'range_max' : 1000,
          'cur_min' : 3,
          'cur_max' : 1000
      });

      equal($slider.nstSlider('get_rounding'), 10);

      equal($slider.nstSlider('round_value_according_to_rounding', 5), 0);
      equal($slider.nstSlider('round_value_according_to_rounding', 6), 10);
      equal($slider.nstSlider('round_value_according_to_rounding', 9), 10);
      equal($slider.nstSlider('round_value_according_to_rounding', 10), 10);
      equal($slider.nstSlider('round_value_according_to_rounding', 22), 20);
      equal($slider.nstSlider('round_value_according_to_rounding', 35), 30);
      equal($slider.nstSlider('round_value_according_to_rounding', 999), 1000);
      equal($slider.nstSlider('round_value_according_to_rounding', 1000), 1000);
  });

  test("Rounds correctly with variable roundings", function () {
      var rounding = {
          '1' : '10',  // round with rounding 1 if the value is less than 10
          '10': '50',  // round with rounding 10 if value is less than 99
          '20': '500',
          '100' : '1000'
      };
      var $slider = buildSlider(this.sliders.sliderWithRounding, {
          'range_min' : 3,
          'range_max' : 1000,
          'cur_min' : 3,
          'cur_max' : 1000,
          'rounding' : rounding
      });

      deepEqual($slider.nstSlider('get_rounding'), rounding);

      equal($slider.nstSlider('round_value_according_to_rounding', 1), 1);
      equal($slider.nstSlider('round_value_according_to_rounding', 5), 5);
      equal($slider.nstSlider('round_value_according_to_rounding', 6), 6);
      equal($slider.nstSlider('round_value_according_to_rounding', 9), 9);
      equal($slider.nstSlider('round_value_according_to_rounding', 10), 10);
      equal($slider.nstSlider('round_value_according_to_rounding', 22), 20);
      equal($slider.nstSlider('round_value_according_to_rounding', 35), 30);
      equal($slider.nstSlider('round_value_according_to_rounding', 999), 1000);
      equal($slider.nstSlider('round_value_according_to_rounding', 450), 440);
      equal($slider.nstSlider('round_value_according_to_rounding', 300), 300);
      equal($slider.nstSlider('round_value_according_to_rounding', 923), 900);
      equal($slider.nstSlider('round_value_according_to_rounding', 4436), 4400);
  });

}(jQuery));
