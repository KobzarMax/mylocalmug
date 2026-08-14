import { registerRootComponent } from 'expo';

import App from './App';
import React from 'react';
import { LocalQueryProvider } from './src/lib/query/QueryProvider';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
function Root() {
  return React.createElement(LocalQueryProvider, null, React.createElement(App));
}

registerRootComponent(Root);
