/**
 * Created by dmitri on 02/03/16.
 */
'use strict';

import request from 'superagent';
import d3 from 'd3';

import ViewActions from '../../../actions/ViewActions';

import TypeConstants from '../../../constants/TypeConstants';

import conf from '../../../conf/ApplicationConfiguration';

class OrbOptions {
  static remove(data, errorCallback = null, successCallback = null) {
    if(!confirm("Veuillez confirmer la suppression de l'entité")) {
      return;
    }

    request.post(conf.actions.databaseActions.remove)
      .set('Content-Type', "application/json")
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

  static edit(data) {

  }

  static annotate(data) {

  }

  static notAvailable() {
    alert("Cette fonctionnalité n'est pas disponible dans la version actuelle");
  }

  static showMetdata(data) {
    ViewActions.displayMetadataAboutEntity(data.uid);
  }

  static zoomToObject(d3id, view) {
    //console.log('zoom');
    // Retrieve object coordinates and size in d3
    var object = d3.select(d3id);
    var data = object.node().getBBox();
    var winLoc = object.node().getBoundingClientRect();

    // Calculate fitting area
    var scale = 1.0;
    if(data.height > data.width) {
      scale = (view.height) / (data.height);
    }
    else {
      scale = (view.width) / (data.width);
    }
    scale = scale*0.95;
    var marginX = (view.width - data.width*scale)/2;
    var marginY = (view.height - data.height*scale)/2;

    // Dispatch action
    ViewActions.updateViewport(
      (view.left - winLoc.left + view.leftFromWindow)*scale/view.scale + marginX,
      (view.top - winLoc.top + view.topFromWindow)*scale/view.scale + marginY,
      null,
      null,
      scale
    );
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
    switch(item.type) {
      case TypeConstants.point:
        var bakRect = d3.select('#POI-' + item.uid).select('rect');
        var text = d3.select('#POI-' + item.uid).select('text');

        window.setTimeout(function() {
          OrbOptions.blink(bakRect, bakRect.attr('fill'), text.attr('fill') , 'fill');
          OrbOptions.blink(text, text.attr('fill'), bakRect.attr('fill') , 'fill');
        }, 10);

        return {
          rect: bakRect,
          text: text,
          rectColor: bakRect.attr('fill'),
          textColor: text.attr('fill')
        };
        break;
      case TypeConstants.path:
        var comp = d3.select('#PATH-' + item.uid);
        var color = comp.attr('stroke');
        var newColor = 'blue';
        if(color == 'blue') {
          newColor = 'red';
        }
        window.setTimeout(function() {
          OrbOptions.blink(comp, color, newColor, 'stroke');
        }, 10);

        return {
          d3component: comp,
          color: color
        };
        break;
      case TypeConstants.region:
        var comp = d3.select('#ROI-' + item.uid);
        var color = comp.attr('fill');
        var newColor = 'red';
        if(color == 'red') {
          newColor = 'blue';
        }

        window.setTimeout(function() {
          OrbOptions.blink(comp, color, newColor, 'fill');
        }, 10);

        return {
          d3component: comp,
            color: color
        };
        break;
      case TypeConstants.sheet:
        var comp = d3.select('#NODE-' + item.uid);

        window.setTimeout(function() {
          OrbOptions.blink(comp, 1.0, 0.3, 'opacity');
        }, 10);

        return {
            d3component: comp
          };

        break;
      default:
        break;
    }

    return null;
  }

  static stopAnimation(item, animationData) {
    switch(item.type) {
      case TypeConstants.point:
        animationData.rect.interrupt().transition().attr('fill', animationData.rectColor);
        animationData.text.interrupt().transition().attr('fill', animationData.textColor);
        break;
      case TypeConstants.path:
        animationData.d3component.interrupt().transition().attr('stroke', animationData.color);
        break;
      case TypeConstants.region:
        animationData.d3component.interrupt().transition().attr('fill', animationData.color);
        break;
      case TypeConstants.sheet:
        animationData.d3component.interrupt().transition().attr('opacity', 1.0);
        break;
      default:
        break;
    }
  }

}

export default OrbOptions;