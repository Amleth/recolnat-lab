/**
 * Created by dmitri on 02/03/16.
 */
'use strict';

import request from 'superagent';
import d3 from 'd3';

import ViewActions from '../../../actions/ViewActions';

import conf from '../../../conf/ApplicationConfiguration';

class OrbPoint {
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

}

export default OrbPoint;