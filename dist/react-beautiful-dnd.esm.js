import _extends from '@babel/runtime-corejs2/helpers/esm/extends';
import _inheritsLoose from '@babel/runtime-corejs2/helpers/esm/inheritsLoose';
import React, { PureComponent, Component, Fragment } from 'react';
import { compose, createStore, applyMiddleware, bindActionCreators } from 'redux';
import invariant from 'tiny-invariant';
import PropTypes from 'prop-types';
import { getRect, createBox, withScroll, offset, getBox, expand, calculateBox } from 'css-box-model';
import memoizeOne from 'memoize-one';
import _Object$values from '@babel/runtime-corejs2/core-js/object/values';
import _Object$keys from '@babel/runtime-corejs2/core-js/object/keys';
import _Object$assign from '@babel/runtime-corejs2/core-js/object/assign';
import _Date$now from '@babel/runtime-corejs2/core-js/date/now';
import rafSchd from 'raf-schd';
import { connect } from 'react-redux';
import _regeneratorRuntime from '@babel/runtime-corejs2/regenerator';
import _asyncToGenerator from '@babel/runtime-corejs2/helpers/esm/asyncToGenerator';
import _Number$isInteger from '@babel/runtime-corejs2/core-js/number/is-integer';

var origin = {
  x: 0,
  y: 0
};
var add = function add(point1, point2) {
  return {
    x: point1.x + point2.x,
    y: point1.y + point2.y
  };
};
var subtract = function subtract(point1, point2) {
  return {
    x: point1.x - point2.x,
    y: point1.y - point2.y
  };
};
var isEqual = function isEqual(point1, point2) {
  return point1.x === point2.x && point1.y === point2.y;
};
var negate = function negate(point) {
  return {
    x: point.x !== 0 ? -point.x : 0,
    y: point.y !== 0 ? -point.y : 0
  };
};
var patch = function patch(line, value, otherValue) {
  var _ref;

  if (otherValue === void 0) {
    otherValue = 0;
  }

  return _ref = {}, _ref[line] = value, _ref[line === 'x' ? 'y' : 'x'] = otherValue, _ref;
};
var distance = function distance(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
};
var closest = function closest(target, points) {
  return Math.min.apply(Math, points.map(function (point) {
    return distance(target, point);
  }));
};
var apply = function apply(fn) {
  return function (point) {
    return {
      x: fn(point.x),
      y: fn(point.y)
    };
  };
};

var executeClip = (function (frame, subject) {
  var result = getRect({
    top: Math.max(subject.top, frame.top),
    right: Math.min(subject.right, frame.right),
    bottom: Math.min(subject.bottom, frame.bottom),
    left: Math.max(subject.left, frame.left)
  });

  if (result.width <= 0 || result.height <= 0) {
    return null;
  }

  return result;
});

var isEqual$1 = function isEqual(first, second) {
  return first.top === second.top && first.right === second.right && first.bottom === second.bottom && first.left === second.left;
};
var offsetByPosition = function offsetByPosition(spacing, point) {
  return {
    top: spacing.top + point.y,
    left: spacing.left + point.x,
    bottom: spacing.bottom + point.y,
    right: spacing.right + point.x
  };
};
var getCorners = function getCorners(spacing) {
  return [{
    x: spacing.left,
    y: spacing.top
  }, {
    x: spacing.right,
    y: spacing.top
  }, {
    x: spacing.left,
    y: spacing.bottom
  }, {
    x: spacing.right,
    y: spacing.bottom
  }];
};

var scroll = function scroll(target, frame) {
  if (!frame) {
    return target;
  }

  return offsetByPosition(target, frame.scroll.diff.displacement);
};

var increase = function increase(target, axis, withPlaceholder) {
  if (withPlaceholder && withPlaceholder.increasedBy) {
    var _extends2;

    return _extends({}, target, (_extends2 = {}, _extends2[axis.end] = target[axis.end] + withPlaceholder.increasedBy[axis.line], _extends2));
  }

  return target;
};

var clip = function clip(target, frame) {
  if (frame && frame.shouldClipSubject) {
    return executeClip(frame.pageMarginBox, target);
  }

  return getRect(target);
};

var getSubject = (function (_ref) {
  var page = _ref.page,
      withPlaceholder = _ref.withPlaceholder,
      axis = _ref.axis,
      frame = _ref.frame;
  var scrolled = scroll(page.marginBox, frame);
  var increased = increase(scrolled, axis, withPlaceholder);
  var clipped = clip(increased, frame);
  return {
    page: page,
    withPlaceholder: withPlaceholder,
    active: clipped
  };
});

var scrollDroppable = (function (droppable, newScroll) {
  !droppable.frame ? process.env.NODE_ENV !== "production" ? invariant(false) : invariant(false) : void 0;
  var scrollable = droppable.frame;
  var scrollDiff = subtract(newScroll, scrollable.scroll.initial);
  var scrollDisplacement = negate(scrollDiff);

  var frame = _extends({}, scrollable, {
    scroll: {
      initial: scrollable.scroll.initial,
      current: newScroll,
      diff: {
        value: scrollDiff,
        displacement: scrollDisplacement
      },
      max: scrollable.scroll.max
    }
  });

  var subject = getSubject({
    page: droppable.subject.page,
    withPlaceholder: droppable.subject.withPlaceholder,
    axis: droppable.axis,
    frame: frame
  });

  var result = _extends({}, droppable, {
    frame: frame,
    subject: subject
  });

  return result;
});

var records = {};
var isEnabled = false;

var isTimingsEnabled = function isTimingsEnabled() {
  return isEnabled;
};
var start = function start(key) {
  if (process.env.NODE_ENV !== 'production') {
    if (!isTimingsEnabled()) {
      return;
    }

    var now = performance.now();
    records[key] = now;
  }
};
var finish = function finish(key) {
  if (process.env.NODE_ENV !== 'production') {
    if (!isTimingsEnabled()) {
      return;
    }

    var now = performance.now();
    var previous = records[key];

    if (!previous) {
      console.warn('cannot finish timing as no previous time found', key);
      return;
    }

    var result = now - previous;
    var rounded = result.toFixed(2);

    var style = function () {
      if (result < 12) {
        return {
          textColor: 'green',
          symbol: '✅'
        };
      }

      if (result < 40) {
        return {
          textColor: 'orange',
          symbol: '⚠️'
        };
      }

      return {
        textColor: 'red',
        symbol: '❌'
      };
    }();

    console.log(style.symbol + " %cTiming %c" + rounded + " %cms %c" + key, 'color: blue; font-weight: bold;', "color: " + style.textColor + "; font-size: 1.1em;", 'color: grey;', 'color: purple; font-weight: bold;');
  }
};

function values(map) {
  return _Object$values(map);
}
function findIndex(list, predicate) {
  if (list.findIndex) {
    return list.findIndex(predicate);
  }

  for (var i = 0; i < list.length; i++) {
    if (predicate(list[i])) {
      return i;
    }
  }

  return -1;
}
function find(list, predicate) {
  if (list.find) {
    return list.find(predicate);
  }

  var index = findIndex(list, predicate);

  if (index !== -1) {
    return list[index];
  }

  return undefined;
}

var toDroppableMap = memoizeOne(function (droppables) {
  return droppables.reduce(function (previous, current) {
    previous[current.descriptor.id] = current;
    return previous;
  }, {});
});
var toDraggableMap = memoizeOne(function (draggables) {
  return draggables.reduce(function (previous, current) {
    previous[current.descriptor.id] = current;
    return previous;
  }, {});
});
var toDroppableList = memoizeOne(function (droppables) {
  return values(droppables);
});
var toDraggableList = memoizeOne(function (draggables) {
  return values(draggables);
});

var isWithin = (function (lowerBound, upperBound) {
  return function (value) {
    return lowerBound <= value && value <= upperBound;
  };
});

var isPositionInFrame = (function (frame) {
  var isWithinVertical = isWithin(frame.top, frame.bottom);
  var isWithinHorizontal = isWithin(frame.left, frame.right);
  return function (point) {
    return isWithinVertical(point.y) && isWithinVertical(point.y) && isWithinHorizontal(point.x) && isWithinHorizontal(point.x);
  };
});

var getDroppableOver = (function (_ref) {
  var target = _ref.target,
      droppables = _ref.droppables;
  var maybe = find(toDroppableList(droppables), function (droppable) {
    if (!droppable.isEnabled) {
      return false;
    }

    var active = droppable.subject.active;

    if (!active) {
      return false;
    }

    return isPositionInFrame(active)(target);
  });
  return maybe ? maybe.descriptor.id : null;
});

var getDraggablesInsideDroppable = memoizeOne(function (droppableId, draggables) {
  var result = toDraggableList(draggables).filter(function (draggable) {
    return droppableId === draggable.descriptor.droppableId;
  }).sort(function (a, b) {
    return a.descriptor.index - b.descriptor.index;
  });
  return result;
});

var isPartiallyVisibleThroughFrame = (function (frame) {
  var isWithinVertical = isWithin(frame.top, frame.bottom);
  var isWithinHorizontal = isWithin(frame.left, frame.right);
  return function (subject) {
    var isContained = isWithinVertical(subject.top) && isWithinVertical(subject.bottom) && isWithinHorizontal(subject.left) && isWithinHorizontal(subject.right);

    if (isContained) {
      return true;
    }

    var isPartiallyVisibleVertically = isWithinVertical(subject.top) || isWithinVertical(subject.bottom);
    var isPartiallyVisibleHorizontally = isWithinHorizontal(subject.left) || isWithinHorizontal(subject.right);
    var isPartiallyContained = isPartiallyVisibleVertically && isPartiallyVisibleHorizontally;

    if (isPartiallyContained) {
      return true;
    }

    var isBiggerVertically = subject.top < frame.top && subject.bottom > frame.bottom;
    var isBiggerHorizontally = subject.left < frame.left && subject.right > frame.right;
    var isTargetBiggerThanFrame = isBiggerVertically && isBiggerHorizontally;

    if (isTargetBiggerThanFrame) {
      return true;
    }

    var isTargetBiggerOnOneAxis = isBiggerVertically && isPartiallyVisibleHorizontally || isBiggerHorizontally && isPartiallyVisibleVertically;
    return isTargetBiggerOnOneAxis;
  };
});

var isTotallyVisibleThroughFrame = (function (frame) {
  var isWithinVertical = isWithin(frame.top, frame.bottom);
  var isWithinHorizontal = isWithin(frame.left, frame.right);
  return function (subject) {
    var isContained = isWithinVertical(subject.top) && isWithinVertical(subject.bottom) && isWithinHorizontal(subject.left) && isWithinHorizontal(subject.right);
    return isContained;
  };
});

var vertical = {
  direction: 'vertical',
  line: 'y',
  crossAxisLine: 'x',
  start: 'top',
  end: 'bottom',
  size: 'height',
  crossAxisStart: 'left',
  crossAxisEnd: 'right',
  crossAxisSize: 'width'
};
var horizontal = {
  direction: 'horizontal',
  line: 'x',
  crossAxisLine: 'y',
  start: 'left',
  end: 'right',
  size: 'width',
  crossAxisStart: 'top',
  crossAxisEnd: 'bottom',
  crossAxisSize: 'height'
};

var isTotallyVisibleThroughFrameOnAxis = (function (axis) {
  return function (frame) {
    var isWithinVertical = isWithin(frame.top, frame.bottom);
    var isWithinHorizontal = isWithin(frame.left, frame.right);
    return function (subject) {
      if (axis === vertical) {
        return isWithinVertical(subject.top) && isWithinVertical(subject.bottom);
      }

      return isWithinHorizontal(subject.left) && isWithinHorizontal(subject.right);
    };
  };
});

var getDroppableDisplaced = function getDroppableDisplaced(target, destination) {
  var displacement = destination.frame ? destination.frame.scroll.diff.displacement : origin;
  return offsetByPosition(target, displacement);
};

var isVisibleInDroppable = function isVisibleInDroppable(target, destination, isVisibleThroughFrameFn) {
  if (!destination.subject.active) {
    return false;
  }

  return isVisibleThroughFrameFn(destination.subject.active)(target);
};

var isVisibleInViewport = function isVisibleInViewport(target, viewport, isVisibleThroughFrameFn) {
  return isVisibleThroughFrameFn(viewport)(target);
};

var isVisible = function isVisible(_ref) {
  var toBeDisplaced = _ref.target,
      destination = _ref.destination,
      viewport = _ref.viewport,
      withDroppableDisplacement = _ref.withDroppableDisplacement,
      isVisibleThroughFrameFn = _ref.isVisibleThroughFrameFn;
  var displacedTarget = withDroppableDisplacement ? getDroppableDisplaced(toBeDisplaced, destination) : toBeDisplaced;
  return isVisibleInDroppable(displacedTarget, destination, isVisibleThroughFrameFn) && isVisibleInViewport(displacedTarget, viewport, isVisibleThroughFrameFn);
};

var isPartiallyVisible = function isPartiallyVisible(args) {
  return isVisible(_extends({}, args, {
    isVisibleThroughFrameFn: isPartiallyVisibleThroughFrame
  }));
};
var isTotallyVisible = function isTotallyVisible(args) {
  return isVisible(_extends({}, args, {
    isVisibleThroughFrameFn: isTotallyVisibleThroughFrame
  }));
};
var isTotallyVisibleOnAxis = function isTotallyVisibleOnAxis(args) {
  return isVisible(_extends({}, args, {
    isVisibleThroughFrameFn: isTotallyVisibleThroughFrameOnAxis(args.destination.axis)
  }));
};

var getShouldAnimate = function getShouldAnimate(isVisible, previous) {
  if (!isVisible) {
    return false;
  }

  if (!previous) {
    return true;
  }

  return previous.shouldAnimate;
};

var getDisplacement = (function (_ref) {
  var draggable = _ref.draggable,
      destination = _ref.destination,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport;
  var id = draggable.descriptor.id;
  var map = previousImpact.movement.map;
  var isVisible = isPartiallyVisible({
    target: draggable.page.marginBox,
    destination: destination,
    viewport: viewport,
    withDroppableDisplacement: true
  });
  var shouldAnimate = getShouldAnimate(isVisible, map[id]);
  var displacement = {
    draggableId: id,
    isVisible: isVisible,
    shouldAnimate: shouldAnimate
  };
  return displacement;
});

var getDisplacementMap = memoizeOne(function (displaced) {
  return displaced.reduce(function (map, displacement) {
    map[displacement.draggableId] = displacement;
    return map;
  }, {});
});

var isUserMovingForward = (function (axis, direction) {
  return axis === vertical ? direction.vertical === 'down' : direction.horizontal === 'right';
});

var getDisplacedBy = memoizeOne(function (axis, displaceBy, willDisplaceForward) {
  var modifier = willDisplaceForward ? 1 : -1;
  var displacement = displaceBy[axis.line] * modifier;
  return {
    value: displacement,
    point: patch(axis.line, displacement)
  };
});

var getNewIndex = function getNewIndex(startIndex, amountOfDisplaced, isInFrontOfStart) {
  if (!amountOfDisplaced) {
    return startIndex;
  }

  if (isInFrontOfStart) {
    return startIndex + amountOfDisplaced;
  }

  return startIndex - amountOfDisplaced;
};

var inHomeList = (function (_ref) {
  var currentCenter = _ref.pageBorderBoxCenterWithDroppableScrollChange,
      draggable = _ref.draggable,
      home = _ref.home,
      insideHome = _ref.insideHome,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport,
      currentUserDirection = _ref.userDirection;
  var axis = home.axis;
  var originalCenter = draggable.page.borderBox.center;
  var targetCenter = currentCenter[axis.line];
  var isInFrontOfStart = targetCenter > originalCenter[axis.line];
  var willDisplaceForward = !isInFrontOfStart;
  var isMovingForward = isUserMovingForward(home.axis, currentUserDirection);
  var isMovingTowardStart = isInFrontOfStart ? !isMovingForward : isMovingForward;
  var displacedBy = getDisplacedBy(home.axis, draggable.displaceBy, willDisplaceForward);
  var displacement = displacedBy.value;
  var displaced = insideHome.filter(function (child) {
    if (child === draggable) {
      return false;
    }

    var borderBox = child.page.borderBox;
    var start = borderBox[axis.start];
    var end = borderBox[axis.end];

    if (isInFrontOfStart) {
      if (child.descriptor.index < draggable.descriptor.index) {
        return false;
      }

      if (isMovingTowardStart) {
        var displacedEndEdge = end + displacement;
        return targetCenter > displacedEndEdge;
      }

      return targetCenter >= start;
    }

    if (child.descriptor.index > draggable.descriptor.index) {
      return false;
    }

    if (isMovingTowardStart) {
      var displacedStartEdge = start + displacement;
      return targetCenter < displacedStartEdge;
    }

    return targetCenter <= end;
  }).map(function (dimension) {
    return getDisplacement({
      draggable: dimension,
      destination: home,
      previousImpact: previousImpact,
      viewport: viewport.frame
    });
  });
  var ordered = isInFrontOfStart ? displaced.reverse() : displaced;
  var index = getNewIndex(draggable.descriptor.index, ordered.length, isInFrontOfStart);
  var newMovement = {
    displaced: ordered,
    map: getDisplacementMap(ordered),
    willDisplaceForward: willDisplaceForward,
    displacedBy: displacedBy
  };
  var impact = {
    movement: newMovement,
    direction: axis.direction,
    destination: {
      droppableId: home.descriptor.id,
      index: index
    },
    merge: null
  };
  return impact;
});

var inForeignList = (function (_ref) {
  var currentCenter = _ref.pageBorderBoxCenterWithDroppableScrollChange,
      draggable = _ref.draggable,
      destination = _ref.destination,
      insideDestination = _ref.insideDestination,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport,
      userDirection = _ref.userDirection;
  var axis = destination.axis;
  var isMovingForward = isUserMovingForward(destination.axis, userDirection);
  var displacedBy = getDisplacedBy(destination.axis, draggable.displaceBy, true);
  var targetCenter = currentCenter[axis.line];
  var displacement = displacedBy.value;
  var displaced = insideDestination.filter(function (child) {
    var borderBox = child.page.borderBox;
    var start = borderBox[axis.start];
    var end = borderBox[axis.end];

    if (isMovingForward) {
      return targetCenter <= start + displacement;
    }

    return targetCenter < end;
  }).map(function (dimension) {
    return getDisplacement({
      draggable: dimension,
      destination: destination,
      previousImpact: previousImpact,
      viewport: viewport.frame
    });
  });
  var newIndex = insideDestination.length - displaced.length;
  var movement = {
    displacedBy: displacedBy,
    displaced: displaced,
    map: getDisplacementMap(displaced),
    willDisplaceForward: true
  };
  var impact = {
    movement: movement,
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: newIndex
    },
    merge: null
  };
  return impact;
});

var noDisplacedBy = {
  point: origin,
  value: 0
};
var noMovement = {
  displaced: [],
  map: {},
  displacedBy: noDisplacedBy,
  willDisplaceForward: false
};
var noImpact = {
  movement: noMovement,
  direction: null,
  destination: null,
  merge: null
};

var withDroppableScroll = (function (droppable, point) {
  var frame = droppable.frame;

  if (!frame) {
    return point;
  }

  return add(point, frame.scroll.diff.value);
});

var isHomeOf = (function (draggable, destination) {
  return draggable.descriptor.droppableId === destination.descriptor.id;
});

var getWhenEntered = function getWhenEntered(id, current, oldMerge) {
  if (!oldMerge) {
    return current;
  }

  if (id !== oldMerge.combine.draggableId) {
    return current;
  }

  return oldMerge.whenEntered;
};

var isCombiningWith = function isCombiningWith(_ref) {
  var id = _ref.id,
      currentCenter = _ref.currentCenter,
      axis = _ref.axis,
      borderBox = _ref.borderBox,
      displacedBy = _ref.displacedBy,
      currentUserDirection = _ref.currentUserDirection,
      oldMerge = _ref.oldMerge;
  var start = borderBox[axis.start] + displacedBy;
  var end = borderBox[axis.end] + displacedBy;
  var size = borderBox[axis.size];
  var twoThirdsOfSize = size * 0.666;
  var whenEntered = getWhenEntered(id, currentUserDirection, oldMerge);
  var isMovingForward = isUserMovingForward(axis, whenEntered);
  var targetCenter = currentCenter[axis.line];

  if (isMovingForward) {
    return isWithin(start, start + twoThirdsOfSize)(targetCenter);
  }

  return isWithin(end - twoThirdsOfSize, end)(targetCenter);
};

var getCombineImpact = (function (_ref2) {
  var currentCenter = _ref2.pageBorderBoxCenterWithDroppableScrollChange,
      previousImpact = _ref2.previousImpact,
      draggable = _ref2.draggable,
      destination = _ref2.destination,
      insideDestination = _ref2.insideDestination,
      userDirection = _ref2.userDirection;

  if (!destination.isCombineEnabled) {
    return null;
  }

  var axis = destination.axis;
  var map = previousImpact.movement.map;
  var canBeDisplacedBy = previousImpact.movement.displacedBy.value;
  var oldMerge = previousImpact.merge;
  var target = find(insideDestination, function (child) {
    var id = child.descriptor.id;

    if (id === draggable.descriptor.id) {
      return false;
    }

    var isDisplaced = Boolean(map[id]);
    var displacedBy = isDisplaced ? canBeDisplacedBy : 0;
    return isCombiningWith({
      id: id,
      currentCenter: currentCenter,
      axis: axis,
      borderBox: child.page.borderBox,
      displacedBy: displacedBy,
      currentUserDirection: userDirection,
      oldMerge: oldMerge
    });
  });

  if (!target) {
    return null;
  }

  var merge = {
    whenEntered: getWhenEntered(target.descriptor.id, userDirection, oldMerge),
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id
    }
  };

  var withMerge = _extends({}, previousImpact, {
    destination: null,
    merge: merge
  });

  return withMerge;
});

var getDragImpact = (function (_ref) {
  var pageBorderBoxCenter = _ref.pageBorderBoxCenter,
      draggable = _ref.draggable,
      draggables = _ref.draggables,
      droppables = _ref.droppables,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport,
      userDirection = _ref.userDirection;
  var destinationId = getDroppableOver({
    target: pageBorderBoxCenter,
    droppables: droppables
  });

  if (!destinationId) {
    return noImpact;
  }

  var destination = droppables[destinationId];
  var isWithinHomeDroppable = isHomeOf(draggable, destination);
  var insideDestination = getDraggablesInsideDroppable(destination.descriptor.id, draggables);
  var pageBorderBoxCenterWithDroppableScrollChange = withDroppableScroll(destination, pageBorderBoxCenter);
  var withMerge = getCombineImpact({
    pageBorderBoxCenterWithDroppableScrollChange: pageBorderBoxCenterWithDroppableScrollChange,
    previousImpact: previousImpact,
    draggable: draggable,
    destination: destination,
    insideDestination: insideDestination,
    userDirection: userDirection
  });

  if (withMerge) {
    return withMerge;
  }

  return isWithinHomeDroppable ? inHomeList({
    pageBorderBoxCenterWithDroppableScrollChange: pageBorderBoxCenterWithDroppableScrollChange,
    draggable: draggable,
    home: destination,
    insideHome: insideDestination,
    previousImpact: previousImpact,
    viewport: viewport,
    userDirection: userDirection
  }) : inForeignList({
    pageBorderBoxCenterWithDroppableScrollChange: pageBorderBoxCenterWithDroppableScrollChange,
    draggable: draggable,
    destination: destination,
    insideDestination: insideDestination,
    previousImpact: previousImpact,
    viewport: viewport,
    userDirection: userDirection
  });
});

var getDragPositions = (function (_ref) {
  var oldInitial = _ref.initial,
      oldCurrent = _ref.current,
      oldClientBorderBoxCenter = _ref.oldClientBorderBoxCenter,
      newClientBorderBoxCenter = _ref.newClientBorderBoxCenter,
      viewport = _ref.viewport;
  var shift = subtract(newClientBorderBoxCenter, oldClientBorderBoxCenter);

  var initial = function () {
    var client = {
      selection: add(oldInitial.client.selection, shift),
      borderBoxCenter: newClientBorderBoxCenter,
      offset: origin
    };
    var page = {
      selection: add(client.selection, viewport.scroll.initial),
      borderBoxCenter: add(client.selection, viewport.scroll.initial)
    };
    return {
      client: client,
      page: page
    };
  }();

  var current = function () {
    var reverse = negate(shift);
    var offset$$1 = add(oldCurrent.client.offset, reverse);
    var client = {
      selection: add(initial.client.selection, offset$$1),
      borderBoxCenter: add(initial.client.borderBoxCenter, offset$$1),
      offset: offset$$1
    };
    var page = {
      selection: add(client.selection, viewport.scroll.current),
      borderBoxCenter: add(client.borderBoxCenter, viewport.scroll.current)
    };
    !isEqual(oldCurrent.client.borderBoxCenter, client.borderBoxCenter) ? process.env.NODE_ENV !== "production" ? invariant(false, "\n        Incorrect new client center position.\n        Expected (" + oldCurrent.client.borderBoxCenter.x + ", " + oldCurrent.client.borderBoxCenter.y + ")\n        to equal (" + client.borderBoxCenter.x + ", " + client.borderBoxCenter.y + ")\n      ") : invariant(false) : void 0;
    return {
      client: client,
      page: page
    };
  }();

  return {
    current: current,
    initial: initial
  };
});

var getMaxScroll = (function (_ref) {
  var scrollHeight = _ref.scrollHeight,
      scrollWidth = _ref.scrollWidth,
      height = _ref.height,
      width = _ref.width;
  var maxScroll = subtract({
    x: scrollWidth,
    y: scrollHeight
  }, {
    x: width,
    y: height
  });
  var adjustedMaxScroll = {
    x: Math.max(0, maxScroll.x),
    y: Math.max(0, maxScroll.y)
  };
  return adjustedMaxScroll;
});

var getDroppableDimension = (function (_ref) {
  var descriptor = _ref.descriptor,
      isEnabled = _ref.isEnabled,
      isCombineEnabled = _ref.isCombineEnabled,
      isFixedOnPage = _ref.isFixedOnPage,
      direction = _ref.direction,
      client = _ref.client,
      page = _ref.page,
      closest$$1 = _ref.closest;

  var frame = function () {
    if (!closest$$1) {
      return null;
    }

    var scrollSize = closest$$1.scrollSize,
        frameClient = closest$$1.client;
    var maxScroll = getMaxScroll({
      scrollHeight: scrollSize.scrollHeight,
      scrollWidth: scrollSize.scrollWidth,
      height: frameClient.paddingBox.height,
      width: frameClient.paddingBox.width
    });
    return {
      pageMarginBox: closest$$1.page.marginBox,
      frameClient: frameClient,
      scrollSize: scrollSize,
      shouldClipSubject: closest$$1.shouldClipSubject,
      scroll: {
        initial: closest$$1.scroll,
        current: closest$$1.scroll,
        max: maxScroll,
        diff: {
          value: origin,
          displacement: origin
        }
      }
    };
  }();

  var axis = direction === 'vertical' ? vertical : horizontal;
  var subject = getSubject({
    page: page,
    withPlaceholder: null,
    axis: axis,
    frame: frame
  });
  var dimension = {
    descriptor: descriptor,
    isCombineEnabled: isCombineEnabled,
    isFixedOnPage: isFixedOnPage,
    axis: axis,
    isEnabled: isEnabled,
    client: client,
    page: page,
    frame: frame,
    subject: subject
  };
  return dimension;
});

var getRequiredGrowthForPlaceholder = function getRequiredGrowthForPlaceholder(droppable, placeholderSize, draggables) {
  var axis = droppable.axis;
  var availableSpace = droppable.subject.page.contentBox[axis.size];
  var insideDroppable = getDraggablesInsideDroppable(droppable.descriptor.id, draggables);
  var spaceUsed = insideDroppable.reduce(function (sum, dimension) {
    return sum + dimension.client.marginBox[axis.size];
  }, 0);
  var requiredSpace = spaceUsed + placeholderSize[axis.line];
  var needsToGrowBy = requiredSpace - availableSpace;

  if (needsToGrowBy <= 0) {
    return null;
  }

  return patch(axis.line, needsToGrowBy);
};

var withMaxScroll = function withMaxScroll(frame, max) {
  return _extends({}, frame, {
    scroll: _extends({}, frame.scroll, {
      max: max
    })
  });
};

var addPlaceholder = function addPlaceholder(droppable, displaceBy, draggables) {
  var frame = droppable.frame;
  !!droppable.subject.withPlaceholder ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot add placeholder size to a subject when it already has one') : invariant(false) : void 0;
  var placeholderSize = patch(droppable.axis.line, displaceBy[droppable.axis.line]);
  var requiredGrowth = getRequiredGrowthForPlaceholder(droppable, placeholderSize, draggables);
  var added = {
    placeholderSize: placeholderSize,
    increasedBy: requiredGrowth,
    oldFrameMaxScroll: droppable.frame ? droppable.frame.scroll.max : null
  };

  if (!frame) {
    var _subject = getSubject({
      page: droppable.subject.page,
      withPlaceholder: added,
      axis: droppable.axis,
      frame: droppable.frame
    });

    return _extends({}, droppable, {
      subject: _subject
    });
  }

  var maxScroll = requiredGrowth ? add(frame.scroll.max, requiredGrowth) : frame.scroll.max;
  var newFrame = withMaxScroll(frame, maxScroll);
  var subject = getSubject({
    page: droppable.subject.page,
    withPlaceholder: added,
    axis: droppable.axis,
    frame: newFrame
  });
  return _extends({}, droppable, {
    subject: subject,
    frame: newFrame
  });
};
var removePlaceholder = function removePlaceholder(droppable) {
  var added = droppable.subject.withPlaceholder;
  !added ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot remove placeholder form subject when there was none') : invariant(false) : void 0;
  var frame = droppable.frame;

  if (!frame) {
    var _subject2 = getSubject({
      page: droppable.subject.page,
      axis: droppable.axis,
      frame: null,
      withPlaceholder: null
    });

    return _extends({}, droppable, {
      subject: _subject2
    });
  }

  var oldMaxScroll = added.oldFrameMaxScroll;
  !oldMaxScroll ? process.env.NODE_ENV !== "production" ? invariant(false, 'Expected droppable with frame to have old max frame scroll when removing placeholder') : invariant(false) : void 0;
  var newFrame = withMaxScroll(frame, oldMaxScroll);
  var subject = getSubject({
    page: droppable.subject.page,
    axis: droppable.axis,
    frame: newFrame,
    withPlaceholder: null
  });
  return _extends({}, droppable, {
    subject: subject,
    frame: newFrame
  });
};

var getFrame = (function (droppable) {
  var frame = droppable.frame;
  !frame ? process.env.NODE_ENV !== "production" ? invariant(false, 'Expected Droppable to have a frame') : invariant(false) : void 0;
  return frame;
});

var throwIfSpacingChange = function throwIfSpacingChange(old, fresh) {
  if (process.env.NODE_ENV !== 'production') {
    var getMessage = function getMessage(spacingType) {
      return "Cannot change the " + spacingType + " of a Droppable during a drag";
    };

    !isEqual$1(old.margin, fresh.margin) ? process.env.NODE_ENV !== "production" ? invariant(false, getMessage('margin')) : invariant(false) : void 0;
    !isEqual$1(old.border, fresh.border) ? process.env.NODE_ENV !== "production" ? invariant(false, getMessage('border')) : invariant(false) : void 0;
    !isEqual$1(old.padding, fresh.padding) ? process.env.NODE_ENV !== "production" ? invariant(false, getMessage('padding')) : invariant(false) : void 0;
  }
};

var adjustBorderBoxSize = function adjustBorderBoxSize(axis, old, fresh) {
  return {
    top: old.top,
    left: old.left,
    right: old.left + fresh.width,
    bottom: old.top + fresh.height
  };
};

var adjustModifiedDroppables = (function (_ref) {
  var modified = _ref.modified,
      existingDroppables = _ref.existingDroppables,
      initialWindowScroll = _ref.initialWindowScroll;

  if (!modified.length) {
    return modified;
  }

  var adjusted = modified.map(function (provided) {
    var raw = existingDroppables[provided.descriptor.id];
    !raw ? process.env.NODE_ENV !== "production" ? invariant(false, 'Could not locate droppable in existing droppables') : invariant(false) : void 0;
    var existing = raw.subject.withPlaceholder ? removePlaceholder(raw) : raw;
    var oldClient = existing.client;
    var newClient = provided.client;
    var oldScrollable = getFrame(existing);
    var newScrollable = getFrame(provided);

    if (process.env.NODE_ENV !== 'production') {
      throwIfSpacingChange(existing.client, provided.client);
      throwIfSpacingChange(oldScrollable.frameClient, newScrollable.frameClient);
      var isFrameEqual = oldScrollable.frameClient.borderBox.height === newScrollable.frameClient.borderBox.height && oldScrollable.frameClient.borderBox.width === newScrollable.frameClient.borderBox.width;
      !isFrameEqual ? process.env.NODE_ENV !== "production" ? invariant(false, 'The width and height of your Droppable scroll container cannot change when adding or removing Draggables during a drag') : invariant(false) : void 0;
    }

    var client = createBox({
      borderBox: adjustBorderBoxSize(existing.axis, oldClient.borderBox, newClient.borderBox),
      margin: oldClient.margin,
      border: oldClient.border,
      padding: oldClient.padding
    });
    var closest = {
      client: oldScrollable.frameClient,
      page: withScroll(oldScrollable.frameClient, initialWindowScroll),
      shouldClipSubject: oldScrollable.shouldClipSubject,
      scrollSize: newScrollable.scrollSize,
      scroll: oldScrollable.scroll.initial
    };
    var withSizeChanged = getDroppableDimension({
      descriptor: provided.descriptor,
      isEnabled: provided.isEnabled,
      isCombineEnabled: provided.isCombineEnabled,
      isFixedOnPage: provided.isFixedOnPage,
      direction: provided.axis.direction,
      client: client,
      page: withScroll(client, initialWindowScroll),
      closest: closest
    });
    var scrolled = scrollDroppable(withSizeChanged, newScrollable.scroll.current);
    return scrolled;
  });
  return adjusted;
});

var adjustAdditionsForScrollChanges = (function (_ref) {
  var additions = _ref.additions,
      modifiedDroppables = _ref.modified,
      viewport = _ref.viewport;
  var windowScrollChange = viewport.scroll.diff.value;
  var modifiedMap = toDroppableMap(modifiedDroppables);
  return additions.map(function (draggable) {
    var droppableId = draggable.descriptor.droppableId;
    var modified = modifiedMap[droppableId];
    var frame = modified.frame;
    !frame ? process.env.NODE_ENV !== "production" ? invariant(false) : invariant(false) : void 0;
    var droppableScrollChange = frame.scroll.diff.value;
    var totalChange = add(windowScrollChange, droppableScrollChange);
    var client = offset(draggable.client, totalChange);
    var page = withScroll(client, viewport.scroll.initial);

    var moved = _extends({}, draggable, {
      placeholder: _extends({}, draggable.placeholder, {
        client: client
      }),
      client: client,
      page: page
    });

    return moved;
  });
});

var getDraggableMap = (function (_ref) {
  var existing = _ref.existing,
      addedDraggables = _ref.additions,
      removedDraggables = _ref.removals,
      initialWindowScroll = _ref.initialWindowScroll;
  var droppables = toDroppableList(existing.droppables);
  var shifted = {};
  droppables.forEach(function (droppable) {
    var axis = droppable.axis;
    var original = getDraggablesInsideDroppable(droppable.descriptor.id, existing.draggables);
    var toShift = {};

    var addShift = function addShift(id, shift) {
      var previous = toShift[id];

      if (!previous) {
        toShift[id] = shift;
        return;
      }

      toShift[id] = {
        indexChange: previous.indexChange + shift.indexChange,
        offset: add(previous.offset, shift.offset)
      };
    };

    var removals = toDraggableMap(removedDraggables.map(function (id) {
      return existing.draggables[id];
    }).filter(function (draggable) {
      return draggable.descriptor.droppableId === droppable.descriptor.id;
    }));
    var withRemovals = original.filter(function (item, index) {
      var isBeingRemoved = Boolean(removals[item.descriptor.id]);

      if (!isBeingRemoved) {
        return true;
      }

      var offset$$1 = negate(patch(axis.line, item.client.marginBox[axis.size]));
      original.slice(index).forEach(function (sibling) {
        if (removals[sibling.descriptor.id]) {
          return;
        }

        addShift(sibling.descriptor.id, {
          indexChange: -1,
          offset: offset$$1
        });
      });
      return false;
    });
    var additions = addedDraggables.filter(function (draggable) {
      return draggable.descriptor.droppableId === droppable.descriptor.id;
    });
    var withAdditions = withRemovals.slice(0);
    additions.forEach(function (item) {
      withAdditions.splice(item.descriptor.index, 0, item);
    });
    var additionMap = toDraggableMap(additions);
    withAdditions.forEach(function (item, index) {
      var wasAdded = Boolean(additionMap[item.descriptor.id]);

      if (!wasAdded) {
        return;
      }

      var offset$$1 = patch(axis.line, item.client.marginBox[axis.size]);
      withAdditions.slice(index).forEach(function (sibling) {
        if (additionMap[sibling.descriptor.id]) {
          return;
        }

        addShift(sibling.descriptor.id, {
          indexChange: 1,
          offset: offset$$1
        });
      });
    });
    withAdditions.forEach(function (item) {
      if (additionMap[item.descriptor.id]) {
        return;
      }

      var shift = toShift[item.descriptor.id];

      if (!shift) {
        return;
      }

      var client = offset(item.client, shift.offset);
      var page = withScroll(client, initialWindowScroll);
      var index = item.descriptor.index + shift.indexChange;

      var moved = _extends({}, item, {
        descriptor: _extends({}, item.descriptor, {
          index: index
        }),
        placeholder: _extends({}, item.placeholder, {
          client: client
        }),
        client: client,
        page: page
      });

      shifted[moved.descriptor.id] = moved;
    });
  });

  var draggableMap = _extends({}, existing.draggables, shifted, toDraggableMap(addedDraggables));

  removedDraggables.forEach(function (id) {
    delete draggableMap[id];
  });
  return draggableMap;
});

var withNoAnimatedDisplacement = (function (impact) {
  var displaced = impact.movement.displaced;

  if (!displaced.length) {
    return impact;
  }

  var withoutAnimation = displaced.map(function (displacement) {
    if (!displacement.shouldAnimate) {
      return displacement;
    }

    return _extends({}, displacement, {
      shouldAnimate: false
    });
  });

  var result = _extends({}, impact, {
    movement: _extends({}, impact.movement, {
      displaced: withoutAnimation,
      map: getDisplacementMap(withoutAnimation)
    })
  });

  return result;
});

var whatIsDraggedOver = (function (impact) {
  var merge = impact.merge,
      destination = impact.destination;

  if (destination) {
    return destination.droppableId;
  }

  if (merge) {
    return merge.combine.droppableId;
  }

  return null;
});

var shouldUsePlaceholder = (function (descriptor, impact) {
  var isOver = whatIsDraggedOver(impact);

  if (!isOver) {
    return false;
  }

  return isOver !== descriptor.droppableId;
});

var patchDroppableMap = (function (dimensions, updated) {
  var _extends2;

  return _extends({}, dimensions, {
    droppables: _extends({}, dimensions.droppables, (_extends2 = {}, _extends2[updated.descriptor.id] = updated, _extends2))
  });
});

var clearUnusedPlaceholder = function clearUnusedPlaceholder(_ref) {
  var previousImpact = _ref.previousImpact,
      impact = _ref.impact,
      dimensions = _ref.dimensions;
  var last = whatIsDraggedOver(previousImpact);
  var now = whatIsDraggedOver(impact);

  if (!last) {
    return dimensions;
  }

  if (last === now) {
    return dimensions;
  }

  var lastDroppable = dimensions.droppables[last];

  if (!lastDroppable.subject.withPlaceholder) {
    return dimensions;
  }

  var updated = removePlaceholder(lastDroppable);
  return patchDroppableMap(dimensions, updated);
};

var getDimensionMapWithPlaceholder = (function (_ref2) {
  var dimensions = _ref2.dimensions,
      previousImpact = _ref2.previousImpact,
      draggable = _ref2.draggable,
      impact = _ref2.impact;
  var base = clearUnusedPlaceholder({
    previousImpact: previousImpact,
    impact: impact,
    dimensions: dimensions
  });
  var usePlaceholder = shouldUsePlaceholder(draggable.descriptor, impact);

  if (!usePlaceholder) {
    return base;
  }

  var droppableId = whatIsDraggedOver(impact);

  if (!droppableId) {
    return base;
  }

  var droppable = base.droppables[droppableId];

  if (droppable.subject.withPlaceholder) {
    return base;
  }

  var patched = addPlaceholder(droppable, draggable.displaceBy, base.draggables);
  return patchDroppableMap(base, patched);
});

var timingsKey = 'Processing dynamic changes';
var publishWhileDragging = (function (_ref) {
  var _extends2, _extends3;

  var state = _ref.state,
      published = _ref.published;
  start(timingsKey);
  var adjusted = adjustModifiedDroppables({
    modified: published.modified,
    existingDroppables: state.dimensions.droppables,
    initialWindowScroll: state.viewport.scroll.initial
  });
  var shifted = adjustAdditionsForScrollChanges({
    additions: published.additions,
    modified: adjusted,
    viewport: state.viewport
  });
  var patched = {
    draggables: state.dimensions.draggables,
    droppables: _extends({}, state.dimensions.droppables, toDroppableMap(adjusted))
  };
  var draggables = getDraggableMap({
    existing: patched,
    additions: shifted,
    removals: published.removals,
    initialWindowScroll: state.viewport.scroll.initial
  });
  var dragging = state.critical.draggable.id;
  var original = state.dimensions.draggables[dragging];
  var updated = draggables[dragging];
  var dimensions = getDimensionMapWithPlaceholder({
    previousImpact: state.impact,
    impact: state.impact,
    draggable: updated,
    dimensions: {
      draggables: draggables,
      droppables: patched.droppables
    }
  });
  var critical = {
    droppable: state.critical.droppable,
    draggable: updated.descriptor
  };

  var _getDragPositions = getDragPositions({
    initial: state.initial,
    current: state.current,
    oldClientBorderBoxCenter: original.client.borderBox.center,
    newClientBorderBoxCenter: updated.client.borderBox.center,
    viewport: state.viewport
  }),
      initial = _getDragPositions.initial,
      current = _getDragPositions.current;

  var impact = withNoAnimatedDisplacement(getDragImpact({
    pageBorderBoxCenter: current.page.borderBoxCenter,
    draggable: dimensions.draggables[state.critical.draggable.id],
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    previousImpact: noImpact,
    viewport: state.viewport,
    userDirection: state.userDirection
  }));
  var isOrphaned = Boolean(state.movementMode === 'SNAP' && state.impact.destination && !impact.destination);
  !!isOrphaned ? process.env.NODE_ENV !== "production" ? invariant(false, 'Dragging item no longer has a valid destination after a dynamic update. This is not supported') : invariant(false) : void 0;
  finish(timingsKey);

  var draggingState = _extends({
    phase: 'DRAGGING'
  }, state, (_extends2 = {}, _extends2["phase"] = 'DRAGGING', _extends2.critical = critical, _extends2.current = current, _extends2.initial = initial, _extends2.impact = impact, _extends2.dimensions = dimensions, _extends2.forceShouldAnimate = false, _extends2));

  if (state.phase === 'COLLECTING') {
    return draggingState;
  }

  var dropPending = _extends({
    phase: 'DROP_PENDING'
  }, draggingState, (_extends3 = {}, _extends3["phase"] = 'DROP_PENDING', _extends3.reason = state.reason, _extends3.isWaiting = false, _extends3));

  return dropPending;
});

var getKnownActive = function getKnownActive(droppable) {
  var rect = droppable.subject.active;
  !rect ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot get clipped area from droppable') : invariant(false) : void 0;
  return rect;
};

var getBestCrossAxisDroppable = (function (_ref) {
  var isMovingForward = _ref.isMovingForward,
      pageBorderBoxCenter = _ref.pageBorderBoxCenter,
      source = _ref.source,
      droppables = _ref.droppables,
      viewport = _ref.viewport;
  var active = source.subject.active;

  if (!active) {
    return null;
  }

  var axis = source.axis;
  var isBetweenSourceClipped = isWithin(active[axis.start], active[axis.end]);
  var candidates = toDroppableList(droppables).filter(function (droppable) {
    return droppable !== source;
  }).filter(function (droppable) {
    return droppable.isEnabled;
  }).filter(function (droppable) {
    return Boolean(droppable.subject.active);
  }).filter(function (droppable) {
    return isPartiallyVisibleThroughFrame(viewport.frame)(getKnownActive(droppable));
  }).filter(function (droppable) {
    var activeOfTarget = getKnownActive(droppable);

    if (isMovingForward) {
      return active[axis.crossAxisEnd] < activeOfTarget[axis.crossAxisEnd];
    }

    return activeOfTarget[axis.crossAxisStart] < active[axis.crossAxisStart];
  }).filter(function (droppable) {
    var activeOfTarget = getKnownActive(droppable);
    var isBetweenDestinationClipped = isWithin(activeOfTarget[axis.start], activeOfTarget[axis.end]);
    return isBetweenSourceClipped(activeOfTarget[axis.start]) || isBetweenSourceClipped(activeOfTarget[axis.end]) || isBetweenDestinationClipped(active[axis.start]) || isBetweenDestinationClipped(active[axis.end]);
  }).sort(function (a, b) {
    var first = getKnownActive(a)[axis.crossAxisStart];
    var second = getKnownActive(b)[axis.crossAxisStart];

    if (isMovingForward) {
      return first - second;
    }

    return second - first;
  }).filter(function (droppable, index, array) {
    return getKnownActive(droppable)[axis.crossAxisStart] === getKnownActive(array[0])[axis.crossAxisStart];
  });

  if (!candidates.length) {
    return null;
  }

  if (candidates.length === 1) {
    return candidates[0];
  }

  var contains = candidates.filter(function (droppable) {
    var isWithinDroppable = isWithin(getKnownActive(droppable)[axis.start], getKnownActive(droppable)[axis.end]);
    return isWithinDroppable(pageBorderBoxCenter[axis.line]);
  });

  if (contains.length === 1) {
    return contains[0];
  }

  if (contains.length > 1) {
    return contains.sort(function (a, b) {
      return getKnownActive(a)[axis.start] - getKnownActive(b)[axis.start];
    })[0];
  }

  return candidates.sort(function (a, b) {
    var first = closest(pageBorderBoxCenter, getCorners(getKnownActive(a)));
    var second = closest(pageBorderBoxCenter, getCorners(getKnownActive(b)));

    if (first !== second) {
      return first - second;
    }

    return getKnownActive(a)[axis.start] - getKnownActive(b)[axis.start];
  })[0];
});

var withDroppableDisplacement = (function (droppable, point) {
  var frame = droppable.frame;

  if (!frame) {
    return point;
  }

  return add(point, frame.scroll.diff.displacement);
});

var getClosestDraggable = (function (_ref) {
  var axis = _ref.axis,
      pageBorderBoxCenter = _ref.pageBorderBoxCenter,
      viewport = _ref.viewport,
      destination = _ref.destination,
      insideDestination = _ref.insideDestination;
  var sorted = insideDestination.filter(function (draggable) {
    return isTotallyVisible({
      target: draggable.page.borderBox,
      destination: destination,
      viewport: viewport.frame,
      withDroppableDisplacement: true
    });
  }).sort(function (a, b) {
    var distanceToA = distance(pageBorderBoxCenter, withDroppableDisplacement(destination, a.page.borderBox.center));
    var distanceToB = distance(pageBorderBoxCenter, withDroppableDisplacement(destination, b.page.borderBox.center));

    if (distanceToA < distanceToB) {
      return -1;
    }

    if (distanceToB < distanceToA) {
      return 1;
    }

    return a.page.borderBox[axis.start] - b.page.borderBox[axis.start];
  });
  return sorted[0] || null;
});

var getWillDisplaceForward = (function (_ref) {
  var isInHomeList = _ref.isInHomeList,
      proposedIndex = _ref.proposedIndex,
      startIndexInHome = _ref.startIndexInHome;
  return isInHomeList ? proposedIndex < startIndexInHome : true;
});

var getHomeLocation = (function (descriptor) {
  return {
    index: descriptor.index,
    droppableId: descriptor.droppableId
  };
});

var getHomeImpact = (function (draggable, home) {
  return {
    movement: noMovement,
    direction: home.axis.direction,
    destination: getHomeLocation(draggable.descriptor),
    merge: null
  };
});

var toHomeList = (function (_ref) {
  var moveIntoIndexOf = _ref.moveIntoIndexOf,
      insideDestination = _ref.insideDestination,
      draggable = _ref.draggable,
      destination = _ref.destination,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport;

  if (!moveIntoIndexOf) {
    return null;
  }

  var axis = destination.axis;
  var homeIndex = draggable.descriptor.index;
  var targetIndex = moveIntoIndexOf.descriptor.index;

  if (homeIndex === targetIndex) {
    return getHomeImpact(draggable, destination);
  }

  var willDisplaceForward = getWillDisplaceForward({
    isInHomeList: true,
    proposedIndex: targetIndex,
    startIndexInHome: homeIndex
  });
  var isMovingAfterStart = !willDisplaceForward;
  var modified = isMovingAfterStart ? insideDestination.slice(homeIndex + 1, targetIndex + 1).reverse() : insideDestination.slice(targetIndex, homeIndex);
  var displaced = modified.map(function (dimension) {
    return getDisplacement({
      draggable: dimension,
      destination: destination,
      previousImpact: previousImpact,
      viewport: viewport.frame
    });
  });
  !displaced.length ? process.env.NODE_ENV !== "production" ? invariant(false, 'Must displace as least one thing if not moving into the home index') : invariant(false) : void 0;
  var displacedBy = getDisplacedBy(destination.axis, draggable.displaceBy, willDisplaceForward);
  var impact = {
    movement: {
      displacedBy: displacedBy,
      displaced: displaced,
      map: getDisplacementMap(displaced),
      willDisplaceForward: willDisplaceForward
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: targetIndex
    },
    merge: null
  };
  return impact;
});

var whenCombining = (function (_ref) {
  var combine = _ref.combine,
      movement = _ref.movement,
      draggables = _ref.draggables;
  var groupingWith = combine.draggableId;
  var isDisplaced = Boolean(movement.map[groupingWith]);
  var center = draggables[groupingWith].page.borderBox.center;
  return isDisplaced ? add(center, movement.displacedBy.point) : center;
});

var distanceFromStartToBorderBoxCenter = function distanceFromStartToBorderBoxCenter(axis, box) {
  return box.margin[axis.start] + box.borderBox[axis.size] / 2;
};

var distanceFromEndToBorderBoxCenter = function distanceFromEndToBorderBoxCenter(axis, box) {
  return box.margin[axis.end] + box.borderBox[axis.size] / 2;
};

var getCrossAxisBorderBoxCenter = function getCrossAxisBorderBoxCenter(axis, target, isMoving) {
  return target[axis.crossAxisStart] + isMoving.margin[axis.crossAxisStart] + isMoving.borderBox[axis.crossAxisSize] / 2;
};

var goAfter = function goAfter(_ref) {
  var axis = _ref.axis,
      moveRelativeTo = _ref.moveRelativeTo,
      isMoving = _ref.isMoving;
  return patch(axis.line, moveRelativeTo.marginBox[axis.end] + distanceFromStartToBorderBoxCenter(axis, isMoving), getCrossAxisBorderBoxCenter(axis, moveRelativeTo.marginBox, isMoving));
};
var goBefore = function goBefore(_ref2) {
  var axis = _ref2.axis,
      moveRelativeTo = _ref2.moveRelativeTo,
      isMoving = _ref2.isMoving;
  return patch(axis.line, moveRelativeTo.marginBox[axis.start] - distanceFromEndToBorderBoxCenter(axis, isMoving), getCrossAxisBorderBoxCenter(axis, moveRelativeTo.marginBox, isMoving));
};
var goIntoStart = function goIntoStart(_ref3) {
  var axis = _ref3.axis,
      moveInto = _ref3.moveInto,
      isMoving = _ref3.isMoving;
  return patch(axis.line, moveInto.contentBox[axis.start] + distanceFromStartToBorderBoxCenter(axis, isMoving), getCrossAxisBorderBoxCenter(axis, moveInto.contentBox, isMoving));
};

var whenReordering = (function (_ref) {
  var movement = _ref.movement,
      draggable = _ref.draggable,
      draggables = _ref.draggables,
      droppable = _ref.droppable;
  var insideDestination = getDraggablesInsideDroppable(droppable.descriptor.id, draggables);
  var draggablePage = draggable.page;
  var axis = droppable.axis;

  if (!insideDestination.length) {
    return goIntoStart({
      axis: axis,
      moveInto: droppable.page,
      isMoving: draggablePage
    });
  }

  var displaced = movement.displaced,
      willDisplaceForward = movement.willDisplaceForward,
      displacedBy = movement.displacedBy;
  var isOverHome = isHomeOf(draggable, droppable);
  var closest = displaced.length ? draggables[displaced[0].draggableId] : null;

  if (!closest) {
    if (isOverHome) {
      return draggable.page.borderBox.center;
    }

    var moveRelativeTo = insideDestination[insideDestination.length - 1];
    return goAfter({
      axis: axis,
      moveRelativeTo: moveRelativeTo.page,
      isMoving: draggablePage
    });
  }

  var displacedClosest = offset(closest.page, displacedBy.point);

  if (willDisplaceForward) {
    return goBefore({
      axis: axis,
      moveRelativeTo: displacedClosest,
      isMoving: draggablePage
    });
  }

  return goAfter({
    axis: axis,
    moveRelativeTo: displacedClosest,
    isMoving: draggablePage
  });
});

var getResultWithoutDroppableDisplacement = function getResultWithoutDroppableDisplacement(_ref) {
  var impact = _ref.impact,
      draggable = _ref.draggable,
      droppable = _ref.droppable,
      draggables = _ref.draggables;
  var merge = impact.merge;
  var destination = impact.destination;
  var original = draggable.page.borderBox.center;

  if (!droppable) {
    return original;
  }

  if (destination) {
    return whenReordering({
      movement: impact.movement,
      draggable: draggable,
      draggables: draggables,
      droppable: droppable
    });
  }

  if (merge) {
    return whenCombining({
      movement: impact.movement,
      combine: merge.combine,
      draggables: draggables
    });
  }

  return original;
};

var getPageBorderBoxCenter = (function (args) {
  var withoutDisplacement = getResultWithoutDroppableDisplacement(args);
  var droppable = args.droppable;
  var withDisplacement = droppable ? withDroppableDisplacement(droppable, withoutDisplacement) : withoutDisplacement;
  return withDisplacement;
});

var isTotallyVisibleInNewLocation = (function (_ref) {
  var draggable = _ref.draggable,
      destination = _ref.destination,
      newPageBorderBoxCenter = _ref.newPageBorderBoxCenter,
      viewport = _ref.viewport,
      withDroppableDisplacement = _ref.withDroppableDisplacement,
      _ref$onlyOnMainAxis = _ref.onlyOnMainAxis,
      onlyOnMainAxis = _ref$onlyOnMainAxis === void 0 ? false : _ref$onlyOnMainAxis;
  var diff = subtract(newPageBorderBoxCenter, draggable.page.borderBox.center);
  var shifted = offsetByPosition(draggable.page.borderBox, diff);
  var args = {
    target: shifted,
    destination: destination,
    withDroppableDisplacement: withDroppableDisplacement,
    viewport: viewport
  };

  if (onlyOnMainAxis) {
    return isTotallyVisibleOnAxis(args);
  }

  return isTotallyVisible(args);
});

var toForeignList = (function (_ref) {
  var previousPageBorderBoxCenter = _ref.previousPageBorderBoxCenter,
      moveRelativeTo = _ref.moveRelativeTo,
      insideDestination = _ref.insideDestination,
      draggable = _ref.draggable,
      draggables = _ref.draggables,
      destination = _ref.destination,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport;
  var axis = destination.axis;

  if (!moveRelativeTo || !insideDestination.length) {
    var proposed = {
      movement: noMovement,
      direction: axis.direction,
      destination: {
        droppableId: destination.descriptor.id,
        index: 0
      },
      merge: null
    };
    var pageBorderBoxCenter = getPageBorderBoxCenter({
      impact: proposed,
      draggable: draggable,
      droppable: destination,
      draggables: draggables
    });
    var withPlaceholder = addPlaceholder(destination, draggable.displaceBy, draggables);
    var isVisibleInNewLocation = isTotallyVisibleInNewLocation({
      draggable: draggable,
      destination: withPlaceholder,
      newPageBorderBoxCenter: pageBorderBoxCenter,
      viewport: viewport.frame,
      withDroppableDisplacement: false,
      onlyOnMainAxis: true
    });
    return isVisibleInNewLocation ? proposed : null;
  }

  var targetIndex = insideDestination.indexOf(moveRelativeTo);
  !(targetIndex !== -1) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find draggable in foreign list') : invariant(false) : void 0;
  var isGoingBeforeTarget = Boolean(previousPageBorderBoxCenter[destination.axis.line] < moveRelativeTo.page.borderBox.center[destination.axis.line]);
  var proposedIndex = isGoingBeforeTarget ? targetIndex : targetIndex + 1;
  var displaced = insideDestination.slice(proposedIndex).map(function (dimension) {
    return getDisplacement({
      draggable: dimension,
      destination: destination,
      viewport: viewport.frame,
      previousImpact: previousImpact
    });
  });
  var willDisplaceForward = true;
  var displacedBy = getDisplacedBy(destination.axis, draggable.displaceBy, willDisplaceForward);
  var impact = {
    movement: {
      displacedBy: displacedBy,
      displaced: displaced,
      map: getDisplacementMap(displaced),
      willDisplaceForward: willDisplaceForward
    },
    direction: axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex
    },
    merge: null
  };
  return impact;
});

var moveToNewDroppable = (function (_ref) {
  var previousPageBorderBoxCenter = _ref.previousPageBorderBoxCenter,
      destination = _ref.destination,
      insideDestination = _ref.insideDestination,
      draggable = _ref.draggable,
      draggables = _ref.draggables,
      moveRelativeTo = _ref.moveRelativeTo,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport;

  if (insideDestination.length && !moveRelativeTo) {
    return null;
  }

  if (moveRelativeTo) {
    !(moveRelativeTo.descriptor.droppableId === destination.descriptor.id) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Unable to find target in destination droppable') : invariant(false) : void 0;
  }

  var isMovingToHome = isHomeOf(draggable, destination);
  return isMovingToHome ? toHomeList({
    moveIntoIndexOf: moveRelativeTo,
    insideDestination: insideDestination,
    draggable: draggable,
    destination: destination,
    previousImpact: previousImpact,
    viewport: viewport
  }) : toForeignList({
    previousPageBorderBoxCenter: previousPageBorderBoxCenter,
    moveRelativeTo: moveRelativeTo,
    insideDestination: insideDestination,
    draggable: draggable,
    draggables: draggables,
    destination: destination,
    previousImpact: previousImpact,
    viewport: viewport
  });
});

var withViewportDisplacement = (function (viewport, point) {
  return add(viewport.scroll.diff.displacement, point);
});

var getClientFromPageBorderBoxCenter = (function (_ref) {
  var pageBorderBoxCenter = _ref.pageBorderBoxCenter,
      draggable = _ref.draggable,
      viewport = _ref.viewport;
  var withoutPageScrollChange = withViewportDisplacement(viewport, pageBorderBoxCenter);
  var offset$$1 = subtract(withoutPageScrollChange, draggable.page.borderBox.center);
  return add(draggable.client.borderBox.center, offset$$1);
});

var moveCrossAxis = (function (_ref) {
  var isMovingForward = _ref.isMovingForward,
      previousPageBorderBoxCenter = _ref.previousPageBorderBoxCenter,
      draggable = _ref.draggable,
      isOver = _ref.isOver,
      draggables = _ref.draggables,
      droppables = _ref.droppables,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport;
  var destination = getBestCrossAxisDroppable({
    isMovingForward: isMovingForward,
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    source: isOver,
    droppables: droppables,
    viewport: viewport
  });

  if (!destination) {
    return null;
  }

  var insideDestination = getDraggablesInsideDroppable(destination.descriptor.id, draggables);
  var moveRelativeTo = getClosestDraggable({
    axis: destination.axis,
    pageBorderBoxCenter: previousPageBorderBoxCenter,
    viewport: viewport,
    destination: destination,
    insideDestination: insideDestination
  });
  var impact = moveToNewDroppable({
    previousPageBorderBoxCenter: previousPageBorderBoxCenter,
    destination: destination,
    draggable: draggable,
    draggables: draggables,
    moveRelativeTo: moveRelativeTo,
    insideDestination: insideDestination,
    previousImpact: previousImpact,
    viewport: viewport
  });

  if (!impact) {
    return null;
  }

  var pageBorderBoxCenter = getPageBorderBoxCenter({
    impact: impact,
    draggable: draggable,
    droppable: destination,
    draggables: draggables
  });
  var clientSelection = getClientFromPageBorderBoxCenter({
    pageBorderBoxCenter: pageBorderBoxCenter,
    draggable: draggable,
    viewport: viewport
  });
  return {
    clientSelection: clientSelection,
    impact: impact,
    scrollJumpRequest: null
  };
});

var forward = {
  vertical: 'down',
  horizontal: 'right'
};
var backward = {
  vertical: 'up',
  horizontal: 'left'
};

var moveToNextCombine = (function (_ref) {
  var isMovingForward = _ref.isMovingForward,
      isInHomeList = _ref.isInHomeList,
      draggable = _ref.draggable,
      destination = _ref.destination,
      originalInsideDestination = _ref.insideDestination,
      previousImpact = _ref.previousImpact;

  if (!destination.isCombineEnabled) {
    return null;
  }

  if (previousImpact.merge) {
    return null;
  }

  var location = previousImpact.destination;
  !location ? process.env.NODE_ENV !== "production" ? invariant(false, 'Need a previous location to move from into a combine') : invariant(false) : void 0;
  var currentIndex = location.index;

  var currentInsideDestination = function () {
    var shallow = originalInsideDestination.slice();

    if (isInHomeList) {
      shallow.splice(draggable.descriptor.index, 1);
    }

    shallow.splice(location.index, 0, draggable);
    return shallow;
  }();

  var targetIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  if (targetIndex < 0) {
    return null;
  }

  if (targetIndex > currentInsideDestination.length - 1) {
    return null;
  }

  var target = currentInsideDestination[targetIndex];
  var merge = {
    whenEntered: isMovingForward ? forward : backward,
    combine: {
      draggableId: target.descriptor.id,
      droppableId: destination.descriptor.id
    }
  };
  var impact = {
    movement: previousImpact.movement,
    destination: null,
    direction: destination.axis.direction,
    merge: merge
  };
  return impact;
});

var addClosest = function addClosest(add, displaced) {
  var added = {
    draggableId: add.descriptor.id,
    isVisible: true,
    shouldAnimate: true
  };
  return [added].concat(displaced);
};
var removeClosest = function removeClosest(displaced) {
  return displaced.slice(1);
};

var fromReorder = (function (_ref) {
  var isMovingForward = _ref.isMovingForward,
      isInHomeList = _ref.isInHomeList,
      previousImpact = _ref.previousImpact,
      draggable = _ref.draggable,
      initialInside = _ref.insideDestination;

  if (previousImpact.merge) {
    return null;
  }

  var location = previousImpact.destination;
  !location ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot move to next index without previous destination') : invariant(false) : void 0;
  var insideDestination = initialInside.slice();
  var currentIndex = location.index;
  var isInForeignList = !isInHomeList;

  if (isInForeignList) {
    insideDestination.splice(location.index, 0, draggable);
  }

  var proposedIndex = isMovingForward ? currentIndex + 1 : currentIndex - 1;

  if (proposedIndex < 0) {
    return null;
  }

  if (proposedIndex > insideDestination.length - 1) {
    return null;
  }

  return {
    proposedIndex: proposedIndex,
    modifyDisplacement: true
  };
});

var fromCombine = (function (_ref) {
  var isInHomeList = _ref.isInHomeList,
      isMovingForward = _ref.isMovingForward,
      draggable = _ref.draggable,
      destination = _ref.destination,
      previousImpact = _ref.previousImpact,
      draggables = _ref.draggables,
      merge = _ref.merge;

  if (!destination.isCombineEnabled) {
    return null;
  }

  var movement = previousImpact.movement;
  var combineId = merge.combine.draggableId;
  var combine = draggables[combineId];
  var combineIndex = combine.descriptor.index;
  var isCombineDisplaced = Boolean(movement.map[combineId]);

  if (!isCombineDisplaced) {
    var willDisplaceForward = getWillDisplaceForward({
      isInHomeList: isInHomeList,
      proposedIndex: combineIndex,
      startIndexInHome: draggable.descriptor.index
    });

    if (willDisplaceForward) {
      if (isMovingForward) {
        return {
          proposedIndex: combineIndex + 1,
          modifyDisplacement: false
        };
      }

      return {
        proposedIndex: combineIndex,
        modifyDisplacement: true
      };
    }

    if (isMovingForward) {
      return {
        proposedIndex: combineIndex,
        modifyDisplacement: true
      };
    }

    return {
      proposedIndex: combineIndex - 1,
      modifyDisplacement: false
    };
  }

  var isDisplacedForward = movement.willDisplaceForward;
  var visualIndex = isDisplacedForward ? combineIndex + 1 : combineIndex - 1;

  if (isDisplacedForward) {
    if (isMovingForward) {
      return {
        proposedIndex: visualIndex,
        modifyDisplacement: true
      };
    }

    return {
      proposedIndex: visualIndex - 1,
      modifyDisplacement: false
    };
  }

  if (isMovingForward) {
    return {
      proposedIndex: visualIndex + 1,
      modifyDisplacement: false
    };
  }

  return {
    proposedIndex: visualIndex,
    modifyDisplacement: true
  };
});

var getIsIncreasingDisplacement = function getIsIncreasingDisplacement(_ref) {
  var isInHomeList = _ref.isInHomeList,
      isMovingForward = _ref.isMovingForward,
      proposedIndex = _ref.proposedIndex,
      startIndexInHome = _ref.startIndexInHome;

  if (!isInHomeList) {
    return !isMovingForward;
  }

  if (isMovingForward) {
    return proposedIndex > startIndexInHome;
  }

  return proposedIndex < startIndexInHome;
};

var moveToNextIndex = (function (_ref2) {
  var isMovingForward = _ref2.isMovingForward,
      isInHomeList = _ref2.isInHomeList,
      draggable = _ref2.draggable,
      draggables = _ref2.draggables,
      destination = _ref2.destination,
      insideDestination = _ref2.insideDestination,
      previousImpact = _ref2.previousImpact;

  var instruction = function () {
    if (previousImpact.destination) {
      return fromReorder({
        isMovingForward: isMovingForward,
        isInHomeList: isInHomeList,
        draggable: draggable,
        previousImpact: previousImpact,
        insideDestination: insideDestination
      });
    }

    !previousImpact.merge ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot move to next spot without a destination or merge') : invariant(false) : void 0;
    return fromCombine({
      isInHomeList: isInHomeList,
      isMovingForward: isMovingForward,
      draggable: draggable,
      destination: destination,
      previousImpact: previousImpact,
      draggables: draggables,
      merge: previousImpact.merge
    });
  }();

  if (instruction == null) {
    return null;
  }

  var proposedIndex = instruction.proposedIndex,
      modifyDisplacement = instruction.modifyDisplacement;
  var startIndexInHome = draggable.descriptor.index;
  var willDisplaceForward = getWillDisplaceForward({
    isInHomeList: isInHomeList,
    proposedIndex: proposedIndex,
    startIndexInHome: startIndexInHome
  });
  var displacedBy = getDisplacedBy(destination.axis, draggable.displaceBy, willDisplaceForward);
  var atProposedIndex = insideDestination[proposedIndex];

  var displaced = function () {
    if (!modifyDisplacement) {
      return previousImpact.movement.displaced;
    }

    var isIncreasingDisplacement = getIsIncreasingDisplacement({
      isInHomeList: isInHomeList,
      isMovingForward: isMovingForward,
      proposedIndex: proposedIndex,
      startIndexInHome: startIndexInHome
    });
    var lastDisplaced = previousImpact.movement.displaced;
    return isIncreasingDisplacement ? addClosest(atProposedIndex, lastDisplaced) : removeClosest(lastDisplaced);
  }();

  return {
    movement: {
      displacedBy: displacedBy,
      willDisplaceForward: willDisplaceForward,
      displaced: displaced,
      map: getDisplacementMap(displaced)
    },
    direction: destination.axis.direction,
    destination: {
      droppableId: destination.descriptor.id,
      index: proposedIndex
    },
    merge: null
  };
});

var scrollViewport = (function (viewport, newScroll) {
  var diff = subtract(newScroll, viewport.scroll.initial);
  var displacement = negate(diff);
  var frame = getRect({
    top: newScroll.y,
    bottom: newScroll.y + viewport.frame.height,
    left: newScroll.x,
    right: newScroll.x + viewport.frame.width
  });
  var updated = {
    frame: frame,
    scroll: {
      initial: viewport.scroll.initial,
      max: viewport.scroll.max,
      current: newScroll,
      diff: {
        value: diff,
        displacement: displacement
      }
    }
  };
  return updated;
});

var withNewDisplacement = (function (impact, displaced) {
  return _extends({}, impact, {
    movement: _extends({}, impact.movement, {
      displaced: displaced,
      map: getDisplacementMap(displaced)
    })
  });
});

var speculativelyIncrease = (function (_ref) {
  var impact = _ref.impact,
      viewport = _ref.viewport,
      destination = _ref.destination,
      draggables = _ref.draggables,
      maxScrollChange = _ref.maxScrollChange;
  var displaced = impact.movement.displaced;
  var scrolledViewport = scrollViewport(viewport, add(viewport.scroll.current, maxScrollChange));
  var scrolledDroppable = destination.frame ? scrollDroppable(destination, add(destination.frame.scroll.current, maxScrollChange)) : destination;
  var updated = displaced.map(function (entry) {
    if (entry.isVisible) {
      return entry;
    }

    var result = getDisplacement({
      draggable: draggables[entry.draggableId],
      destination: scrolledDroppable,
      previousImpact: impact,
      viewport: scrolledViewport.frame
    });

    if (!result.isVisible) {
      return entry;
    }

    return {
      draggableId: entry.draggableId,
      isVisible: true,
      shouldAnimate: false
    };
  });
  return withNewDisplacement(impact, updated);
});

var moveToNextPlace = (function (_ref) {
  var isMovingForward = _ref.isMovingForward,
      draggable = _ref.draggable,
      destination = _ref.destination,
      draggables = _ref.draggables,
      previousImpact = _ref.previousImpact,
      viewport = _ref.viewport,
      previousPageBorderBoxCenter = _ref.previousPageBorderBoxCenter,
      previousClientSelection = _ref.previousClientSelection;

  if (!destination.isEnabled) {
    return null;
  }

  var insideDestination = getDraggablesInsideDroppable(destination.descriptor.id, draggables);
  var isInHomeList = isHomeOf(draggable, destination);
  var impact = moveToNextCombine({
    isInHomeList: isInHomeList,
    isMovingForward: isMovingForward,
    draggable: draggable,
    destination: destination,
    insideDestination: insideDestination,
    previousImpact: previousImpact
  }) || moveToNextIndex({
    isMovingForward: isMovingForward,
    isInHomeList: isInHomeList,
    draggable: draggable,
    draggables: draggables,
    destination: destination,
    insideDestination: insideDestination,
    previousImpact: previousImpact
  });

  if (!impact) {
    return null;
  }

  var pageBorderBoxCenter = getPageBorderBoxCenter({
    impact: impact,
    draggable: draggable,
    droppable: destination,
    draggables: draggables
  });
  var isVisibleInNewLocation = isTotallyVisibleInNewLocation({
    draggable: draggable,
    destination: destination,
    newPageBorderBoxCenter: pageBorderBoxCenter,
    viewport: viewport.frame,
    withDroppableDisplacement: false,
    onlyOnMainAxis: true
  });

  if (isVisibleInNewLocation) {
    var clientSelection = getClientFromPageBorderBoxCenter({
      pageBorderBoxCenter: pageBorderBoxCenter,
      draggable: draggable,
      viewport: viewport
    });
    return {
      clientSelection: clientSelection,
      impact: impact,
      scrollJumpRequest: null
    };
  }

  var distance$$1 = subtract(pageBorderBoxCenter, previousPageBorderBoxCenter);
  var cautious = speculativelyIncrease({
    impact: impact,
    viewport: viewport,
    destination: destination,
    draggables: draggables,
    maxScrollChange: distance$$1
  });
  return {
    clientSelection: previousClientSelection,
    impact: cautious,
    scrollJumpRequest: distance$$1
  };
});

var getDroppableOver$1 = function getDroppableOver(impact, droppables) {
  var id = whatIsDraggedOver(impact);
  return id ? droppables[id] : null;
};

var moveInDirection = (function (_ref) {
  var state = _ref.state,
      type = _ref.type;
  var isActuallyOver = getDroppableOver$1(state.impact, state.dimensions.droppables);
  var isMainAxisMovementAllowed = Boolean(isActuallyOver);
  var home = state.dimensions.droppables[state.critical.droppable.id];
  var isOver = isActuallyOver || home;
  var direction = isOver.axis.direction;
  var isMovingOnMainAxis = direction === 'vertical' && (type === 'MOVE_UP' || type === 'MOVE_DOWN') || direction === 'horizontal' && (type === 'MOVE_LEFT' || type === 'MOVE_RIGHT');

  if (isMovingOnMainAxis && !isMainAxisMovementAllowed) {
    return null;
  }

  var isMovingForward = type === 'MOVE_DOWN' || type === 'MOVE_RIGHT';
  var draggable = state.dimensions.draggables[state.critical.draggable.id];
  var previousPageBorderBoxCenter = state.current.page.borderBoxCenter;
  var _state$dimensions = state.dimensions,
      draggables = _state$dimensions.draggables,
      droppables = _state$dimensions.droppables;
  var viewport = state.viewport;
  return isMovingOnMainAxis ? moveToNextPlace({
    isMovingForward: isMovingForward,
    draggable: draggable,
    destination: isOver,
    draggables: draggables,
    viewport: viewport,
    previousPageBorderBoxCenter: previousPageBorderBoxCenter,
    previousClientSelection: state.current.client.selection,
    previousImpact: state.impact
  }) : moveCrossAxis({
    isMovingForward: isMovingForward,
    previousPageBorderBoxCenter: previousPageBorderBoxCenter,
    draggable: draggable,
    isOver: isOver,
    draggables: draggables,
    droppables: droppables,
    previousImpact: state.impact,
    viewport: viewport
  });
});

function isMovementAllowed(state) {
  return state.phase === 'DRAGGING' || state.phase === 'COLLECTING';
}

var getVertical = function getVertical(previous, diff) {
  if (diff === 0) {
    return previous;
  }

  return diff > 0 ? 'down' : 'up';
};

var getHorizontal = function getHorizontal(previous, diff) {
  if (diff === 0) {
    return previous;
  }

  return diff > 0 ? 'right' : 'left';
};

var getUserDirection = (function (previous, oldPageBorderBoxCenter, newPageBorderBoxCenter) {
  var diff = subtract(newPageBorderBoxCenter, oldPageBorderBoxCenter);
  return {
    horizontal: getHorizontal(previous.horizontal, diff.x),
    vertical: getVertical(previous.vertical, diff.y)
  };
});

var update = (function (_ref) {
  var state = _ref.state,
      forcedClientSelection = _ref.clientSelection,
      forcedDimensions = _ref.dimensions,
      forcedViewport = _ref.viewport,
      forcedImpact = _ref.impact,
      scrollJumpRequest = _ref.scrollJumpRequest;
  var viewport = forcedViewport || state.viewport;
  var currentWindowScroll = viewport.scroll.current;
  var dimensions = forcedDimensions || state.dimensions;
  var clientSelection = forcedClientSelection || state.current.client.selection;
  var offset$$1 = subtract(clientSelection, state.initial.client.selection);
  var client = {
    offset: offset$$1,
    selection: clientSelection,
    borderBoxCenter: add(state.initial.client.borderBoxCenter, offset$$1)
  };
  var page = {
    selection: add(client.selection, currentWindowScroll),
    borderBoxCenter: add(client.borderBoxCenter, currentWindowScroll)
  };
  var current = {
    client: client,
    page: page
  };
  var userDirection = getUserDirection(state.userDirection, state.current.page.borderBoxCenter, current.page.borderBoxCenter);

  if (state.phase === 'COLLECTING') {
    return _extends({
      phase: 'COLLECTING'
    }, state, {
      dimensions: dimensions,
      viewport: viewport,
      current: current,
      userDirection: userDirection
    });
  }

  var draggable = dimensions.draggables[state.critical.draggable.id];
  var newImpact = forcedImpact || getDragImpact({
    pageBorderBoxCenter: page.borderBoxCenter,
    draggable: draggable,
    draggables: dimensions.draggables,
    droppables: dimensions.droppables,
    previousImpact: state.impact,
    viewport: viewport,
    userDirection: userDirection
  });
  var withUpdatedPlaceholders = getDimensionMapWithPlaceholder({
    draggable: draggable,
    impact: newImpact,
    previousImpact: state.impact,
    dimensions: dimensions
  });

  var result = _extends({}, state, {
    current: current,
    userDirection: userDirection,
    dimensions: withUpdatedPlaceholders,
    impact: newImpact,
    viewport: viewport,
    scrollJumpRequest: scrollJumpRequest || null,
    forceShouldAnimate: scrollJumpRequest ? false : null
  });

  return result;
});

var recomputeDisplacementVisibility = (function (_ref) {
  var impact = _ref.impact,
      viewport = _ref.viewport,
      destination = _ref.destination,
      draggables = _ref.draggables;
  var updated = impact.movement.displaced.map(function (entry) {
    return getDisplacement({
      draggable: draggables[entry.draggableId],
      destination: destination,
      previousImpact: impact,
      viewport: viewport.frame
    });
  });
  return withNewDisplacement(impact, updated);
});

var getClientBorderBoxCenter = (function (_ref) {
  var impact = _ref.impact,
      draggable = _ref.draggable,
      droppable = _ref.droppable,
      draggables = _ref.draggables,
      viewport = _ref.viewport;
  var pageBorderBoxCenter = getPageBorderBoxCenter({
    impact: impact,
    draggable: draggable,
    draggables: draggables,
    droppable: droppable
  });
  return getClientFromPageBorderBoxCenter({
    pageBorderBoxCenter: pageBorderBoxCenter,
    draggable: draggable,
    viewport: viewport
  });
});

var refreshSnap = (function (_ref) {
  var state = _ref.state,
      forcedDimensions = _ref.dimensions,
      forcedViewport = _ref.viewport;
  !(state.movementMode === 'SNAP') ? process.env.NODE_ENV !== "production" ? invariant(false) : invariant(false) : void 0;
  var needsVisibilityCheck = state.impact;
  var viewport = forcedViewport || state.viewport;
  var dimensions = forcedDimensions || state.dimensions;
  var draggables = dimensions.draggables,
      droppables = dimensions.droppables;
  var draggable = draggables[state.critical.draggable.id];
  var isOver = whatIsDraggedOver(needsVisibilityCheck);
  !isOver ? process.env.NODE_ENV !== "production" ? invariant(false, 'Must be over a destination in SNAP movement mode') : invariant(false) : void 0;
  var destination = droppables[isOver];
  var impact = recomputeDisplacementVisibility({
    impact: needsVisibilityCheck,
    viewport: viewport,
    destination: destination,
    draggables: draggables
  });
  var clientSelection = getClientBorderBoxCenter({
    impact: impact,
    draggable: draggable,
    droppable: destination,
    draggables: draggables,
    viewport: viewport
  });
  return update({
    impact: impact,
    clientSelection: clientSelection,
    state: state,
    dimensions: dimensions,
    viewport: viewport
  });
});

var isSnapping = function isSnapping(state) {
  return state.movementMode === 'SNAP';
};

var postDroppableChange = function postDroppableChange(state, updated, isEnabledChanging) {
  var dimensions = patchDroppableMap(state.dimensions, updated);

  if (!isSnapping(state) || isEnabledChanging) {
    return update({
      state: state,
      dimensions: dimensions
    });
  }

  return refreshSnap({
    state: state,
    dimensions: dimensions
  });
};

var idle = {
  phase: 'IDLE'
};
var reducer = (function (state, action) {
  if (state === void 0) {
    state = idle;
  }

  if (action.type === 'CLEAN') {
    return idle;
  }

  if (action.type === 'INITIAL_PUBLISH') {
    !(state.phase === 'IDLE') ? process.env.NODE_ENV !== "production" ? invariant(false, 'INITIAL_PUBLISH must come after a IDLE phase') : invariant(false) : void 0;
    var _action$payload = action.payload,
        critical = _action$payload.critical,
        clientSelection = _action$payload.clientSelection,
        viewport = _action$payload.viewport,
        dimensions = _action$payload.dimensions,
        movementMode = _action$payload.movementMode;
    var draggable = dimensions.draggables[critical.draggable.id];
    var home = dimensions.droppables[critical.droppable.id];
    var client = {
      selection: clientSelection,
      borderBoxCenter: draggable.client.borderBox.center,
      offset: origin
    };
    var initial = {
      client: client,
      page: {
        selection: add(client.selection, viewport.scroll.initial),
        borderBoxCenter: add(client.selection, viewport.scroll.initial)
      }
    };
    var isWindowScrollAllowed = toDroppableList(dimensions.droppables).every(function (item) {
      return !item.isFixedOnPage;
    });
    var result = {
      phase: 'DRAGGING',
      isDragging: true,
      critical: critical,
      movementMode: movementMode,
      dimensions: dimensions,
      initial: initial,
      current: initial,
      isWindowScrollAllowed: isWindowScrollAllowed,
      impact: getHomeImpact(draggable, home),
      viewport: viewport,
      userDirection: forward,
      scrollJumpRequest: null,
      forceShouldAnimate: null
    };
    return result;
  }

  if (action.type === 'COLLECTION_STARTING') {
    var _extends2;

    if (state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    !(state.phase === 'DRAGGING') ? process.env.NODE_ENV !== "production" ? invariant(false, "Collection cannot start from phase " + state.phase) : invariant(false) : void 0;

    var _result = _extends({
      phase: 'COLLECTING'
    }, state, (_extends2 = {}, _extends2["phase"] = 'COLLECTING', _extends2));

    return _result;
  }

  if (action.type === 'PUBLISH_WHILE_DRAGGING') {
    !(state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING') ? process.env.NODE_ENV !== "production" ? invariant(false, "Unexpected " + action.type + " received in phase " + state.phase) : invariant(false) : void 0;
    return publishWhileDragging({
      state: state,
      published: action.payload
    });
  }

  if (action.type === 'MOVE') {
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    !isMovementAllowed(state) ? process.env.NODE_ENV !== "production" ? invariant(false, action.type + " not permitted in phase " + state.phase) : invariant(false) : void 0;
    var _clientSelection = action.payload.client;

    if (isEqual(_clientSelection, state.current.client.selection)) {
      return state;
    }

    return update({
      state: state,
      clientSelection: _clientSelection,
      impact: isSnapping(state) ? state.impact : null
    });
  }

  if (action.type === 'UPDATE_DROPPABLE_SCROLL') {
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    if (state.phase === 'COLLECTING') {
      return state;
    }

    !isMovementAllowed(state) ? process.env.NODE_ENV !== "production" ? invariant(false, action.type + " not permitted in phase " + state.phase) : invariant(false) : void 0;
    var _action$payload2 = action.payload,
        id = _action$payload2.id,
        offset$$1 = _action$payload2.offset;
    var target = state.dimensions.droppables[id];

    if (!target) {
      return state;
    }

    var scrolled = scrollDroppable(target, offset$$1);
    return postDroppableChange(state, scrolled, false);
  }

  if (action.type === 'UPDATE_DROPPABLE_IS_ENABLED') {
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    !isMovementAllowed(state) ? process.env.NODE_ENV !== "production" ? invariant(false, "Attempting to move in an unsupported phase " + state.phase) : invariant(false) : void 0;
    var _action$payload3 = action.payload,
        _id = _action$payload3.id,
        isEnabled = _action$payload3.isEnabled;
    var _target = state.dimensions.droppables[_id];
    !_target ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot find Droppable[id: " + _id + "] to toggle its enabled state") : invariant(false) : void 0;
    !(_target.isEnabled !== isEnabled) ? process.env.NODE_ENV !== "production" ? invariant(false, "Trying to set droppable isEnabled to " + String(isEnabled) + "\n      but it is already " + String(_target.isEnabled)) : invariant(false) : void 0;

    var updated = _extends({}, _target, {
      isEnabled: isEnabled
    });

    return postDroppableChange(state, updated, true);
  }

  if (action.type === 'UPDATE_DROPPABLE_IS_COMBINE_ENABLED') {
    if (state.phase === 'DROP_PENDING') {
      return state;
    }

    !isMovementAllowed(state) ? process.env.NODE_ENV !== "production" ? invariant(false, "Attempting to move in an unsupported phase " + state.phase) : invariant(false) : void 0;
    var _action$payload4 = action.payload,
        _id2 = _action$payload4.id,
        isCombineEnabled = _action$payload4.isCombineEnabled;
    var _target2 = state.dimensions.droppables[_id2];
    !_target2 ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot find Droppable[id: " + _id2 + "] to toggle its isCombineEnabled state") : invariant(false) : void 0;
    !(_target2.isCombineEnabled !== isCombineEnabled) ? process.env.NODE_ENV !== "production" ? invariant(false, "Trying to set droppable isCombineEnabled to " + String(isCombineEnabled) + "\n      but it is already " + String(_target2.isCombineEnabled)) : invariant(false) : void 0;

    var _updated = _extends({}, _target2, {
      isCombineEnabled: isCombineEnabled
    });

    return postDroppableChange(state, _updated, true);
  }

  if (action.type === 'MOVE_BY_WINDOW_SCROLL') {
    if (state.phase === 'DROP_PENDING' || state.phase === 'DROP_ANIMATING') {
      return state;
    }

    !isMovementAllowed(state) ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot move by window in phase " + state.phase) : invariant(false) : void 0;
    !state.isWindowScrollAllowed ? process.env.NODE_ENV !== "production" ? invariant(false, 'Window scrolling is currently not supported for fixed lists. Aborting drag') : invariant(false) : void 0;
    var newScroll = action.payload.newScroll;

    if (isEqual(state.viewport.scroll.current, newScroll)) {
      return state;
    }

    var _viewport = scrollViewport(state.viewport, newScroll);

    if (isSnapping(state)) {
      return refreshSnap({
        state: state,
        viewport: _viewport
      });
    }

    return update({
      state: state,
      viewport: _viewport
    });
  }

  if (action.type === 'UPDATE_VIEWPORT_MAX_SCROLL') {
    !isMovementAllowed(state) ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot update viewport scroll in phase " + state.phase) : invariant(false) : void 0;
    var maxScroll = action.payload.maxScroll;

    var withMaxScroll = _extends({}, state.viewport, {
      scroll: _extends({}, state.viewport.scroll, {
        max: maxScroll
      })
    });

    return _extends({
      phase: 'DRAGGING'
    }, state, {
      viewport: withMaxScroll
    });
  }

  if (action.type === 'MOVE_UP' || action.type === 'MOVE_DOWN' || action.type === 'MOVE_LEFT' || action.type === 'MOVE_RIGHT') {
    if (state.phase === 'COLLECTING' || state.phase === 'DROP_PENDING') {
      return state;
    }

    !(state.phase === 'DRAGGING') ? process.env.NODE_ENV !== "production" ? invariant(false, action.type + " received while not in DRAGGING phase") : invariant(false) : void 0;

    var _result2 = moveInDirection({
      state: state,
      type: action.type
    });

    if (!_result2) {
      return state;
    }

    return update({
      state: state,
      impact: _result2.impact,
      clientSelection: _result2.clientSelection,
      scrollJumpRequest: _result2.scrollJumpRequest
    });
  }

  if (action.type === 'DROP_PENDING') {
    var _extends3;

    var reason = action.payload.reason;
    !(state.phase === 'COLLECTING') ? process.env.NODE_ENV !== "production" ? invariant(false, 'Can only move into the DROP_PENDING phase from the COLLECTING phase') : invariant(false) : void 0;

    var newState = _extends({
      phase: 'DROP_PENDING'
    }, state, (_extends3 = {}, _extends3["phase"] = 'DROP_PENDING', _extends3.isWaiting = true, _extends3.reason = reason, _extends3));

    return newState;
  }

  if (action.type === 'DROP_ANIMATE') {
    var pending = action.payload;
    !(state.phase === 'DRAGGING' || state.phase === 'DROP_PENDING') ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot animate drop from phase " + state.phase) : invariant(false) : void 0;
    var _result3 = {
      phase: 'DROP_ANIMATING',
      pending: pending,
      dimensions: state.dimensions
    };
    return _result3;
  }

  if (action.type === 'DROP_COMPLETE') {
    return idle;
  }

  return state;
});

var lift = function lift(args) {
  return {
    type: 'LIFT',
    payload: args
  };
};
var initialPublish = function initialPublish(args) {
  return {
    type: 'INITIAL_PUBLISH',
    payload: args
  };
};
var publishWhileDragging$1 = function publishWhileDragging(args) {
  return {
    type: 'PUBLISH_WHILE_DRAGGING',
    payload: args
  };
};
var collectionStarting = function collectionStarting() {
  return {
    type: 'COLLECTION_STARTING',
    payload: null
  };
};
var updateDroppableScroll = function updateDroppableScroll(args) {
  return {
    type: 'UPDATE_DROPPABLE_SCROLL',
    payload: args
  };
};
var updateDroppableIsEnabled = function updateDroppableIsEnabled(args) {
  return {
    type: 'UPDATE_DROPPABLE_IS_ENABLED',
    payload: args
  };
};
var updateDroppableIsCombineEnabled = function updateDroppableIsCombineEnabled(args) {
  return {
    type: 'UPDATE_DROPPABLE_IS_COMBINE_ENABLED',
    payload: args
  };
};
var move = function move(args) {
  return {
    type: 'MOVE',
    payload: args
  };
};
var moveByWindowScroll = function moveByWindowScroll(args) {
  return {
    type: 'MOVE_BY_WINDOW_SCROLL',
    payload: args
  };
};
var updateViewportMaxScroll = function updateViewportMaxScroll(args) {
  return {
    type: 'UPDATE_VIEWPORT_MAX_SCROLL',
    payload: args
  };
};
var moveUp = function moveUp() {
  return {
    type: 'MOVE_UP',
    payload: null
  };
};
var moveDown = function moveDown() {
  return {
    type: 'MOVE_DOWN',
    payload: null
  };
};
var moveRight = function moveRight() {
  return {
    type: 'MOVE_RIGHT',
    payload: null
  };
};
var moveLeft = function moveLeft() {
  return {
    type: 'MOVE_LEFT',
    payload: null
  };
};
var clean = function clean() {
  return {
    type: 'CLEAN',
    payload: null
  };
};
var animateDrop = function animateDrop(pending) {
  return {
    type: 'DROP_ANIMATE',
    payload: pending
  };
};
var completeDrop = function completeDrop(result) {
  return {
    type: 'DROP_COMPLETE',
    payload: result
  };
};
var drop = function drop(args) {
  return {
    type: 'DROP',
    payload: args
  };
};
var dropPending = function dropPending(args) {
  return {
    type: 'DROP_PENDING',
    payload: args
  };
};
var dropAnimationFinished = function dropAnimationFinished() {
  return {
    type: 'DROP_ANIMATION_FINISHED',
    payload: null
  };
};

var lift$1 = (function (getMarshal) {
  return function (_ref) {
    var getState = _ref.getState,
        dispatch = _ref.dispatch;
    return function (next) {
      return function (action) {
        if (action.type !== 'LIFT') {
          next(action);
          return;
        }

        var marshal = getMarshal();
        var _action$payload = action.payload,
            id = _action$payload.id,
            clientSelection = _action$payload.clientSelection,
            movementMode = _action$payload.movementMode;
        var initial = getState();

        if (initial.phase === 'DROP_ANIMATING') {
          dispatch(completeDrop(initial.pending.result));
        }

        !(getState().phase === 'IDLE') ? process.env.NODE_ENV !== "production" ? invariant(false, 'Incorrect phase to start a drag') : invariant(false) : void 0;
        var scrollOptions = {
          shouldPublishImmediately: movementMode === 'SNAP'
        };
        var request = {
          draggableId: id,
          scrollOptions: scrollOptions
        };

        var _marshal$startPublish = marshal.startPublishing(request),
            critical = _marshal$startPublish.critical,
            dimensions = _marshal$startPublish.dimensions,
            viewport = _marshal$startPublish.viewport;

        dispatch(initialPublish({
          critical: critical,
          dimensions: dimensions,
          clientSelection: clientSelection,
          movementMode: movementMode,
          viewport: viewport
        }));
      };
    };
  };
});

var style = (function (marshal) {
  return function () {
    return function (next) {
      return function (action) {
        if (action.type === 'INITIAL_PUBLISH') {
          marshal.dragging();
        }

        if (action.type === 'DROP_ANIMATE') {
          marshal.dropping(action.payload.result.reason);
        }

        if (action.type === 'CLEAN' || action.type === 'DROP_COMPLETE') {
          marshal.resting();
        }

        next(action);
      };
    };
  };
});

var minDropTime = 0.33;
var maxDropTime = 0.55;
var dropTimeRange = maxDropTime - minDropTime;
var maxDropTimeAtDistance = 1500;
var cancelDropModifier = 0.6;
var getDropDuration = (function (_ref) {
  var current = _ref.current,
      destination = _ref.destination,
      reason = _ref.reason;
  var distance$$1 = distance(current, destination);

  if (distance$$1 <= 0) {
    return minDropTime;
  }

  if (distance$$1 >= maxDropTimeAtDistance) {
    return maxDropTime;
  }

  var percentage = distance$$1 / maxDropTimeAtDistance;
  var duration = minDropTime + dropTimeRange * percentage;
  var withDuration = reason === 'CANCEL' ? duration * cancelDropModifier : duration;
  return Number(withDuration.toFixed(2));
});

var getNewHomeClientOffset = (function (_ref) {
  var impact = _ref.impact,
      draggable = _ref.draggable,
      dimensions = _ref.dimensions,
      viewport = _ref.viewport;
  var draggables = dimensions.draggables,
      droppables = dimensions.droppables;
  var droppableId = whatIsDraggedOver(impact);
  var destination = droppableId ? droppables[droppableId] : null;
  var home = droppables[draggable.descriptor.droppableId];
  var newClientCenter = getClientBorderBoxCenter({
    impact: impact,
    draggable: draggable,
    draggables: draggables,
    droppable: destination || home,
    viewport: viewport
  });
  var offset$$1 = subtract(newClientCenter, draggable.client.borderBox.center);
  return offset$$1;
});

var drop$1 = (function (_ref) {
  var getState = _ref.getState,
      dispatch = _ref.dispatch;
  return function (next) {
    return function (action) {
      if (action.type !== 'DROP') {
        next(action);
        return;
      }

      var state = getState();
      var reason = action.payload.reason;

      if (state.phase === 'COLLECTING') {
        dispatch(dropPending({
          reason: reason
        }));
        return;
      }

      if (state.phase === 'IDLE') {
        return;
      }

      var isWaitingForDrop = state.phase === 'DROP_PENDING' && state.isWaiting;
      !!isWaitingForDrop ? process.env.NODE_ENV !== "production" ? invariant(false, 'A DROP action occurred while DROP_PENDING and still waiting') : invariant(false) : void 0;
      !(state.phase === 'DRAGGING' || state.phase === 'DROP_PENDING') ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot drop in phase: " + state.phase) : invariant(false) : void 0;
      var critical = state.critical;
      var dimensions = state.dimensions;
      var impact = reason === 'DROP' ? state.impact : noImpact;
      var draggable = dimensions.draggables[state.critical.draggable.id];
      var destination = impact ? impact.destination : null;
      var combine = impact && impact.merge ? impact.merge.combine : null;
      var source = {
        index: critical.draggable.index,
        droppableId: critical.droppable.id
      };
      var result = {
        draggableId: draggable.descriptor.id,
        type: draggable.descriptor.type,
        source: source,
        mode: state.movementMode,
        destination: destination,
        combine: combine,
        reason: reason
      };
      var newHomeClientOffset = getNewHomeClientOffset({
        impact: impact,
        draggable: draggable,
        dimensions: dimensions,
        viewport: state.viewport
      });
      var isAnimationRequired = !isEqual(state.current.client.offset, newHomeClientOffset) || Boolean(result.combine);

      if (!isAnimationRequired) {
        dispatch(completeDrop(result));
        return;
      }

      var dropDuration = getDropDuration({
        current: state.current.client.offset,
        destination: newHomeClientOffset,
        reason: reason
      });
      var pending = {
        newHomeClientOffset: newHomeClientOffset,
        dropDuration: dropDuration,
        result: result,
        impact: impact
      };
      dispatch(animateDrop(pending));
    };
  };
});

var position = function position(index) {
  return index + 1;
};

var onDragStart = function onDragStart(start) {
  return "\n  You have lifted an item in position " + position(start.source.index) + ".\n  Use the arrow keys to move, space bar to drop, and escape to cancel.\n";
};

var withLocation = function withLocation(source, destination) {
  var isInHomeList = source.droppableId === destination.droppableId;
  var startPosition = position(source.index);
  var endPosition = position(destination.index);

  if (isInHomeList) {
    return "\n      You have moved the item from position " + startPosition + "\n      to position " + endPosition + "\n    ";
  }

  return "\n    You have moved the item from position " + startPosition + "\n    in list " + source.droppableId + "\n    to list " + destination.droppableId + "\n    in position " + endPosition + "\n  ";
};

var withCombine = function withCombine(id, source, combine) {
  var inHomeList = source.droppableId === combine.droppableId;

  if (inHomeList) {
    return "\n      The item " + id + "\n      has been combined with " + combine.draggableId;
  }

  return "\n      The item " + id + "\n      in list " + source.droppableId + "\n      has been combined with " + combine.draggableId + "\n      in list " + combine.droppableId + "\n    ";
};

var onDragUpdate = function onDragUpdate(update) {
  var location = update.destination;

  if (location) {
    return withLocation(update.source, location);
  }

  var combine = update.combine;

  if (combine) {
    return withCombine(update.draggableId, update.source, combine);
  }

  return 'You are over an area that cannot be dropped on';
};

var returnedToStart = function returnedToStart(source) {
  return "\n  The item has returned to its starting position\n  of " + position(source.index) + "\n";
};

var onDragEnd = function onDragEnd(result) {
  if (result.reason === 'CANCEL') {
    return "\n      Movement cancelled.\n      " + returnedToStart(result.source) + "\n    ";
  }

  var location = result.destination;
  var combine = result.combine;

  if (location) {
    return "\n      You have dropped the item.\n      " + withLocation(result.source, location) + "\n    ";
  }

  if (combine) {
    return "\n      You have dropped the item.\n      " + withCombine(result.draggableId, result.source, combine) + "\n    ";
  }

  return "\n    The item has been dropped while not over a drop area.\n    " + returnedToStart(result.source) + "\n  ";
};

var preset = {
  onDragStart: onDragStart,
  onDragUpdate: onDragUpdate,
  onDragEnd: onDragEnd
};

var isProduction = process.env.NODE_ENV === 'production';
var spacesAndTabs = /[ \t]{2,}/g;

var clean$1 = function clean(value) {
  return value.replace(spacesAndTabs, ' ').trim();
};

var getDevMessage = function getDevMessage(message) {
  return clean$1("\n  %creact-beautiful-dnd\n\n  %c" + clean$1(message) + "\n\n  %c\uD83D\uDC77\u200D This is a development only message. It will be removed in production builds.\n");
};

var getFormattedMessage = function getFormattedMessage(message) {
  return [getDevMessage(message), 'color: #00C584; font-size: 1.2em; font-weight: bold;', 'line-height: 1.5', 'color: #723874;'];
};
var isDisabledFlag = '__react-beautiful-dnd-disable-dev-warnings';
var warning = function warning(message) {
  var _console;

  if (isProduction) {
    return;
  }

  if (typeof window !== 'undefined' && window[isDisabledFlag]) {
    return;
  }

  (_console = console).warn.apply(_console, getFormattedMessage(message));
};

var getExpiringAnnounce = (function (announce) {
  var wasCalled = false;
  var isExpired = false;
  var timeoutId = setTimeout(function () {
    isExpired = true;
  });

  var result = function result(message) {
    if (wasCalled) {
      process.env.NODE_ENV !== "production" ? warning('Announcement already made. Not making a second announcement') : void 0;
      return;
    }

    if (isExpired) {
      process.env.NODE_ENV !== "production" ? warning("\n        Announcements cannot be made asynchronously.\n        Default message has already been announced.\n      ") : void 0;
      return;
    }

    wasCalled = true;
    announce(message);
    clearTimeout(timeoutId);
  };

  result.wasCalled = function () {
    return wasCalled;
  };

  return result;
});

var getAsyncMarshal = (function () {
  var entries = [];

  var execute = function execute(timerId) {
    var index = findIndex(entries, function (item) {
      return item.timerId === timerId;
    });
    !(index !== -1) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Could not find timer') : invariant(false) : void 0;

    var _entries$splice = entries.splice(index, 1),
        entry = _entries$splice[0];

    entry.callback();
  };

  var add = function add(fn) {
    var timerId = setTimeout(function () {
      return execute(timerId);
    });
    var entry = {
      timerId: timerId,
      callback: fn
    };
    entries.push(entry);
  };

  var flush = function flush() {
    if (!entries.length) {
      return;
    }

    var shallow = [].concat(entries);
    entries.length = 0;
    shallow.forEach(function (entry) {
      clearTimeout(entry.timerId);
      entry.callback();
    });
  };

  return {
    add: add,
    flush: flush
  };
});

var areLocationsEqual = function areLocationsEqual(first, second) {
  if (first == null && second == null) {
    return true;
  }

  if (first == null || second == null) {
    return false;
  }

  return first.droppableId === second.droppableId && first.index === second.index;
};
var isCombineEqual = function isCombineEqual(first, second) {
  if (first == null && second == null) {
    return true;
  }

  if (first == null || second == null) {
    return false;
  }

  return first.draggableId === second.draggableId && first.droppableId === second.droppableId;
};
var isCriticalEqual = function isCriticalEqual(first, second) {
  if (first === second) {
    return true;
  }

  var isDraggableEqual = first.draggable.id === second.draggable.id && first.draggable.droppableId === second.draggable.droppableId && first.draggable.type === second.draggable.type && first.draggable.index === second.draggable.index;
  var isDroppableEqual = first.droppable.id === second.droppable.id && first.droppable.type === second.droppable.type;
  return isDraggableEqual && isDroppableEqual;
};

var withTimings = function withTimings(key, fn) {
  start(key);
  fn();
  finish(key);
};

var getDragStart = function getDragStart(critical, mode) {
  return {
    draggableId: critical.draggable.id,
    type: critical.droppable.type,
    source: {
      droppableId: critical.droppable.id,
      index: critical.draggable.index
    },
    mode: mode
  };
};

var execute = function execute(responder, data, announce, getDefaultMessage) {
  if (!responder) {
    announce(getDefaultMessage(data));
    return;
  }

  var willExpire = getExpiringAnnounce(announce);
  var provided = {
    announce: willExpire
  };
  responder(data, provided);

  if (!willExpire.wasCalled()) {
    announce(getDefaultMessage(data));
  }
};

var getPublisher = (function (getResponders, announce) {
  var asyncMarshal = getAsyncMarshal();
  var dragging = null;

  var beforeStart = function beforeStart(critical, mode) {
    !!dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot fire onBeforeDragStart as a drag start has already been published') : invariant(false) : void 0;
    withTimings('onBeforeDragStart', function () {
      var fn = getResponders().onBeforeDragStart;

      if (fn) {
        fn(getDragStart(critical, mode));
      }
    });
  };

  var start$$1 = function start$$1(critical, mode) {
    !!dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot fire onBeforeDragStart as a drag start has already been published') : invariant(false) : void 0;
    var data = getDragStart(critical, mode);
    dragging = {
      mode: mode,
      lastCritical: critical,
      lastLocation: data.source,
      lastCombine: null
    };
    asyncMarshal.add(function () {
      withTimings('onDragStart', function () {
        return execute(getResponders().onDragStart, data, announce, preset.onDragStart);
      });
    });
  };

  var update = function update(critical, impact) {
    var location = impact.destination;
    var combine = impact.merge ? impact.merge.combine : null;
    !dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot fire onDragMove when onDragStart has not been called') : invariant(false) : void 0;
    var hasCriticalChanged = !isCriticalEqual(critical, dragging.lastCritical);

    if (hasCriticalChanged) {
      dragging.lastCritical = critical;
    }

    var hasLocationChanged = !areLocationsEqual(dragging.lastLocation, location);

    if (hasLocationChanged) {
      dragging.lastLocation = location;
    }

    var hasGroupingChanged = !isCombineEqual(dragging.lastCombine, combine);

    if (hasGroupingChanged) {
      dragging.lastCombine = combine;
    }

    if (!hasCriticalChanged && !hasLocationChanged && !hasGroupingChanged) {
      return;
    }

    var data = _extends({}, getDragStart(critical, dragging.mode), {
      combine: combine,
      destination: location
    });

    asyncMarshal.add(function () {
      withTimings('onDragUpdate', function () {
        return execute(getResponders().onDragUpdate, data, announce, preset.onDragUpdate);
      });
    });
  };

  var flush = function flush() {
    !dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Can only flush responders while dragging') : invariant(false) : void 0;
    asyncMarshal.flush();
  };

  var drop = function drop(result) {
    !dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot fire onDragEnd when there is no matching onDragStart') : invariant(false) : void 0;
    dragging = null;
    withTimings('onDragEnd', function () {
      return execute(getResponders().onDragEnd, result, announce, preset.onDragEnd);
    });
  };

  var abort = function abort() {
    if (!dragging) {
      return;
    }

    var result = _extends({}, getDragStart(dragging.lastCritical, dragging.mode), {
      combine: null,
      destination: null,
      reason: 'CANCEL'
    });

    drop(result);
  };

  return {
    beforeStart: beforeStart,
    start: start$$1,
    update: update,
    flush: flush,
    drop: drop,
    abort: abort
  };
});

var responders = (function (getResponders, announce) {
  var publisher = getPublisher(getResponders, announce);
  return function (store) {
    return function (next) {
      return function (action) {
        if (action.type === 'INITIAL_PUBLISH') {
          var critical = action.payload.critical;
          publisher.beforeStart(critical, action.payload.movementMode);
          next(action);
          publisher.start(critical, action.payload.movementMode);
          return;
        }

        if (action.type === 'DROP_COMPLETE') {
          var result = action.payload;
          publisher.flush();
          next(action);
          publisher.drop(result);
          return;
        }

        next(action);

        if (action.type === 'CLEAN') {
          publisher.abort();
          return;
        }

        var state = store.getState();

        if (state.phase === 'DRAGGING') {
          publisher.update(state.critical, state.impact);
        }
      };
    };
  };
});

var dropAnimationFinish = (function (store) {
  return function (next) {
    return function (action) {
      if (action.type !== 'DROP_ANIMATION_FINISHED') {
        next(action);
        return;
      }

      var state = store.getState();
      !(state.phase === 'DROP_ANIMATING') ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot finish a drop animating when no drop is occurring') : invariant(false) : void 0;
      store.dispatch(completeDrop(state.pending.result));
    };
  };
});

var dimensionMarshalStopper = (function (getMarshal) {
  return function () {
    return function (next) {
      return function (action) {
        if (action.type === 'DROP_COMPLETE' || action.type === 'CLEAN' || action.type === 'DROP_ANIMATE') {
          var marshal = getMarshal();
          marshal.stopPublishing();
        }

        next(action);
      };
    };
  };
});

var shouldEnd = function shouldEnd(action) {
  return action.type === 'DROP_COMPLETE' || action.type === 'DROP_ANIMATE' || action.type === 'CLEAN';
};

var shouldCancelPending = function shouldCancelPending(action) {
  return action.type === 'COLLECTION_STARTING';
};

var autoScroll = (function (getScroller) {
  return function (store) {
    return function (next) {
      return function (action) {
        if (shouldEnd(action)) {
          getScroller().stop();
          next(action);
          return;
        }

        if (shouldCancelPending(action)) {
          getScroller().cancelPending();
          next(action);
          return;
        }

        if (action.type === 'INITIAL_PUBLISH') {
          next(action);
          var state = store.getState();
          !(state.phase === 'DRAGGING') ? process.env.NODE_ENV !== "production" ? invariant(false, 'Expected phase to be DRAGGING after INITIAL_PUBLISH') : invariant(false) : void 0;
          getScroller().start(state);
          return;
        }

        next(action);
        getScroller().scroll(store.getState());
      };
    };
  };
});

var pendingDrop = (function (store) {
  return function (next) {
    return function (action) {
      next(action);

      if (action.type !== 'PUBLISH_WHILE_DRAGGING') {
        return;
      }

      var postActionState = store.getState();

      if (postActionState.phase !== 'DROP_PENDING') {
        return;
      }

      if (postActionState.isWaiting) {
        return;
      }

      store.dispatch(drop({
        reason: postActionState.reason
      }));
    };
  };
});

var getDocumentElement = (function () {
  var doc = document.documentElement;
  !doc ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find document.documentElement') : invariant(false) : void 0;
  return doc;
});

var getMaxWindowScroll = (function () {
  var doc = getDocumentElement();
  var maxScroll = getMaxScroll({
    scrollHeight: doc.scrollHeight,
    scrollWidth: doc.scrollWidth,
    width: doc.clientWidth,
    height: doc.clientHeight
  });
  return maxScroll;
});

var shouldCheckOnAction = function shouldCheckOnAction(action) {
  return action.type === 'MOVE' || action.type === 'MOVE_UP' || action.type === 'MOVE_RIGHT' || action.type === 'MOVE_DOWN' || action.type === 'MOVE_LEFT' || action.type === 'MOVE_BY_WINDOW_SCROLL';
};

var wasDestinationChange = function wasDestinationChange(previous, current, action) {
  if (!shouldCheckOnAction(action)) {
    return false;
  }

  if (!isMovementAllowed(previous) || !isMovementAllowed(current)) {
    return false;
  }

  if (whatIsDraggedOver(previous.impact) === whatIsDraggedOver(current.impact)) {
    return false;
  }

  return true;
};

var getUpdatedViewportMax = function getUpdatedViewportMax(viewport) {
  var maxScroll = getMaxWindowScroll();

  if (isEqual(viewport.scroll.max, maxScroll)) {
    return null;
  }

  return maxScroll;
};

var updateViewportMaxScrollOnDestinationChange = (function (store) {
  return function (next) {
    return function (action) {
      var previous = store.getState();
      next(action);
      var current = store.getState();

      if (!current.isDragging) {
        return;
      }

      if (!wasDestinationChange(previous, current, action)) {
        return;
      }

      var maxScroll = getUpdatedViewportMax(current.viewport);

      if (maxScroll) {
        next(updateViewportMaxScroll({
          maxScroll: maxScroll
        }));
      }
    };
  };
});

var composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ : compose;
var createStore$1 = (function (_ref) {
  var getDimensionMarshal = _ref.getDimensionMarshal,
      styleMarshal = _ref.styleMarshal,
      getResponders = _ref.getResponders,
      announce = _ref.announce,
      getScroller = _ref.getScroller;
  return createStore(reducer, composeEnhancers(applyMiddleware(style(styleMarshal), dimensionMarshalStopper(getDimensionMarshal), lift$1(getDimensionMarshal), drop$1, dropAnimationFinish, pendingDrop, updateViewportMaxScrollOnDestinationChange, autoScroll(getScroller), responders(getResponders, announce))));
});

var clean$2 = function clean() {
  return {
    additions: {},
    removals: {},
    modified: {}
  };
};

var timingKey = 'Publish collection from DOM';
var createPublisher = (function (_ref) {
  var getEntries = _ref.getEntries,
      callbacks = _ref.callbacks;

  var advancedUsageWarning = function () {
    if (process.env.NODE_ENV === 'production') {
      return function () {};
    }

    var hasAnnounced = false;
    return function () {
      if (hasAnnounced) {
        return;
      }

      hasAnnounced = true;
      process.env.NODE_ENV !== "production" ? warning("\n        Advanced usage warning: you are adding or removing a dimension during a drag\n        This an advanced feature.\n\n        More information: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/changes-while-dragging.md\n      ") : void 0;
    };
  }();

  var staging = clean$2();
  var frameId = null;

  var collect = function collect() {
    advancedUsageWarning();

    if (frameId) {
      return;
    }

    frameId = requestAnimationFrame(function () {
      frameId = null;
      callbacks.collectionStarting();
      start(timingKey);
      var entries = getEntries();
      var _staging = staging,
          additions = _staging.additions,
          removals = _staging.removals,
          modified = _staging.modified;

      var added = _Object$keys(additions).map(function (id) {
        return entries.draggables[id].getDimension(origin);
      }).sort(function (a, b) {
        return a.descriptor.index - b.descriptor.index;
      });

      var updated = _Object$keys(modified).map(function (id) {
        var entry = entries.droppables[id];
        !entry ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find dynamically added droppable in cache') : invariant(false) : void 0;
        return entry.callbacks.recollect();
      });

      var result = {
        additions: added,
        removals: _Object$keys(removals),
        modified: updated
      };
      staging = clean$2();
      finish(timingKey);
      callbacks.publish(result);
    });
  };

  var add$$1 = function add$$1(descriptor) {
    staging.additions[descriptor.id] = descriptor;
    staging.modified[descriptor.droppableId] = true;

    if (staging.removals[descriptor.id]) {
      delete staging.removals[descriptor.id];
    }

    collect();
  };

  var remove = function remove(descriptor) {
    staging.removals[descriptor.id] = descriptor;
    staging.modified[descriptor.droppableId] = true;

    if (staging.additions[descriptor.id]) {
      delete staging.additions[descriptor.id];
    }

    collect();
  };

  var stop = function stop() {
    if (!frameId) {
      return;
    }

    cancelAnimationFrame(frameId);
    frameId = null;
    staging = clean$2();
  };

  return {
    add: add$$1,
    remove: remove,
    stop: stop
  };
});

var getWindowScroll = (function () {
  return {
    x: window.pageXOffset,
    y: window.pageYOffset
  };
});

var getViewport = (function () {
  var scroll = getWindowScroll();
  var maxScroll = getMaxWindowScroll();
  var top = scroll.y;
  var left = scroll.x;
  var doc = getDocumentElement();
  var width = doc.clientWidth;
  var height = doc.clientHeight;
  var right = left + width;
  var bottom = top + height;
  var frame = getRect({
    top: top,
    left: left,
    right: right,
    bottom: bottom
  });
  var viewport = {
    frame: frame,
    scroll: {
      initial: scroll,
      current: scroll,
      max: maxScroll,
      diff: {
        value: origin,
        displacement: origin
      }
    }
  };
  return viewport;
});

var getInitialPublish = (function (_ref) {
  var critical = _ref.critical,
      scrollOptions = _ref.scrollOptions,
      entries = _ref.entries;
  var timingKey = 'Initial collection from DOM';
  start(timingKey);
  var viewport = getViewport();
  var windowScroll = viewport.scroll.current;
  var home = critical.droppable;
  var droppables = values(entries.droppables).filter(function (entry) {
    return entry.descriptor.type === home.type;
  }).map(function (entry) {
    return entry.callbacks.getDimensionAndWatchScroll(windowScroll, scrollOptions);
  });
  var draggables = values(entries.draggables).filter(function (entry) {
    return entry.descriptor.type === critical.draggable.type;
  }).map(function (entry) {
    return entry.getDimension(windowScroll);
  });
  var dimensions = {
    draggables: toDraggableMap(draggables),
    droppables: toDroppableMap(droppables)
  };
  finish(timingKey);
  var result = {
    dimensions: dimensions,
    critical: critical,
    viewport: viewport
  };
  return result;
});

var throwIfAddOrRemoveOfWrongType = function throwIfAddOrRemoveOfWrongType(collection, descriptor) {
  !(collection.critical.draggable.type === descriptor.type) ? process.env.NODE_ENV !== "production" ? invariant(false, "We have detected that you have added a Draggable during a drag.\n      This is not of the same type as the dragging item\n\n      Dragging type: " + collection.critical.draggable.type + ".\n      Added type: " + descriptor.type + "\n\n      We are not allowing this as you can run into problems if your change\n      has shifted the positioning of other Droppables, or has changed the size of the page") : invariant(false) : void 0;
};

var createDimensionMarshal = (function (callbacks) {
  var entries = {
    droppables: {},
    draggables: {}
  };
  var collection = null;
  var publisher = createPublisher({
    callbacks: {
      publish: callbacks.publishWhileDragging,
      collectionStarting: callbacks.collectionStarting
    },
    getEntries: function getEntries() {
      return entries;
    }
  });

  var registerDraggable = function registerDraggable(descriptor, getDimension) {
    var entry = {
      descriptor: descriptor,
      getDimension: getDimension
    };
    entries.draggables[descriptor.id] = entry;

    if (!collection) {
      return;
    }

    throwIfAddOrRemoveOfWrongType(collection, descriptor);
    publisher.add(descriptor);
  };

  var updateDraggable = function updateDraggable(previous, descriptor, getDimension) {
    !entries.draggables[previous.id] ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot update draggable registration as no previous registration was found') : invariant(false) : void 0;
    delete entries.draggables[previous.id];
    var entry = {
      descriptor: descriptor,
      getDimension: getDimension
    };
    entries.draggables[descriptor.id] = entry;
  };

  var unregisterDraggable = function unregisterDraggable(descriptor) {
    var entry = entries.draggables[descriptor.id];
    !entry ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot unregister Draggable with id:\n      " + descriptor.id + " as it is not registered") : invariant(false) : void 0;

    if (entry.descriptor !== descriptor) {
      return;
    }

    delete entries.draggables[descriptor.id];

    if (!collection) {
      return;
    }

    !(collection.critical.draggable.id !== descriptor.id) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot remove the dragging item during a drag') : invariant(false) : void 0;
    throwIfAddOrRemoveOfWrongType(collection, descriptor);
    publisher.remove(descriptor);
  };

  var registerDroppable = function registerDroppable(descriptor, droppableCallbacks) {
    var id = descriptor.id;
    entries.droppables[id] = {
      descriptor: descriptor,
      callbacks: droppableCallbacks
    };
    !!collection ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot add a Droppable during a drag') : invariant(false) : void 0;
  };

  var updateDroppable = function updateDroppable(previous, descriptor, droppableCallbacks) {
    !entries.droppables[previous.id] ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot update droppable registration as no previous registration was found') : invariant(false) : void 0;
    delete entries.droppables[previous.id];
    var entry = {
      descriptor: descriptor,
      callbacks: droppableCallbacks
    };
    entries.droppables[descriptor.id] = entry;
    !!collection ? process.env.NODE_ENV !== "production" ? invariant(false, 'You are not able to update the id or type of a droppable during a drag') : invariant(false) : void 0;
  };

  var unregisterDroppable = function unregisterDroppable(descriptor) {
    var entry = entries.droppables[descriptor.id];
    !entry ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot unregister Droppable with id " + descriptor.id + " as as it is not registered") : invariant(false) : void 0;

    if (entry.descriptor !== descriptor) {
      return;
    }

    delete entries.droppables[descriptor.id];
    !!collection ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot add a Droppable during a drag') : invariant(false) : void 0;
  };

  var updateDroppableIsEnabled = function updateDroppableIsEnabled(id, isEnabled) {
    !entries.droppables[id] ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot update is enabled flag of Droppable " + id + " as it is not registered") : invariant(false) : void 0;

    if (!collection) {
      return;
    }

    callbacks.updateDroppableIsEnabled({
      id: id,
      isEnabled: isEnabled
    });
  };

  var updateDroppableIsCombineEnabled = function updateDroppableIsCombineEnabled(id, isCombineEnabled) {
    !entries.droppables[id] ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot update isCombineEnabled flag of Droppable " + id + " as it is not registered") : invariant(false) : void 0;

    if (!collection) {
      return;
    }

    callbacks.updateDroppableIsCombineEnabled({
      id: id,
      isCombineEnabled: isCombineEnabled
    });
  };

  var updateDroppableScroll = function updateDroppableScroll(id, newScroll) {
    !entries.droppables[id] ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot update the scroll on Droppable " + id + " as it is not registered") : invariant(false) : void 0;

    if (!collection) {
      return;
    }

    callbacks.updateDroppableScroll({
      id: id,
      offset: newScroll
    });
  };

  var scrollDroppable = function scrollDroppable(id, change) {
    var entry = entries.droppables[id];
    !entry ? process.env.NODE_ENV !== "production" ? invariant(false, "Cannot scroll Droppable " + id + " as it is not registered") : invariant(false) : void 0;

    if (!collection) {
      return;
    }

    entry.callbacks.scroll(change);
  };

  var stopPublishing = function stopPublishing() {
    if (!collection) {
      return;
    }

    publisher.stop();
    var home = collection.critical.droppable;
    values(entries.droppables).filter(function (entry) {
      return entry.descriptor.type === home.type;
    }).forEach(function (entry) {
      return entry.callbacks.dragStopped();
    });
    collection = null;
  };

  var startPublishing = function startPublishing(request) {
    !!collection ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot start capturing critical dimensions as there is already a collection') : invariant(false) : void 0;
    var entry = entries.draggables[request.draggableId];
    !entry ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find critical draggable entry') : invariant(false) : void 0;
    var home = entries.droppables[entry.descriptor.droppableId];
    !home ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find critical droppable entry') : invariant(false) : void 0;
    var critical = {
      draggable: entry.descriptor,
      droppable: home.descriptor
    };
    collection = {
      critical: critical
    };
    return getInitialPublish({
      critical: critical,
      entries: entries,
      scrollOptions: request.scrollOptions
    });
  };

  var marshal = {
    registerDraggable: registerDraggable,
    updateDraggable: updateDraggable,
    unregisterDraggable: unregisterDraggable,
    registerDroppable: registerDroppable,
    updateDroppable: updateDroppable,
    unregisterDroppable: unregisterDroppable,
    updateDroppableIsEnabled: updateDroppableIsEnabled,
    updateDroppableIsCombineEnabled: updateDroppableIsCombineEnabled,
    scrollDroppable: scrollDroppable,
    updateDroppableScroll: updateDroppableScroll,
    startPublishing: startPublishing,
    stopPublishing: stopPublishing
  };
  return marshal;
});

var curves = {
  outOfTheWay: 'cubic-bezier(0.2, 0, 0, 1)',
  drop: 'cubic-bezier(.2,1,.1,1)'
};
var combine = {
  opacity: {
    drop: 0,
    combining: 0.7
  },
  scale: {
    drop: 0.75
  }
};
var outOfTheWayTime = 0.2;
var outOfTheWayTiming = outOfTheWayTime + "s " + curves.outOfTheWay;
var transitions = {
  fluid: "opacity " + outOfTheWayTiming,
  snap: "transform " + outOfTheWayTiming + ", opacity " + outOfTheWayTiming,
  drop: function drop(duration) {
    var timing = duration + "s " + curves.drop;
    return "transform " + timing + ", opacity " + timing;
  },
  outOfTheWay: "transform " + outOfTheWayTiming
};

var moveTo = function moveTo(offset$$1) {
  return isEqual(offset$$1, origin) ? null : "translate(" + offset$$1.x + "px, " + offset$$1.y + "px)";
};

var transforms = {
  moveTo: moveTo,
  drop: function drop(offset$$1, isCombining) {
    var translate = moveTo(offset$$1);

    if (!translate) {
      return null;
    }

    if (!isCombining) {
      return translate;
    }

    return translate + " scale(" + combine.scale.drop + ")";
  }
};

var prefix = 'data-react-beautiful-dnd';
var dragHandle = prefix + "-drag-handle";
var draggable = prefix + "-draggable";
var droppable = prefix + "-droppable";

var makeGetSelector = function makeGetSelector(context) {
  return function (attribute) {
    return "[" + attribute + "=\"" + context + "\"]";
  };
};

var getStyles = function getStyles(rules, property) {
  return rules.map(function (rule) {
    var value = rule.styles[property];

    if (!value) {
      return '';
    }

    return rule.selector + " { " + value + " }";
  }).join(' ');
};

var noPointerEvents = 'pointer-events: none;';
var getStyles$1 = (function (styleContext) {
  var getSelector = makeGetSelector(styleContext);

  var dragHandle$$1 = function () {
    var grabCursor = "\n      cursor: -webkit-grab;\n      cursor: grab;\n    ";
    return {
      selector: getSelector(dragHandle),
      styles: {
        always: "\n          -webkit-touch-callout: none;\n          -webkit-tap-highlight-color: rgba(0,0,0,0);\n          touch-action: manipulation;\n        ",
        resting: grabCursor,
        dragging: noPointerEvents,
        dropAnimating: grabCursor
      }
    };
  }();

  var draggable$$1 = function () {
    var transition = "\n      transition: " + transitions.outOfTheWay + ";\n    ";
    return {
      selector: getSelector(draggable),
      styles: {
        dragging: transition,
        dropAnimating: transition,
        userCancel: transition
      }
    };
  }();

  var droppable$$1 = {
    selector: getSelector(droppable),
    styles: {
      always: "overflow-anchor: none;"
    }
  };
  var body = {
    selector: 'body',
    styles: {
      dragging: "\n        cursor: grabbing;\n        cursor: -webkit-grabbing;\n        user-select: none;\n        -webkit-user-select: none;\n        -moz-user-select: none;\n        -ms-user-select: none;\n        overflow-anchor: none;\n      "
    }
  };
  var rules = [draggable$$1, dragHandle$$1, droppable$$1, body];
  return {
    always: getStyles(rules, 'always'),
    resting: getStyles(rules, 'resting'),
    dragging: getStyles(rules, 'dragging'),
    dropAnimating: getStyles(rules, 'dropAnimating'),
    userCancel: getStyles(rules, 'userCancel')
  };
});

var count = 0;
var resetStyleContext = function resetStyleContext() {
  count = 0;
};

var getHead = function getHead() {
  var head = document.querySelector('head');
  !head ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find the head to append a style to') : invariant(false) : void 0;
  return head;
};

var createStyleEl = function createStyleEl() {
  var el = document.createElement('style');
  el.type = 'text/css';
  return el;
};

var createStyleMarshal = (function () {
  var context = "" + count++;
  var styles = getStyles$1(context);
  var always = null;
  var dynamic = null;
  var setStyle = memoizeOne(function (el, proposed) {
    !el ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot set style of style tag if not mounted') : invariant(false) : void 0;
    el.innerHTML = proposed;
  });

  var mount = function mount() {
    !(!always && !dynamic) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Style marshal already mounted') : invariant(false) : void 0;
    always = createStyleEl();
    dynamic = createStyleEl();
    always.setAttribute(prefix + "-always", context);
    dynamic.setAttribute(prefix + "-dynamic", context);
    getHead().appendChild(always);
    getHead().appendChild(dynamic);
    setStyle(always, styles.always);
    setStyle(dynamic, styles.resting);
  };

  var dragging = function dragging() {
    return setStyle(dynamic, styles.dragging);
  };

  var dropping = function dropping(reason) {
    if (reason === 'DROP') {
      setStyle(dynamic, styles.dropAnimating);
      return;
    }

    setStyle(dynamic, styles.userCancel);
  };

  var resting = function resting() {
    return setStyle(dynamic, styles.resting);
  };

  var unmount = function unmount() {
    !(always && dynamic) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot unmount style marshal as it is already unmounted') : invariant(false) : void 0;
    getHead().removeChild(always);
    getHead().removeChild(dynamic);
    always = null;
    dynamic = null;
  };

  var marshal = {
    dragging: dragging,
    dropping: dropping,
    resting: resting,
    styleContext: context,
    mount: mount,
    unmount: unmount
  };
  return marshal;
});

var canStartDrag = (function (state, id) {
  if (state.phase === 'IDLE') {
    return true;
  }

  if (state.phase !== 'DROP_ANIMATING') {
    return false;
  }

  if (state.pending.result.draggableId === id) {
    return false;
  }

  return state.pending.result.reason === 'DROP';
});

var scrollWindow = (function (change) {
  window.scrollBy(change.x, change.y);
});

var getBodyElement = (function () {
  var body = document.body;
  !body ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot find document.body') : invariant(false) : void 0;
  return body;
});

var count$1 = 0;
var visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  margin: '-1px',
  border: '0',
  padding: '0',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  'clip-path': 'inset(100%)'
};
var createAnnouncer = (function () {
  var id = "react-beautiful-dnd-announcement-" + count$1++;
  var el = null;

  var announce = function announce(message) {
    if (el) {
      el.textContent = message;
      return;
    }

    process.env.NODE_ENV !== "production" ? warning("\n      A screen reader message was trying to be announced but it was unable to do so.\n      This can occur if you unmount your <DragDropContext /> in your onDragEnd.\n      Consider calling provided.announce() before the unmount so that the instruction will\n      not be lost for users relying on a screen reader.\n\n      Message not passed to screen reader:\n\n      \"" + message + "\"\n    ") : void 0;
  };

  var mount = function mount() {
    !!el ? process.env.NODE_ENV !== "production" ? invariant(false, 'Announcer already mounted') : invariant(false) : void 0;
    el = document.createElement('div');
    el.id = id;
    el.setAttribute('aria-live', 'assertive');
    el.setAttribute('role', 'log');
    el.setAttribute('aria-atomic', 'true');

    _Object$assign(el.style, visuallyHidden);

    getBodyElement().appendChild(el);
  };

  var unmount = function unmount() {
    !el ? process.env.NODE_ENV !== "production" ? invariant(false, 'Will not unmount announcer as it is already unmounted') : invariant(false) : void 0;
    getBodyElement().removeChild(el);
    el = null;
  };

  var announcer = {
    announce: announce,
    id: id,
    mount: mount,
    unmount: unmount
  };
  return announcer;
});

var getScrollableDroppables = memoizeOne(function (droppables) {
  return toDroppableList(droppables).filter(function (droppable) {
    if (!droppable.isEnabled) {
      return false;
    }

    if (!droppable.frame) {
      return false;
    }

    return true;
  });
});

var getScrollableDroppableOver = function getScrollableDroppableOver(target, droppables) {
  var maybe = find(getScrollableDroppables(droppables), function (droppable) {
    !droppable.frame ? process.env.NODE_ENV !== "production" ? invariant(false, 'Invalid result') : invariant(false) : void 0;
    return isPositionInFrame(droppable.frame.pageMarginBox)(target);
  });
  return maybe;
};

var getBestScrollableDroppable = (function (_ref) {
  var center = _ref.center,
      destination = _ref.destination,
      droppables = _ref.droppables;

  if (destination) {
    var _dimension = droppables[destination];

    if (!_dimension.frame) {
      return null;
    }

    return _dimension;
  }

  var dimension = getScrollableDroppableOver(center, droppables);
  return dimension;
});

var config = {
  startFromPercentage: 0.25,
  maxScrollAtPercentage: 0.05,
  maxPixelScroll: 28,
  ease: function ease(percentage) {
    return Math.pow(percentage, 2);
  },
  durationDampening: {
    stopDampeningAt: 1200,
    accelerateAt: 360
  }
};

var getDistanceThresholds = (function (container, axis) {
  var startScrollingFrom = container[axis.size] * config.startFromPercentage;
  var maxScrollValueAt = container[axis.size] * config.maxScrollAtPercentage;
  var thresholds = {
    startScrollingFrom: startScrollingFrom,
    maxScrollValueAt: maxScrollValueAt
  };
  return thresholds;
});

var getPercentage = (function (_ref) {
  var startOfRange = _ref.startOfRange,
      endOfRange = _ref.endOfRange,
      current = _ref.current;
  var range = endOfRange - startOfRange;

  if (range === 0) {
    process.env.NODE_ENV !== "production" ? warning("\n      Detected distance range of 0 in the fluid auto scroller\n      This is unexpected and would cause a divide by 0 issue.\n      Not allowing an auto scroll\n    ") : void 0;
    return 0;
  }

  var currentInRange = current - startOfRange;
  var percentage = currentInRange / range;
  return percentage;
});

var minScroll = 1;

var getValueFromDistance = (function (distanceToEdge, thresholds) {
  if (distanceToEdge > thresholds.startScrollingFrom) {
    return 0;
  }

  if (distanceToEdge <= thresholds.maxScrollValueAt) {
    return config.maxPixelScroll;
  }

  if (distanceToEdge === thresholds.startScrollingFrom) {
    return minScroll;
  }

  var percentageFromMaxScrollValueAt = getPercentage({
    startOfRange: thresholds.maxScrollValueAt,
    endOfRange: thresholds.startScrollingFrom,
    current: distanceToEdge
  });
  var percentageFromStartScrollingFrom = 1 - percentageFromMaxScrollValueAt;
  var scroll = config.maxPixelScroll * config.ease(percentageFromStartScrollingFrom);
  return Math.ceil(scroll);
});

var accelerateAt = config.durationDampening.accelerateAt;
var stopAt = config.durationDampening.stopDampeningAt;
var dampenValueByTime = (function (proposedScroll, dragStartTime) {
  var startOfRange = dragStartTime;
  var endOfRange = stopAt;

  var now = _Date$now();

  var runTime = now - startOfRange;

  if (runTime >= stopAt) {
    return proposedScroll;
  }

  if (runTime < accelerateAt) {
    return minScroll;
  }

  var betweenAccelerateAtAndStopAtPercentage = getPercentage({
    startOfRange: accelerateAt,
    endOfRange: endOfRange,
    current: runTime
  });
  var scroll = proposedScroll * config.ease(betweenAccelerateAtAndStopAtPercentage);
  return Math.ceil(scroll);
});

var getValue = (function (_ref) {
  var distanceToEdge = _ref.distanceToEdge,
      thresholds = _ref.thresholds,
      dragStartTime = _ref.dragStartTime,
      shouldUseTimeDampening = _ref.shouldUseTimeDampening;
  var scroll = getValueFromDistance(distanceToEdge, thresholds);

  if (scroll === 0) {
    return 0;
  }

  if (!shouldUseTimeDampening) {
    return scroll;
  }

  return Math.max(dampenValueByTime(scroll, dragStartTime), minScroll);
});

var getScrollOnAxis = (function (_ref) {
  var container = _ref.container,
      distanceToEdges = _ref.distanceToEdges,
      dragStartTime = _ref.dragStartTime,
      axis = _ref.axis,
      shouldUseTimeDampening = _ref.shouldUseTimeDampening;
  var thresholds = getDistanceThresholds(container, axis);
  var isCloserToEnd = distanceToEdges[axis.end] < distanceToEdges[axis.start];

  if (isCloserToEnd) {
    return getValue({
      distanceToEdge: distanceToEdges[axis.end],
      thresholds: thresholds,
      dragStartTime: dragStartTime,
      shouldUseTimeDampening: shouldUseTimeDampening
    });
  }

  return -1 * getValue({
    distanceToEdge: distanceToEdges[axis.start],
    thresholds: thresholds,
    dragStartTime: dragStartTime,
    shouldUseTimeDampening: shouldUseTimeDampening
  });
});

var adjustForSizeLimits = (function (_ref) {
  var container = _ref.container,
      subject = _ref.subject,
      proposedScroll = _ref.proposedScroll;
  var isTooBigVertically = subject.height > container.height;
  var isTooBigHorizontally = subject.width > container.width;

  if (!isTooBigHorizontally && !isTooBigVertically) {
    return proposedScroll;
  }

  if (isTooBigHorizontally && isTooBigVertically) {
    return null;
  }

  return {
    x: isTooBigHorizontally ? 0 : proposedScroll.x,
    y: isTooBigVertically ? 0 : proposedScroll.y
  };
});

var clean$3 = apply(function (value) {
  return value === 0 ? 0 : value;
});
var getScroll = (function (_ref) {
  var dragStartTime = _ref.dragStartTime,
      container = _ref.container,
      subject = _ref.subject,
      center = _ref.center,
      shouldUseTimeDampening = _ref.shouldUseTimeDampening;
  var distanceToEdges = {
    top: center.y - container.top,
    right: container.right - center.x,
    bottom: container.bottom - center.y,
    left: center.x - container.left
  };
  var y = getScrollOnAxis({
    container: container,
    distanceToEdges: distanceToEdges,
    dragStartTime: dragStartTime,
    axis: vertical,
    shouldUseTimeDampening: shouldUseTimeDampening
  });
  var x = getScrollOnAxis({
    container: container,
    distanceToEdges: distanceToEdges,
    dragStartTime: dragStartTime,
    axis: horizontal,
    shouldUseTimeDampening: shouldUseTimeDampening
  });
  var required = clean$3({
    x: x,
    y: y
  });

  if (isEqual(required, origin)) {
    return null;
  }

  var limited = adjustForSizeLimits({
    container: container,
    subject: subject,
    proposedScroll: required
  });

  if (!limited) {
    return null;
  }

  return isEqual(limited, origin) ? null : limited;
});

var smallestSigned = apply(function (value) {
  if (value === 0) {
    return 0;
  }

  return value > 0 ? 1 : -1;
});
var getOverlap = function () {
  var getRemainder = function getRemainder(target, max) {
    if (target < 0) {
      return target;
    }

    if (target > max) {
      return target - max;
    }

    return 0;
  };

  return function (_ref) {
    var current = _ref.current,
        max = _ref.max,
        change = _ref.change;
    var targetScroll = add(current, change);
    var overlap = {
      x: getRemainder(targetScroll.x, max.x),
      y: getRemainder(targetScroll.y, max.y)
    };

    if (isEqual(overlap, origin)) {
      return null;
    }

    return overlap;
  };
}();
var canPartiallyScroll = function canPartiallyScroll(_ref2) {
  var rawMax = _ref2.max,
      current = _ref2.current,
      change = _ref2.change;
  var max = {
    x: Math.max(current.x, rawMax.x),
    y: Math.max(current.y, rawMax.y)
  };
  var smallestChange = smallestSigned(change);
  var overlap = getOverlap({
    max: max,
    current: current,
    change: smallestChange
  });

  if (!overlap) {
    return true;
  }

  if (smallestChange.x !== 0 && overlap.x === 0) {
    return true;
  }

  if (smallestChange.y !== 0 && overlap.y === 0) {
    return true;
  }

  return false;
};
var canScrollWindow = function canScrollWindow(viewport, change) {
  return canPartiallyScroll({
    current: viewport.scroll.current,
    max: viewport.scroll.max,
    change: change
  });
};
var getWindowOverlap = function getWindowOverlap(viewport, change) {
  if (!canScrollWindow(viewport, change)) {
    return null;
  }

  var max = viewport.scroll.max;
  var current = viewport.scroll.current;
  return getOverlap({
    current: current,
    max: max,
    change: change
  });
};
var canScrollDroppable = function canScrollDroppable(droppable, change) {
  var frame = droppable.frame;

  if (!frame) {
    return false;
  }

  return canPartiallyScroll({
    current: frame.scroll.current,
    max: frame.scroll.max,
    change: change
  });
};
var getDroppableOverlap = function getDroppableOverlap(droppable, change) {
  var frame = droppable.frame;

  if (!frame) {
    return null;
  }

  if (!canScrollDroppable(droppable, change)) {
    return null;
  }

  return getOverlap({
    current: frame.scroll.current,
    max: frame.scroll.max,
    change: change
  });
};

var getWindowScrollChange = (function (_ref) {
  var viewport = _ref.viewport,
      subject = _ref.subject,
      center = _ref.center,
      dragStartTime = _ref.dragStartTime,
      shouldUseTimeDampening = _ref.shouldUseTimeDampening;
  var scroll = getScroll({
    dragStartTime: dragStartTime,
    container: viewport.frame,
    subject: subject,
    center: center,
    shouldUseTimeDampening: shouldUseTimeDampening
  });
  return scroll && canScrollWindow(viewport, scroll) ? scroll : null;
});

var getDroppableScrollChange = (function (_ref) {
  var droppable = _ref.droppable,
      subject = _ref.subject,
      center = _ref.center,
      dragStartTime = _ref.dragStartTime,
      shouldUseTimeDampening = _ref.shouldUseTimeDampening;
  var frame = droppable.frame;

  if (!frame) {
    return null;
  }

  var scroll = getScroll({
    dragStartTime: dragStartTime,
    container: frame.pageMarginBox,
    subject: subject,
    center: center,
    shouldUseTimeDampening: shouldUseTimeDampening
  });
  return scroll && canScrollDroppable(droppable, scroll) ? scroll : null;
});

var scroll$1 = (function (_ref) {
  var state = _ref.state,
      dragStartTime = _ref.dragStartTime,
      shouldUseTimeDampening = _ref.shouldUseTimeDampening,
      scrollWindow = _ref.scrollWindow,
      scrollDroppable = _ref.scrollDroppable;
  var center = state.current.page.borderBoxCenter;
  var draggable = state.dimensions.draggables[state.critical.draggable.id];
  var subject = draggable.page.marginBox;

  if (state.isWindowScrollAllowed) {
    var viewport = state.viewport;

    var _change = getWindowScrollChange({
      dragStartTime: dragStartTime,
      viewport: viewport,
      subject: subject,
      center: center,
      shouldUseTimeDampening: shouldUseTimeDampening
    });

    if (_change) {
      scrollWindow(_change);
      return;
    }
  }

  var droppable = getBestScrollableDroppable({
    center: center,
    destination: whatIsDraggedOver(state.impact),
    droppables: state.dimensions.droppables
  });

  if (!droppable) {
    return;
  }

  var change = getDroppableScrollChange({
    dragStartTime: dragStartTime,
    droppable: droppable,
    subject: subject,
    center: center,
    shouldUseTimeDampening: shouldUseTimeDampening
  });

  if (change) {
    scrollDroppable(droppable.descriptor.id, change);
  }
});

var createFluidScroller = (function (_ref) {
  var scrollWindow = _ref.scrollWindow,
      scrollDroppable = _ref.scrollDroppable;
  var scheduleWindowScroll = rafSchd(scrollWindow);
  var scheduleDroppableScroll = rafSchd(scrollDroppable);
  var dragging = null;

  var tryScroll = function tryScroll(state) {
    !dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot fluid scroll if not dragging') : invariant(false) : void 0;
    var _dragging = dragging,
        shouldUseTimeDampening = _dragging.shouldUseTimeDampening,
        dragStartTime = _dragging.dragStartTime;
    scroll$1({
      state: state,
      scrollWindow: scheduleWindowScroll,
      scrollDroppable: scheduleDroppableScroll,
      dragStartTime: dragStartTime,
      shouldUseTimeDampening: shouldUseTimeDampening
    });
  };

  var cancelPending = function cancelPending() {
    !dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot cancel pending fluid scroll when not started') : invariant(false) : void 0;
    scheduleWindowScroll.cancel();
    scheduleDroppableScroll.cancel();
  };

  var start$$1 = function start$$1(state) {
    start('starting fluid scroller');
    !!dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot start auto scrolling when already started') : invariant(false) : void 0;

    var dragStartTime = _Date$now();

    var wasScrollNeeded = false;

    var fakeScrollCallback = function fakeScrollCallback() {
      wasScrollNeeded = true;
    };

    scroll$1({
      state: state,
      dragStartTime: 0,
      shouldUseTimeDampening: false,
      scrollWindow: fakeScrollCallback,
      scrollDroppable: fakeScrollCallback
    });
    dragging = {
      dragStartTime: dragStartTime,
      shouldUseTimeDampening: wasScrollNeeded
    };
    finish('starting fluid scroller');

    if (wasScrollNeeded) {
      tryScroll(state);
    }
  };

  var stop = function stop() {
    if (!dragging) {
      return;
    }

    cancelPending();
    dragging = null;
  };

  return {
    start: start$$1,
    stop: stop,
    cancelPending: cancelPending,
    scroll: tryScroll
  };
});

var createJumpScroller = (function (_ref) {
  var move = _ref.move,
      scrollDroppable = _ref.scrollDroppable,
      scrollWindow = _ref.scrollWindow;

  var moveByOffset = function moveByOffset(state, offset$$1) {
    var client = add(state.current.client.selection, offset$$1);
    move({
      client: client
    });
  };

  var scrollDroppableAsMuchAsItCan = function scrollDroppableAsMuchAsItCan(droppable, change) {
    if (!canScrollDroppable(droppable, change)) {
      return change;
    }

    var overlap = getDroppableOverlap(droppable, change);

    if (!overlap) {
      scrollDroppable(droppable.descriptor.id, change);
      return null;
    }

    var whatTheDroppableCanScroll = subtract(change, overlap);
    scrollDroppable(droppable.descriptor.id, whatTheDroppableCanScroll);
    var remainder = subtract(change, whatTheDroppableCanScroll);
    return remainder;
  };

  var scrollWindowAsMuchAsItCan = function scrollWindowAsMuchAsItCan(isWindowScrollAllowed, viewport, change) {
    if (!isWindowScrollAllowed) {
      return change;
    }

    if (!canScrollWindow(viewport, change)) {
      return change;
    }

    var overlap = getWindowOverlap(viewport, change);

    if (!overlap) {
      scrollWindow(change);
      return null;
    }

    var whatTheWindowCanScroll = subtract(change, overlap);
    scrollWindow(whatTheWindowCanScroll);
    var remainder = subtract(change, whatTheWindowCanScroll);
    return remainder;
  };

  var jumpScroller = function jumpScroller(state) {
    var request = state.scrollJumpRequest;

    if (!request) {
      return;
    }

    var destination = whatIsDraggedOver(state.impact);
    !destination ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot perform a jump scroll when there is no destination') : invariant(false) : void 0;
    var droppableRemainder = scrollDroppableAsMuchAsItCan(state.dimensions.droppables[destination], request);

    if (!droppableRemainder) {
      return;
    }

    var viewport = state.viewport;
    var windowRemainder = scrollWindowAsMuchAsItCan(state.isWindowScrollAllowed, viewport, droppableRemainder);

    if (!windowRemainder) {
      return;
    }

    moveByOffset(state, windowRemainder);
  };

  return jumpScroller;
});

var createAutoScroller = (function (_ref) {
  var scrollDroppable = _ref.scrollDroppable,
      scrollWindow = _ref.scrollWindow,
      move = _ref.move;
  var fluidScroller = createFluidScroller({
    scrollWindow: scrollWindow,
    scrollDroppable: scrollDroppable
  });
  var jumpScroll = createJumpScroller({
    move: move,
    scrollWindow: scrollWindow,
    scrollDroppable: scrollDroppable
  });

  var scroll = function scroll(state) {
    if (state.phase !== 'DRAGGING') {
      return;
    }

    if (state.movementMode === 'FLUID') {
      fluidScroller.scroll(state);
      return;
    }

    if (!state.scrollJumpRequest) {
      return;
    }

    jumpScroll(state);
  };

  var scroller = {
    scroll: scroll,
    cancelPending: fluidScroller.cancelPending,
    start: fluidScroller.start,
    stop: fluidScroller.stop
  };
  return scroller;
});

var prefix$1 = function prefix(key) {
  return "private-react-beautiful-dnd-key-do-not-use-" + key;
};

var storeKey = prefix$1('store');
var droppableIdKey = prefix$1('droppable-id');
var droppableTypeKey = prefix$1('droppable-type');
var dimensionMarshalKey = prefix$1('dimension-marshal');
var styleContextKey = prefix$1('style-context');
var canLiftContextKey = prefix$1('can-lift');

var peerDependencies = {
	react: "^16.3.1"
};

var semver = /(\d+)\.(\d+)\.(\d+)/;

var getVersion = function getVersion(value) {
  var result = semver.exec(value);
  !(result != null) ? process.env.NODE_ENV !== "production" ? invariant(false, "Unable to parse React version " + value) : invariant(false) : void 0;
  var major = Number(result[1]);
  var minor = Number(result[2]);
  var patch = Number(result[3]);
  return {
    major: major,
    minor: minor,
    patch: patch,
    raw: value
  };
};

var isSatisfied = function isSatisfied(expected, actual) {
  if (actual.major > expected.major) {
    return true;
  }

  if (actual.major < expected.major) {
    return false;
  }

  if (actual.minor > expected.minor) {
    return true;
  }

  if (actual.minor < expected.minor) {
    return false;
  }

  return actual.patch >= expected.patch;
};

var checkReactVersion = (function (peerDepValue, actualValue) {
  var peerDep = getVersion(peerDepValue);
  var actual = getVersion(actualValue);

  if (isSatisfied(peerDep, actual)) {
    return;
  }

  process.env.NODE_ENV !== "production" ? warning("\n    React version: [" + actual.raw + "]\n    does not satisfy expected peer dependency version: [" + peerDep.raw + "]\n\n    This can result in run time bugs, and even fatal crashes\n  ") : void 0;
});

var suffix = "\n  We expect a html5 doctype: <!doctype html>\n  This is to ensure consistent browser layout and measurement\n  More information:\n";
var checkDoctype = (function (doc) {
  var doctype = doc.doctype;

  if (!doctype) {
    process.env.NODE_ENV !== "production" ? warning("\n      No <!doctype html> found.\n\n      " + suffix + "\n    ") : void 0;
    return;
  }

  if (doctype.name.toLowerCase() !== 'html') {
    process.env.NODE_ENV !== "production" ? warning("\n      Unexpected <!doctype> found: (" + doctype.name + ")\n\n      " + suffix + "\n    ") : void 0;
  }

  if (doctype.publicId !== '') {
    process.env.NODE_ENV !== "production" ? warning("\n      Unexpected <!doctype> publicId found: (" + doctype.publicId + ")\n      A html5 doctype does not have a publicId\n\n      " + suffix + "\n    ") : void 0;
  }
});

var _DragDropContext$chil;
var resetServerContext = function resetServerContext() {
  resetStyleContext();
};

var printFatalDevError = function printFatalDevError(error) {
  var _console;

  if (process.env.NODE_ENV === 'production') {
    return;
  }

  (_console = console).error.apply(_console, getFormattedMessage("\n      An error has occurred while a drag is occurring.\n      Any existing drag will be cancelled.\n\n      > " + error.message + "\n      "));

  console.error('raw', error);
};

var DragDropContext = function (_React$Component) {
  _inheritsLoose(DragDropContext, _React$Component);

  function DragDropContext(props, context) {
    var _this;

    _this = _React$Component.call(this, props, context) || this;
    _this.store = void 0;
    _this.dimensionMarshal = void 0;
    _this.styleMarshal = void 0;
    _this.autoScroller = void 0;
    _this.announcer = void 0;
    _this.unsubscribe = void 0;

    _this.canLift = function (id) {
      var canStartDragResult = canStartDrag(_this.store.getState(), id);

      if (canStartDragResult && _this.props.onBeforeEverything) {
        _this.props.onBeforeEverything(id);
      }

      return canStartDragResult;
    };

    _this.onFatalError = function (error) {
      printFatalDevError(error);

      var state = _this.store.getState();

      if (state.phase !== 'IDLE') {
        _this.store.dispatch(clean());
      }
    };

    _this.onWindowError = function (error) {
      return _this.onFatalError(error);
    };

    if (process.env.NODE_ENV !== 'production') {
      !(typeof props.onDragEnd === 'function') ? process.env.NODE_ENV !== "production" ? invariant(false, 'A DragDropContext requires an onDragEnd function to perform reordering logic') : invariant(false) : void 0;
    }

    _this.announcer = createAnnouncer();
    _this.styleMarshal = createStyleMarshal();
    _this.store = createStore$1({
      getDimensionMarshal: function getDimensionMarshal() {
        return _this.dimensionMarshal;
      },
      styleMarshal: _this.styleMarshal,
      getResponders: function getResponders() {
        return {
          onBeforeDragStart: _this.props.onBeforeDragStart,
          onDragStart: _this.props.onDragStart,
          onDragEnd: _this.props.onDragEnd,
          onDragUpdate: _this.props.onDragUpdate
        };
      },
      announce: _this.announcer.announce,
      getScroller: function getScroller() {
        return _this.autoScroller;
      }
    });
    var callbacks = bindActionCreators({
      publishWhileDragging: publishWhileDragging$1,
      updateDroppableScroll: updateDroppableScroll,
      updateDroppableIsEnabled: updateDroppableIsEnabled,
      updateDroppableIsCombineEnabled: updateDroppableIsCombineEnabled,
      collectionStarting: collectionStarting
    }, _this.store.dispatch);
    _this.dimensionMarshal = createDimensionMarshal(callbacks);
    _this.autoScroller = createAutoScroller(_extends({
      scrollWindow: scrollWindow,
      scrollDroppable: _this.dimensionMarshal.scrollDroppable
    }, bindActionCreators({
      move: move
    }, _this.store.dispatch)));
    return _this;
  }

  var _proto = DragDropContext.prototype;

  _proto.getChildContext = function getChildContext() {
    var _ref;

    return _ref = {}, _ref[storeKey] = this.store, _ref[dimensionMarshalKey] = this.dimensionMarshal, _ref[styleContextKey] = this.styleMarshal.styleContext, _ref[canLiftContextKey] = this.canLift, _ref;
  };

  _proto.componentDidMount = function componentDidMount() {
    window.addEventListener('error', this.onWindowError);
    this.styleMarshal.mount();
    this.announcer.mount();

    if (process.env.NODE_ENV !== 'production') {
      checkReactVersion(peerDependencies.react, React.version);
      checkDoctype(document);
    }
  };

  _proto.componentDidCatch = function componentDidCatch(error) {
    this.onFatalError(error);

    if (error.message.indexOf('Invariant failed') !== -1) {
      this.setState({});
      return;
    }

    throw error;
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    window.removeEventListener('error', this.onWindowError);
    var state = this.store.getState();

    if (state.phase !== 'IDLE') {
      this.store.dispatch(clean());
    }

    this.styleMarshal.unmount();
    this.announcer.unmount();
  };

  _proto.render = function render() {
    return this.props.children;
  };

  return DragDropContext;
}(React.Component);

DragDropContext.childContextTypes = (_DragDropContext$chil = {}, _DragDropContext$chil[storeKey] = PropTypes.shape({
  dispatch: PropTypes.func.isRequired,
  subscribe: PropTypes.func.isRequired,
  getState: PropTypes.func.isRequired
}).isRequired, _DragDropContext$chil[dimensionMarshalKey] = PropTypes.object.isRequired, _DragDropContext$chil[styleContextKey] = PropTypes.string.isRequired, _DragDropContext$chil[canLiftContextKey] = PropTypes.func.isRequired, _DragDropContext$chil);

var isEqual$2 = function isEqual(base) {
  return function (value) {
    return base === value;
  };
};

var isScroll = isEqual$2('scroll');
var isAuto = isEqual$2('auto');
var isVisible$1 = isEqual$2('visible');

var isEither = function isEither(overflow, fn) {
  return fn(overflow.overflowX) || fn(overflow.overflowY);
};

var isBoth = function isBoth(overflow, fn) {
  return fn(overflow.overflowX) && fn(overflow.overflowY);
};

var isElementScrollable = function isElementScrollable(el) {
  var style = window.getComputedStyle(el);
  var overflow = {
    overflowX: style.overflowX,
    overflowY: style.overflowY
  };
  return isEither(overflow, isScroll) || isEither(overflow, isAuto);
};

var isBodyScrollable = function isBodyScrollable() {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }

  var body = getBodyElement();
  var html = document.documentElement;
  !html ? process.env.NODE_ENV !== "production" ? invariant(false) : invariant(false) : void 0;

  if (!isElementScrollable(body)) {
    return false;
  }

  var htmlStyle = window.getComputedStyle(html);
  var htmlOverflow = {
    overflowX: htmlStyle.overflowX,
    overflowY: htmlStyle.overflowY
  };

  if (isBoth(htmlOverflow, isVisible$1)) {
    return false;
  }

  process.env.NODE_ENV !== "production" ? warning("\n    We have detected that your <body> element might be a scroll container.\n    We have found no reliable way of detecting whether the <body> element is a scroll container.\n    Under most circumstances a <body> scroll bar will be on the <html> element (document.documentElement)\n\n    Because we cannot determine if the <body> is a scroll container, and generally it is not one,\n    we will be treating the <body> as *not* a scroll container\n\n    More information: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/how-we-detect-scroll-containers.md\n  ") : void 0;
  return false;
};

var getClosestScrollable = function getClosestScrollable(el) {
  if (el == null) {
    return null;
  }

  if (el === document.body) {
    return isBodyScrollable() ? el : null;
  }

  if (el === document.documentElement) {
    return null;
  }

  if (!isElementScrollable(el)) {
    return getClosestScrollable(el.parentElement);
  }

  return el;
};

var checkForNestedScrollContainers = (function (scrollable) {
  if (!scrollable) {
    return;
  }

  var anotherScrollParent = getClosestScrollable(scrollable.parentElement);

  if (!anotherScrollParent) {
    return;
  }

  process.env.NODE_ENV !== "production" ? warning("\n    Droppable: unsupported nested scroll container detected.\n    A Droppable can only have one scroll parent (which can be itself)\n    Nested scroll containers are currently not supported.\n\n    We hope to support nested scroll containers soon: https://github.com/atlassian/react-beautiful-dnd/issues/131\n  ") : void 0;
});

var getScroll$1 = (function (el) {
  return {
    x: el.scrollLeft,
    y: el.scrollTop
  };
});

var getIsFixed = function getIsFixed(el) {
  if (!el) {
    return false;
  }

  var style = window.getComputedStyle(el);

  if (style.position === 'fixed') {
    return true;
  }

  return getIsFixed(el.parentElement);
};

var getEnv = (function (start) {
  var closestScrollable = getClosestScrollable(start);
  var isFixedOnPage = getIsFixed(start);
  return {
    closestScrollable: closestScrollable,
    isFixedOnPage: isFixedOnPage
  };
});

var getClient = function getClient(targetRef, closestScrollable) {
  var base = getBox(targetRef);

  if (!closestScrollable) {
    return base;
  }

  if (targetRef !== closestScrollable) {
    return base;
  }

  var top = base.paddingBox.top - closestScrollable.scrollTop;
  var left = base.paddingBox.left - closestScrollable.scrollLeft;
  var bottom = top + closestScrollable.scrollHeight;
  var right = left + closestScrollable.scrollWidth;
  var paddingBox = {
    top: top,
    right: right,
    bottom: bottom,
    left: left
  };
  var borderBox = expand(paddingBox, base.border);
  var client = createBox({
    borderBox: borderBox,
    margin: base.margin,
    border: base.border,
    padding: base.padding
  });
  return client;
};

var getDimension = (function (_ref) {
  var ref = _ref.ref,
      descriptor = _ref.descriptor,
      env = _ref.env,
      windowScroll = _ref.windowScroll,
      direction = _ref.direction,
      isDropDisabled = _ref.isDropDisabled,
      isCombineEnabled = _ref.isCombineEnabled,
      shouldClipSubject = _ref.shouldClipSubject;
  var closestScrollable = env.closestScrollable;
  var client = getClient(ref, closestScrollable);
  var page = withScroll(client, windowScroll);

  var closest = function () {
    if (!closestScrollable) {
      return null;
    }

    var frameClient = getBox(closestScrollable);
    var scrollSize = {
      scrollHeight: closestScrollable.scrollHeight,
      scrollWidth: closestScrollable.scrollWidth
    };
    return {
      client: frameClient,
      page: withScroll(frameClient, windowScroll),
      scroll: getScroll$1(closestScrollable),
      scrollSize: scrollSize,
      shouldClipSubject: shouldClipSubject
    };
  }();

  var dimension = getDroppableDimension({
    descriptor: descriptor,
    isEnabled: !isDropDisabled,
    isCombineEnabled: isCombineEnabled,
    isFixedOnPage: env.isFixedOnPage,
    direction: direction,
    client: client,
    page: page,
    closest: closest
  });
  return dimension;
});

var _DroppableDimensionPu;

var getClosestScrollable$1 = function getClosestScrollable(dragging) {
  return dragging && dragging.env.closestScrollable || null;
};

var immediate = {
  passive: false
};
var delayed = {
  passive: true
};

var getListenerOptions = function getListenerOptions(options) {
  return options.shouldPublishImmediately ? immediate : delayed;
};

var withoutPlaceholder = function withoutPlaceholder(placeholder, fn) {
  if (!placeholder) {
    return fn();
  }

  var last = placeholder.style.display;
  placeholder.style.display = 'none';
  var result = fn();
  placeholder.style.display = last;
  return result;
};

var DroppableDimensionPublisher = function (_React$Component) {
  _inheritsLoose(DroppableDimensionPublisher, _React$Component);

  function DroppableDimensionPublisher(props, context) {
    var _this;

    _this = _React$Component.call(this, props, context) || this;
    _this.dragging = void 0;
    _this.callbacks = void 0;
    _this.publishedDescriptor = null;

    _this.getClosestScroll = function () {
      var dragging = _this.dragging;

      if (!dragging || !dragging.env.closestScrollable) {
        return origin;
      }

      return getScroll$1(dragging.env.closestScrollable);
    };

    _this.memoizedUpdateScroll = memoizeOne(function (x, y) {
      !_this.publishedDescriptor ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot update scroll on unpublished droppable') : invariant(false) : void 0;
      var newScroll = {
        x: x,
        y: y
      };
      var marshal = _this.context[dimensionMarshalKey];
      marshal.updateDroppableScroll(_this.publishedDescriptor.id, newScroll);
    });

    _this.updateScroll = function () {
      var scroll = _this.getClosestScroll();

      _this.memoizedUpdateScroll(scroll.x, scroll.y);
    };

    _this.scheduleScrollUpdate = rafSchd(_this.updateScroll);

    _this.onClosestScroll = function () {
      var dragging = _this.dragging;
      var closest$$1 = getClosestScrollable$1(_this.dragging);
      !(dragging && closest$$1) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Could not find scroll options while scrolling') : invariant(false) : void 0;
      var options = dragging.scrollOptions;

      if (options.shouldPublishImmediately) {
        _this.updateScroll();

        return;
      }

      _this.scheduleScrollUpdate();
    };

    _this.scroll = function (change) {
      var closest$$1 = getClosestScrollable$1(_this.dragging);
      !closest$$1 ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot scroll a droppable with no closest scrollable') : invariant(false) : void 0;
      closest$$1.scrollTop += change.y;
      closest$$1.scrollLeft += change.x;
    };

    _this.dragStopped = function () {
      var dragging = _this.dragging;
      !dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot stop drag when no active drag') : invariant(false) : void 0;
      var closest$$1 = getClosestScrollable$1(dragging);
      _this.dragging = null;

      if (!closest$$1) {
        return;
      }

      _this.scheduleScrollUpdate.cancel();

      closest$$1.removeEventListener('scroll', _this.onClosestScroll, getListenerOptions(dragging.scrollOptions));
    };

    _this.getMemoizedDescriptor = memoizeOne(function (id, type) {
      return {
        id: id,
        type: type
      };
    });

    _this.publish = function () {
      var marshal = _this.context[dimensionMarshalKey];

      var descriptor = _this.getMemoizedDescriptor(_this.props.droppableId, _this.props.type);

      if (!_this.publishedDescriptor) {
        marshal.registerDroppable(descriptor, _this.callbacks);
        _this.publishedDescriptor = descriptor;
        return;
      }

      if (_this.publishedDescriptor === descriptor) {
        return;
      }

      marshal.updateDroppable(_this.publishedDescriptor, descriptor, _this.callbacks);
      _this.publishedDescriptor = descriptor;
    };

    _this.unpublish = function () {
      !_this.publishedDescriptor ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot unpublish descriptor when none is published') : invariant(false) : void 0;
      var marshal = _this.context[dimensionMarshalKey];
      marshal.unregisterDroppable(_this.publishedDescriptor);
      _this.publishedDescriptor = null;
    };

    _this.recollect = function () {
      var dragging = _this.dragging;
      var closest$$1 = getClosestScrollable$1(dragging);
      !(dragging && closest$$1) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Can only recollect Droppable client for Droppables that have a scroll container') : invariant(false) : void 0;
      return withoutPlaceholder(_this.props.getPlaceholderRef(), function () {
        return getDimension({
          ref: dragging.ref,
          descriptor: dragging.descriptor,
          env: dragging.env,
          windowScroll: origin,
          direction: _this.props.direction,
          isDropDisabled: _this.props.isDropDisabled,
          isCombineEnabled: _this.props.isCombineEnabled,
          shouldClipSubject: !_this.props.ignoreContainerClipping
        });
      });
    };

    _this.getDimensionAndWatchScroll = function (windowScroll, options) {
      !!_this.dragging ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot collect a droppable while a drag is occurring') : invariant(false) : void 0;
      var descriptor = _this.publishedDescriptor;
      !descriptor ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot get dimension for unpublished droppable') : invariant(false) : void 0;

      var ref = _this.props.getDroppableRef();

      !ref ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot collect without a droppable ref') : invariant(false) : void 0;
      var env = getEnv(ref);
      var dragging = {
        ref: ref,
        descriptor: descriptor,
        env: env,
        scrollOptions: options
      };
      _this.dragging = dragging;
      var dimension = getDimension({
        ref: ref,
        descriptor: descriptor,
        env: env,
        windowScroll: windowScroll,
        direction: _this.props.direction,
        isDropDisabled: _this.props.isDropDisabled,
        isCombineEnabled: _this.props.isCombineEnabled,
        shouldClipSubject: !_this.props.ignoreContainerClipping
      });

      if (env.closestScrollable) {
        env.closestScrollable.addEventListener('scroll', _this.onClosestScroll, getListenerOptions(dragging.scrollOptions));

        if (process.env.NODE_ENV !== 'production') {
          checkForNestedScrollContainers(env.closestScrollable);
        }
      }

      return dimension;
    };

    var callbacks = {
      getDimensionAndWatchScroll: _this.getDimensionAndWatchScroll,
      recollect: _this.recollect,
      dragStopped: _this.dragStopped,
      scroll: _this.scroll
    };
    _this.callbacks = callbacks;
    return _this;
  }

  var _proto = DroppableDimensionPublisher.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.publish();
  };

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    this.publish();

    if (!this.dragging) {
      return;
    }

    var isDisabledChanged = this.props.isDropDisabled !== prevProps.isDropDisabled;
    var isCombineChanged = this.props.isCombineEnabled !== prevProps.isCombineEnabled;

    if (!isDisabledChanged && !isCombineChanged) {
      return;
    }

    var marshal = this.context[dimensionMarshalKey];

    if (isDisabledChanged) {
      marshal.updateDroppableIsEnabled(this.props.droppableId, !this.props.isDropDisabled);
    }

    if (isCombineChanged) {
      marshal.updateDroppableIsCombineEnabled(this.props.droppableId, this.props.isCombineEnabled);
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    if (this.dragging) {
      process.env.NODE_ENV !== "production" ? warning('unmounting droppable while a drag is occurring') : void 0;
      this.dragStopped();
    }

    this.unpublish();
  };

  _proto.render = function render() {
    return this.props.children;
  };

  return DroppableDimensionPublisher;
}(React.Component);

DroppableDimensionPublisher.contextTypes = (_DroppableDimensionPu = {}, _DroppableDimensionPu[dimensionMarshalKey] = PropTypes.object.isRequired, _DroppableDimensionPu);

var Placeholder = function (_PureComponent) {
  _inheritsLoose(Placeholder, _PureComponent);

  function Placeholder() {
    return _PureComponent.apply(this, arguments) || this;
  }

  var _proto = Placeholder.prototype;

  _proto.render = function render() {
    var placeholder = this.props.placeholder;
    var client = placeholder.client,
        display = placeholder.display,
        tagName = placeholder.tagName;
    var style = {
      display: display,
      boxSizing: 'border-box',
      width: client.borderBox.width,
      height: client.borderBox.height,
      marginTop: client.margin.top,
      marginRight: client.margin.right,
      marginBottom: client.margin.bottom,
      marginLeft: client.margin.left,
      flexShrink: '0',
      flexGrow: '0',
      pointerEvents: 'none'
    };
    return React.createElement(tagName, {
      style: style,
      ref: this.props.innerRef
    });
  };

  return Placeholder;
}(PureComponent);

var getWindowFromEl = (function (el) {
  return el && el.ownerDocument ? el.ownerDocument.defaultView : window;
});

function isHtmlElement(el) {
  return el instanceof getWindowFromEl(el).HTMLElement;
}

var throwIfRefIsInvalid = (function (ref) {
  !(ref && isHtmlElement(ref)) ? process.env.NODE_ENV !== "production" ? invariant(false, "\n    provided.innerRef has not been provided with a HTMLElement.\n\n    You can find a guide on using the innerRef callback functions at:\n    https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/using-inner-ref.md\n  ") : invariant(false) : void 0;
});

var checkOwnProps = (function (props) {
  !props.droppableId ? process.env.NODE_ENV !== "production" ? invariant(false, 'A Droppable requires a droppableId prop') : invariant(false) : void 0;
  !(typeof props.isDropDisabled === 'boolean') ? process.env.NODE_ENV !== "production" ? invariant(false, 'isDropDisabled must be a boolean') : invariant(false) : void 0;
  !(typeof props.isCombineEnabled === 'boolean') ? process.env.NODE_ENV !== "production" ? invariant(false, 'isCombineEnabled must be a boolean') : invariant(false) : void 0;
  !(typeof props.ignoreContainerClipping === 'boolean') ? process.env.NODE_ENV !== "production" ? invariant(false, 'ignoreContainerClipping must be a boolean') : invariant(false) : void 0;
});

var _Droppable$contextTyp, _Droppable$childConte;

var Droppable = function (_Component) {
  _inheritsLoose(Droppable, _Component);

  function Droppable(props, context) {
    var _this;

    _this = _Component.call(this, props, context) || this;
    _this.styleContext = void 0;
    _this.ref = null;
    _this.placeholderRef = null;

    _this.setPlaceholderRef = function (ref) {
      _this.placeholderRef = ref;
    };

    _this.getPlaceholderRef = function () {
      return _this.placeholderRef;
    };

    _this.setRef = function (ref) {
      if (ref === null) {
        return;
      }

      if (ref === _this.ref) {
        return;
      }

      _this.ref = ref;
      throwIfRefIsInvalid(ref);
    };

    _this.getDroppableRef = function () {
      return _this.ref;
    };

    _this.styleContext = context[styleContextKey];

    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps(props);
    }

    return _this;
  }

  var _proto = Droppable.prototype;

  _proto.getChildContext = function getChildContext() {
    var _value;

    var value = (_value = {}, _value[droppableIdKey] = this.props.droppableId, _value[droppableTypeKey] = this.props.type, _value);
    return value;
  };

  _proto.componentDidMount = function componentDidMount() {
    throwIfRefIsInvalid(this.ref);
    this.warnIfPlaceholderNotMounted();
  };

  _proto.componentDidUpdate = function componentDidUpdate() {
    this.warnIfPlaceholderNotMounted();
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.ref = null;
    this.placeholderRef = null;
  };

  _proto.warnIfPlaceholderNotMounted = function warnIfPlaceholderNotMounted() {
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    if (!this.props.placeholder) {
      return;
    }

    if (this.placeholderRef) {
      return;
    }

    process.env.NODE_ENV !== "production" ? warning("\n      Droppable setup issue: DroppableProvided > placeholder could not be found.\n      Please be sure to add the {provided.placeholder} Node as a child of your Droppable\n\n      More information: https://github.com/atlassian/react-beautiful-dnd#1-provided-droppableprovided\n    ") : void 0;
  };

  _proto.getPlaceholder = function getPlaceholder() {
    if (!this.props.placeholder) {
      return null;
    }

    return React.createElement(Placeholder, {
      placeholder: this.props.placeholder,
      innerRef: this.setPlaceholderRef
    });
  };

  _proto.render = function render() {
    var _this$props = this.props,
        children = _this$props.children,
        direction = _this$props.direction,
        type = _this$props.type,
        droppableId = _this$props.droppableId,
        isDropDisabled = _this$props.isDropDisabled,
        isCombineEnabled = _this$props.isCombineEnabled,
        ignoreContainerClipping = _this$props.ignoreContainerClipping,
        isDraggingOver = _this$props.isDraggingOver,
        draggingOverWith = _this$props.draggingOverWith;
    var provided = {
      innerRef: this.setRef,
      placeholder: this.getPlaceholder(),
      droppableProps: {
        'data-react-beautiful-dnd-droppable': this.styleContext
      }
    };
    var snapshot = {
      isDraggingOver: isDraggingOver,
      draggingOverWith: draggingOverWith
    };
    return React.createElement(DroppableDimensionPublisher, {
      droppableId: droppableId,
      type: type,
      direction: direction,
      ignoreContainerClipping: ignoreContainerClipping,
      isDropDisabled: isDropDisabled,
      isCombineEnabled: isCombineEnabled,
      getDroppableRef: this.getDroppableRef,
      getPlaceholderRef: this.getPlaceholderRef
    }, children(provided, snapshot));
  };

  return Droppable;
}(Component);

Droppable.contextTypes = (_Droppable$contextTyp = {}, _Droppable$contextTyp[styleContextKey] = PropTypes.string.isRequired, _Droppable$contextTyp);
Droppable.childContextTypes = (_Droppable$childConte = {}, _Droppable$childConte[droppableIdKey] = PropTypes.string.isRequired, _Droppable$childConte[droppableTypeKey] = PropTypes.string.isRequired, _Droppable$childConte);

var isStrictEqual = (function (a, b) {
  return a === b;
});

var defaultMapProps = {
  isDraggingOver: false,
  draggingOverWith: null,
  placeholder: null
};
var makeMapStateToProps = function makeMapStateToProps() {
  var getMapProps = memoizeOne(function (isDraggingOver, draggingOverWith, placeholder) {
    return {
      isDraggingOver: isDraggingOver,
      draggingOverWith: draggingOverWith,
      placeholder: placeholder
    };
  });

  var getDraggingOverProps = function getDraggingOverProps(id, draggable, impact) {
    var isOver = whatIsDraggedOver(impact) === id;

    if (!isOver) {
      return defaultMapProps;
    }

    var usePlaceholder = shouldUsePlaceholder(draggable.descriptor, impact);
    var placeholder = usePlaceholder ? draggable.placeholder : null;
    return getMapProps(true, draggable.descriptor.id, placeholder);
  };

  var selector = function selector(state, ownProps) {
    if (ownProps.isDropDisabled) {
      return defaultMapProps;
    }

    var id = ownProps.droppableId;

    if (state.isDragging) {
      var draggable = state.dimensions.draggables[state.critical.draggable.id];
      return getDraggingOverProps(id, draggable, state.impact);
    }

    if (state.phase === 'DROP_ANIMATING') {
      var _draggable = state.dimensions.draggables[state.pending.result.draggableId];
      return getDraggingOverProps(id, _draggable, state.pending.impact);
    }

    return defaultMapProps;
  };

  return selector;
};
var defaultProps = {
  type: 'DEFAULT',
  direction: 'vertical',
  isDropDisabled: false,
  isCombineEnabled: false,
  ignoreContainerClipping: false
};
var ConnectedDroppable = connect(makeMapStateToProps, null, null, {
  storeKey: storeKey,
  pure: true,
  areStatePropsEqual: isStrictEqual
})(Droppable);
ConnectedDroppable.defaultProps = defaultProps;

var _DraggableDimensionPu;

var DraggableDimensionPublisher = function (_Component) {
  _inheritsLoose(DraggableDimensionPublisher, _Component);

  function DraggableDimensionPublisher() {
    var _this;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _this = _Component.call.apply(_Component, [this].concat(args)) || this;
    _this.publishedDescriptor = null;
    _this.getMemoizedDescriptor = memoizeOne(function (id, index, droppableId, type) {
      return {
        id: id,
        index: index,
        droppableId: droppableId,
        type: type
      };
    });

    _this.publish = function () {
      var marshal = _this.context[dimensionMarshalKey];

      var descriptor = _this.getMemoizedDescriptor(_this.props.draggableId, _this.props.index, _this.props.droppableId, _this.props.type);

      if (!_this.publishedDescriptor) {
        marshal.registerDraggable(descriptor, _this.getDimension);
        _this.publishedDescriptor = descriptor;
        return;
      }

      if (descriptor === _this.publishedDescriptor) {
        return;
      }

      marshal.updateDraggable(_this.publishedDescriptor, descriptor, _this.getDimension);
      _this.publishedDescriptor = descriptor;
    };

    _this.unpublish = function () {
      !_this.publishedDescriptor ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot unpublish descriptor when none is published') : invariant(false) : void 0;
      var marshal = _this.context[dimensionMarshalKey];
      marshal.unregisterDraggable(_this.publishedDescriptor);
      _this.publishedDescriptor = null;
    };

    _this.getDimension = function (windowScroll) {
      if (windowScroll === void 0) {
        windowScroll = origin;
      }

      var targetRef = _this.props.getDraggableRef();

      var descriptor = _this.publishedDescriptor;
      !targetRef ? process.env.NODE_ENV !== "production" ? invariant(false, 'DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM') : invariant(false) : void 0;
      !descriptor ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot get dimension for unpublished draggable') : invariant(false) : void 0;
      var computedStyles = window.getComputedStyle(targetRef);
      var borderBox = targetRef.getBoundingClientRect();
      var client = calculateBox(borderBox, computedStyles);
      var page = withScroll(client, windowScroll);
      var placeholder = {
        client: client,
        tagName: targetRef.tagName.toLowerCase(),
        display: computedStyles.display
      };
      var displaceBy = {
        x: client.marginBox.width,
        y: client.marginBox.height
      };
      var dimension = {
        descriptor: descriptor,
        placeholder: placeholder,
        displaceBy: displaceBy,
        client: client,
        page: page
      };
      return dimension;
    };

    return _this;
  }

  var _proto = DraggableDimensionPublisher.prototype;

  _proto.componentDidMount = function componentDidMount() {
    this.publish();
  };

  _proto.componentDidUpdate = function componentDidUpdate() {
    this.publish();
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.unpublish();
  };

  _proto.render = function render() {
    return this.props.children;
  };

  return DraggableDimensionPublisher;
}(Component);

DraggableDimensionPublisher.contextTypes = (_DraggableDimensionPu = {}, _DraggableDimensionPu[dimensionMarshalKey] = PropTypes.object.isRequired, _DraggableDimensionPu);

function isSvgElement(el) {
  return el instanceof getWindowFromEl(el).SVGElement;
}

var selector = "[" + dragHandle + "]";

var throwIfSVG = function throwIfSVG(el) {
  !!isSvgElement(el) ? process.env.NODE_ENV !== "production" ? invariant(false, "A drag handle cannot be an SVGElement: it has inconsistent focus support.\n\n    More information: https://github.com/atlassian/react-beautiful-dnd/blob/master/docs/guides/dragging-svgs.md") : invariant(false) : void 0;
};

var getDragHandleRef = function getDragHandleRef(draggableRef) {
  if (draggableRef.hasAttribute(dragHandle)) {
    throwIfSVG(draggableRef);
    return draggableRef;
  }

  var el = draggableRef.querySelector(selector);
  throwIfSVG(draggableRef);
  !el ? process.env.NODE_ENV !== "production" ? invariant(false, "\n      Cannot find drag handle element inside of Draggable.\n      Please be sure to apply the {...provided.dragHandleProps} to your Draggable\n\n      More information: https://github.com/atlassian/react-beautiful-dnd#draggable\n    ") : invariant(false) : void 0;
  !isHtmlElement(el) ? process.env.NODE_ENV !== "production" ? invariant(false, 'A drag handle must be a HTMLElement') : invariant(false) : void 0;
  return el;
};

var retainingFocusFor = null;
var listenerOptions = {
  capture: true
};

var clearRetentionOnFocusChange = function () {
  var isBound = false;

  var bind = function bind() {
    if (isBound) {
      return;
    }

    isBound = true;
    window.addEventListener('focus', onWindowFocusChange, listenerOptions);
  };

  var unbind = function unbind() {
    if (!isBound) {
      return;
    }

    isBound = false;
    window.removeEventListener('focus', onWindowFocusChange, listenerOptions);
  };

  var onWindowFocusChange = function onWindowFocusChange() {
    unbind();
    retainingFocusFor = null;
  };

  var result = function result() {
    return bind();
  };

  result.cancel = function () {
    return unbind();
  };

  return result;
}();

var retain = function retain(id) {
  retainingFocusFor = id;
  clearRetentionOnFocusChange();
};

var tryRestoreFocus = function tryRestoreFocus(id, draggableRef) {
  if (!retainingFocusFor) {
    return;
  }

  if (id !== retainingFocusFor) {
    return;
  }

  retainingFocusFor = null;
  clearRetentionOnFocusChange.cancel();
  var dragHandleRef = getDragHandleRef(draggableRef);

  if (!dragHandleRef) {
    process.env.NODE_ENV !== "production" ? warning('Could not find drag handle in the DOM to focus on it') : void 0;
    return;
  }

  dragHandleRef.focus();
};

var retainer = {
  retain: retain,
  tryRestoreFocus: tryRestoreFocus
};

function isElement(el) {
  return el instanceof getWindowFromEl(el).Element;
}

var interactiveTagNames = {
  input: true,
  button: true,
  textarea: true,
  select: true,
  option: true,
  optgroup: true,
  video: true,
  audio: true
};

var isAnInteractiveElement = function isAnInteractiveElement(parent, current) {
  if (current == null) {
    return false;
  }

  var hasAnInteractiveTag = Boolean(interactiveTagNames[current.tagName.toLowerCase()]);

  if (hasAnInteractiveTag) {
    return true;
  }

  var attribute = current.getAttribute('contenteditable');

  if (attribute === 'true' || attribute === '') {
    return true;
  }

  if (current === parent) {
    return false;
  }

  return isAnInteractiveElement(parent, current.parentElement);
};

var shouldAllowDraggingFromTarget = (function (event, props) {
  if (props.canDragInteractiveElements) {
    return true;
  }

  var target = event.target,
      currentTarget = event.currentTarget;

  if (!isElement(target) || !isElement(currentTarget)) {
    return true;
  }

  return !isAnInteractiveElement(currentTarget, target);
});

var createScheduler = (function (callbacks) {
  var memoizedMove = memoizeOne(function (x, y) {
    var point = {
      x: x,
      y: y
    };
    callbacks.onMove(point);
  });
  var move = rafSchd(function (point) {
    return memoizedMove(point.x, point.y);
  });
  var moveUp = rafSchd(callbacks.onMoveUp);
  var moveDown = rafSchd(callbacks.onMoveDown);
  var moveRight = rafSchd(callbacks.onMoveRight);
  var moveLeft = rafSchd(callbacks.onMoveLeft);
  var windowScrollMove = rafSchd(callbacks.onWindowScroll);

  var cancel = function cancel() {
    move.cancel();
    moveUp.cancel();
    moveDown.cancel();
    moveRight.cancel();
    moveLeft.cancel();
    windowScrollMove.cancel();
  };

  return {
    move: move,
    moveUp: moveUp,
    moveDown: moveDown,
    moveRight: moveRight,
    moveLeft: moveLeft,
    windowScrollMove: windowScrollMove,
    cancel: cancel
  };
});

var sloppyClickThreshold = 5;
var isSloppyClickThresholdExceeded = (function (original, current) {
  return Math.abs(current.x - original.x) >= sloppyClickThreshold || Math.abs(current.y - original.y) >= sloppyClickThreshold;
});

var tab = 9;
var enter = 13;
var escape = 27;
var space = 32;
var pageUp = 33;
var pageDown = 34;
var end = 35;
var home = 36;
var arrowLeft = 37;
var arrowUp = 38;
var arrowRight = 39;
var arrowDown = 40;

var _preventedKeys;
var preventedKeys = (_preventedKeys = {}, _preventedKeys[enter] = true, _preventedKeys[tab] = true, _preventedKeys);
var preventStandardKeyEvents = (function (event) {
  if (preventedKeys[event.keyCode]) {
    event.preventDefault();
  }
});

var getOptions = function getOptions(shared, fromBinding) {
  return _extends({}, shared, fromBinding);
};

var bindEvents = function bindEvents(el, bindings, sharedOptions) {
  bindings.forEach(function (binding) {
    var options = getOptions(sharedOptions, binding.options);
    el.addEventListener(binding.eventName, binding.fn, options);
  });
};
var unbindEvents = function unbindEvents(el, bindings, sharedOptions) {
  bindings.forEach(function (binding) {
    var options = getOptions(sharedOptions, binding.options);
    el.removeEventListener(binding.eventName, binding.fn, options);
  });
};

var sharedOptions = {
  capture: true
};
var createPostDragEventPreventer = (function (getWindow) {
  var isBound = false;

  var bind = function bind() {
    if (isBound) {
      return;
    }

    isBound = true;
    bindEvents(getWindow(), pointerEvents, sharedOptions);
  };

  var unbind = function unbind() {
    if (!isBound) {
      return;
    }

    isBound = false;
    unbindEvents(getWindow(), pointerEvents, sharedOptions);
  };

  var pointerEvents = [{
    eventName: 'click',
    fn: function fn(event) {
      event.preventDefault();
      unbind();
    }
  }, {
    eventName: 'mousedown',
    fn: unbind
  }, {
    eventName: 'touchstart',
    fn: unbind
  }];

  var preventNext = function preventNext() {
    if (isBound) {
      unbind();
    }

    bind();
  };

  var preventer = {
    preventNext: preventNext,
    abort: unbind
  };
  return preventer;
});

var createEventMarshal = (function () {
  var isMouseDownHandled = false;

  var handle = function handle() {
    !!isMouseDownHandled ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot handle mouse down as it is already handled') : invariant(false) : void 0;
    isMouseDownHandled = true;
  };

  var isHandled = function isHandled() {
    return isMouseDownHandled;
  };

  var reset = function reset() {
    isMouseDownHandled = false;
  };

  return {
    handle: handle,
    isHandled: isHandled,
    reset: reset
  };
});

var supportedEventName = function () {
  var base = 'visibilitychange';

  if (typeof document === 'undefined') {
    return base;
  }

  var candidates = [base, "ms" + base, "webkit" + base, "moz" + base, "o" + base];
  var supported = find(candidates, function (eventName) {
    return "on" + eventName in document;
  });
  return supported || base;
}();

var primaryButton = 0;

var noop = function noop() {};

var mouseDownMarshal = createEventMarshal();
var liftCounter = {
  counter: 0,
  reset: function reset() {
    this.counter = 0;
  },
  inc: function inc() {
    this.counter++;
  },
  equal: function equal(val) {
    return this.counter === val;
  }
};
var createMouseSensor = (function (_ref) {
  var callbacks = _ref.callbacks,
      getWindow = _ref.getWindow,
      canStartCapturing = _ref.canStartCapturing;
  var state = {
    isDragging: false,
    pending: null
  };

  var setState = function setState(newState) {
    state = newState;
  };

  var isDragging = function isDragging() {
    return state.isDragging;
  };

  var isCapturing = function isCapturing() {
    return Boolean(state.pending || state.isDragging);
  };

  var schedule = createScheduler(callbacks);
  var postDragEventPreventer = createPostDragEventPreventer(getWindow);

  var startDragging = function startDragging(fn) {
    if (fn === void 0) {
      fn = noop;
    }

    setState({
      pending: null,
      isDragging: true
    });
    fn();
  };

  var stopDragging = function stopDragging(fn, shouldBlockClick) {
    if (fn === void 0) {
      fn = noop;
    }

    if (shouldBlockClick === void 0) {
      shouldBlockClick = true;
    }

    schedule.cancel();
    unbindWindowEvents();
    mouseDownMarshal.reset();

    if (shouldBlockClick) {
      postDragEventPreventer.preventNext();
    }

    setState({
      isDragging: false,
      pending: null
    });
    fn();
  };

  var startPendingDrag = function startPendingDrag(point) {
    setState({
      pending: point,
      isDragging: false
    });
    bindWindowEvents();
  };

  var stopPendingDrag = function stopPendingDrag() {
    stopDragging(noop, false);
  };

  var kill = function kill(fn) {
    if (fn === void 0) {
      fn = noop;
    }

    if (state.pending) {
      stopPendingDrag();
      return;
    }

    if (state.isDragging) {
      stopDragging(fn);
    }
  };

  var unmount = function unmount() {
    kill();
    postDragEventPreventer.abort();
  };

  var cancel = function cancel() {
    kill(callbacks.onCancel);
  };

  var isExecutingLift = false;
  var windowBindings = [{
    eventName: 'mousemove',
    fn: function fn(event) {
      var button = event.button,
          clientX = event.clientX,
          clientY = event.clientY;

      if (button !== primaryButton) {
        return;
      }

      var point = {
        x: clientX,
        y: clientY
      };

      if (state.isDragging) {
        event.preventDefault();

        if (!isExecutingLift) {
          schedule.move(point);
        }

        return;
      }

      if (!state.pending) {
        stopPendingDrag();
        process.env.NODE_ENV !== "production" ? invariant(false, 'Expected there to be an active or pending drag when window mousemove event is received') : invariant(false);
      }

      if (!isSloppyClickThresholdExceeded(state.pending, point)) {
        return;
      }

      event.preventDefault();
      isExecutingLift = true;
      startDragging(_asyncToGenerator(_regeneratorRuntime.mark(function _callee() {
        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                liftCounter.inc();
                _context.next = 3;
                return callbacks.onLift({
                  clientSelection: point,
                  movementMode: 'FLUID',
                  canExecuteLift: function canExecuteLift(index) {
                    return liftCounter.equal(index) && mouseDownMarshal.isHandled();
                  },
                  index: liftCounter.counter,
                  executeDone: function executeDone() {
                    isExecutingLift = false;
                    liftCounter.reset();
                  }
                });

              case 3:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      })));
    }
  }, {
    eventName: 'mouseup',
    fn: function fn(event) {
      if (state.pending) {
        stopPendingDrag();
        return;
      }

      event.preventDefault();
      stopDragging(callbacks.onDrop);
    }
  }, {
    eventName: 'mousedown',
    fn: function fn(event) {
      if (state.isDragging) {
        event.preventDefault();
      }

      stopDragging(callbacks.onCancel);
    }
  }, {
    eventName: 'keydown',
    fn: function fn(event) {
      if (!state.isDragging) {
        cancel();
        return;
      }

      if (event.keyCode === escape) {
        event.preventDefault();
        cancel();
        return;
      }

      preventStandardKeyEvents(event);
    }
  }, {
    eventName: 'resize',
    fn: cancel
  }, {
    eventName: 'scroll',
    options: {
      passive: true,
      capture: false
    },
    fn: function fn() {
      if (state.pending) {
        stopPendingDrag();
        return;
      }

      schedule.windowScrollMove();
    }
  }, {
    eventName: 'webkitmouseforcechanged',
    fn: function fn(event) {
      if (event.webkitForce == null || MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN == null) {
        process.env.NODE_ENV !== "production" ? warning('handling a mouse force changed event when it is not supported') : void 0;
        return;
      }

      var forcePressThreshold = MouseEvent.WEBKIT_FORCE_AT_FORCE_MOUSE_DOWN;
      var isForcePressing = event.webkitForce >= forcePressThreshold;

      if (isForcePressing) {
        cancel();
      }
    }
  }, {
    eventName: supportedEventName,
    fn: cancel
  }];

  var bindWindowEvents = function bindWindowEvents() {
    var win = getWindow();
    bindEvents(win, windowBindings, {
      capture: true
    });
  };

  var unbindWindowEvents = function unbindWindowEvents() {
    var win = getWindow();
    unbindEvents(win, windowBindings, {
      capture: true
    });
  };

  var onMouseDown = function onMouseDown(event) {
    if (mouseDownMarshal.isHandled()) {
      return;
    }

    !!isCapturing() ? process.env.NODE_ENV !== "production" ? invariant(false, 'Should not be able to perform a mouse down while a drag or pending drag is occurring') : invariant(false) : void 0;

    if (!canStartCapturing(event)) {
      return;
    }

    if (event.button !== primaryButton) {
      return;
    }

    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }

    mouseDownMarshal.handle();
    event.preventDefault();
    var point = {
      x: event.clientX,
      y: event.clientY
    };
    startPendingDrag(point);
  };

  var sensor = {
    onMouseDown: onMouseDown,
    kill: kill,
    isCapturing: isCapturing,
    isDragging: isDragging,
    unmount: unmount
  };
  return sensor;
});

var getBorderBoxCenterPosition = (function (el) {
  return getRect(el.getBoundingClientRect()).center;
});

var _scrollJumpKeys;
var scrollJumpKeys = (_scrollJumpKeys = {}, _scrollJumpKeys[pageDown] = true, _scrollJumpKeys[pageUp] = true, _scrollJumpKeys[home] = true, _scrollJumpKeys[end] = true, _scrollJumpKeys);

var noop$1 = function noop() {};

var createKeyboardSensor = (function (_ref) {
  var callbacks = _ref.callbacks,
      getWindow = _ref.getWindow,
      getDraggableRef = _ref.getDraggableRef,
      canStartCapturing = _ref.canStartCapturing;
  var state = {
    isDragging: false
  };

  var setState = function setState(newState) {
    state = newState;
  };

  var startDragging = function startDragging(fn) {
    if (fn === void 0) {
      fn = noop$1;
    }

    setState({
      isDragging: true
    });
    bindWindowEvents();
    fn();
  };

  var stopDragging = function stopDragging(postDragFn) {
    if (postDragFn === void 0) {
      postDragFn = noop$1;
    }

    schedule.cancel();
    unbindWindowEvents();
    setState({
      isDragging: false
    });
    postDragFn();
  };

  var kill = function kill() {
    if (state.isDragging) {
      stopDragging();
    }
  };

  var cancel = function cancel() {
    stopDragging(callbacks.onCancel);
  };

  var isDragging = function isDragging() {
    return state.isDragging;
  };

  var schedule = createScheduler(callbacks);

  var onKeyDown = function onKeyDown(event) {
    if (!isDragging()) {
      if (event.defaultPrevented) {
        return;
      }

      if (!canStartCapturing(event)) {
        return;
      }

      if (event.keyCode !== space) {
        return;
      }

      var ref = getDraggableRef();
      !ref ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot start a keyboard drag without a draggable ref') : invariant(false) : void 0;
      var center = getBorderBoxCenterPosition(ref);
      event.preventDefault();
      startDragging(function () {
        return callbacks.onLift({
          clientSelection: center,
          movementMode: 'SNAP'
        });
      });
      return;
    }

    if (event.keyCode === escape) {
      event.preventDefault();
      cancel();
      return;
    }

    if (event.keyCode === space) {
      event.preventDefault();
      stopDragging(callbacks.onDrop);
      return;
    }

    if (event.keyCode === arrowDown) {
      event.preventDefault();
      schedule.moveDown();
      return;
    }

    if (event.keyCode === arrowUp) {
      event.preventDefault();
      schedule.moveUp();
      return;
    }

    if (event.keyCode === arrowRight) {
      event.preventDefault();
      schedule.moveRight();
      return;
    }

    if (event.keyCode === arrowLeft) {
      event.preventDefault();
      schedule.moveLeft();
      return;
    }

    if (scrollJumpKeys[event.keyCode]) {
      event.preventDefault();
      return;
    }

    preventStandardKeyEvents(event);
  };

  var windowBindings = [{
    eventName: 'mousedown',
    fn: cancel
  }, {
    eventName: 'mouseup',
    fn: cancel
  }, {
    eventName: 'click',
    fn: cancel
  }, {
    eventName: 'touchstart',
    fn: cancel
  }, {
    eventName: 'resize',
    fn: cancel
  }, {
    eventName: 'wheel',
    fn: cancel,
    options: {
      passive: true
    }
  }, {
    eventName: 'scroll',
    options: {
      capture: false
    },
    fn: callbacks.onWindowScroll
  }, {
    eventName: supportedEventName,
    fn: cancel
  }];

  var bindWindowEvents = function bindWindowEvents() {
    bindEvents(getWindow(), windowBindings, {
      capture: true
    });
  };

  var unbindWindowEvents = function unbindWindowEvents() {
    unbindEvents(getWindow(), windowBindings, {
      capture: true
    });
  };

  var sensor = {
    onKeyDown: onKeyDown,
    kill: kill,
    isDragging: isDragging,
    isCapturing: isDragging,
    unmount: kill
  };
  return sensor;
});

var timeForLongPress = 150;
var forcePressThreshold = 0.15;
var touchStartMarshal = createEventMarshal();

var noop$2 = function noop() {};

var webkitHack = function () {
  var stub = {
    preventTouchMove: noop$2,
    releaseTouchMove: noop$2
  };

  if (typeof window === 'undefined') {
    return stub;
  }

  if (!('ontouchstart' in window)) {
    return stub;
  }

  var isBlocking = false;
  window.addEventListener('touchmove', function (event) {
    if (!isBlocking) {
      return;
    }

    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();
  }, {
    passive: false,
    capture: false
  });

  var preventTouchMove = function preventTouchMove() {
    isBlocking = true;
  };

  var releaseTouchMove = function releaseTouchMove() {
    isBlocking = false;
  };

  return {
    preventTouchMove: preventTouchMove,
    releaseTouchMove: releaseTouchMove
  };
}();

var initial = {
  isDragging: false,
  pending: null,
  hasMoved: false,
  longPressTimerId: null
};
var createTouchSensor = (function (_ref) {
  var callbacks = _ref.callbacks,
      getWindow = _ref.getWindow,
      canStartCapturing = _ref.canStartCapturing;
  var state = initial;

  var setState = function setState(partial) {
    state = _extends({}, state, partial);
  };

  var isDragging = function isDragging() {
    return state.isDragging;
  };

  var isCapturing = function isCapturing() {
    return Boolean(state.pending || state.isDragging || state.longPressTimerId);
  };

  var schedule = createScheduler(callbacks);
  var postDragEventPreventer = createPostDragEventPreventer(getWindow);

  var startDragging = function startDragging() {
    var pending = state.pending;

    if (!pending) {
      stopPendingDrag();
      process.env.NODE_ENV !== "production" ? invariant(false, 'cannot start a touch drag without a pending position') : invariant(false);
    }

    setState({
      isDragging: true,
      hasMoved: false,
      pending: null,
      longPressTimerId: null
    });
    callbacks.onLift({
      clientSelection: pending,
      movementMode: 'FLUID'
    });
  };

  var stopDragging = function stopDragging(fn) {
    if (fn === void 0) {
      fn = noop$2;
    }

    schedule.cancel();
    touchStartMarshal.reset();
    webkitHack.releaseTouchMove();
    unbindWindowEvents();
    postDragEventPreventer.preventNext();
    setState(initial);
    fn();
  };

  var startPendingDrag = function startPendingDrag(event) {
    var touch = event.touches[0];
    var clientX = touch.clientX,
        clientY = touch.clientY;
    var point = {
      x: clientX,
      y: clientY
    };
    var longPressTimerId = setTimeout(startDragging, timeForLongPress);
    setState({
      longPressTimerId: longPressTimerId,
      pending: point,
      isDragging: false,
      hasMoved: false
    });
    bindWindowEvents();
  };

  var stopPendingDrag = function stopPendingDrag() {
    if (state.longPressTimerId) {
      clearTimeout(state.longPressTimerId);
    }

    schedule.cancel();
    touchStartMarshal.reset();
    webkitHack.releaseTouchMove();
    unbindWindowEvents();
    setState(initial);
  };

  var kill = function kill(fn) {
    if (fn === void 0) {
      fn = noop$2;
    }

    if (state.pending) {
      stopPendingDrag();
      return;
    }

    if (state.isDragging) {
      stopDragging(fn);
    }
  };

  var unmount = function unmount() {
    kill();
    postDragEventPreventer.abort();
  };

  var cancel = function cancel() {
    kill(callbacks.onCancel);
  };

  var windowBindings = [{
    eventName: 'touchmove',
    options: {
      passive: false
    },
    fn: function fn(event) {
      if (!state.isDragging) {
        stopPendingDrag();
        return;
      }

      if (!state.hasMoved) {
        setState({
          hasMoved: true
        });
      }

      var _event$touches$ = event.touches[0],
          clientX = _event$touches$.clientX,
          clientY = _event$touches$.clientY;
      var point = {
        x: clientX,
        y: clientY
      };
      event.preventDefault();
      schedule.move(point);
    }
  }, {
    eventName: 'touchend',
    fn: function fn(event) {
      if (!state.isDragging) {
        stopPendingDrag();
        return;
      }

      event.preventDefault();
      stopDragging(callbacks.onDrop);
    }
  }, {
    eventName: 'touchcancel',
    fn: function fn(event) {
      if (!state.isDragging) {
        stopPendingDrag();
        return;
      }

      event.preventDefault();
      stopDragging(callbacks.onCancel);
    }
  }, {
    eventName: 'touchstart',
    fn: cancel
  }, {
    eventName: 'orientationchange',
    fn: cancel
  }, {
    eventName: 'resize',
    fn: cancel
  }, {
    eventName: 'scroll',
    options: {
      passive: true,
      capture: false
    },
    fn: function fn() {
      if (state.pending) {
        stopPendingDrag();
        return;
      }

      schedule.windowScrollMove();
    }
  }, {
    eventName: 'contextmenu',
    fn: function fn(event) {
      event.preventDefault();
    }
  }, {
    eventName: 'keydown',
    fn: function fn(event) {
      if (!state.isDragging) {
        cancel();
        return;
      }

      if (event.keyCode === escape) {
        event.preventDefault();
      }

      cancel();
    }
  }, {
    eventName: 'touchforcechange',
    fn: function fn(event) {
      if (state.hasMoved) {
        event.preventDefault();
        return;
      }

      var touch = event.touches[0];

      if (touch.force >= forcePressThreshold) {
        cancel();
      }
    }
  }, {
    eventName: supportedEventName,
    fn: cancel
  }];

  var bindWindowEvents = function bindWindowEvents() {
    bindEvents(getWindow(), windowBindings, {
      capture: true
    });
  };

  var unbindWindowEvents = function unbindWindowEvents() {
    unbindEvents(getWindow(), windowBindings, {
      capture: true
    });
  };

  var onTouchStart = function onTouchStart(event) {
    if (touchStartMarshal.isHandled()) {
      return;
    }

    !!isCapturing() ? process.env.NODE_ENV !== "production" ? invariant(false, 'Should not be able to perform a touch start while a drag or pending drag is occurring') : invariant(false) : void 0;

    if (!canStartCapturing(event)) {
      return;
    }

    touchStartMarshal.handle();
    webkitHack.preventTouchMove();
    startPendingDrag(event);
  };

  var sensor = {
    onTouchStart: onTouchStart,
    kill: kill,
    isCapturing: isCapturing,
    isDragging: isDragging,
    unmount: unmount
  };
  return sensor;
});

var _DragHandle$contextTy;

var preventHtml5Dnd = function preventHtml5Dnd(event) {
  event.preventDefault();
};

var DragHandle = function (_Component) {
  _inheritsLoose(DragHandle, _Component);

  function DragHandle(props, context) {
    var _this;

    _this = _Component.call(this, props, context) || this;
    _this.mouseSensor = void 0;
    _this.keyboardSensor = void 0;
    _this.touchSensor = void 0;
    _this.sensors = void 0;
    _this.styleContext = void 0;
    _this.canLift = void 0;
    _this.isFocused = false;
    _this.lastDraggableRef = void 0;

    _this.onFocus = function () {
      _this.isFocused = true;
    };

    _this.onBlur = function () {
      _this.isFocused = false;
    };

    _this.onKeyDown = function (event) {
      if (_this.mouseSensor.isCapturing() || _this.touchSensor.isCapturing()) {
        return;
      }

      _this.keyboardSensor.onKeyDown(event);
    };

    _this.onMouseDown = function (event) {
      if (_this.keyboardSensor.isCapturing() || _this.mouseSensor.isCapturing()) {
        return;
      }

      _this.mouseSensor.onMouseDown(event);
    };

    _this.onTouchStart = function (event) {
      if (_this.mouseSensor.isCapturing() || _this.keyboardSensor.isCapturing()) {
        return;
      }

      _this.touchSensor.onTouchStart(event);
    };

    _this.canStartCapturing = function (event) {
      if (_this.isAnySensorCapturing()) {
        return false;
      }

      if (!_this.canLift(_this.props.draggableId)) {
        return false;
      }

      return shouldAllowDraggingFromTarget(event, _this.props);
    };

    _this.isAnySensorCapturing = function () {
      return _this.sensors.some(function (sensor) {
        return sensor.isCapturing();
      });
    };

    _this.getProvided = memoizeOne(function (isEnabled) {
      if (!isEnabled) {
        return null;
      }

      var provided = {
        onMouseDown: _this.onMouseDown,
        onKeyDown: _this.onKeyDown,
        onTouchStart: _this.onTouchStart,
        onFocus: _this.onFocus,
        onBlur: _this.onBlur,
        tabIndex: 0,
        'data-react-beautiful-dnd-drag-handle': _this.styleContext,
        'aria-roledescription': 'Draggable item. Press space bar to lift',
        draggable: false,
        onDragStart: preventHtml5Dnd
      };
      return provided;
    });

    var getWindow = function getWindow() {
      return getWindowFromEl(_this.props.getDraggableRef());
    };

    var args = {
      callbacks: _this.props.callbacks,
      getDraggableRef: _this.props.getDraggableRef,
      getWindow: getWindow,
      canStartCapturing: _this.canStartCapturing
    };
    _this.mouseSensor = createMouseSensor(args);
    _this.keyboardSensor = createKeyboardSensor(args);
    _this.touchSensor = createTouchSensor(args);
    _this.sensors = [_this.mouseSensor, _this.keyboardSensor, _this.touchSensor];
    _this.styleContext = context[styleContextKey];
    _this.canLift = context[canLiftContextKey];
    return _this;
  }

  var _proto = DragHandle.prototype;

  _proto.componentDidMount = function componentDidMount() {
    var draggableRef = this.props.getDraggableRef();
    this.lastDraggableRef = draggableRef;
    !draggableRef ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot get draggable ref from drag handle') : invariant(false) : void 0;

    if (!this.props.isEnabled) {
      return;
    }

    var dragHandleRef = getDragHandleRef(draggableRef);
    retainer.tryRestoreFocus(this.props.draggableId, dragHandleRef);
  };

  _proto.componentDidUpdate = function componentDidUpdate(prevProps) {
    var _this2 = this;

    var ref = this.props.getDraggableRef();

    if (ref !== this.lastDraggableRef) {
      this.lastDraggableRef = ref;

      if (ref && this.isFocused && this.props.isEnabled) {
        getDragHandleRef(ref).focus();
      }
    }

    var isCapturing = this.isAnySensorCapturing();

    if (!isCapturing) {
      return;
    }

    var isBeingDisabled = prevProps.isEnabled && !this.props.isEnabled;

    if (isBeingDisabled) {
      this.sensors.forEach(function (sensor) {
        if (!sensor.isCapturing()) {
          return;
        }

        var wasDragging = sensor.isDragging();
        sensor.kill();

        if (wasDragging) {
          process.env.NODE_ENV !== "production" ? warning('You have disabled dragging on a Draggable while it was dragging. The drag has been cancelled') : void 0;

          _this2.props.callbacks.onCancel();
        }
      });
    }

    var isDragAborted = prevProps.isDragging && !this.props.isDragging;

    if (isDragAborted) {
      this.sensors.forEach(function (sensor) {
        if (sensor.isCapturing()) {
          sensor.kill();
        }
      });
    }
  };

  _proto.componentWillUnmount = function componentWillUnmount() {
    var _this3 = this;

    this.sensors.forEach(function (sensor) {
      var wasDragging = sensor.isDragging();
      sensor.unmount();

      if (wasDragging) {
        _this3.props.callbacks.onCancel();
      }
    });

    var shouldRetainFocus = function () {
      if (!_this3.props.isEnabled) {
        return false;
      }

      if (!_this3.isFocused) {
        return false;
      }

      return _this3.props.isDragging || _this3.props.isDropAnimating;
    }();

    if (shouldRetainFocus) {
      retainer.retain(this.props.draggableId);
    }
  };

  _proto.render = function render() {
    var _this$props = this.props,
        children = _this$props.children,
        isEnabled = _this$props.isEnabled;
    return children(this.getProvided(isEnabled));
  };

  return DragHandle;
}(Component);

DragHandle.contextTypes = (_DragHandle$contextTy = {}, _DragHandle$contextTy[styleContextKey] = PropTypes.string.isRequired, _DragHandle$contextTy[canLiftContextKey] = PropTypes.func.isRequired, _DragHandle$contextTy);

var checkOwnProps$1 = (function (props) {
  !_Number$isInteger(props.index) ? process.env.NODE_ENV !== "production" ? invariant(false, 'Draggable requires an integer index prop') : invariant(false) : void 0;
  !props.draggableId ? process.env.NODE_ENV !== "production" ? invariant(false, 'Draggable requires a draggableId') : invariant(false) : void 0;
  !(typeof props.isDragDisabled === 'boolean') ? process.env.NODE_ENV !== "production" ? invariant(false, 'isDragDisabled must be a boolean') : invariant(false) : void 0;
});

var _Draggable$contextTyp;
var zIndexOptions = {
  dragging: 5000,
  dropAnimating: 4500
};

var getDraggingTransition = function getDraggingTransition(shouldAnimateDragMovement, dropping) {
  if (dropping) {
    return transitions.drop(dropping.duration);
  }

  if (shouldAnimateDragMovement) {
    return transitions.snap;
  }

  return transitions.fluid;
};

var getDraggingOpacity = function getDraggingOpacity(isCombining, isDropAnimating) {
  if (!isCombining) {
    return null;
  }

  return isDropAnimating ? combine.opacity.drop : combine.opacity.combining;
};

var getShouldDraggingAnimate = function getShouldDraggingAnimate(dragging) {
  if (dragging.forceShouldAnimate != null) {
    return dragging.forceShouldAnimate;
  }

  return dragging.mode === 'SNAP';
};

var Draggable = function (_Component) {
  _inheritsLoose(Draggable, _Component);

  function Draggable(props, context) {
    var _this;

    _this = _Component.call(this, props, context) || this;
    _this.callbacks = void 0;
    _this.styleContext = void 0;
    _this.ref = null;

    _this.onMoveEnd = function () {
      if (_this.props.dragging && _this.props.dragging.dropping) {
        _this.props.dropAnimationFinished();
      }
    };

    _this.onLift = function () {
      var _ref = _asyncToGenerator(_regeneratorRuntime.mark(function _callee(options) {
        var ref, clientSelection, movementMode, _this$props, lift, draggableId, beforeLift, liftMe;

        return _regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                ref = _this.ref;
                !ref ? process.env.NODE_ENV !== "production" ? invariant(false) : invariant(false) : void 0;
                !!_this.props.isDragDisabled ? process.env.NODE_ENV !== "production" ? invariant(false, 'Cannot lift a Draggable when it is disabled') : invariant(false) : void 0;
                clientSelection = options.clientSelection, movementMode = options.movementMode;
                _this$props = _this.props, lift = _this$props.lift, draggableId = _this$props.draggableId, beforeLift = _this$props.beforeLift;

                liftMe = function liftMe() {
                  if (!options.canExecuteLift(options.index)) {
                    return;
                  }

                  lift({
                    id: draggableId,
                    clientSelection: clientSelection,
                    movementMode: movementMode
                  });
                  options.executeDone();
                };

                if (!(typeof beforeLift == 'function')) {
                  _context.next = 11;
                  break;
                }

                _context.next = 9;
                return beforeLift(liftMe);

              case 9:
                _context.next = 12;
                break;

              case 11:
                liftMe();

              case 12:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      return function (_x) {
        return _ref.apply(this, arguments);
      };
    }();

    _this.setRef = function (ref) {
      if (ref === null) {
        return;
      }

      if (ref === _this.ref) {
        return;
      }

      _this.ref = ref;
      throwIfRefIsInvalid(ref);
    };

    _this.getDraggableRef = function () {
      return _this.ref;
    };

    _this.getDraggingStyle = memoizeOne(function (dragging) {
      var dimension = dragging.dimension;
      var box = dimension.client;
      var offset$$1 = dragging.offset,
          combineWith = dragging.combineWith,
          dropping = dragging.dropping;
      var isCombining = Boolean(combineWith);
      var shouldAnimate = getShouldDraggingAnimate(dragging);
      var isDropAnimating = Boolean(dropping);
      var transform = isDropAnimating ? transforms.drop(offset$$1, isCombining) : transforms.moveTo(offset$$1);
      var style = {
        position: 'fixed',
        top: box.marginBox.top,
        left: box.marginBox.left,
        boxSizing: 'border-box',
        width: box.borderBox.width,
        height: box.borderBox.height,
        transition: getDraggingTransition(shouldAnimate, dropping),
        transform: transform,
        opacity: getDraggingOpacity(isCombining, isDropAnimating),
        zIndex: isDropAnimating ? zIndexOptions.dropAnimating : zIndexOptions.dragging,
        pointerEvents: 'none'
      };
      return style;
    });
    _this.getSecondaryStyle = memoizeOne(function (secondary) {
      return {
        transform: transforms.moveTo(secondary.offset),
        transition: secondary.shouldAnimateDisplacement ? null : 'none'
      };
    });
    _this.getDraggingProvided = memoizeOne(function (dragging, dragHandleProps) {
      var style = _this.getDraggingStyle(dragging);

      var isDropping = Boolean(dragging.dropping);
      var provided = {
        innerRef: _this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': _this.styleContext,
          style: style,
          onTransitionEnd: isDropping ? _this.onMoveEnd : null
        },
        dragHandleProps: dragHandleProps
      };
      return provided;
    });
    _this.getSecondaryProvided = memoizeOne(function (secondary, dragHandleProps) {
      var style = _this.getSecondaryStyle(secondary);

      var provided = {
        innerRef: _this.setRef,
        draggableProps: {
          'data-react-beautiful-dnd-draggable': _this.styleContext,
          style: style,
          onTransitionEnd: null
        },
        dragHandleProps: dragHandleProps
      };
      return provided;
    });
    _this.getDraggingSnapshot = memoizeOne(function (dragging) {
      return {
        isDragging: true,
        isDropAnimating: Boolean(dragging.dropping),
        dropAnimation: dragging.dropping,
        mode: dragging.mode,
        draggingOver: dragging.draggingOver,
        combineWith: dragging.combineWith,
        combineTargetFor: null
      };
    });
    _this.getSecondarySnapshot = memoizeOne(function (secondary) {
      return {
        isDragging: false,
        isDropAnimating: false,
        dropAnimation: null,
        mode: null,
        draggingOver: null,
        combineTargetFor: secondary.combineTargetFor,
        combineWith: null
      };
    });

    _this.renderChildren = function (dragHandleProps) {
      var dragging = _this.props.dragging;
      var secondary = _this.props.secondary;
      var children = _this.props.children;

      if (dragging) {
        var _child = children(_this.getDraggingProvided(dragging, dragHandleProps), _this.getDraggingSnapshot(dragging));

        var placeholder = React.createElement(Placeholder, {
          placeholder: dragging.dimension.placeholder
        });
        return React.createElement(Fragment, null, _child, placeholder);
      }

      !secondary ? process.env.NODE_ENV !== "production" ? invariant(false, 'If no DraggingMapProps are provided, then SecondaryMapProps are required') : invariant(false) : void 0;
      var child = children(_this.getSecondaryProvided(secondary, dragHandleProps), _this.getSecondarySnapshot(secondary));
      return React.createElement(Fragment, null, child);
    };

    _this.state = {
      cords: null
    };
    var callbacks = {
      onLift: _this.onLift,
      onMove: function onMove(clientSelection) {
        return props.move({
          client: clientSelection
        });
      },
      onDrop: function onDrop() {
        props.drop({
          reason: 'DROP'
        });
        props.onDragDrop && props.onDragDrop();
      },
      onCancel: function onCancel() {
        return props.drop({
          reason: 'CANCEL'
        });
      },
      onMoveUp: props.moveUp,
      onMoveDown: props.moveDown,
      onMoveRight: props.moveRight,
      onMoveLeft: props.moveLeft,
      onWindowScroll: function onWindowScroll() {
        return props.moveByWindowScroll({
          newScroll: getWindowScroll()
        });
      }
    };
    _this.callbacks = callbacks;
    _this.styleContext = context[styleContextKey];

    if (process.env.NODE_ENV !== 'production') {
      checkOwnProps$1(props);
    }

    return _this;
  }

  var _proto = Draggable.prototype;

  _proto.componentWillUnmount = function componentWillUnmount() {
    this.ref = null;
  };

  _proto.render = function render() {
    var _this$props2 = this.props,
        draggableId = _this$props2.draggableId,
        index = _this$props2.index,
        dragging = _this$props2.dragging,
        isDragDisabled = _this$props2.isDragDisabled,
        disableInteractiveElementBlocking = _this$props2.disableInteractiveElementBlocking;
    var droppableId = this.context[droppableIdKey];
    var type = this.context[droppableTypeKey];
    var isDragging = Boolean(dragging);
    var isDropAnimating = Boolean(dragging && dragging.dropping);
    return React.createElement(DraggableDimensionPublisher, {
      key: draggableId,
      draggableId: draggableId,
      droppableId: droppableId,
      type: type,
      index: index,
      getDraggableRef: this.getDraggableRef
    }, React.createElement(DragHandle, {
      draggableId: draggableId,
      isDragging: isDragging,
      isDropAnimating: isDropAnimating,
      isEnabled: !isDragDisabled,
      callbacks: this.callbacks,
      getDraggableRef: this.getDraggableRef,
      canDragInteractiveElements: disableInteractiveElementBlocking
    }, this.renderChildren));
  };

  return Draggable;
}(Component);

Draggable.contextTypes = (_Draggable$contextTyp = {}, _Draggable$contextTyp[droppableIdKey] = PropTypes.string.isRequired, _Draggable$contextTyp[droppableTypeKey] = PropTypes.string.isRequired, _Draggable$contextTyp[styleContextKey] = PropTypes.string.isRequired, _Draggable$contextTyp);

var getCombineWith = function getCombineWith(impact) {
  if (!impact.merge) {
    return null;
  }

  return impact.merge.combine.draggableId;
};

var defaultMapProps$1 = {
  secondary: {
    offset: origin,
    combineTargetFor: null,
    shouldAnimateDisplacement: true
  },
  dragging: null
};
var makeMapStateToProps$1 = function makeMapStateToProps() {
  var memoizedOffset = memoizeOne(function (x, y) {
    return {
      x: x,
      y: y
    };
  });
  var getSecondaryProps = memoizeOne(function (offset$$1, combineTargetFor, shouldAnimateDisplacement) {
    if (combineTargetFor === void 0) {
      combineTargetFor = null;
    }

    return {
      secondary: {
        offset: offset$$1,
        combineTargetFor: combineTargetFor,
        shouldAnimateDisplacement: shouldAnimateDisplacement
      },
      dragging: null
    };
  });
  var getDraggingProps = memoizeOne(function (offset$$1, mode, dimension, draggingOver, combineWith, forceShouldAnimate) {
    return {
      dragging: {
        mode: mode,
        dropping: null,
        offset: offset$$1,
        dimension: dimension,
        draggingOver: draggingOver,
        combineWith: combineWith,
        forceShouldAnimate: forceShouldAnimate
      },
      secondary: null
    };
  });

  var getSecondaryMovement = function getSecondaryMovement(ownId, draggingId, impact) {
    var map = impact.movement.map;
    var displacement = map[ownId];
    var movement = impact.movement;
    var merge = impact.merge;
    var isCombinedWith = Boolean(merge && merge.combine.draggableId === ownId);
    var displacedBy = movement.displacedBy.point;
    var offset$$1 = memoizedOffset(displacedBy.x, displacedBy.y);

    if (isCombinedWith) {
      return getSecondaryProps(displacement ? offset$$1 : origin, draggingId, displacement ? displacement.shouldAnimate : true);
    }

    if (!displacement) {
      return null;
    }

    if (!displacement.isVisible) {
      return null;
    }

    return getSecondaryProps(offset$$1, null, displacement.shouldAnimate);
  };

  var draggingSelector = function draggingSelector(state, ownProps) {
    if (state.isDragging) {
      if (state.critical.draggable.id !== ownProps.draggableId) {
        return null;
      }

      var offset$$1 = state.current.client.offset;
      var dimension = state.dimensions.draggables[ownProps.draggableId];
      var mode = state.movementMode;
      var draggingOver = whatIsDraggedOver(state.impact);
      var combineWith = getCombineWith(state.impact);
      var forceShouldAnimate = state.forceShouldAnimate;
      return getDraggingProps(memoizedOffset(offset$$1.x, offset$$1.y), mode, dimension, draggingOver, combineWith, forceShouldAnimate);
    }

    if (state.phase === 'DROP_ANIMATING') {
      var pending = state.pending;

      if (pending.result.draggableId !== ownProps.draggableId) {
        return null;
      }

      var _draggingOver = whatIsDraggedOver(pending.impact);

      var _combineWith = getCombineWith(pending.impact);

      var duration = pending.dropDuration;
      var _mode = pending.result.mode;
      return {
        dragging: {
          offset: pending.newHomeClientOffset,
          dimension: state.dimensions.draggables[ownProps.draggableId],
          draggingOver: _draggingOver,
          combineWith: _combineWith,
          mode: _mode,
          forceShouldAnimate: null,
          dropping: {
            duration: duration,
            curve: curves.drop,
            moveTo: pending.newHomeClientOffset,
            opacity: _combineWith ? combine.opacity.drop : null,
            scale: _combineWith ? combine.scale.drop : null
          }
        },
        secondary: null
      };
    }

    return null;
  };

  var secondarySelector = function secondarySelector(state, ownProps) {
    if (state.isDragging) {
      if (state.critical.draggable.id === ownProps.draggableId) {
        return null;
      }

      return getSecondaryMovement(ownProps.draggableId, state.critical.draggable.id, state.impact);
    }

    if (state.phase === 'DROP_ANIMATING') {
      if (state.pending.result.draggableId === ownProps.draggableId) {
        return null;
      }

      return getSecondaryMovement(ownProps.draggableId, state.pending.result.draggableId, state.pending.impact);
    }

    return null;
  };

  var selector = function selector(state, ownProps) {
    return draggingSelector(state, ownProps) || secondarySelector(state, ownProps) || defaultMapProps$1;
  };

  return selector;
};
var mapDispatchToProps = {
  lift: lift,
  move: move,
  moveUp: moveUp,
  moveDown: moveDown,
  moveLeft: moveLeft,
  moveRight: moveRight,
  moveByWindowScroll: moveByWindowScroll,
  drop: drop,
  dropAnimationFinished: dropAnimationFinished
};
var defaultProps$1 = {
  isDragDisabled: false,
  disableInteractiveElementBlocking: false
};
var ConnectedDraggable = connect(makeMapStateToProps$1, mapDispatchToProps, null, {
  storeKey: storeKey,
  pure: true,
  areStatePropsEqual: isStrictEqual
})(Draggable);
ConnectedDraggable.defaultProps = defaultProps$1;

window.addEventListener('mousemove', function (e) {
  var mouseCords = {
    x: e.pageX,
    y: e.pageY
  };
  window.mouseCords = mouseCords;
});

export { DragDropContext, ConnectedDroppable as Droppable, ConnectedDraggable as Draggable, resetServerContext };
