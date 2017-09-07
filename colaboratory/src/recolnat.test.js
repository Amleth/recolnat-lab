import {extractCatalogNumberFromUrl} from './recolnat';

test('Catalog number of url "http://sonneratphoto.mnhn.fr/2011/06/22/5/P03141823.jpg" should be "P03141823"', () => {
  expect(extractCatalogNumberFromUrl('http://sonneratphoto.mnhn.fr/2011/06/22/5/P03141823.jpg')).toBe('P03141823');
});