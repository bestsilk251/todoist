import { registerRootComponent } from 'expo';
import App from './app/App';

// registerRootComponent wires the root component for both native and web,
// setting up AppRegistry so the app actually mounts. Without it the web
// bundle loads but renders a blank screen.
registerRootComponent(App);
