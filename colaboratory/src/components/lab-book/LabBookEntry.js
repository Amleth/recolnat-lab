/**
 * Created by dmitri on 03/12/15.
 */
'use strict';

import React from 'react';
import TimeAgo from 'react-timeago';
import request from 'superagent';

import conf from '../../conf/ApplicationConfiguration';

class LabBookEntry extends React.Component {
  constructor(props) {
    super(props);
    console.log(JSON.stringify(props.action));
    //console.log(props.userstore.getUser().rPlusId);

    this.textStyle = {
      userSelect: 'none',
      cursor: 'default'
    };

    var user = props.action.user;
    var userVerb = "";
    var actionPre = props.action.action;
    var actionPost = "";

    if(props.action.user == props.userstore.getUser().rPlusId) {
      user = "vous";
      userVerb = "avez";
    }
    else {
      userVerb = "a";
    }

    if(props.action.action == "Creation") {
      actionPre = "crée";
    }
    else if(props.action.action == "Access") {
      actionPre = "obtenu l'accès à";
    }
    else if(props.action.action == "Annotation") {
      actionPre = "ajouté l'annotation";
      actionPost = "à";
    }
    else if(props.action.action == "Child") {
      actionPre = "ajouté";
      actionPost = "à la collection";
    }
    else if(props.action.action == "OriginalSource") {
      actionPre = "indiqué que";
      actionPost = "provient de";
    }
    else if(props.action.action == "ScaleData") {
      actionPre = "ajouté l'étalon";
      actionPost = "à";
    }
    else if(props.action.action == "Link") {
      actionPre = "relié";
      actionPost = "à";
    }
    else if(props.action.action == "Membership") {
      actionPre = "été ajouté au groupe";
    }
    else if(props.action.action == "Path") {
      actionPre = "crée le chemin";
      actionPost = "sur";
    }
    else if(props.action.action == "Point") {
      actionPre = "crée le point";
      actionPost = "sur";
    }
    else if(props.action.action == "Region") {
      actionPre = "crée la zone";
      actionPost = "sur";
    }
    else if(props.action.action == "Comment") {
      actionPre = "ajouté le commentaire";
      actionPost = "à";
    }
    else if(props.action.action == "Coordinates") {
      actionPre = "indiqué des coordonnées";
      actionPost = "sur";
    }
    else if(props.action.action == "Determination") {
      actionPre = "ajouté la détermination";
      actionPost = "à";
    }
    else if(props.action.action == "Measurement") {
      actionPre = "mesuré";
      //actionPost = "sur";
    }
    else if(props.action.action == "Message") {
      actionPre = "ajouté le message";
      actionPost = "à";
    }
    else if(props.action.action == "Transcription") {
      actionPre = "a transcrit";
      actionPost = "de";
    }
    else if(props.action.action == "VernacularName") {
      actionPre = "indiqué l'appellation vernaculaire";
      actionPost = "de";
    }
    else {
      console.error("Action type not handled in code " + action);
    }

    this.state = {
      actor: user,
      actorVerb: userVerb,
      actionPre: actionPre,
      actionPost: actionPost,
      data: props.action.data,
      target: props.action.target,
      date: new Date(props.action.date),
      actorMetadata: '',
      dataMetadata: '',
      targetMetadata: ''
    };
  }

  getUserMetadata() {
    request.get(conf.actions.databaseActions.getData)
      .query({id: this.props.action.user})
    .withCredentials()
    .end((err, res) => {
      if(err) {
        console.error(err);
      }
      else {
        var response = JSON.parse(res.text);
        var dataTable = "<table class='ui celled table'><tbody>";
        Object.keys(response).forEach(function(key) {
          dataTable = dataTable + "<tr><td class='ui cell'>" + key + "</td><td class='ui cell'>" + response[key] + "</td></tr>";
        });
        dataTable = dataTable + "</tbody></table>";

        this.setState({actorMetadata: dataTable});
      }
    });
  }

  getDataMetadata() {
    request.get(conf.actions.databaseActions.getData)
      .query({id: this.props.action.data})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
        }
        else {
          var response = JSON.parse(res.text);
          var dataTable = "<table class='ui celled table'><tbody>";
          Object.keys(response).forEach(function(key) {
            dataTable = dataTable + "<tr><td class='ui cell'>" + key + "</td><td class='ui cell'>" + response[key] + "</td></tr>";
          });
          dataTable = dataTable + "</tbody></table>";

          var display = "objet sans nom";
          if(response.name) {
            display = response.name;
          }
          if(response.text) {
            display = response.text;
          }

          this.setState({data: display, dataMetadata: dataTable});
        }
      });
  }

  getTargetMetadata() {
    request.get(conf.actions.databaseActions.getData)
      .query({id: this.props.action.target})
      .withCredentials()
      .end((err, res) => {
        if(err) {
          console.error(err);
        }
        else {
          var response = JSON.parse(res.text);
          var dataTable = "<table class='ui celled table'><tbody>";
          Object.keys(response).forEach(function(key) {
            dataTable = dataTable + "<tr><td class='ui cell'>" + key + "</td><td class='ui cell'>" + response[key] + "</td></tr>";
          });
          dataTable = dataTable + "</tbody></table>";

          var display = "objet sans nom";
          if(response.name) {
            display = response.name;
          }
          if(response.text) {
            display = response.text;
          }
          this.setState({target: display, targetMetadata: dataTable});
        }
      });
  }

  componentDidMount() {
    // Start fetching data about entities from various services.
    if(this.props.action.user) {
      this.getUserMetadata();
    }
    if(this.props.action.data) {
      this.getDataMetadata();
    }
    if(this.props.action.target) {
      this.getTargetMetadata();
    }
  }

  componentDidUpdate() {
    $('.metadata', $(this.refs.self.getDOMNode())).popup();
  }

  toFrString(value, unit, suffix, date) {
    var langUnit = unit;
    if(unit == "hour") {
      if(value == 1) {
        langUnit = "heure";
      }
      else {
        langUnit = "heures";
      }
    }
    else if (unit == "second") {
      if(value == 1) {
        langUnit = "seconde";
      }
      else {
        langUnit = "secondes";
      }
    }
    else if (unit == "minute") {
      if(value == 1) {
        langUnit = "minute";
      }
      else {
        langUnit = "minutes";
      }
    }
    else if (unit == "day") {
      if(value == 1) {
        return "Hier"
      }
      else {
        langUnit = "jours";
      }
    }
    else if (unit == "week") {
      if(value == 1) {
        return "La semaine dernière"
      }
      else {
        langUnit = "semaines";
      }
    }
    else if (unit == "month") {
      if(value == 1) {
        return "Le mois dernier";
      }
      else {
        langUnit = "mois";
      }
    }
    else if (unit == "year") {
      if(value == 1) {
        return "L'année dernière";
      }
      else {
        langUnit = "ans";
      }
    }
    return "Il y a " + value + " " + langUnit;
  }

  render() {
    return(
      <div className='ui segment' ref="self">
        <p style={this.textStyle}>
          <TimeAgo date={this.state.date.getTime()} formatter={this.toFrString} /> <a className='metadata' data-html={this.state.actorMetadata}>{this.state.actor}</a> {this.state.actorVerb} {this.state.actionPre} <a className='metadata' data-html={this.state.dataMetadata}>{this.state.data}</a> {this.state.actionPost} <a className='metadata' data-html={this.state.targetMetadata}>{this.state.target}</a>
          </p>
        </div>
    );
  }
}

export default LabBookEntry;