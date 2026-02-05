import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Satellite, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { spaceApi } from '../services/api';

export default function PassesPage() {
  const [location, setLocation] = useState({ lat: 47.6062, lon: -122.3321 }); // Bellevue, WA

  const { data: nextPass, isLoading } = useQuery({
    queryKey: ['next-iss-pass', location],
    queryFn: () => spaceApi.getNextISSPass(location.lat, location.lon),
  });

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
          <div className="flex items-center space-x-2 mb-4">
            <MapPin className="w-5 h-5 text-space-400" />
            <h2 className="text-lg font-semibold text-white">Your Location</h2>
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
        </div>

        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Finding next ISS pass...</div>
        ) : nextPass ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-8 rounded-2xl bg-gradient-to-br from-space-600/20 to-aurora-600/20 border border-space-500/30"
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
        ) : (
          <div className="text-center text-slate-400 py-12">
            No upcoming passes found for this location.
          </div>
        )}
      </div>
    </div>
  );
}
