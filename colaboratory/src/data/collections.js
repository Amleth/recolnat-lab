/**
 * Created by dmitri on 01/04/15.
 */

export default [
  {
    id: 'root',
    containsIds: ['1','2'],
    type: 'root',
    name: 'collections'
  },
  {
    id: '1',
    parentIds: ['root'],
    containsIds: ['11', '12', '13', 'ficus1', 'ficus5'],
    type: 'bag',
    name: 'collection printemps'
  },
  {
    id: '2',
    parentIds: ['root'],
    containsIds: ['21', '22', '12', 'ficus2', 'ficus5'],
    type: 'bag',
    name: 'collection été'
  },
  {
    id: '11',
    parentIds: ['1', '21'],
    containsIds: ['ficus5', '21'],
    type: 'bag',
    name: 'poissons d\'avril'
  },
  {
    id: '12',
    parentIds: ['1', '2'],
    containsIds: ['ficus3'],
    type: 'bag',
    name: 'poissons de mai'
  },
  {
    id: '13',
    parentIds: ['1'],
    containsIds: ['ficus3', 'ficus4'],
    type: 'bag',
    name: 'les autres poissons dont je ne savais pas quoi faire'
  },
  {
    id: '21',
    parentIds: ['2', '11'],
    containsIds: ['ficus1', 'ficus4', 'ficus5', '11'],
    type: 'bag',
    name: 'les sanglots longs des violons de l\'automne'
  },
  {
    id: '22',
    parentIds: ['2'],
    containsIds: ['ficus1'],
    type: 'bag',
    name: 'blessent mon coeur d\'une langueur monotone'
  },
  {
    name: 'Ficus da Gagnep',
    url: 'http://dsiphoto.mnhn.fr/sonnera2/LAPI/scanR/R20130424/P06875744.jpg',
    reColNatID: 'B916E509EC6A462AB242FC65017213D6',
    catalogNum: 'P06875744',
    type: 'item',
    id: 'ficus1',
    parentIds: ['1','21', '22']
  },
  {
    name: 'Ficus oligodon',
    url: 'http://sonneratphoto.mnhn.fr/2012/11/13/1/P06879807.jpg',
    reColNatID: '12F406B96C424911A429E52EFCDE8600',
    catalogNum: 'P06879807',
    type: 'item',
    id: 'ficus2',
    parentIds: ['2']
  },
  {
    name: 'Ficus capreifolia',
    url: 'http://sonneratphoto.mnhn.fr/2012/11/12/1/P06760858.jpg',
    reColNatID: '769C54AF12D9485092E0FED190648980',
    catalogNum: ' P06760858',
    type: 'item',
    id: 'ficus3',
    parentIds: ['13', '12']
  },
  {
    name: 'Ficus leucantatoma',
    url: 'http://sonneratphoto.mnhn.fr/2012/11/12/4/P06762660.jpg',
    reColNatID: 'F635DC08762949FDAB4D8568F19F87C2',
    catalogNum: 'P06762660',
    type: 'item',
    id: 'ficus4',
    parentIds: ['13', '21']
  },
  {
    name: 'Ficus carica',
    url: 'http://sonneratphoto.mnhn.fr/2012/11/08/7/P06862730.jpg',
    reColNatID: '7F5F0DF3549C44CCB219387EFBA74870',
    catalogNum: 'P06862730',
    type: 'item',
    id: 'ficus5',
    parentIds: ['1', '2', '11', '21']
  }

];
