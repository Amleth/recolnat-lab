/**
 * Created by dmitri on 17/05/16.
 */
import request from 'superagent';

import conf from '../conf/ApplicationConfiguration';

export default class REST {
  static createStudy(name, callback = undefined) {
    request.post(conf.actions.studyServiceActions.createStudy)
      .send({name: name})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
          alert('La création a échoué : ' + err);
        }
        else {
          // Reload studies
          callback();
        }
      });
  }

  static createSubSet(parentId, setName, onSuccessCallback = undefined, onErrorCallback = undefined) {
    request.post(conf.actions.setServiceActions.createSet)
      .send({
        name: setName,
        parent: parentId
      })
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
          if(onErrorCallback) {
            onErrorCallback();
          }
          alert('La création a échoué : ' + err);
        }
        else {
          // Reload studies
          var response = JSON.parse(res.text);
          if(onSuccessCallback) {
            onSuccessCallback(response.parentSet, response.subSet, response.link);
          }
        }
      });
  }

  /**
   * data: array of {entity, view, x, y}
   * @param entityId
   * @param viewId
   * @param x
   * @param y
   * @param onSuccessCallback
   * @param onErrorCallback
   */
  static placeEntityInView(data, onSuccessCallback = undefined, onErrorCallback = undefined) {
    request.post(conf.actions.viewServiceActions.place)
      .send(data)
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error placing entities ' + JSON.stringify(data) + ' : ' + err);
          if(onErrorCallback) {
            onErrorCallback();
          }
        }
        else {
          if(onSuccessCallback) {
            onSuccessCallback(JSON.parse(res.text));
          }
        }
      });
  }

  static addAnnotation(annotationText, entity, onSuccessCallback=undefined, onErrorCallback = undefined) {
    request.post(conf.actions.databaseActions.addAnnotation)
      .send({
        entity: entity,
        text: annotationText
      })
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error adding annotation to ' + entity + ' : ' + err);
          if(onErrorCallback) {
            onErrorCallback();
          }
        }
        else {
          if(onSuccessCallback) {
            onSuccessCallback(JSON.parse(res.text));
          }
        }
      })
  }

  /**
  Each specmen is an object which contains fields 'recolnatSpecimenUuid, images, name'
  **/
  static importRecolnatSpecimensIntoSet(specimens, setId, onSuccessCallback = undefined, onErrorCallback = undefined) {
    request.post(conf.actions.setServiceActions.importRecolnatSpecimen)
      .set('Content-Type', "application/json")
      .send({set: setId})
      .send({specimens: specimens})
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.error(err);
          if(onErrorCallback) {
            onErrorCallback(err, res);
          }
        }
        else {
          if(onSuccessCallback) {
            onSuccessCallback(JSON.parse(res.text));
          }
        }
      });
  }

  static importExternalImagesIntoSet(setId, images, onSuccessCallback = undefined, onErrorCallback = undefined) {
    request.post(conf.setServiceActions.importExternalImages)
    .set('Content-Type', "application/json")
    .send({set: setId})
    .send({images: images})
    .withCredentials()
    .end((err, res) => {
      if (err) {
        console.error(err);
        if(onErrorCallback) {
          onErrorCallback(err, res);
        }
      }
      else {
        if(onSuccessCallback) {
          onSuccessCallback(JSON.parse(res.text));
        }
      }
    });
  }

  static moveEntityFromSetToSet(linkId, targetSetId, onSuccessCallback = undefined, onErrorCallback = undefined) {
    request.post(conf.actions.setServiceActions.cutPaste)
      .set('Content-Type', "application/json")
      .send({linkId: linkId})
      .send({destination: targetSetId})
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.error(err);
          if(onErrorCallback) {
            onErrorCallback(err);
          }
        }
        else {
          if(onSuccessCallback) {
            onSuccessCallback(JSON.parse(res.text));
          }
        }
      });
  }

  /**
   *
   * @param entityId
   * @param properties an array of {'key', 'value'} objects; keys must mirror database fields
   * @param onSuccessCallback
   * @param onErrorCallback
   */
  static changeEntityProperties(entityId, properties, onSuccessCallback = undefined, onErrorCallback = undefined) {
    request.post(conf.actions.databaseActions.editProperties)
      .set('Content-Type', "application/json")
      .send({entity: entityId})
      .send({properties: properties})
      .withCredentials()
      .end((err, res) => {
        if (err) {
          console.error(err);
          if(onErrorCallback) {
            onErrorCallback(err);
          }
        }
        else {
          if(onSuccessCallback) {
            onSuccessCallback(JSON.parse(res.text));
          }
        }
      });
  }
};
