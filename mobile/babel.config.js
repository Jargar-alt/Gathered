const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'babel-plugin-module-resolver',
        {
          alias: {
            '@': path.resolve(__dirname),
            '@shared': path.resolve(__dirname, 'shared'),
          },
          extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
