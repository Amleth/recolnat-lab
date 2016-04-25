/**
 * Created by dmitri on 01/04/15.
 */
'use strict';

import React from 'react';
import request from 'superagent';
import fastcsv from 'fast-csv';
import fs from "filereader-stream";

import ViewActions from '../../actions/ViewActions';

import conf from '../../conf/ApplicationConfiguration';

class GraphNavigator extends React.Component {
  constructor(props) {
    super(props);

    this.componentStyle = {
      height: '100%',
      width: '100%',
      display: 'flex',
      flexDirection: 'column'
    };

    this.textSearchBarStyle = {
      height: '20px',
      minHeight: '20px',
      maxHeight: '20px',
      margin: '5px 5px 5px 5px',
      width: '90%'
    };

    this.graphStyle = {
      height: '80%',
      minHeight: '300px',
      maxHeight: '300px',
      width: '100%'
    };

    this.parentContainerStyle = {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      overflowX: 'auto',
      overflowY: 'hidden',
      flexWrap: 'nowrap',
      marginBottom: '10px'
    };

    this.currentElementContainerStyle = {
      width: '100%',
      overflow: 'hidden'
    };

    this.contentContainerStyle = {
      minHeight: '230px',
      maxHeight: '230px',
      flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden'
    };

    this.parentNodeStyle = {
      height: '20px',
      borderStyle: 'solid',
      borderRadius: '10px',
      borderWidth: '1px',
      textAlign: 'center',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flex: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    };

    this.parentNodeSelectedStyle = {
      height: '20px',
      borderStyle: 'solid',
      borderRadius: '10px',
      borderWidth: '1px',
      borderColor: '#990000',
      textAlign: 'center',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flex: 'none',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    };

    this.currentNodeStyle = {
      width: '80%',
      maxHeight: '90%',
      margin: '5% 10% 5% 10%',
      borderStyle: 'solid',
      borderRadius: '10px',
      borderWidth: '1px',
      textOverflow: 'ellipsis',
      textAlign: 'center',
      cursor: 'pointer',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    };

    this.childNodeStyle = {
      width: '90%',
      borderStyle: 'solid',
      borderRadius: '10px',
      borderWidth: '1px',
      textAlign: 'left',
      cursor: 'pointer',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    };

    this.childNodeSelectedStyle = {
      width: '90%',
      borderStyle: 'solid',
      borderRadius: '10px',
      borderWidth: '1px',
      borderColor: '#990000',
      textAlign: 'left',
      cursor: 'pointer',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      WebkitUserSelect: 'none',
      MozUserSelect: 'none',
      msUserSelect: 'none',
      userSelect: 'none'
    };

    this.buttonsContainerStyle = {
      height: '10%',
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap'
    };

    this.buttonStyle = {
      overflow: 'hidden'
    };

    this.inputFileStyle = {
      position: 'relative',
      height: '1px',
      width: '1px',
      top: "-100em",
      zIndex: "2",
      opacity: "0",
      overflow: 'hidden'
    };

    this.state =
    {
      parents: [],
      current: {name: "Chargement en cours", id:"root", type: "root"},
      children: [],
      selected: {id: null, linkId: null}, copy: null, cut: null,
      viewButtonColor: '',
      userLoggedIn: false
    };

    this._onUserLogIn = () => {
      const userLogIn = () => this.setState({userLoggedIn: true});
      return userLogIn.apply(this);
    };

    this._onUserLogOut = () => {
      const userLogOut = () => this.setState({userLoggedIn: false});
      return userLogOut.apply(this);
    };
  }

  componentWillMount() {
    //this.getGraphAround({id: 'root', type: "root"});
  }

  componentDidMount() {
    this.props.userstore.addUserLogInListener(this._onUserLogIn);
    this.props.userstore.addUserLogOutListener(this._onUserLogOut);
    $('.ui.button').popup();
  }

  componentWillUpdate(nextProps, nextState) {
    nextState.viewButtonColor = '';
    for(var i = 0; i < nextState.children.length; ++i) {
      if(nextState.children[i].type == 'item') {
        nextState.viewButtonColor = 'green';
        break;
      }
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if(this.state.userLoggedIn && !prevState.userLoggedIn) {
      this.getGraphAround({id: this.state.current.uid, type: this.state.current.type});
    }
  }

  componentWillUnmount() {
    this.props.userstore.removeUserLogInListener(this._onUserLogIn);
    this.props.userstore.removeUserLogOutListener(this._onUserLogOut);
  }

  getGraphAround(node) {
    if(node.type == 'item') {
      alert("L'élément sélectionné n'est pas un bureau de travail");
      return;
    }
    request
      .get(conf.urls.virtualWorkbenchService)
      .query({id: node.uid})
      .set('Accept', 'application/json')
      .withCredentials()
      .end((err, res)=> {
      if(err) {
        console.log("Error occurred when retrieving workbench. Server returned: " + err);
      }
      else {
        console.log("Received response " + res.text);
        var response = JSON.parse(res.text);
        this.setState({parents: _.sortBy(response.parents, 'name'), current: response.current, children: _.sortBy(response.children, 'name'), selected: {id: null, linkId: null}});
      }
    });
  }

  promptCreateWorkbench() {
    var name = prompt("Nom du bureau à créer", "Nouveau bureau");
    if(name != null) {
      request.post(conf.actions.virtualWorkbenchServiceActions.createNewWorkbench)
        .set('Content-Type', 'application/json')
        .send({parent: this.state.current.uid})
        .send({name: name})
        .withCredentials()
        .end((err, res)=> {
          if(err) {
            console.log("Error occurred when creating new workbench. Server returned: " + err);
          }
          else {
            console.log("Received response " + res.text);
          }
          this.getGraphAround(this.state.current);
        });
    }
  }

  /**
   * Removes parenthood link between state.current and state.selected. If state.selected is left without parents, it will be deleted and its content unlinked, and recursively until no orphaned workbenches are left.
   */
  promptDelete() {
    if(this.state.selected === null) {
      alert("Veuillez sélectionner un élément à supprimmer");
    }
    else {
      var process = confirm("Vous confirmez la suppression de l'élément séléctionné ?");
      if(process) {
        request.post(conf.actions.virtualWorkbenchServiceActions.deleteWorkbench)
          .set('Content-Type', 'application/json')
          .send({container: this.state.current.uid})
          .send({target: this.state.selected.uid})
          .send({linkId: this.state.selected.linkId})
          .withCredentials()
          .end((err, res) => {
            if (err) {
              console.log(err);
              alert(err);
            }
            else {
              console.log("Delete received response " + res.text);
            }
            this.getGraphAround(this.state.current);
          });
      }
    }
  }

  setSelected(node) {
    this.setState({selected: node});
  }

  beginCopy() {
    this.setState({copy: this.state.selected})
  }

  beginCut() {
    this.setState({cut: {target: this.state.selected, parent: this.state.current.uid}});
  }

  paste() {
    if(this.state.copy) {
      request.post(conf.actions.virtualWorkbenchServiceActions.copypaste)
      .set('Content-Type', 'application/json')
      .send({target: this.state.copy.uid})
      .send({destination: this.state.current.uid})
        .withCredentials()
      .end((err, res) => {
          if(err) {
            console.log(err);
            alert(err);
          }
          else {
            console.log("Copy/paste successful");
          }
          this.setState({copy: null, cut: null});
          this.getGraphAround(this.state.current);
        });
    }
    else if(this.state.cut) {
      request.post(conf.actions.virtualWorkbenchServiceActions.cutpaste)
      .set('Content-Type', 'application/json')
      .send({target: this.state.cut.target.uid})
      .send({source: this.state.cut.parent})
        .send({linkId: this.state.cut.target.linkId})
      .send({destination: this.state.current.uid})
        .withCredentials()
      .end((err, res)=> {
          if(err) {
            console.log(err);
            alert(err);
          }
          else {
            console.log("Cut/paste successful");
          }
          this.setState({copy: null, cut: null});
          this.getGraphAround(this.state.current);
        })
    }
    else {
      alert("Rien à coller !");
    }
  }

  sendToView() {
    if(this.state.current) {
      ViewActions.setActiveWorkbench(this.state.current.uid);
    }
  }

  import() {
    alert('Not implemented');
    return;
    // Get new entity ID
    var id = prompt("Identifiant de l'élément à importer (UUID)", null);
    if(!id) {
      alert("Aucun identifiant entré.");
    }
    // Transmit ID to server
    request.post(conf.actions.virtualWorkbenchServiceActions.import)
    .set('Content-Type', 'application/json')
    .send({elementToImport: id})
    .send({parent: this.state.current.uid})
      .withCredentials()
    .end((err, res) => {
        if(err) {
          console.log(err);
          alert("Echec de l'import");
        }
        else {
          console.log("Import successful")
        }
        // Reload graph
        this.getGraphAround(this.state.current);
      });
  }

  callFileInput() {
    React.findDOMNode(this.refs.fileInput).click();
  }

  openCSV(event) {
    var selectedFiles = React.findDOMNode(this.refs.fileInput).files;
    if(selectedFiles.length < 1) {
      console.log("No file selected");
      return;
    }

    var file = selectedFiles[0];
    console.log("name=" + file.name + " size=" + file.size + " type=" + file.type);

    var self = this;
    var stream = fs(file);
    var parser = fastcsv({objectMode: true, headers: true, ignoreEmpty: true, discardUnmappedColumns: true, trim: true})
    .on("data", function(data) {
        if(data.url && data.name) {
          console.log("data=" + JSON.stringify(data));
          request.post(conf.actions.virtualWorkbenchServiceActions.importSheet)
            .set('Content-Type', "application/json")
            .send({workbench: self.state.current.uid})
            .send({url: data.url})
            .send({name: data.name})
            .withCredentials()
            .end((err, res) => {
              if (err) {
                console.error(err);
              }
              else {
                self.getGraphAround(self.state.current);
              }
            });
        }
        else {
          console.error("CSV has no url and name fields");
          alert("Le CSV n'est pas valide. Pour être valide il doit contenir des colonnes correspondant aux labels 'url' et 'name'");
        }
      })
    .on("end", function() {
        self.getGraphAround(self.state.current);
      });
    stream.pipe(parser);
  }

  render() {
    return(
      <div style={this.componentStyle}>
          <input style={this.textSearchBarStyle} type='search' name='graphSearchInput' placeholder='Recherche...'></input>
        <div style={this.graphStyle}>
          <div style={this.parentContainerStyle}>
          {this.state.parents.map(function(node) {
            var pStyle = this.parentNodeStyle;
            return(
              <div className='ui label'
                   key={node.uid}
                   style={pStyle}
                   onDoubleClick={this.getGraphAround.bind(this, node)}>
                {node.name}
              </div>);
          }, this)}
          </div>
          <div style={this.currentElementContainerStyle}>
            <div className='ui label' style={this.currentNodeStyle}>{this.state.current.name}</div>
          </div>
          <div style={this.contentContainerStyle}>
            {this.state.children.map(function(node) {
              var cStyle = this.childNodeStyle;
              if(this.state.selected.linkId === node.linkId) {
                cStyle = this.childNodeSelectedStyle;
              }
              var icon = '';
              if(node.type == 'bag') {
                icon = 'folder icon';
              }
              else if(node.type == 'item') {
                icon = 'file image outline icon';
              }
              return(
                <div className='ui label fluid'
                  key={node.linkId}
                     style={cStyle}
                     onDoubleClick={this.getGraphAround.bind(this, node)}
                     onClick={this.setSelected.bind(this, node)}>
                  <div className='ui detail'>
                    <i className={icon} />
                  </div>
                  {node.name}
                </div>)
            }, this)}
          </div>
        </div>
        <input type="file" style={this.inputFileStyle} accept="text/csv" ref="fileInput" onChange={this.openCSV.bind(this)} />
        <div className='ui small compact icon buttons' style={this.buttonsContainerStyle}>
          <button className={' ui button ' + this.state.viewButtonColor} style={this.buttonStyle} onClick={this.sendToView.bind(this)} data-content="Voir les images du bureau actif">
            <i className="ui unhide icon"></i>
            Ouvrir
          </button>
          <button className=' ui button ' style={this.buttonStyle} onClick={this.promptCreateWorkbench.bind(this)} data-content="Créer un nouveau dossier">
            <i className="folder icon"></i>
          </button>
          <button className=' ui  button ' style={this.buttonStyle} onClick={this.promptDelete.bind(this)} data-content="Supprimer l'élément sélectionné">
            <i className="trash icon"></i>
          </button>
          <button className=' ui  button ' style={this.buttonStyle} onClick={this.beginCopy.bind(this)} data-content="Copier l'élément sélectionné">
            <i className="copy icon"></i>
          </button>
          <button className=' ui  button ' style={this.buttonStyle} onClick={this.beginCut.bind(this)} data-content="Couper l'élément sélectionné">
            <i className="cut icon"></i>
          </button>
          <button className=' ui  button ' style={this.buttonStyle} onClick={this.paste.bind(this)} data-content="Coller l'élément précédemment coupé ou copié dans le bureau actif">
            <i className="paste icon"></i>
          </button>
          </div>
          <div className='ui small compact icon buttons' style={this.buttonsContainerStyle}>
          <button className=' ui  button ' style={this.buttonStyle} onClick={this.import.bind(this)} data-content="Importer des planches depuis le panier">
            <i className="in cart icon"></i>
          </button>
          <button className=' ui  button ' style={this.buttonStyle} onClick={this.callFileInput.bind(this)} data-content="Importer des images depuis un fichier CSV">
            <i className="upload icon"></i>
          </button>
        </div>
      </div>
    );
  }
}

export default GraphNavigator;