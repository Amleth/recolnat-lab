/**
 * Created by dmitri on 16/02/16.
 */
'use strict';

import React from 'react';

import AbstractMetadataDisplay from './AbstractManagerMetadataDisplay';

class RecolnatSheetMetadataDisplay extends AbstractMetadataDisplay {
  constructor(props) {
    super(props);
  }

  initialState() {
    return {
      source: null,
      name: null,
      species: null,
      harvester: null,
      harvestLocation: null,
      collection: null,
      linkToExplore: null
    };
  }


}