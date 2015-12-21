 
 
 'use strict';
 
 import React from 'react';
 import d3 from 'd3';
 
 class Point extends ContextMenuItem {
   constructor(props){
     super(props);
     
     this.state = {
       d3component: null,
       color: null
     }:
   }
   
   beginHilight() {
     var comp = d3.select('#ROI-' + this.props.item.id);
     var color = comp.attr('fill');
     var newColor = 'red';
     if(color == 'red') {
       newColor = 'blue';
     }
     
     this.setState(
       {d3component: comp, 
       color: color});
     
     window.setTimeout(function() {
     ContextMenuItem.blink(comp, color, newColor, 'fill');
     }, 10);
     
   }
   
   endHilight() {
     this.state.d3component.interrupt().transition().attr('fill', this.state.color);
     this.setState({d3component: null,  color: null});
   }
   
   componentWillUnmount() {
     if(this.state.d3component) {
       this.state.d3component.interrupt().transition().attr('fill', this.state.color);
     }
   }
   
   actions() {
   }
 }