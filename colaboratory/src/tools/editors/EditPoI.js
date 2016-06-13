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
      .on('contextMenu', EditPoI.endEdit.bind(null, data));
  }

  static endEdit(data) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
      d3.select('#POI-EDIT-' + data.uid).remove();

      d3.select('.' + Classes.ROOT_CLASS)
        .on('click', null);
  }

  static startDrag(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    d3.select('svg')
      .style('cursor', '-webkit-grabbing')
      .style('cursor', 'grabbing');

    d.tx = 0;
    d.ty = 0;
  }

  static moveLocal(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();

    d.tx = d.tx + d3.event.dx;
    d.ty = d.ty + d3.event.dy;
    console.log('tX=' + d.tx);
    console.log('tY=' + d.ty);

    var newX = Number.parseFloat(d.x) + d.tx;
    var newY = Number.parseFloat(d.y) + d.ty;

    console.log('newX=' + newX);
    console.log('newY=' + newY);

    d3.select('#POI-' + d.uid)
      .attr('transform', 'translate(' + newX + ',' + newY + ')');
  }

  static fixPosition(d) {
    d3.event.sourceEvent.stopPropagation();
    d3.event.sourceEvent.preventDefault();
    d3.select('svg')
      .style('cursor', '-webkit-auto')
      .style('cursor', 'auto');

    var properties = [
      { key: 'x', value: Number.parseFloat(d.x) + d.tx },
      { key: 'y', value: Number.parseFloat(d.y) + d.ty }
    ];

    d.tx = 0;
    d.ty = 0;

    //REST.changeEntityProperties(d.uid, properties, MetadataActions.updateLabBenchFrom.bind(null, d.uid), EditPoI.moveAbortedByServer);

    EditPoI.endEdit(d);
  }

  static moveAbortedByServer(response) {
    alert('Le déplacement a été refusé par le serveur');
    window.setTimeout(MetadataActions.updateLabBenchFrom.bind(null, response.id), 10);
  }
}

export default EditPoI;