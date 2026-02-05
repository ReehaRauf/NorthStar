import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CloudSun, AlertTriangle, Activity, Zap } from 'lucide-react';
import { spaceApi } from '../services/api';
import { format } from 'date-fns';

function RiskBadge({ risk }) {
  const colors = {
    none: 'bg-aurora-500/20 text-aurora-300 border-aurora-500/30',
    minor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    moderate: 'bg-solar-500/20 text-solar-300 border-solar-500/30',
    high: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colors[risk] || colors.none}`}>
      {risk}
    </span>
  );
}

export default function SpaceWeatherPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['space-weather'],
    queryFn: spaceApi.getSpaceWeather,
    refetchInterval: 300000, // 5 minutes
  });

  const { data: impact } = useQuery({
    queryKey: ['space-weather-impact'],
    queryFn: spaceApi.getImpactExplanation,
    enabled: !!data,
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-display font-bold text-white mb-2">Space Weather</h1>
          <p className="text-slate-400">Real-time solar activity and geomagnetic conditions</p>
        </motion.div>

        {isLoading ? (
          <div className="text-center text-slate-400 py-12">Loading space weather data...</div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300">
            Failed to load space weather data. Please try again later.
          </div>
        ) : (
          <>
            {/* Status Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-solar-600/20 to-space-600/20 border border-solar-500/30"
            >
              <div className="flex items-start space-x-4 mb-4">
                <CloudSun className="w-10 h-10 text-solar-400 flex-shrink-0" />
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">Current Status</h2>
                  <p className="text-lg text-white/90">{data.summary}</p>
                  <p className="text-sm text-slate-400 mt-2">
                    Last updated: {format(new Date(data.timestamp), 'PPp')}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Kp Index */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Activity className="w-6 h-6 text-space-400" />
                  <h3 className="text-lg font-semibold text-white">Kp Index</h3>
                </div>
                <p className="text-4xl font-bold text-white mb-2">{data.kp_current.toFixed(1)}</p>
                <p className="text-sm text-slate-400">Geomagnetic activity level</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Zap className="w-6 h-6 text-solar-400" />
                  <h3 className="text-lg font-semibold text-white">Solar Flares</h3>
                </div>
                <p className="text-4xl font-bold text-white mb-2">{data.recent_flares?.length || 0}</p>
                <p className="text-sm text-slate-400">In last 24 hours</p>
              </motion.div>
            </div>

            {/* Risk Levels */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 mb-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Impact Assessment</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">GPS Degradation</span>
                  <RiskBadge risk={data.gps_degradation_risk} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">HF Radio</span>
                  <RiskBadge risk={data.hf_radio_risk} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Satellite Operations</span>
                  <RiskBadge risk={data.satellite_risk} />
                </div>
              </div>
            </motion.div>

            {/* Impact Explanation */}
            {impact && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-aurora-500/10 border border-aurora-500/20"
              >
                <div className="flex items-center space-x-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-aurora-400" />
                  <h3 className="text-lg font-semibold text-white">What This Means</h3>
                </div>
                <p className="text-white/90 mb-4">{impact.actionable_guidance}</p>
                {impact.who_should_care?.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-aurora-500/20">
                    <p className="text-sm text-slate-400 mb-2">Who should pay attention:</p>
                    <div className="flex flex-wrap gap-2">
                      {impact.who_should_care.map((person, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-aurora-500/20 text-aurora-300 text-sm"
                        >
                          {person}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
