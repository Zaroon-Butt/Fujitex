module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 56) auto-includes the expo-router and
    // react-native-worklets/reanimated transforms — no manual plugin needed.
    presets: ['babel-preset-expo'],
  };
};
