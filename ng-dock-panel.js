(function () {
  'use strict';

  /* jshint expr:true */

  /* globals
   angular,
   $
   */

  var validPositions = ['top', 'right', 'bottom', 'left', 'fill'],
    dockPositionHandles = {top: 's', right: 'w', bottom: 'n', left: 'e'};
  var uiResizeClasses = {
    CUSTOM_RESIZE_HANDLE_CLASS: 'dock-resize-handle',
    CUSTOM_COLLAPSE_HANDLE_CLASS: 'dock-collapse-handle',
    JQUI_RESIZE_HANDLE_CLASS: 'ui-resizable-handle',
    JQUI_RESIZE_DIRECTION_PREFIX: 'ui-resizable-'
  };

  angular.module('ngDockPanel', [])
         .factory('dockService', dockService)
         .directive('dockPanel', dockPanelDirective)
         .directive('dock', dockDirective)
         .directive('dockResizable', dockResizableDirective);


  function dockService() {
    return {
      dockPanels: {},
      validPositions: validPositions,
      dockPositionHandles: dockPositionHandles,
      uiResizeClasses: uiResizeClasses,
      Panel: panelFactory()
    };
  }

  function panelFactory() {

    function setPosition(dockPosition, dockAnchors, cssStyle) {
      cssStyle.position = 'absolute';

      if (dockPosition !== 'bottom') {
        cssStyle.top = dockAnchors.top;
      } else {
        cssStyle.top = 'auto';
      }
      if (dockPosition !== 'left') {
        cssStyle.right = dockAnchors.right;
      } else {
        cssStyle.right = 'auto';
      }
      if (dockPosition !== 'right') {
        cssStyle.left = dockAnchors.left;
      } else {
        cssStyle.left = 'auto';
      }
      if (dockPosition !== 'top') {
        cssStyle.bottom = dockAnchors.bottom;
      } else {
        cssStyle.bottom = 'auto';
      }
    }

    function decreaseSize(element, dockPosition, dockAnchors) {
      var size;

      if (!element.is(':visible')) {
        return;
      }

      if ('top|bottom'.indexOf(dockPosition) !== -1) {
        size = element.outerHeight(true);
      }
      if ('left|right'.indexOf(dockPosition) !== -1) {
        size = element.outerWidth(true);
      }

      switch (dockPosition) {
        case 'top':
          dockAnchors.top += size;
          break;
        case 'right':
          dockAnchors.right += size;
          break;
        case 'bottom':
          dockAnchors.bottom += size;
          break;
        case 'left':
          dockAnchors.left += size;
          break;
      }
    }

    function removeClasses(element) {
      validPositions.forEach(function (pos) {
        element.removeClass('dock-' + pos);
      });
    }

    function update(element, dockPosition, dockAnchors) {
      var cssStyle = {};
      removeClasses(element);
      setPosition(dockPosition, dockAnchors, cssStyle);
      element.addClass('dock-' + dockPosition);
      element.css(cssStyle);
      decreaseSize(element, dockPosition, dockAnchors);
    }

    return function Panel(element, scope) {
      var self = this;

      var dockAnchors = {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
      };
      var children = [];

      this.addChild = function (element, dockPosition) {
        var pos = evalDockPosition(dockPosition, scope);

        children.push({
          element: element,
          dockPosition: pos,
          order: children.length
        });

        update(element, pos, dockAnchors);
      };

      this.refresh = function (delay) {

        preCalcPositions();

        if (delay) {
          setTimeout(doUpdate);
        } else {
          doUpdate();
        }

        function preCalcPositions() {
          children.forEach(function (child) {
            child.calcPosition = evalDockPosition(child.element.attr('dock'), scope);
          });
        }

        function doUpdate() {
          dockAnchors.top = 0;
          dockAnchors.bottom = 0;
          dockAnchors.left = 0;
          dockAnchors.right = 0;

          children.forEach(function (child) {
            update(child.element, child.calcPosition, dockAnchors);
          });
        }
      };

      $(window).resize(function () {
        self.refresh(false /* delay */);
      });

      scope.$watch(function () {
        self.refresh(true /* delay */);
      });
    };
  }

  function evalDockPosition(dockPosition, scope) {
    var pos = dockPosition;

    if (validPositions.indexOf(pos) === -1) {
      // may be an expression
      pos = scope.$eval(dockPosition);
    }

    if (validPositions.indexOf(pos) === -1) {
      // not a valid dock position
      throw {
        message: 'Invalid dock position "' + pos + '". Valid positions: ' + validPositions.join(', ')
      };
    }

    return pos;
  }

  function dockPanelDirective() {
    return {
      restrict: 'A',
      scope: true,
      controller: dockPanelDirectiveController
    };
  }

  dockPanelDirectiveController.$inject = ['$scope', '$element', 'dockService'];
  function dockPanelDirectiveController($scope, $element, dockService) {
    $scope.__dockPanel_id = String(Math.random()).replace(/\./g, '');
    dockService.dockPanels[$scope.__dockPanel_id] = new dockService.Panel($element, $scope);
  }

  function dockDirective() {
    return {
      restrict: 'A',
      scope: true,
      controller: dockDirectiveController
    };
  }

  dockDirectiveController.$inject = ['$scope', '$element', 'dockService'];
  function dockDirectiveController($scope, $element, dockService) {
    var dockPosition = evalDockPosition($element.attr('dock'), $scope);
    $scope.__dock_id = String(Math.random()).replace(/\./g, '');
    var parentPanel = dockService.dockPanels[$scope.$parent.__dockPanel_id];
    parentPanel.addChild($element, dockPosition);
  }

  function dockResizableDirective() {
    return {
      require: 'dock',
      restrict: 'A',
      controller: dockResizableDirectiveController,
      controllerAs: 'vm'
    };
  }

  dockResizableDirectiveController.$inject = ['$scope', '$element', 'dockService'];
  function dockResizableDirectiveController($scope, $element, dockService) {
    var vm = this;

    var resizeClasses = dockService.uiResizeClasses;
    var stylePlaceholder = {
      height: {
        'min-height': $element.css('min-height'),
        'max-height': $element.css('max-height'),
        'height': $element.css('height')
      },
      weight: {
        'min-width': $element.css('min-width'),
        'max-width': $element.css('max-width'),
        'width': $element.css('width')
      }
    };

    var dockPosition = evalDockPosition($element.attr('dock'), $scope),
      resizeHandleDirection;

    vm.toggleCollapse = _collapse;

    enableResize();

    $scope.$watch(function () {
      var newDockPosition = evalDockPosition($element.attr('dock'), $scope);

      if (newDockPosition !== dockPosition) {
        dockPosition = newDockPosition;
        $element.resizable('destroy');
        enableResize();
      }
    });

    function _collapse() {
      var dimension = "top|bottom".indexOf(dockPosition) !== -1 ? 'height' : 'width';
      var minName = ['min', dimension].join('-'),
        maxName = ['max', dimension].join('-');
      var cssZero = '0px';

      if ($element.css(maxName) === cssZero) {
        angular.forEach(stylePlaceholder[dimension], function (val, key) {
          $element.css(key, val);
        });
      } else {
        angular.forEach(stylePlaceholder[dimension], function (val, key) {
          stylePlaceholder[dimension][key] = $element.css(key);
        });
        $element.css(minName, cssZero);
        $element.css(maxName, cssZero);
      }
    }

    function enableResize() {
      if (dockPosition !== 'fill') {
        $element.resizable(resolveResizeOptions());
      }
    }

    function resolveResizeOptions() {
      resizeHandleDirection = dockService.dockPositionHandles[dockPosition];
      var defaultOptions = {
          handles: resizeHandleDirection
        },
        customOptions = {},
        optionsAttr = evalResizeOptions();

      // custom dock-resize-handle
      var resizeHandle = $element.find('.' + resizeClasses.CUSTOM_RESIZE_HANDLE_CLASS).first();
      if (resizeHandle.length) {
        addJquiClasses(resizeHandle);
        (customOptions.handles = customOptions.handles || {})[resizeHandleDirection] = '.' + resizeClasses.CUSTOM_RESIZE_HANDLE_CLASS;
      }

      // custom dock-collapse-handle
      var collapseHandle = $element.find('.' + resizeClasses.CUSTOM_COLLAPSE_HANDLE_CLASS).first();
      if (collapseHandle.length) {
        addJquiClasses(collapseHandle);
      }

      return angular.merge({}, defaultOptions, customOptions, optionsAttr);
    }

    function addJquiClasses(handle) {
      handle.addClass([
        resizeClasses.JQUI_RESIZE_HANDLE_CLASS,
        resizeClasses.JQUI_RESIZE_DIRECTION_PREFIX + resizeHandleDirection
      ].join(' '));
    }

    function evalResizeOptions() {
      var optionsAttr = $scope.$eval($element.attr('dock-resizable'));
      return angular.isObject(optionsAttr) && optionsAttr || {};
    }
  }

})();
