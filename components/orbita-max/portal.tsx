'use client'

import { PortalProvider } from './src/context/PortalContext'
import App from './src/App'

export function OrbitaPortal() {
  return <PortalProvider><App /></PortalProvider>
}
