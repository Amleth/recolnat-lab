/**
 * Created by dmitri on 02/03/16.
 */
'use strict';

import request from 'superagent';
import d3 from 'd3';

import ViewActions from '../../../actions/ViewActions';

import conf from '../../../conf/ApplicationConfiguration';

class OrbPoint {
  static northWestAction() {

  }

  static northAction() {

  }

  static northEastAction() {

  }

  static southWestAction() {

  }

  static remove(data, errorCallback = null, successCallback = null) {
    request.post(conf.actions.databaseActions.remove)
      .set('Content-Type', "application/json")
      .send({id: data.id})
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

  static zoomToObject(d3id, view) {
    console.log('zoom');
    // Retrieve object coordinates and size in d3
    var object = d3.select(d3id);
    var coords = d3.transform(object.attr("transform")).translate;
    var data = object.node().getBBox();
    var winLoc = object.node().getBoundingClientRect();
    console.log(JSON.stringify(coords));
    console.log('x=' + JSON.stringify(data.x));
    console.log('y=' + JSON.stringify(data.y));
    console.log('width=' + JSON.stringify(data.width));
    console.log('height=' + JSON.stringify(data.height));

    console.log('winLoc.left=' + JSON.stringify(winLoc.left));
    console.log('winLoc.top=' + JSON.stringify(winLoc.top));
    console.log('winLoc.height=' + JSON.stringify(winLoc.height));
    console.log('winLoc.width=' + JSON.stringify(winLoc.width));
    console.log('view.winleft=' + JSON.stringify(view.leftFromWindow));
    console.log('view.wintop=' + JSON.stringify(view.topFromWindow));
    console.log('view.left=' + JSON.stringify(view.left));
    console.log('view.top=' + JSON.stringify(view.top));

    //var marginX = (view.width - winLoc.width)/2;
    //var marginY = (view.height - winLoc.height)/2;
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

  static southEastAction() {

  }

  static icons() {
    return {
      nw: null,
      n: null,
      ne: null,
      sw: null,
      s: null,
      se: null
    }
  }
}

export default OrbPoint;