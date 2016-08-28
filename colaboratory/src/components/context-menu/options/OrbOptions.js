/**
 * Created by dmitri on 02/03/16.
 */
'use strict';

import request from 'superagent';
import request_no_cache from 'superagent-no-cache';
import d3 from 'd3';

import ViewActions from '../../../actions/ViewActions';
import ModalActions from '../../../actions/ModalActions';

import TypeConstants from '../../../constants/TypeConstants';
import ModalConstants from '../../../constants/ModalConstants';

import conf from '../../../conf/ApplicationConfiguration';

class OrbOptions {
  static remove(data, errorCallback = null, successCallback = null) {
    if(!confirm("Veuillez confirmer la suppression de l'entité")) {
      return;
    }

    request.post(conf.actions.databaseActions.remove)
      .set('Content-Type', "application/json")
      .use(request_no_cache)
      .send({id: data.uid})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          if(errorCallback) {
            errorCallback(err)
          }
        }
        else {
          if(successCallback) {
            successCallback(res);
          }
        }
      });
  }

  static unlinkFromSet(data, errorCallback=null, successCallback=null) {
    console.log('Entering unlinkFromSet');
    ModalActions.showModal(ModalConstants.Modals.confirmDelete, data, successCallback, errorCallback);
    //if(!confirm("L'entité choisie sera enlevée du set. Confirmation ?")) {
    //  return;
    //}
    //console.log('Deleting');


}

  static edit(data) {

  }

  static annotate(data) {

  }

  static notAvailable() {
    alert("Cette fonctionnalité n'est pas disponible dans la version actuelle");
  }

  static showMetadata(data) {
    ViewActions.displayMetadataAboutEntity(data.uid);
  }

  static zoomToObject(d3selector, view) {
    // Retrieve object coordinates and size in browser window
    var object = d3.select(d3selector);
    var winLoc = object.node().getBoundingClientRect();
    var oldHeight = winLoc.height;
    var oldWidth = winLoc.width;
    var oldScale = view.scale;

    // Calculate fitting area
    var scale = 1.0;
    if(oldHeight > oldWidth) {
      scale = (view.height * oldScale) / (oldHeight);
    }
    else {
      scale = (view.width * oldScale) / (oldWidth);
    }
    scale = scale*0.90;

    // Leave half empty screen as margin to center the object in the viewport
    var marginX = (view.width - oldWidth*scale/view.scale)/2;
    var marginY = (view.height - oldHeight*scale/view.scale)/2;

    // Dispatch action
    window.setTimeout(ViewActions.updateViewport.bind(null,
      (view.left - winLoc.left + view.leftFromWindow)*scale/view.scale + marginX,
      (view.top - winLoc.top + view.topFromWindow)*scale/view.scale + marginY,
      null,
      null,
      scale,
      true
    ), 10);
  }

  static blink(d3Node, startAttributeValue, endAttributeValue, attributeName) {
    function repeat() {
      d3Node.attr(attributeName, startAttributeValue)
        .transition()
        .duration(1000)
        .ease('linear')
        .attr(attributeName, endAttributeValue)
        .transition()
        .duration(1000)
        .ease('linear')
        .attr(attributeName, startAttributeValue)
        .each('end', repeat);
    }
    repeat();
  }

  static beginAnimation(item) {
    if(!d3.select('#POI-' + item).empty()) {
      var bakRect = d3.select('#POI-' + item).select('rect');

      window.setTimeout(function() {
        OrbOptions.blink(bakRect, 'red', 'blue' , 'fill');
      }, 10);

      return {
        type: TypeConstants.point,
        rect: bakRect,
        rectColor: 'white'
      };
    }
    else if(!d3.select('#PATH-' + item).empty()) {
      var comp = d3.select('#PATH-' + item);
      var color = comp.attr('stroke');
      var newColor = 'blue';
      if(color == 'blue') {
        newColor = 'red';
      }
      window.setTimeout(function() {
        OrbOptions.blink(comp, color, newColor, 'stroke');
      }, 10);

      return {
        type: TypeConstants.trail,
        d3component: comp,
        color: color
      };
    }
    else if(!d3.select('#ROI-' + item).empty()) {
      var comp = d3.select('#ROI-' + item);
      var color = comp.attr('fill');
      var newColor = 'red';
      if(color == 'red') {
        newColor = 'blue';
      }

      window.setTimeout(function() {
        OrbOptions.blink(comp, color, newColor, 'fill');
      }, 10);

      return {
        type: TypeConstants.region,
        d3component: comp,
        color: color
      };
    }
    else if(!d3.select('#IMAGE-' + item).empty()) {
      var comp = d3.select('#IMAGE-' + item);

      window.setTimeout(function() {
        OrbOptions.blink(comp, 1.0, 0.3, 'opacity');
      }, 10);

      return {
        type: TypeConstants.image,
        d3component: comp
      };
    }
    else {
      console.warn('No animation for ' + item);
      return null;
    }
  }

  static stopAnimation(animationData) {
    switch(animationData.type) {
      case TypeConstants.point:
        animationData.rect.interrupt().transition().attr('fill', animationData.rectColor);
        break;
      case TypeConstants.trail:
        animationData.d3component.interrupt().transition().attr('stroke', animationData.color);
        break;
      case TypeConstants.region:
        animationData.d3component.interrupt().transition().attr('fill', animationData.color);
        break;
      case TypeConstants.image:
        animationData.d3component.interrupt().transition().attr('opacity', 1.0);
        break;
      default:
        break;
    }
  }

}

export default OrbOptions;
