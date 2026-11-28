'use client';

import React from 'react';
import MarketplaceLandingPage from './pages/marketplace/page';

/**
 * ReNote Public-First Marketplace Homepage.
 * When anyone opens localhost:6000 or the main website URL, it directly
 * displays the Marketplace homepage without requiring authentication.
 */
export default function RootHomePage() {
  return <MarketplaceLandingPage />;
}
