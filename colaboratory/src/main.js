'use strict';

import Window from './Window';
import React from 'react';
import Router from 'react-router';
var {DefaultRoute, Route, Routes} = Router;

var routes = (
  <Route name='app' path='/' handler={Window}>
    <DefaultRoute name="home" handler={Window} />
    </Route>
);

Router.run(routes, Router.HistoryLocation, function(Handler) {
  document.body.style.margin = '0px';
  document.body.style.position = 'relative';
  document.body.style.boxSizing = 'border-box';
  document.body.style.minHeight = '100%';
  document.body.style.maxHeight = '100%';
  document.body.style.color = '#3E3E3E';
  document.body.style.padding = '0px';
  document.body.style.height = '99vh';
  document.body.style.width = '100%';
  document.body.style.overflow = 'hidden';
  document.body.style.fontFamily = 'Roboto Condensed';
  document.body.style.fontWeight = '300';
  //document.body.style = "margin: 0px; position: relative; box-sizing: border-box; min-height: 100%; color: #F5F5F5; padding: 0px; height: 99vh; width: 100%; font-family:'Roboto Condensed'; font-weight:300;";
  React.render(<Window/>, document.body);
});