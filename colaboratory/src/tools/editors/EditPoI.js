/**
 * Created by dmitri on 13/06/16.
 */
'use strict';

import d3 from 'd3';

import Classes from '../../constants/CommonSVGClasses';

import MetadataActions from '../../actions/MetadataActions';

import REST from '../../utils/REST';

class EditPoI {
  static drag() {
    return d3.behavior.drag()
      .origin(d => d)
      .on('dragstart', EditPoI.startDrag)
      .on('drag', EditPoI.moveLocal)
      .on('dragend', EditPoI.fixPosition);
  }

  static startEdit(data) {
    d3.select('#POI-' + data.uid).
      append('rect')
      .datum(data)
      .attr('id', 'POI-EDIT-' + data.uid)
      .attr('height', 60)
      .attr('width', 60)
      .attr("x", -30)
      .attr("y", -60)
      .style('fill', 'rgba(255,255,255,0.2')
      .style('stroke', 'rgb(255,255,255)')
      .style('stroke-width', '1px')
      .style('cursor', '-webkit-grab')
      .style('cursor', 'grab')
      .call(EditPoI.drag());

    d3.select('.' + Classes.ROOT_CLASS)
      .on('contextmenu', EditPoI.endEdit.bind(null, data));
  }

  static endEdit(data) {
    d3.event.stopPropagation();
    d3.event.preventDefault();

    d3.select('#POI-EDIT-' + data.uid).remove();
    d3.select('.' + Classes.ROOT_CLASS)
      .on('contextmenu', null);
  }

  static startDrag(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    d3.select('svg')
      .style('cursor', '-webkit-grabbing')
      .style('cursor', 'grabbing');
  }

  static moveLocal(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();

    // Get coordinates of point in image
    var coords = d3.mouse(this.parentNode.parentNode);

    d3.select('#POI-' + d.uid)
      .attr('transform', 'translate(' + coords[0] + ',' + coords[1] + ')');
  }

  static fixPosition(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    d3.select('svg')
      .style('cursor', '-webkit-auto')
      .style('cursor', 'auto');

      var coords = d3.mouse(this.parentNode.parentNode);

    var properties = [
      { key: 'x', value: coords[0] },
      { key: 'y', value: coords[1] }
    ];

    REST.changeEntityProperties(d.uid, properties, MetadataActions.updateLabBenchFrom.bind(null, d.uid), EditPoI.moveAbortedByServer);

    d3.select('#POI-EDIT-' + data.uid).remove();
    d3.select('.' + Classes.ROOT_CLASS)
      .on('contextmenu', null);
  }

  static moveAbortedByServer() {
    alert('Le déplacement a été refusé par le serveur');
    window.setTimeout(MetadataActions.updateLabBenchFrom, 10);
  }
}

export default EditPoI;
