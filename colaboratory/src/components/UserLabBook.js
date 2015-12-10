/**
 * Created by dmitri on 04/12/15.
 */
'use strict';

import React from 'react';
import LabBook from './LabBook';

class UserLabBook extends LabBook {
  constructor(props) {
    super(props);

    this.title = "Cahier de laboratoire personnel";
  }
}

export default UserLabBook;