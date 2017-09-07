/**
 * Application runner.
 */

'use strict';

import Window from './Window';
import React from 'react';

document.body.style.margin = '0px';
document.body.style.position = 'relative';
document.body.style.boxSizing = 'border-box';
document.body.style.minHeight = '100%';
document.body.style.maxHeight = '100%';
document.body.style.color = '#3E3E3E';
document.body.style.padding = '0px';
document.body.style.height = '99vh';
document.body.style.width = '100%';
document.body.style.overflow = 'hidden';
document.body.style.fontFamily = 'Roboto Condensed';
document.body.style.fontWeight = '300';
React.render(<Window/>, document.getElementById('appContainer'));
