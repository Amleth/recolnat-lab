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

import conf from '../conf/ApplicationConfiguration';

class MetadataViewer extends React.Component {

  constructor(props) {
    super(props);

    this.placeholderStyle = {
      backgroundColor: '#F2F2F2',
      height: '100%',
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
      const displayMetadata = () => this.setState({entity: this.props.entitystore.getSelectedImageId()});

      return displayMetadata.apply(this);
    };

    this.state = {
      loading: true,
      noContent: true,
      entity: null,
      coLabMetadata: null,
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

  displayMetadata() {
    //console.log(id);
    var id = this.state.entity;
    if(!id) {
      this.setState({loading: false, noContent: true});
      return;
    }

    var metadata = this.props.entitystore.getSelectedMetadata();
    if(!metadata) {
      window.setTimeout(this.displayMetadata.bind(this), 2000);
      return;
    }
    // Get CoLab metadata about this entity
    request.get(conf.actions.databaseActions.getData)
      .query({id: id})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error('Error connecting to CoLab database service ' + err);
          this.setState({loading: false, noContent: true});
        }
        else {
          var metadata = JSON.parse(res.text);
          if(metadata.originalSource) {
            this.loadOriginalSourceMetadata(metadata.originalSource.uid, metadata.originalSource.type, metadata.originalSource.origin);
          }
          this.setState({loading: false, coLabMetadata: metadata});
        }
      });
  }

  loadOriginalSourceMetadata(id, type, origin) {
    switch(origin) {
      case 'recolnat':
        this.getRecolnatMetadata(id, type);
        break;
      default:
        console.error('Unknown data source ' + origin);
        break;
    }
  }

  getRecolnatMetadata(id, type) {
    switch(type) {
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
    if(this.state.entity) {
      if(this.props.entitystore.getSelectedMetadata()) {
        return this.props.entitystore.getSelectedMetadata().name;
      }
    }
      return 'Pas de planche sélectionnée';

  }

  componentDidMount() {
    if(this.refs.accordion) {
      $(this.refs.accordion.getDOMNode()).accordion({
        exclusive: false
      });
    }
    this.props.entitystore.addChangeSelectionListener(this._onChangeSelection);
  }

  componentWillUpdate(nextProps, nextState) {
    if(nextState.coLabMetadata) {
      nextState.noContent = false;
    }
    else {
      nextState.noContent = true;
    }

    if(!nextState.entity) {
      nextState.loading = false;
    }
    else if(nextState.entity != this.state.entity) {
      nextState.loading = true;
      nextState.loadingSpecimen = true;
      nextState.loadingHarvest = true;
      nextState.loadingDeterminations = true;
      nextState.loadingLocation = true;
      //nextState.specimen = null;
      //nextState.determinations = [];
      //nextState.harvest = null;
      //nextState.location = null;
      window.setTimeout(this.displayMetadata.bind(this), 100);
    }

    if(nextState.loading) {
      this.loaderStyle.display = '';
      this.noDataStyle.display = 'none';
      this.tableStyle.display = 'none';
    }
    else if(nextState.noContent) {
      this.loaderStyle.display = 'none';
      this.noDataStyle.display = '';
      this.tableStyle.display = 'none';
    }
    else {
      this.loaderStyle.display = 'none';
      this.noDataStyle.display = 'none';
      this.tableStyle.display = '';
    }

    //console.log('current state=' + JSON.stringify(this.state));
    //console.log('future state=' + JSON.stringify(nextState));
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.loading == false && this.state.noContent == false) {
      $(this.refs.accordion.getDOMNode()).accordion('refresh');
    }
  }

  componentWillUnmount() {
    this.props.entitystore.removeChangeSelectionListener(this._onChangeSelection);
  }

  render() {
    var self = this;
    return(
      <div className='ui container' style={this.placeholderStyle}>
        <div style={this.loaderStyle} className='ui active loader'></div>
        <div style={this.noDataStyle} className='ui container'>
          <div className='ui centered header segment' style={this.titleStyle}>
            {this.displaySelectedName()}
          </div>
          <div className='ui segment'>
            Pas d'informations disponibles sur la sélection
          </div>
        </div>

        <div ref='accordion' className="ui styled fluid accordion" style={this.tableStyle}>
          <div className='ui centered header segment' style={this.titleStyle}>
            {this.displaySelectedName()}
          </div>
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