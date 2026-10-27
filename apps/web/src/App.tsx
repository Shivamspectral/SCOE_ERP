import { PortalProvider } from './orbita/context/PortalContext';
import OrbitaApp from './orbita/App.jsx';

export default function App() {
  return <PortalProvider><OrbitaApp /></PortalProvider>;
}
