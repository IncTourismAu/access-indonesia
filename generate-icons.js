const iconGen = require('icon-gen');
const path = require('path');

iconGen('Access-Bali-Hotels.png', path.resolve(__dirname, 'assets'), {
  report: true,
  modes: ['icns', 'ico'],
  names: {
    icns: 'icon',
    ico: 'icon'
  }
}).then(() => {
  console.log('✅ Icons generated in ./assets');
}).catch(err => {
  console.error('❌ Error generating icons:', err);
});
