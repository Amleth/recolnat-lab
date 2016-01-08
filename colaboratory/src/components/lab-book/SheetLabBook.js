/**
 * Created by dmitri on 04/12/15.
 */
'use strict';

import React from 'react';

import LabBook from './LabBook';

class SheetLabBook extends LabBook {
  constructor(props) {
    super(props);

    this.title = "Cahier de laboratoire de la planche active";
  }
}

export default SheetLabBook;