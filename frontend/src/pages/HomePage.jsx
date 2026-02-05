import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Satellite, CloudSun, AlertTriangle, TrendingUp, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import { spaceApi } from '../services/api';

function StatusCard({ title, value, icon: Icon, status, description }) {
  const statusColors = {
    good: 'from-aurora-500/20 to-aurora-600/20 border-aurora-500/30',
    moderate: 'from-solar-500/20 to-solar-600/20 border-solar-500/30',
    warning: 'from-red-500/20 to-red-600/20 border-red-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative p-6 rounded-2xl bg-gradient-to-br ${statusColors[status]} border backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <Icon className="w-5 h-5 text-white/70" />
            <h3 className="text-sm font-medium text-white/70">{title}</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">{value}</p>
          <p className="text-sm text-white/60">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

function EventCard({ event }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-space-500/50 transition-all"
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-2 h-2 rounded-full bg-aurora-400 animate-pulse-slow" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-1">{event.title}</h4>
          <p className="text-sm text-slate-400 mb-2">{event.description}</p>
          <p className="text-xs text-slate-500">{format(new Date(event.timestamp), 'PPp')}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function HomePage() {
  const { data: spaceWeather, isLoading: weatherLoading } = useQuery({
    queryKey: ['space-weather'],
    queryFn: spaceApi.getSpaceWeather,
    refetchInterval: 300000, // 5 minutes
  });

  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['activity-feed'],
    queryFn: spaceApi.getTodayFeed,
    refetchInterval: 600000, // 10 minutes
  });

  // AI Summary query
  const { data: aiSummary, isLoading: summaryLoading } = useQuery({
    queryKey: ['ai-daily-summary', spaceWeather],
    queryFn: async () => {
      if (!spaceWeather) return null;
      
      const summary = await spaceApi.query(
        `Give me a brief, engaging 2-3 sentence summary of today's space conditions. Current Kp: ${spaceWeather.kp_current}, GPS risk: ${spaceWeather.gps_degradation_risk}, recent flares: ${spaceWeather.recent_flares?.length || 0}. Make it conversational and interesting.`,
        null,
        true,
        'quick'
      );
      return summary.response;
    },
    enabled: !!spaceWeather,
    staleTime: 600000, // 10 minutes
  });

  const getKpStatus = (kp) => {
    if (kp < 4) return 'good';
    if (kp < 6) return 'moderate';
    return 'warning';
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-6xl font-display font-bold text-white mb-4">
            What's Happening
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-space-400 to-aurora-400">
              Above Earth
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Real-time space intelligence • Satellite tracking • Space weather monitoring
          </p>
        </motion.div>

        {/* AI Daily Summary */}
        {!summaryLoading && aiSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-space-600/20 to-aurora-600/20 border border-space-500/30"
          >
            <div className="flex items-start space-x-3">
              <Sparkles className="w-6 h-6 text-space-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-space-300 mb-2">AI Daily Briefing</h3>
                <p className="text-white text-lg leading-relaxed">{aiSummary}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {weatherLoading ? (
            <div className="col-span-3 text-center text-slate-400 py-12">
              Loading space weather data...
            </div>
          ) : (
            <>
              <StatusCard
                title="Geomagnetic Activity"
                value={`Kp ${spaceWeather?.kp_current?.toFixed(1) || '?'}`}
                icon={TrendingUp}
                status={getKpStatus(spaceWeather?.kp_current || 0)}
                description={spaceWeather?.summary || 'Checking status...'}
              />
              <StatusCard
                title="GPS Status"
                value={spaceWeather?.gps_degradation_risk || 'Unknown'}
                icon={Satellite}
                status={spaceWeather?.gps_degradation_risk === 'none' ? 'good' : 
                       spaceWeather?.gps_degradation_risk === 'minor' ? 'moderate' : 'warning'}
                description="Navigation accuracy"
              />
              <StatusCard
                title="Solar Activity"
                value={spaceWeather?.recent_flares?.length || 0}
                icon={CloudSun}
                status={spaceWeather?.recent_flares?.length > 0 ? 'moderate' : 'good'}
                description="Flares in last 24h"
              />
            </>
          )}
        </div>

        {/* Activity Feed */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-white">Today in Space</h2>
            <span className="text-sm text-slate-400">{format(new Date(), 'PPPP')}</span>
          </div>

          <div className="space-y-4">
            {feedLoading ? (
              <div className="text-center text-slate-400 py-8">Loading activity feed...</div>
            ) : feed?.events?.length > 0 ? (
              feed.events.map((event, idx) => (
                <EventCard key={event.event_id || idx} event={event} />
              ))
            ) : (
              <div className="text-center text-slate-400 py-8">
                <p>No notable events today. All quiet on the space front! 🌌</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-space-600/10 to-aurora-600/10 border border-space-500/20"
        >
          <h3 className="text-xl font-display font-bold text-white mb-4">Quick Start</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/passes"
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-space-500 transition-all group"
            >
              <Satellite className="w-8 h-8 text-space-400 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-white mb-1">Track Satellites</h4>
              <p className="text-sm text-slate-400">See what's passing overhead tonight</p>
            </a>
            <a
              href="/chat"
              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-aurora-500 transition-all group"
            >
              <AlertTriangle className="w-8 h-8 text-aurora-400 mb-2 group-hover:scale-110 transition-transform" />
              <h4 className="font-semibold text-white mb-1">Ask the Agent</h4>
              <p className="text-sm text-slate-400">Get space weather explanations</p>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}