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
    var imageLinkId = this.props.toolstore.getSelectedImageId();
    var view = this.props.benchstore.getActiveViewData();
    var imageId = null;

    //console.log(imageLinkId);

    for(var i = 0; i < view.displays.length; ++i) {
      var dEntity = view.displays[i];
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
    window.setTimeout(MetadataActions.updateMetadata.bind(null, [imageId]), 100);
  }

  displayImageMetadata() {
    //console.log('displayImageMetadata');
    var id = this.state.imageCoLabId;
    //console.log(id);
    if(!id) {
      this.setState({loading: false, noContent: true});
      return;
    }

    var metadata = this.props.metastore.getMetadataAbout(id);
    var specimenId = null;
    var loading = false;
    //console.log(JSON.stringify(metadata));
    if(metadata.specimens) {
      if(metadata.specimens.length > 0) {
        loading = true;
        if(metadata.specimens.length > 1) {
          console.warn('Multiple specimens for image ' + id);
        }
        specimenId = metadata.specimens[0];
        this.props.metastore.addMetadataUpdateListener(specimenId, this._onSpecimenMetadataUpdated);
        window.setTimeout(MetadataActions.updateMetadata.bind(null, metadata.specimens), 10);
      }
    }


    this.setState({coLabImageMetadata: metadata, specimenCoLabId: specimenId, loading: loading});
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
      window.setTimeout(MetadataActions.updateMetadata.bind(null, [metadata.originalSource]), 10);
    }
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
    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id)
      //.withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Could not retrieve resource data from recolnat about ' + id + ' -> ' + err);
          alert('Impossible de récupérer les données associées dans ReColNat');
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
        }
      });

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/determinations')
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

    request.get('https://api.recolnat.org/erecolnat/v1/specimens/' + id + '/recolte')
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

    this.setState({
      linkToExplore: 'https://explore.recolnat.org/#/specimen/botanique/' + id.split('-').join('')
    });
  }

  displaySelectedName() {
    if(this.state.coLabSpecimenMetadata) {
      if(this.state.coLabSpecimenMetadata.name) {
        return this.state.coLabSpecimenMetadata.name;
      }
      return 'Nom manquant';
    }
    return 'Pas de planche sélectionnée';
  }

  componentDidMount() {
    if(this.refs.accordion) {
      $(this.refs.accordion.getDOMNode()).accordion({
        exclusive: false
      });
    }
    this.props.toolstore.addSelectionChangeListener(this._onChangeSelection);
    this.props.modestore.addModeChangeListener(this._onModeChange);
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
    if(nextState.coLabImageMetadata) {
      nextState.noContent = false;
    }
    else {
      nextState.noContent = true;
    }

    //if(!nextState.imageCoLabId) {
    //  nextState.loading = false;
    //}
    //else if(nextState.imageCoLabId != this.state.imageCoLabId) {
    //  nextState.loading = true;
    //  nextState.loadingSpecimen = true;
    //  nextState.loadingHarvest = true;
    //  nextState.loadingDeterminations = true;
    //  nextState.loadingLocation = true;
    //  //nextState.specimen = null;
    //  //nextState.determinations = [];
    //  //nextState.harvest = null;
    //  //nextState.location = null;
    //  //window.setTimeout(this.displayMetadata.bind(this), 100);
    //}

    //if(nextState.loading) {
    //  this.loaderStyle.display = '';
    //  this.noDataStyle.display = 'none';
    //  this.tableStyle.display = 'none';
    //}
    //else if(nextState.noContent) {
    //  this.loaderStyle.display = 'none';
    //  this.noDataStyle.display = '';
    //  this.tableStyle.display = 'none';
    //}
    //else {
    //  this.loaderStyle.display = 'none';
    //  this.noDataStyle.display = 'none';
    //  this.tableStyle.display = '';
    //}
      this.loaderStyle.display = 'none';
      this.noDataStyle.display = 'none';
    this.tableStyle.display = '';

    //console.log('current state=' + JSON.stringify(this.state));
    //console.log('future state=' + JSON.stringify(nextState));
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
            Pas d'informations disponibles sur la sélection
          </div>
        </div>

        <div ref='accordion' className="ui fluid accordion" style={this.tableStyle}>
          <SpecimenMetadataTable loading={this.state.loadingSpecimen}
                                 metadata={this.state.specimen}
                                 title='Spécimen'/>
          {this.state.determinations.map(function(determination, index) {
            return <DeterminationMetadataTable key={'META-DET-' + index}
                                               loading={self.state.loadingDeterminations}
                                               metadata={determination}
                                               title={'Détermination ' + (index+1)}/>
          })}
          <HarvestMetadataTable metadata={this.state.harvest}
                                loading={this.state.loadingHarvest}
                                title='Récolte'/>
          <LocationMetadataTable metadata={this.state.location}
                                 loading={this.state.loadingLocation}
                                 title='Localisation'/>
        </div>
      </div>
    );
  }
}

export default MetadataViewer;