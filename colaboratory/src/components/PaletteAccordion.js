/**
 * Created by dmitri on 30/03/15.
 */
'use strict';

import React from "react";

import GraphNavigator from './../tools/palettes/GraphNavigator';
import Minimap from '../tools/palettes/Minimap';
import CollectionNavigator from '../tools/palettes/CollectionNavigator';
import Toolbox from '../tools/palettes/Toolbox';
import DisplayController from '../tools/palettes/DisplayController';
import Organisation from '../tools/palettes/Organisation';

import toolboxIcon from '../images/tools.svg';

class PaletteAccordion extends React.Component {

  constructor(params) {
    super(params);
    this.containerStyle = {
      border: 'none',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 0 0'
    };

    this.accordionCategoryWorkbenchStyle = {
      backgroundColor: '#E8E8E8',
      marginBottom: '10px',
      paddingRight: '5px',
      paddingLeft: '5px',
      paddingBottom: '10px'
    };

    this.accordionCategoryNavigatorStyle = {
      backgroundColor: '#E8E8E8',
      marginBottom: '10px',
      paddingRight: '5px',
      paddingLeft: '5px',
      paddingBottom: '10px'
    };

    this.accordionCategoryMinimapStyle = {
      backgroundColor: '#E8E8E8',
      marginBottom: '10px',
      paddingRight: '5px',
      paddingLeft: '5px',
      paddingBottom: '10px'
    };

    this.accordionCategoryDisplayStyle = {
      backgroundColor: '#E8E8E8',
      marginBottom: '10px',
      paddingRight: '5px',
      paddingLeft: '5px',
      paddingBottom: '10px'
    };

    this.accordionCategoryOrganisationStyle = {
      backgroundColor: '#E8E8E8',
      marginBottom: '10px',
      paddingRight: '5px',
      paddingLeft: '5px',
      paddingBottom: '10px'
    };

    this.accordionCategoryToolboxStyle = {
      backgroundColor: '#E8E8E8',
      marginBottom: '10px',
      paddingRight: '5px',
      paddingLeft: '5px',
      paddingBottom: '10px'
    };

    var accordionPadding = '5px 5px 5px 5px';
    var accordionBorderRadius = '0 4px 0 0';

    this.accordionWorkbenchStyle = {
      backgroundColor: '#a39d76',
      padding: accordionPadding,
      fontFamily: 'Roboto Condensed',
      marginTop: '3px',
      borderRadius: accordionBorderRadius
    };

    this.accordionNavigatorStyle = {
      backgroundColor: '#96ce92',
      padding: accordionPadding,
      fontFamily: 'Roboto Condensed',
      marginTop: '3px',
      borderRadius: accordionBorderRadius
    };

    this.accordionMinimapStyle = {
      backgroundColor: '#96ce92',
      padding: accordionPadding,
      fontFamily: 'Roboto Condensed',
      marginTop: '3px',
      borderRadius: accordionBorderRadius
    };

    this.accordionDisplayStyle = {
      backgroundColor: '#96ce92',
      padding: accordionPadding,
      fontFamily: 'Roboto Condensed',
      marginTop: '3px',
      borderRadius: accordionBorderRadius
    };

    this.accordionOrganisationStyle = {
      backgroundColor: '#ffb647',
      padding: accordionPadding,
      fontFamily: 'Roboto Condensed',
      marginTop: '3px',
      borderRadius: accordionBorderRadius
    };

    this.accordionToolboxStyle = {
      backgroundColor: '#ffb647',
      padding: accordionPadding,
      fontFamily: 'Roboto Condensed',
      marginTop: '3px',
      verticalAlign: 'center',
      borderRadius: accordionBorderRadius
    };
  }

  componentDidMount() {
    //$(this.refs.self.getDOMNode()).accordion({exclusive: false});
  }

  render() {
    return(
      <div ref='self' style={this.containerStyle} className='ui container'>
        <div className='ui divider'></div>
        <Minimap ministore={this.props.ministore}
                 viewstore={this.props.viewstore} />
        <div className='ui divider'></div>
        <Toolbox ministore={this.props.ministore}
                 viewstore={this.props.viewstore}
                 entitystore={this.props.entitystore}
                 toolstore={this.props.toolstore}/>
        <div className='ui divider'></div>
        <DisplayController ministore={this.props.ministore}
                           viewstore={this.props.viewstore}
                           entitystore={this.props.entitystore}
                           toolstore={this.props.toolstore}/>

      </div>
    );
  }

//<CollectionNavigator entitystore={this.props.entitystore}
//viewstore={this.props.viewstore}
//ministore={this.props.ministore}/>

  //render() {
  //  return(
  //    <div ref='self' style={this.containerStyle} className='ui styled fluid accordion'>
  //      <p style={this.accordionNavigatorStyle} className='ui title'>
  //      <i className='ui large block layout icon'></i>Carrousel
  //      </p>
  //      <div className='ui content' style={this.accordionCategoryNavigatorStyle}>
  //        <CollectionNavigator entitystore={this.props.entitystore} viewstore={this.props.viewstore} ministore={this.props.ministore}/>
  //      </div>
  //
  //      <p style={this.accordionMinimapStyle} className='ui title'>
  //      <i className='ui large move icon'></i>Navigation
  //      </p>
  //      <div className='ui content' style={this.accordionCategoryMinimapStyle}>
  //        <Minimap ministore={this.props.ministore} viewstore={this.props.viewstore} />
  //      </div>
  //
  //
  //      <p style={this.accordionToolboxStyle} className='ui title'>
  //      <i className='ui large paint brush icon'></i>Outils
  //      </p>
  //      <div className='ui content' style={this.accordionCategoryToolboxStyle}>
  //        <Toolbox ministore={this.props.ministore} viewstore={this.props.viewstore} entitystore={this.props.entitystore} toolstore={this.props.toolstore}/>
  //      </div>
  //
  //      <p style={this.accordionDisplayStyle} className='ui title'><i className='ui large icon configure'></i>Filtrage</p>
  //      <div className='ui content' style={this.accordionCategoryDisplayStyle}>
  //        <DisplayController ministore={this.props.ministore} viewstore={this.props.viewstore} entitystore={this.props.entitystore} toolstore={this.props.toolstore}/>
  //      </div>
  //
  //    </div>
  //  );
  //}
}
// <img src={toolboxIcon} height='21px' width='27px'/>
// 

export default PaletteAccordion;