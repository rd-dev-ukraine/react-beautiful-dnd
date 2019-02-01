// @flow
import {
  calculateBox,
  withScroll,
  type BoxModel,
  type Position,
} from 'css-box-model';
import memoizeOne from 'memoize-one';
import PropTypes from 'prop-types';
import { Component, type Node } from 'react';
import invariant from 'tiny-invariant';
import { dimensionMarshalKey } from '../context-keys';
import { origin } from '../../state/position';
import type {
  DraggableDescriptor,
  DraggableDimension,
  Placeholder,
  DraggableId,
  DroppableId,
  TypeId,
} from '../../types';
import type { DimensionMarshal } from '../../state/dimension-marshal/dimension-marshal-types';

type Props = {|
  draggableId: DraggableId,
  droppableId: DroppableId,
  type: TypeId,
  index: number,
  getDraggableRef: () => ?HTMLElement,
  children: Node,
|};

export default class DraggableDimensionPublisher extends Component<Props> {
  /* eslint-disable react/sort-comp */
  static contextTypes = {
    [dimensionMarshalKey]: PropTypes.object.isRequired,
  };

  publishedDescriptor: ?DraggableDescriptor = null;

  componentDidMount() {
    console.log({
      method: 'componentDidMount',
      props: this.props,
    });

    this.publish();
  }

  componentDidUpdate() {
    console.log({
      method: 'componentDidUpdate',
      props: this.props,
    });

    this.publish();
  }

  componentWillUnmount() {
    console.log({
      method: 'componentWillUnmount',
      props: this.props,
    });

    this.unpublish();
  }

  getMemoizedDescriptor = memoizeOne(
    (
      id: DraggableId,
      index: number,
      droppableId: DroppableId,
      type: TypeId,
    ): DraggableDescriptor => ({
      id,
      index,
      droppableId,
      type,
    }),
  );

  publish = () => {
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    const descriptor: DraggableDescriptor = this.getMemoizedDescriptor(
      this.props.draggableId,
      this.props.index,
      this.props.droppableId,
      this.props.type,
    );

    if (!this.publishedDescriptor) {
      marshal.registerDraggable(descriptor, this.getDimension);
      this.publishedDescriptor = descriptor;
      return;
    }

    // VL: WTF?
    // No changes to the descriptor
    if (descriptor === this.publishedDescriptor) {
      return;
    }

    marshal.updateDraggable(
      this.publishedDescriptor,
      descriptor,
      this.getDimension,
    );
    this.publishedDescriptor = descriptor;
  };

  unpublish = () => {
    invariant(
      this.publishedDescriptor,
      'Cannot unpublish descriptor when none is published',
    );

    // Using the previously published id to unpublish. This is to guard
    // against the case where the id dynamically changes. This is not
    // supported during a drag - but it is good to guard against.
    const marshal: DimensionMarshal = this.context[dimensionMarshalKey];
    marshal.unregisterDraggable(this.publishedDescriptor);
    this.publishedDescriptor = null;
  };

  getDimension = (windowScroll?: Position = origin): DraggableDimension => {
    const targetRef: ?HTMLElement = this.props.getDraggableRef();
    const descriptor: ?DraggableDescriptor = this.publishedDescriptor;
    // const mousePosCords = this.props.dragableCenterCords;

    invariant(
      targetRef,
      'DraggableDimensionPublisher cannot calculate a dimension when not attached to the DOM',
    );
    invariant(descriptor, 'Cannot get dimension for unpublished draggable');

    const computedStyles: CSSStyleDeclaration = window.getComputedStyle(
      targetRef,
    );
    const borderBox: ClientRect = targetRef.getBoundingClientRect();
    const client: BoxModel = calculateBox(borderBox, computedStyles);

    // const isDragging = isInsideRect(window.mouseCords, client.contentBox);

    // console.log('IsDragging', isDragging);

    // // make global listener for mouse cords that writes cords into window.mousePosCords
    // // let isDragging = isInsideRect(window.mousePosCords, client.contentBox)
    // if (isDragging) {
    //   client.borderBox.center = window.mouseCords;
    //   client.contentBox.center = window.mouseCords;
    //   // client.paddingBox.center = window.mouseCords;
    //   // client.marginBox.center = window.mouseCords;
    // }

    const page: BoxModel = withScroll(client, windowScroll);

    const placeholder: Placeholder = {
      client,
      tagName: targetRef.tagName.toLowerCase(),
      display: computedStyles.display,
    };
    const displaceBy: Position = {
      x: client.marginBox.width,
      y: client.marginBox.height,
    };

    const dimension: DraggableDimension = {
      descriptor,
      placeholder,
      displaceBy,
      client,
      page,
    };

    console.log({
      props: this.props,
      descriptor,
      targetRef,
      box: client,
      dimension,
    });

    return dimension;
  };

  render() {
    return this.props.children;
  }
}

function isInsideRect(cords, contentBox) {
  const { x, y } = cords;
  const { top, left } = contentBox;

  return y >= top && x >= left;
}
