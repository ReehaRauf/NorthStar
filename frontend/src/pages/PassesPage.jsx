import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Satellite, MapPin, AlertCircle, Globe, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { spaceApi } from '../services/api';

export default function PassesPage() {
  const [location, setLocation] = useState({ lat: 47.6062, lon: -122.3321 }); // Bellevue, WA
  const [showISSPosition, setShowISSPosition] = useState(false);

  const { data: allPasses, isLoading } = useQuery({
    queryKey: ['overhead-satellites', location],
    queryFn: () => spaceApi.getOverheadSatellites(location.lat, location.lon, 0, 240, 0), // 10 days, 0° min
  });

  const { data: issPosition, isLoading: positionLoading } = useQuery({
    queryKey: ['iss-position'],
    queryFn: spaceApi.getISSPosition,
    enabled: showISSPosition,
    refetchInterval: 5000, // Update every 5 seconds
  });

  // Separate visible and non-visible passes
  const visiblePasses = allPasses?.filter(p => p.max_elevation >= 30) || [];
  const lowPasses = allPasses?.filter(p => p.max_elevation < 30 && p.max_elevation >= 10) || [];
  const nextPass = visiblePasses[0];

  // Nearby major cities to suggest
  const nearbyCities = [
    { name: 'Portland, OR', lat: 45.5152, lon: -122.6784 },
    { name: 'Vancouver, BC', lat: 49.2827, lon: -123.1207 },
    { name: 'San Francisco, CA', lat: 37.7749, lon: -122.4194 },
  ];

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-2">Satellite Passes</h1>
          <p className="text-slate-400">Track the ISS and satellites overhead</p>
        </motion.div>

        <div className="mb-8 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <MapPin className="w-5 h-5 text-space-400" />
              <h2 className="text-lg font-semibold text-white">Your Location</h2>
            </div>
            <button
              onClick={() => setShowISSPosition(!showISSPosition)}
              className="px-4 py-2 rounded-lg bg-space-600/30 hover:bg-space-600/50 text-white text-sm font-medium transition-all flex items-center space-x-2 border border-space-500/30"
            >
              <Globe className="w-4 h-4" />
              <span>{showISSPosition ? 'Hide' : 'Where is ISS Now?'}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="number"
              value={location.lat}
              onChange={(e) => setLocation({ ...location, lat: parseFloat(e.target.value) })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Latitude"
              step="0.0001"
            />
            <input
              type="number"
              value={location.lon}
              onChange={(e) => setLocation({ ...location, lon: parseFloat(e.target.value) })}
              className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
              placeholder="Longitude"
              step="0.0001"
            />
          </div>

          {/* ISS Current Position */}
          {showISSPosition && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-700"
            >
              {positionLoading ? (
                <div className="text-center text-slate-400 py-4">Locating ISS...</div>
              ) : issPosition ? (
                <div className="p-4 rounded-lg bg-space-600/10 border border-space-500/20">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">ISS Current Position</h3>
                    <span className="text-xs text-slate-400">
                      Updates every 5s
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-400">Latitude</p>
                      <p className="text-lg font-bold text-white">{issPosition.latitude.toFixed(4)}°</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Longitude</p>
                      <p className="text-lg font-bold text-white">{issPosition.longitude.toFixed(4)}°</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Altitude</p>
                      <p className="text-lg font-bold text-white">{issPosition.altitude_km.toFixed(0)} km</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">Time</p>
                      <p className="text-lg font-bold text-white">
                        {format(new Date(issPosition.timestamp), 'h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${issPosition.latitude},${issPosition.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center space-x-2 text-sm text-space-400 hover:text-space-300"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>View on Google Maps</span>
                  </a>
                </div>
              ) : null}
            </motion.div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Finding ISS passes...</div>
        ) : nextPass ? (
          <>
            {/* Next Good Pass */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-space-600/20 to-aurora-600/20 border border-space-500/30 mb-6"
            >
              <div className="flex items-center space-x-3 mb-6">
                <Satellite className="w-8 h-8 text-space-400" />
                <div>
                  <h2 className="text-2xl font-bold text-white">{nextPass.satellite_name}</h2>
                  <p className="text-slate-400">Next visible pass</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Start Time</h3>
                  <p className="text-xl font-bold text-white">
                    {format(new Date(nextPass.start_time), 'h:mm a')}
                  </p>
                  <p className="text-sm text-slate-500">{format(new Date(nextPass.start_time), 'PPPP')}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Max Elevation</h3>
                  <p className="text-xl font-bold text-white">{nextPass.max_elevation.toFixed(0)}°</p>
                  <p className="text-sm text-slate-500">Duration: {nextPass.duration_seconds}s</p>
                </div>

                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">Path</h3>
                  <p className="text-white">
                    {nextPass.start_azimuth}° → {nextPass.max_azimuth}° → {nextPass.end_azimuth}°
                  </p>
                </div>

                {nextPass.commentary && (
                  <div className="md:col-span-2 p-4 rounded-xl bg-aurora-500/10 border border-aurora-500/20">
                    <p className="text-aurora-200">{nextPass.commentary}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* All Upcoming Passes */}
            {visiblePasses.length > 1 && (
              <div className="mb-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-4">All Visible Passes (Next 10 Days)</h3>
                <div className="space-y-3">
                  {visiblePasses.slice(1).map((pass, idx) => (
                    <div key={idx} className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">
                            {format(new Date(pass.start_time), 'MMM dd, h:mm a')}
                          </p>
                          <p className="text-sm text-slate-400">Max elevation: {pass.max_elevation.toFixed(0)}°</p>
                        </div>
                        {pass.worth_watching && (
                          <span className="px-3 py-1 rounded-full bg-aurora-500/20 text-aurora-300 text-sm">
                            Worth watching
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* No Visible Passes - Show Detailed Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-solar-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">No Visible Passes</h3>
                  <p className="text-slate-300 mb-4">
                    The ISS won't pass high enough over your location in the next 10 days for good viewing. 
                    This is normal - the ISS orbit means some locations go weeks without high passes.
                  </p>
                  <p className="text-sm text-slate-400">
                    Viewing requires passes above 30° elevation for best results.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Low Elevation Passes */}
            {lowPasses.length > 0 && (
              <div className="mb-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                <h3 className="text-lg font-semibold text-white mb-2">Low Passes (Hard to See)</h3>
                <p className="text-sm text-slate-400 mb-4">
                  These passes are below 30° elevation - difficult to spot but technically overhead:
                </p>
                <div className="space-y-2">
                  {lowPasses.slice(0, 3).map((pass, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-700/50">
                      <div className="flex justify-between items-center">
                        <p className="text-slate-300">
                          {format(new Date(pass.start_time), 'MMM dd, h:mm a')}
                        </p>
                        <span className="text-sm text-slate-500">
                          {pass.max_elevation.toFixed(0)}° elevation
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Try Nearby Cities */}
            <div className="mb-6 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="flex items-center space-x-2 mb-4">
                <Navigation className="w-5 h-5 text-space-400" />
                <h3 className="text-lg font-semibold text-white">Try Nearby Locations</h3>
              </div>
              <p className="text-sm text-slate-400 mb-4">
                Check if nearby cities have better viewing opportunities:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {nearbyCities.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLocation({ lat: city.lat, lon: city.lon })}
                    className="p-3 rounded-lg bg-space-600/20 border border-space-500/30 hover:border-space-400 transition-all text-left"
                  >
                    <p className="text-white font-medium">{city.name}</p>
                    <p className="text-xs text-slate-400">
                      {city.lat.toFixed(2)}, {city.lon.toFixed(2)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* ISS Current Position Info */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-space-600/10 to-aurora-600/10 border border-space-500/20">
              <div className="flex items-center space-x-2 mb-3">
                <Globe className="w-5 h-5 text-space-400" />
                <h3 className="text-lg font-semibold text-white">About the ISS</h3>
              </div>
              <p className="text-slate-300 mb-2">
                The International Space Station orbits Earth every 90 minutes at ~400km altitude. 
                Its path shifts daily, so passes vary by location and season.
              </p>
              <p className="text-sm text-slate-400">
                Check back in a few days or try a different location! You can also check{' '}
                <a 
                  href="https://spotthestation.nasa.gov/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-space-400 hover:text-space-300 underline"
                >
                  NASA's Spot The Station
                </a>{' '}
                for alerts.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}