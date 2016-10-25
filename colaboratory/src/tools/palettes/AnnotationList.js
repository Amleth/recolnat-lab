/**
 * Created by dmitri on 12/10/16.
 */
'use strict';

import React from 'react';

import Globals from '../../utils/Globals';

import measureIcon from '../../images/measure.svg';
import polylineIcon from '../../images/polyline.png';
import angleIcon from '../../images/angle.svg';
import perimeterIcon from '../../images/perimeter.svg';
import areaIcon from '../../images/area.svg';

class AnnotationList extends React.Component {
  constructor(props) {
    super(props);

    this.containerStyle = {
      padding: '5px 5px 5px 5px',
      borderColor: '#2185d0!important',
      height: this.props.height
      //overflow: 'hidden'
    };

    this.labelStyle = {
      position: 'relative',
      top: '-15px',
      left: '10px'
    };

    this.scrollerStyle = {
      height: this.props.height-35,
      overflowY: 'auto'
    };

    this.menuStyle = {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between'
    };

    this.typeMenuStyle = {
      display: 'flex',
      flexDirection: 'row'
    };

    this.menuOptionStyle = {
      margin: '2px 2px 2px 2px',
      padding: 0
    };

    this.upperButtonsStyle = {
      display: 'flex',
      flexDirection: 'row'
    };

    this.buttonStyle = {
      height: '30px',
      width: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    };

    this.tableStyle = {

    };

    this.nothingStyle = {
      display: 'none'
    };

    this.iconButtonStyle = {
      margin: 0
    };

    this.cellStyle = {
      padding: 0,
      lineHeight: 1.2,
      //paddingLeft: 0,
      //paddingRight: 0,
      textAlign: 'center'
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInObservationMode() || this.props.modestore.isInOrganisationMode() || this.props.modestore.isInSetMode()
      });
      return setModeVisibility.apply(this);
    };

    this._onMetadataUpdate = (id) => {
      const processMetadata = (id) => this.props.metastore.getAnnotationsOfEntity(id, this.processAnnotations.bind(this));
      return processMetadata.apply(this, [id]);
    };

    this._onEntitySelected = () => {
      const updateSelection = () => this.updateSelection(this.props.inspecstore.getAnnotationListSelection());
      return updateSelection.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: true,
      selectedImageId: null,
      selectedSetId: null,
      display: 'measures',
      subject: 'set',
      buttons: {
        measures: 'active',
        tags: 'disabled',
        image: 'disabled',
        set: 'disabled'
      },
      data: {},
      annotations: [],
      tags: {}
    };
  }

  updateSelection(selection) {
    this.removeListeners();

    var meta = null;
    switch(this.state.subject) {
      case 'image':
        this.props.metastore.addMetadataUpdateListener(selection.imageId, this._onMetadataUpdate);
        this.props.metastore.getAnnotationsOfEntity(selection.imageId, this.processAnnotations.bind(this));
        break;
      case 'set':
        this.props.metastore.addMetadataUpdateListener(selection.setId, this._onMetadataUpdate);
        this.props.metastore.getAnnotationsOfEntity(selection.setId, this.processAnnotations.bind(this));
        break;
      default:
        console.warning('Unknown subject ' + this.state.subject);
        return;
    }

    this.setState({selectedSetId: selection.setId, selectedImageId: selection.imageId});
  }

  removeListeners() {
    this.props.metastore.removeMetadataUpdateListener(this.state.selectedImageId, this._onMetadataUpdate);
    this.props.metastore.removeMetadataUpdateListener(this.state.selectedSetId, this._onMetadataUpdate);
    for(var i = 0; i < this.state.annotations.length; ++i) {
      //this.props.metastore.removeMetadataUpdateListener(this.state.annotations[i], this._onMetadataUpdate);
      if(this.state.annotations[i].inSpecimen) {
        this.props.metastore.removeExternalMetadataUpdateListener(this.state.annotations[i].inSpecimen, this.updateBarcodes.bind(this));
      }
      if(this.state.annotations[i].inSpecimen) {
        this.props.metastore.removeMetadataUpdateListener(this.state.annotations[i].inImage, this.updateMeasures.bind(this));
      }
    }

    this.setState({annotations: []});
  }

  processAnnotations(listOfAnnotations) {
    console.log(JSON.stringify(listOfAnnotations));
    var curatedAnnotations = [];
    for(var i = 0; i < listOfAnnotations.data.annotations.length; ++i) {
      var rawAnnotation = listOfAnnotations.data.annotations[i];
      var filteredAnnotation = JSON.parse(JSON.stringify(rawAnnotation));

      // Convert stuff from px to mm by retrieving the EXIF data of an image.
      var mmPerPixel = null;
      if(filteredAnnotation.inImage) {
        //ViewActions.loadImage(filteredAnnotation.imageUrl, this.updateMeasures().bind(this));
        this.props.metastore.addMetadataUpdateListener(filteredAnnotation.inImage, this.updateMeasures.bind(this));
        var imageMetadata = this.props.metastore.getMetadataAbout(filteredAnnotation.inImage);
        mmPerPixel = Globals.getEXIFScalingData(imageMetadata);
      }
      switch(filteredAnnotation.type) {
        case 'Text':
          continue;
        case 'Unknown':
          console.warning('Unknown annotation type for ' + JSON.stringify(filteredAnnotation));
          continue;
          break;
        case 'Area':
          if(mmPerPixel) {
            filteredAnnotation.displayValue = (filteredAnnotation.value * mmPerPixel * mmPerPixel).toFixed(2) + ' mm²';
          }
          else {
            filteredAnnotation.displayValue = (filteredAnnotation.value).toFixed(2) + ' px²';
          }
          filteredAnnotation.displayType = <img src={areaIcon} height='15px' width='15px' />;
          break;
        case 'Perimeter':
          if(mmPerPixel) {
            filteredAnnotation.displayValue = (filteredAnnotation.value * mmPerPixel).toFixed(2) + ' mm';
          }
          else {
            filteredAnnotation.displayValue = (filteredAnnotation.value).toFixed(2) + ' px';
          }
          filteredAnnotation.displayType = <img src={perimeterIcon} height='15px' width='15px' />;
          break;
        case 'Length':
          if(mmPerPixel) {
            filteredAnnotation.displayValue = (filteredAnnotation.value * mmPerPixel).toFixed(2) + ' mm';
          }
          else {
            filteredAnnotation.displayValue = (filteredAnnotation.value).toFixed(2) + ' px';
          }
          filteredAnnotation.displayType = <img src={polylineIcon} height='15px' width='15px' />;
          break;
        case 'Angle':
          filteredAnnotation.displayValue = filteredAnnotation.value.toFixed(2) + ' °';
          filteredAnnotation.displayType = <img src={angleIcon} height='15px' width='15px' />;
          break;
        default:
          break;
      }

      // Get barcode for inSpecimen data
      this.props.metastore.addExternalMetadataUpdateListener(filteredAnnotation.inSpecimen, this.updateBarcodes.bind(this));

      // Get set name for inSet

      curatedAnnotations.push(filteredAnnotation);
    }
    this.setState({annotations: _.sortBy(curatedAnnotations, Globals.getDate).reverse()});
  }

  updateMeasures() {
    var annotations = this.state.annotations;
    //var annotations = JSON.parse(JSON.stringify(this.state.annotations));
    for(var i = 0; i < annotations.length; ++i) {
      if(annotations[i].inImage) {
        var imageMetadata = this.props.metastore.getMetadataAbout(annotations[i].inImage);
        var mmPerPixel = Globals.getEXIFScalingData(imageMetadata);
        switch(annotations[i].type) {
          case 'Text':
            continue;
          case 'Unknown':
            console.warning('Unknown annotation type for ' + JSON.stringify(annotations[i]));
            continue;
            break;
          case 'Area':
            if(mmPerPixel) {
              annotations[i].displayValue = (annotations[i].value * mmPerPixel * mmPerPixel).toFixed(2) + ' mm²';
            }
            else {
              annotations[i].displayValue = (annotations[i].value).toFixed(2) + ' px²';
            }
            break;
          case 'Perimeter':
            if(mmPerPixel) {
              annotations[i].displayValue = (annotations[i].value * mmPerPixel).toFixed(2) + ' mm';
            }
            else {
              annotations[i].displayValue = (annotations[i].value).toFixed(2) + ' px';
            }
            break;
          case 'Length':
            if(mmPerPixel) {
              annotations[i].displayValue = (annotations[i].value * mmPerPixel).toFixed(2) + ' mm';
            }
            else {
              annotations[i].displayValue = (annotations[i].value).toFixed(2) + ' px';
            }
            break;
          case 'Angle':
            annotations[i].displayValue = annotations[i].value.toFixed(2) + ' °';
            break;
          default:
            break;
        }
      }
    }

    this.setState({annotations: annotations});
  }

  updateBarcodes() {
    //var annotations = JSON.parse(JSON.stringify(this.state.annotations));
    var annotations = this.state.annotations;
    for(var i = 0; i < annotations.length; ++i) {
      if(annotations[i].inSpecimen) {
        var data = this.props.metastore.getExternalMetadata(annotations[i].inSpecimen);
        if(data) {
          annotations[i].barcode = data.institutioncode + ' ' + data.catalognumber;
        }
      }
    }

    this.setState({annotations: annotations});
  }

  setSubject(subject) {
    this.removeListeners();

    switch(subject) {
      case 'image':
        this.props.metastore.addMetadataUpdateListener(this.state.selectedImageId, this._onMetadataUpdate);
        this.props.metastore.getAnnotationsOfEntity(this.state.selectedImageId, this.processAnnotations.bind(this));
        break;
      case 'set':
        this.props.metastore.addMetadataUpdateListener(this.state.selectedSetId, this._onMetadataUpdate);
        this.props.metastore.getAnnotationsOfEntity(this.state.selectedSetId, this.processAnnotations.bind(this));
        break;
      default:
        console.warning('Unknown subject ' + subject);
        return;
    }
    this.setState({subject: subject});
  }

  select(id) {
    var annotations = this.state.annotations;
    for(var i = 0; i < annotations.length; ++i) {
      if(annotations[i].uid === id) {
        annotations[i].selected = true;
        break;
      }
    }

    this.setState({annotations: annotations});
  }

  unselect(id) {
    var annotations = this.state.annotations;
    for(var i = 0; i < annotations.length; ++i) {
      if(annotations[i].uid === id) {
        annotations[i].selected = false;
        break;
      }
    }

    this.setState({annotations: annotations});
  }

  toggleSelectAll(isSelected) {
    var annotations = this.state.annotations;
    for(var i = 0; i < annotations.length; ++i) {
      annotations[i].selected = isSelected;
    }

    this.setState({annotations: annotations});
  }

  buildAnnotationRow(annotation) {
    var titleCell = null;
    var selectionIcon = null;
    if(annotation.title.length > 30) {
      titleCell = <td style={this.cellStyle} className='tooltip title' data-content={annotation.title} data-sort-value={annotation.title}>{annotation.title.substring(0,30) + '...'}</td>;
    }
    else {
      titleCell = <td style={this.cellStyle} data-sort-value={annotation.title}>{annotation.title}</td>;
    }
    if(annotation.selected) {
      selectionIcon = <i className='ui checkmark box icon' onClick={this.unselect.bind(this, annotation.uid)}/>;
    }
    else {
      selectionIcon = <i className='ui square outline icon' onClick={this.select.bind(this, annotation.uid)}/>;
    }

    return(
      <tr key={'ANNOT-' + annotation.uid}>
        <td style={this.cellStyle}>
          {selectionIcon}
        </td>
        <td style={this.cellStyle} data-sort-value={annotation.type}>{annotation.displayType}</td>
        {titleCell}
        <td style={this.cellStyle} data-sort-value={annotation.value}>{annotation.displayValue}</td>
        <td style={this.cellStyle} data-sort-value={annotation.barcode}>{annotation.barcode}</td>
        <td style={this.cellStyle}><i className='ui eye icon' /></td>
      </tr>
    )
  }

  componentDidMount() {
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.inspecstore.addAnnotationSelectionListener(this._onEntitySelected);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.containerStyle.display = null;
    }
    else {
      this.containerStyle.display = 'none';
    }

    nextState.buttons.image = nextState.selectedImageId? '' : 'disabled';
    nextState.buttons.set = nextState.selectedSetId? '' : 'disabled';

    nextState.buttons.image += nextState.subject == 'image'? ' active': '';
    nextState.buttons.set += nextState.subject == 'set'? ' active': '';

    if(nextState.annotations.length == 0) {
      this.tableStyle.display = 'none';
      this.nothingStyle.display = '';
    }
    else {
      this.tableStyle.display = '';
      this.nothingStyle.display = 'none';
    }
  }

  componentDidUpdate(prevProps, prevState) {
    $(this.refs.table.getDOMNode()).tablesort();
    $('.tooltip.title', $(this.refs.table.getDOMNode())).popup();
  }

  componentWillUnmount() {
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    this.props.inspecstore.removeAnnotationSelectionListener(this._onEntitySelected);
  }

  render() {
    // note to self: sort/date, sort/type
    var selectAllIcon = null;
    if(this.state.annotations.length == 0) {
      selectAllIcon = <i className='ui square icon' />;
    }
    else if (this.state.annotations[0].selected) {
      selectAllIcon = <i className='ui checkmark box icon' onClick={this.toggleSelectAll.bind(this, false)}/>;
    }
    else {
      selectAllIcon = <i className='ui square outline icon' onClick={this.toggleSelectAll.bind(this, true)}/>;
    }
    var self = this;
    return <div className='ui segment container' ref='component' style={this.containerStyle}>
      <div className='ui blue tiny basic label'
           style={this.labelStyle}>
        Tags et Mesures
      </div>
      <div style={this.scrollerStyle}>
        <div style={this.menuStyle}>
          <div style={this.upperButtonsStyle}>
            <div style={this.buttonStyle}
                 className={'ui tiny compact button ' + this.state.buttons.measures}>
              <img src={measureIcon} style={this.iconButtonStyle} height='20px' width='20px' />
            </div>
            <div style={this.buttonStyle}
                 className={'ui tiny compact icon button ' + this.state.buttons.tags}>
              <i className="tags icon"/>
            </div>
          </div>
          <div style={this.upperButtonsStyle}>
            <div
              className={'ui tiny compact button ' + this.state.buttons.image}
              onClick={this.setSubject.bind(this, 'image')}>Planche</div>
            <div
              className={'ui tiny compact button ' + this.state.buttons.set}
              onClick={this.setSubject.bind(this, 'set')}>Set</div>
          </div>
          <div style={this.upperButtonsStyle}>
            <div style={this.buttonStyle} className='ui tiny compact button'>
              <i className='copy icon'  style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle} className='ui tiny compact button'>
              <i className='download icon' style={this.iconButtonStyle} />
            </div>
            <div style={this.buttonStyle} className='ui tiny compact button'>
              <i style={this.iconButtonStyle} className='setting icon' />
            </div>
          </div>
        </div>

        <div>
          <table style={this.tableStyle}
                 ref='table'
                 className='ui selectable sortable unstackable striped celled collapsing compact small fixed table'>
            <thead>
            <tr>
              <th className='one wide disabled' style={this.cellStyle}>{selectAllIcon}</th>
              <th className='one wide' style={this.cellStyle}>Type</th>
              <th className='six wide' style={this.cellStyle}>Titre</th>
              <th className='three wide' style={this.cellStyle}>Valeur</th>
              <th className='four wide' style={this.cellStyle}>Planche</th>
              <th className='one wide disabled' style={this.cellStyle}></th>
            </tr>
            </thead>
            <tbody>
            {_.values(this.state.annotations).map(this.buildAnnotationRow.bind(this))}
            </tbody>
          </table>
          <div style={this.nothingStyle}>Aucune donnée à afficher pour la sélection courante</div>
        </div>
      </div>
    </div>
  }
}

export default AnnotationList;