// Learn more: https://docs.expo.dev/guides/customizing-metro/
//
// Default Expo Metro config. NOTE: this Expo app is nested inside the Fujitex
// web repo, which carries its own (different) copy of React. Metro resolves
// modules from the *closest* node_modules, and every file bundled here lives
// under mobile-app/, so the local react is always used — the parent's copy is
// never reached. expo-doctor's "duplicate react" warning is therefore a benign
// artifact of the folder layout, not a runtime issue.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

module.exports = config;
