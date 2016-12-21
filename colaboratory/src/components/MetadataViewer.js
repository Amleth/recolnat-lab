/**
 * Created by dmitri on 30/03/15.
 */
'use strict';
import React from 'react';
import request from 'superagent';

//import MetadataTable from './metadata/MetadataTable';
import SpecimenMetadataTable from './metadata/SpecimenMetadataTable';
import HarvestMetadataTable from './metadata/HarvestMetadataTable';
import DeterminationMetadataTable from './metadata/DeterminationMetadataTable';
import LocationMetadataTable from './metadata/LocationMetadataTable';

import MetadataActions from '../actions/MetadataActions';

import conf from '../conf/ApplicationConfiguration';

class MetadataViewer extends React.Component {

  constructor(props) {
    super(props);

    this.placeholderStyle = {
      backgroundColor: '#F2F2F2',
      height: this.props.height,
      margin: '1%',
      padding: '5px 5px 5px 5px',
      overflowY: 'auto',
      width: '100%'
    };

    this.titleStyle = {
      padding: '5px 5px 5px 5px',
      margin: 0
    };

    this.tableStyle = {
      height: '100%',
      overflow: 'auto'
    };

    this.loaderStyle = {
      display: ''
    };

    this.noDataStyle = {
      display: 'none'
    };

    this._onChangeSelection = () => {
      const loadMetadata = () => this.loadMetadata();
      return loadMetadata.apply(this);
    };

    this._onImageMetadataUpdated = () => {
      const displayImageMetadata = () => this.displayImageMetadata();
      return displayImageMetadata.apply(this);
    };

    this._onSpecimenMetadataUpdated = () => {
      const displaySpecimenMetadata = () => this.displaySpecimenMetadata();
      return displaySpecimenMetadata.apply(this);
    };

    this._onSourceMetadataUpdated = () => {
      const displaySourceMetadata = () => this.displayOriginalSourceMetadata();
      return displaySourceMetadata.apply(this);
    };

    this._onModeChange = () => {
      const setModeVisibility = () => this.setState({
        isVisibleInCurrentMode: this.props.modestore.isInOrganisationMode() || this.props.modestore.isInObservationMode()
      });
      return setModeVisibility.apply(this);
    };

    this.state = {
      isVisibleInCurrentMode: false,
      loading: true,
      noContent: true,
      imageCoLabId: null,
      specimenCoLabId: null,
      originalSourceCoLabId: null,
      coLabImageMetadata: null,
      coLabSpecimenMetadata: null,
      specimen: null,
      determinations: [],
      harvest: null,
      location: null,
      loadingSpecimen: true,
      loadingDeterminations: true,
      loadingHarvest: true,
      loadingLocation: true
      //global: [],
      //exif: []
    };
  }

  loadMetadata() {
    //console.log('loadMetadata');
    let imageLinkId = this.props.toolstore.getSelectedImageId();
    let view = this.props.benchstore.getActiveViewData();
    let imageId = null;

    //console.log(imageLinkId);

    for(let i = 0; i < view.displays.length; ++i) {
      let dEntity = view.displays[i];
      //console.log(JSON.stringify(dEntity));
      if(dEntity.link == imageLinkId) {
        imageId = dEntity.entity;
        break;
      }
    }

    //console.log('fetching metadata for image ' + imageId);

    if(imageId != this.state.imageCoLabId) {
      if(this.state.imageCoLabId) {
        this.props.metastore.removeMetadataUpdateListener(this.state.imageCoLabId, this._onImageMetadataUpdated);
      }
      if(this.state.specimenCoLabId) {
        this.props.metastore.removeMetadataUpdateListener(this.state.specimenCoLabId, this._onSpecimenMetadataUpdated);
      }
      if(this.state.originalSourceCoLabId) {
        this.props.metastore.removeMetadataUpdateListener(this.state.originalSourceCoLabId, this._onSourceMetadataUpdated);
      }
      if(imageId) {
        this.props.metastore.addMetadataUpdateListener(imageId, this._onImageMetadataUpdated);
      }
      this.setState({
        loading: imageId != null,
        noContent: imageId == null,
        imageCoLabId: imageId,
        specimenCoLabId: null,
        originalSourceCoLabId: null,
        coLabImageMetadata: null,
        coLabSpecimenMetadata: null,
        specimen: null,
        determinations: [],
        harvest: null,
        location: null,
        loadingSpecimen: true,
        loadingDeterminations: true,
        loadingHarvest: true,
        loadingLocation: true});
    }

    //window.setTimeout(this._onImageMetadataUpdated, 50);
  }

  displayImageMetadata() {
    //console.log('displayImageMetadata');
    let id = this.state.imageCoLabId;
    //console.log(id);
    if(!id) {
      this.setState({loading: false, noContent: true});
      return;
    }

    let metadata = this.props.metastore.getMetadataAbout(id);
    let specimenId = null;
    let loading = false;
    //console.log(JSON.stringify(metadata));
    if(metadata.specimens) {
      if(metadata.specimens.length > 0) {
        loading = true;
        if(metadata.specimens.length > 1) {
          console.warn('Multiple specimens for image ' + id);
        }
        specimenId = metadata.specimens[0];
        this.props.metastore.addMetadataUpdateListener(specimenId, this._onSpecimenMetadataUpdated);
      }
    }


    this.setState({coLabImageMetadata: metadata, specimenCoLabId: specimenId, loading: loading});

    //window.setTimeout(this._onSpecimenMetadataUpdated, 50);
  }

  displaySpecimenMetadata() {
    //console.log('displaySpecimenMetadata');
    if(!this.state.specimenCoLabId) {
      this.setState({loading: false});
      return;
    }
    var metadata = this.props.metastore.getMetadataAbout(this.state.specimenCoLabId);
    this.setState({coLabSpecimenMetadata: metadata});

    if(metadata.originalSource) {
      this.setState({originalSourceCoLabId: metadata.originalSource});
      this.props.metastore.addMetadataUpdateListener(metadata.originalSource, this._onSourceMetadataUpdated);
    }

    //window.setTimeout(this._onSourceMetadataUpdated, 50);
  }

  displayOriginalSourceMetadata() {
    //console.log('displayOriginalSourceMetadata');
    var metadata = this.props.metastore.getMetadataAbout(this.state.originalSourceCoLabId);
    if(!metadata) {
      return;
    }
    var origin = metadata.origin;
    var type = metadata.typeInOriginSource;
    var id = metadata.idInOriginSource;
    switch(origin.toLowerCase()) {
      case 'recolnat':
        this.getRecolnatMetadata(id, type);
        break;
      default:
        console.error('Unknown data source ' + origin);
        this.setState({loading: false});
        break;
    }
  }

  getRecolnatMetadata(id, type) {
    switch(type.toLowerCase()) {
      case 'specimen':
        this.getRecolnatSpecimenMetadata(id);
        break;
      default:
        console.error('No handler for ReColNat object type ' + type);
        break;
    }
  }

  getRecolnatSpecimenMetadata(id) {
    // Example id 3A160E6F-8ED3-4ED3-A46A-D6737893E844
    // https://api.recolnat.org/erecolnat/v1/specimens/3a160e6f-8ed3-4ed3-a46a-d6737893e844
    // Then go to determination(s)
    //console.log('getting recolnat data about ' + id);
    if(this.state.loadingSpecimen) {
    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not retrieve resource data from recolnat about ' + id + ' -> ' + err);
          alert(this.props.userstore.getText('cannotRetrieveRecolnatData') + ' https://api.recolnat.org/erecolnat/v1/specimens/' + id);
          this.setState({
            specimen: null,
            loadingSpecimen: false
          });
        }
        else {
          var specimen = JSON.parse(res.text);
          //console.log('specimen=' + res.text);
          this.setState({
            specimen: specimen,
            loadingSpecimen: false
          });

          if(specimen.links) {
            for(var i = 0; i < specimen.links.length; ++i) {
              var link = specimen.links[i];
              switch(link.rel) {
                case "determinations":
                if(this.state.loadingDeterminations) {
                  request.get(link.href)
                    //.withCredentials()
                    .end((err, res) => {
                      if(err) {
                        console.error('Error requesting determinations about ' + id + ' -> ' + err);
                        this.setState({
                          determinations: [],
                          loadingDeterminations: false
                        });
                      }
                      else {
                        var determinations = JSON.parse(res.text);
                        //console.log('determinations=' + res.text);
                        this.setState({determinations: determinations,
                          loadingDeterminations: false});
                      }
                    });
                  }
                  else {
                    this.setState({
                      determinations: [],
                      loadingDeterminations: false
                    });
                  }
                break;
                case "recolte":
                if(this.state.loadingHarvest) {
                  request.get(link.href)
                    //.withCredentials()
                    .end((err, res) => {
                      if(err) {
                        console.error('Error requesting harvest data about ' + id + ' -> ' + err);
                        this.setState({
                          harvest: null,
                          loadingHarvest: false,
                          loadingLocation: false
                        });
                      }
                      else {
                        var harvest = JSON.parse(res.text);
                        //console.log('harvest=' + res.text);
                        this.setState({harvest: harvest, location: harvest.localisation, loadingHarvest: false, loadingLocation: false});
                      }
                    });
                  }
                  else {
                  this.setState({
                    harvest: null,
                    loadingHarvest: false,
                    loadingLocation: false
                  });
                  }
                break;
                default:
                break;
              }
            }
          }
        }
      });
    }

    this.setState({
      linkToExplore: 'https://explore.recolnat.org/#/specimen/botanique/' + id.split('-').join('')
    });
  }

  displaySelectedName() {
    if(this.state.coLabSpecimenMetadata) {
      if(this.state.coLabSpecimenMetadata.name) {
        return this.state.coLabSpecimenMetadata.name;
      }
      return this.props.userstore.getText('nameUnavailable');
    }
    return this.props.userstore.getText('noSheetSelected');
  }

  componentDidMount() {
    if(this.refs.accordion) {
      $(this.refs.accordion.getDOMNode()).accordion({
        exclusive: false
      });
    }
    this.props.toolstore.addSelectionChangeListener(this._onChangeSelection);
    this.props.modestore.addModeChangeListener(this._onModeChange);
    this.props.userstore.addLanguageChangeListener(this.setState.bind(this, {}));
  }

  componentWillReceiveProps(props) {
    if(props.height != this.props.height) {
      this.placeholderStyle.height = props.height;
    }
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.isVisibleInCurrentMode) {
      this.tableStyle.display = '';
      this.placeholderStyle.display = '';
    }
    else {
      this.tableStyle.display = 'none';
      this.placeholderStyle.display = 'none';
    }
    nextState.noContent = !nextState.coLabImageMetadata;

      this.loaderStyle.display = 'none';
      this.noDataStyle.display = 'none';
    this.tableStyle.display = '';

  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.loading == false && this.state.noContent == false) {
      $(this.refs.accordion.getDOMNode()).accordion('refresh');
    }
  }

  componentWillUnmount() {
    this.props.toolstore.removeSelectionChangeListener(this._onChangeSelection);
    this.props.modestore.removeModeChangeListener(this._onModeChange);
    if(this.state.imageCoLabId) {
      this.props.metastore.removeMetadataUpdateListener(this.state.imageCoLabId, this._onImageMetadataUpdated);
    }
    if(this.state.specimenCoLabId) {
      this.props.metastore.removeMetadataUpdateListener(this.state.imageCoLabId, this._onSpecimenMetadataUpdated);
    }
    this.props.userstore.removeLanguageChangeListener(this.setState.bind(this, {}));
  }

  render() {
    var self = this;
    return(
      <div className='ui segment container' style={this.placeholderStyle}>
        <div style={this.loaderStyle} className='ui active loader'></div>
        <div style={this.noDataStyle} className='ui container'>
          <div className='ui centered header segment' style={this.titleStyle}>
            {this.displaySelectedName()}
          </div>
          <div className='ui segment'>
            {this.props.userstore.getText('noInformationAboutSelection')}
          </div>
        </div>

        <div ref='accordion' className="ui fluid accordion" style={this.tableStyle}>
          <SpecimenMetadataTable loading={this.state.loadingSpecimen}
                                 userstore={this.props.userstore}
                                 metadata={this.state.specimen}
                                 title={this.props.userstore.getText('specimen')}/>
          {this.state.determinations.map(function(determination, index) {
            return <DeterminationMetadataTable key={'META-DET-' + index}
                                               userstore={self.props.userstore}
                                               loading={self.state.loadingDeterminations}
                                               metadata={determination}
                                               title={self.props.userstore.getText('determination') + ' ' + (index+1)}/>
          })}
          <HarvestMetadataTable userstore={this.props.userstore}
                                metadata={this.state.harvest}
                                loading={this.state.loadingHarvest}
                                title={this.props.userstore.getText('harvest')}/>
          <LocationMetadataTable userstore={this.props.userstore}
                                 metadata={this.state.location}
                                 loading={this.state.loadingLocation}
                                 title={this.props.userstore.getText('location')}/>
        </div>
      </div>
    );
  }
}

export default MetadataViewer;
