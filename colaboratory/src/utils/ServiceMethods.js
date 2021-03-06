/**
 * Created by dmitri on 17/05/16.
 */
import conf from '../conf/ApplicationConfiguration';
import ServerConstants from '../constants/ServerConstants';
import SocketActions from '../actions/SocketActions';

export default class ServiceMethods {
  static createRegionOfInterest(image, area, perimeter, vertices, name = null, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.createRegionOfInterest,
      image: image,
      area: area,
      perimeter: perimeter,
      polygon: vertices,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static createPointOfInterest(parent, x, y, name = null, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.createPointOfInterest,
      parent: parent,
      x: x,
      y: y,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static createTrailOfInterest(parent, length, path, name = null, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.createTrailOfInterest,
      parent: parent,
      length: length,
      path: path,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static createAngleOfInterest(parent, measure, vertices, name = null, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.createAngleOfInterest,
      parent: parent,
      measure: measure,
      vertices: vertices,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static addMeasureStandard(measurementId, value, unit, name, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.addMeasureStandard,
      measurement: measurementId,
      value: value,
      unit: unit,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static createSet(name, parent = null, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.createSet,
      parent: parent,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static deleteElementFromSet(linkId, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.deleteFromSet,
      link: linkId
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static deleteElementFromView(linkId, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.deleteFromView,
      link: linkId
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static linkParentToChild(parent, child, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.link,
      target: child,
      destination: parent
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static copy(target, destination, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.copy,
      target: target,
      destination: destination
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static cutPaste(linkId, destination, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.cutPaste,
      link: linkId,
      destination: destination
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static importRecolnatSpecimen(setId, name, recolnatSpecimenUuid, images, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.importRecolnatSpecimen,
      set: setId,
      name: name,
      recolnatSpecimenUuid: recolnatSpecimenUuid,
      images: images
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static importExternalImage(setId, url, name, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.importExternalImage,
      set: setId,
      url: url,
      name: name
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static place(view, entity, x, y, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.place,
      view: view,
      entity: entity,
      x: x,
      y: y
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static move(view, link, entity, x, y, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.move,
      view: view,
      link: link,
      entity: entity,
      x: x,
      y: y
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static resize(view, link, entity, width, height, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.resize,
      view: view,
      link: link,
      entity: entity,
      width: width,
      height: height
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static remove(id, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.remove,
      id: id
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static addAnnotation(entityId, text, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.addAnnotation,
      entity: entityId,
      text: text
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static editProperties(id, properties, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.editProperties,
      entity: id,
      properties: properties
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static createTagDefinition(key, value, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.createTagDefinition,
      descriptorName: key,
      descriptorValue: value
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static tagEntityWithTagId(tagId, entityId, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.UPDATE,
      actionDetail: conf.socket.tagEntity,
      entity: entityId,
      tag: tagId
    };

    window.setTimeout(SocketActions.send.bind(null, message, callback), 10);
  }

  static createAddTag(key, value, entityId, callback = undefined) {
    ServiceMethods.createTagDefinition(key, value, ServiceMethods.createAddTagPostDefine.bind(null, entityId, callback));
  }

  static createAddTagPostDefine(entityId, callback, msg) {
    if(msg.clientProcessError) {
      alert('Technical problem while saving data : ' + JSON.stringify(msg));
    }
    else {
      ServiceMethods.tagEntityWithTagId(msg.data.id, entityId, callback);
    }
  }

  static sendFeedback(message) {
    message.action = ServerConstants.ActionTypes.Send.FEEDBACK;

    window.setTimeout(SocketActions.send.bind(null, message, undefined), 10);
  }

  static prepareSetDownload(setId, callback = undefined) {
    let message = {
      action: ServerConstants.ActionTypes.Send.ORDER,
      actionDetail: conf.socket.prepareSetForDownload,
      set: setId
    };

    window.setTimeout(SocketActions.send.bind(null, message, undefined), 10);
  }
};
