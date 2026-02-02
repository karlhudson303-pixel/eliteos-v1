import React, { useState } from 'react';
import {
  Brain,
  Heart,
  AlertTriangle,
  Shield,
  Lightbulb,
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  BookOpen,
  CheckCircle2,
  Clock,
  Flame,
} from 'lucide-react';
import { MindsetLog, Trade } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';

interface PsychologyProps {
  mindsetLogs: MindsetLog[];
  trades: Trade[];
  onAddMindsetLog: (log: Omit<MindsetLog, 'id' | 'logged_at'>) => void;
}

const emotions = [
  { name: 'Confident', color: 'emerald', icon: Shield },
  { name: 'Calm', color: 'blue', icon: Heart },
  { name: 'Focused', color: 'amber', icon: Target },
  { name: 'Anxious', color: 'yellow', icon: AlertTriangle },
  { name: 'FOMO', color: 'orange', icon: Zap },
  { name: 'Greedy', color: 'red', icon: TrendingUp },
  { name: 'Fearful', color: 'purple', icon: AlertTriangle },
  { name: 'Frustrated', color: 'red', icon: TrendingDown },
  { name: 'Disciplined', color: 'emerald', icon: Shield },
  { name: 'Neutral', color: 'slate', icon: Brain },
];

const cognitiveBiases = [
  { name: 'Confirmation Bias', description: 'Seeking info that confirms your beliefs' },
  { name: 'Loss Aversion', description: 'Fear of losses outweighs desire for gains' },
  { name: 'Overconfidence', description: 'Overestimating your abilities' },
  { name: 'Recency Bias', description: 'Overweighting recent events' },
  { name: 'Anchoring', description: 'Fixating on initial price points' },
  { name: 'Sunk Cost Fallacy', description: 'Holding losers because of past investment' },
  { name: 'Gambler\'s Fallacy', description: 'Believing past events affect future odds' },
  { name: 'Hindsight Bias', description: 'Believing you "knew it all along"' },
];

const copingStrategies = [
  'Take a 5-minute break',
  'Review trading plan',
  'Practice deep breathing',
  'Step away from screens',
  'Journal your thoughts',
  'Physical exercise',
  'Meditation',
  'Talk to accountability partner',
  'Review past wins',
  'Reduce position size',
];

const Psychology: React.FC<PsychologyProps> = ({
  mindsetLogs,
  trades,
  onAddMindsetLog,
}) => {
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInType, setCheckInType] = useState<'daily_checkin' | 'pre_trade' | 'post_trade'>('daily_checkin');
  
  const [newLog, setNewLog] = useState({
    user_id: 'user-1',
    log_type: 'daily_checkin' as MindsetLog['log_type'],
    emotion: 'Neutral',
    intensity: 5,
    triggers: [] as string[],
    coping_strategies: [] as string[],
    cognitive_biases: [] as string[],
    notes: '',
  });

  // Analyze emotion patterns from trades
  const emotionAnalysis = trades.reduce((acc, trade) => {
    const emotion = trade.pre_trade_emotion || 'Unknown';
    if (!acc[emotion]) {
      acc[emotion] = { count: 0, wins: 0, totalPnL: 0, avgDiscipline: 0 };
    }
    acc[emotion].count++;
    if ((trade.profit_loss || 0) > 0) acc[emotion].wins++;
    acc[emotion].totalPnL += trade.profit_loss || 0;
    acc[emotion].avgDiscipline += trade.discipline_score || 5;
    return acc;
  }, {} as Record<string, { count: number; wins: number; totalPnL: number; avgDiscipline: number }>);

  // Calculate averages
  Object.keys(emotionAnalysis).forEach(key => {
    emotionAnalysis[key].avgDiscipline /= emotionAnalysis[key].count;
  });

  // Best and worst emotional states for trading
  const sortedEmotions = Object.entries(emotionAnalysis)
    .filter(([_, data]) => data.count >= 2)
    .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count));

  const bestEmotions = sortedEmotions.slice(0, 3);
  const worstEmotions = sortedEmotions.slice(-3).reverse();

  // Recent mindset logs
  const recentLogs = mindsetLogs.slice(0, 10);

  // Today's check-ins
  const today = new Date().toDateString();
  const todayLogs = mindsetLogs.filter(log => new Date(log.logged_at).toDateString() === today);

  const handleAddLog = () => {
    onAddMindsetLog(newLog);
    setNewLog({
      user_id: 'user-1',
      log_type: 'daily_checkin',
      emotion: 'Neutral',
      intensity: 5,
      triggers: [],
      coping_strategies: [],
      cognitive_biases: [],
      notes: '',
    });
    setIsCheckInOpen(false);
  };

  const openCheckIn = (type: 'daily_checkin' | 'pre_trade' | 'post_trade') => {
    setCheckInType(type);
    setNewLog({ ...newLog, log_type: type });
    setIsCheckInOpen(true);
  };

  const toggleArrayItem = (array: string[], item: string, setter: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setter(array.filter(i => i !== item));
    } else {
      setter([...array, item]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Psychology Center</h1>
          <p className="text-slate-400 mt-1">Master your mind, master the markets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => openCheckIn('pre_trade')}
            leftIcon={<TrendingUp className="w-4 h-4" />}
          >
            Pre-Trade
          </Button>
          <Button
            onClick={() => openCheckIn('daily_checkin')}
            leftIcon={<Brain className="w-4 h-4" />}
          >
            Daily Check-In
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Brain className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Today's Check-ins</span>
          </div>
          <p className="text-3xl font-black text-white">{todayLogs.length}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Best State</span>
          </div>
          <p className="text-xl font-bold text-white">
            {bestEmotions[0]?.[0] || 'N/A'}
          </p>
          {bestEmotions[0] && (
            <p className="text-xs text-slate-500">
              {((bestEmotions[0][1].wins / bestEmotions[0][1].count) * 100).toFixed(0)}% win rate
            </p>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-red-500 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Avoid State</span>
          </div>
          <p className="text-xl font-bold text-white">
            {worstEmotions[0]?.[0] || 'N/A'}
          </p>
          {worstEmotions[0] && (
            <p className="text-xs text-slate-500">
              {((worstEmotions[0][1].wins / worstEmotions[0][1].count) * 100).toFixed(0)}% win rate
            </p>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 text-purple-500 mb-2">
            <Lightbulb className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider">Total Logs</span>
          </div>
          <p className="text-3xl font-black text-white">{mindsetLogs.length}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Performance Analysis */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-amber-500" />
            Emotion Performance Analysis
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {Object.entries(emotionAnalysis).length > 0 ? (
              Object.entries(emotionAnalysis)
                .sort((a, b) => b[1].count - a[1].count)
                .map(([emotion, data]) => {
                  const winRate = (data.wins / data.count) * 100;
                  const emotionConfig = emotions.find(e => e.name === emotion);
                  return (
                    <div key={emotion} className="p-4 bg-slate-700/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {emotionConfig && <emotionConfig.icon className="w-4 h-4 text-slate-400" />}
                          <span className="font-medium text-white">{emotion}</span>
                        </div>
                        <span className="text-xs text-slate-500">{data.count} trades</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className={`text-sm font-bold ${winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {winRate.toFixed(0)}%
                          </p>
                          <p className="text-xs text-slate-500">Win Rate</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${data.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            ${data.totalPnL.toFixed(0)}
                          </p>
                          <p className="text-xs text-slate-500">Total P&L</p>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${data.avgDiscipline >= 7 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {data.avgDiscipline.toFixed(1)}
                          </p>
                          <p className="text-xs text-slate-500">Discipline</p>
                        </div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Log trades with emotions to see analysis</p>
              </div>
            )}
          </div>
        </div>

        {/* Cognitive Bias Awareness */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Cognitive Bias Awareness
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {cognitiveBiases.map((bias) => (
              <div key={bias.name} className="p-3 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors">
                <p className="text-sm font-medium text-white">{bias.name}</p>
                <p className="text-xs text-slate-400 mt-1">{bias.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Check-ins */}
        <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Recent Check-ins
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {recentLogs.length > 0 ? recentLogs.map((log) => (
              <div key={log.id} className="p-4 bg-slate-700/30 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      log.log_type === 'pre_trade' ? 'bg-blue-500/20 text-blue-400' :
                      log.log_type === 'post_trade' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {log.log_type.replace('_', ' ')}
                    </span>
                    <span className="text-sm font-medium text-white">{log.emotion}</span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(log.logged_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-400">Intensity:</span>
                  <div className="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        (log.intensity || 5) <= 3 ? 'bg-emerald-500' :
                        (log.intensity || 5) <= 6 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${((log.intensity || 5) / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{log.intensity}/10</span>
                </div>
                {log.notes && (
                  <p className="text-xs text-slate-400 italic">"{log.notes}"</p>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-slate-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No check-ins yet</p>
                <p className="text-xs mt-1">Start tracking your mental state</p>
              </div>
            )}
          </div>
        </div>

        {/* Trading Rules & Affirmations */}
        <div className="bg-gradient-to-br from-amber-900/30 to-slate-800/50 rounded-2xl p-6 border border-amber-500/20">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            Trading Rules & Affirmations
          </h3>
          <div className="space-y-3">
            {[
              'I only trade setups that match my criteria',
              'I accept losses as part of the process',
              'I follow my trading plan without deviation',
              'I manage risk before seeking reward',
              'I am patient and wait for high-probability setups',
              'I review every trade to improve',
              'I control my emotions, they don\'t control me',
              'I am becoming an elite, disciplined trader',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{rule}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Check-in Modal */}
      <Modal
        isOpen={isCheckInOpen}
        onClose={() => setIsCheckInOpen(false)}
        title={
          checkInType === 'pre_trade' ? 'Pre-Trade Check-in' :
          checkInType === 'post_trade' ? 'Post-Trade Check-in' :
          'Daily Mindset Check-in'
        }
        size="lg"
      >
        <div className="space-y-6">
          {/* Current Emotion */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              How are you feeling right now?
            </label>
            <div className="grid grid-cols-5 gap-2">
              {emotions.map((emotion) => (
                <button
                  key={emotion.name}
                  onClick={() => setNewLog({ ...newLog, emotion: emotion.name })}
                  className={`p-3 rounded-xl text-center transition-all ${
                    newLog.emotion === emotion.name
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <emotion.icon className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-xs font-medium">{emotion.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Intensity */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Emotional Intensity: {newLog.intensity}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={newLog.intensity}
              onChange={(e) => setNewLog({ ...newLog, intensity: parseInt(e.target.value) })}
              className="w-full accent-amber-500"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Mild</span>
              <span>Moderate</span>
              <span>Intense</span>
            </div>
          </div>

          {/* Cognitive Biases */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Any cognitive biases you're noticing?
            </label>
            <div className="flex flex-wrap gap-2">
              {cognitiveBiases.map((bias) => (
                <button
                  key={bias.name}
                  onClick={() => toggleArrayItem(
                    newLog.cognitive_biases,
                    bias.name,
                    (arr) => setNewLog({ ...newLog, cognitive_biases: arr })
                  )}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    newLog.cognitive_biases.includes(bias.name)
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {bias.name}
                </button>
              ))}
            </div>
          </div>

          {/* Coping Strategies */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Coping strategies to use:
            </label>
            <div className="flex flex-wrap gap-2">
              {copingStrategies.map((strategy) => (
                <button
                  key={strategy}
                  onClick={() => toggleArrayItem(
                    newLog.coping_strategies,
                    strategy,
                    (arr) => setNewLog({ ...newLog, coping_strategies: arr })
                  )}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    newLog.coping_strategies.includes(strategy)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800/50 text-slate-400 hover:text-white'
                  }`}
                >
                  {strategy}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Additional thoughts
            </label>
            <textarea
              value={newLog.notes}
              onChange={(e) => setNewLog({ ...newLog, notes: e.target.value })}
              placeholder="What's on your mind? Any triggers or observations?"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setIsCheckInOpen(false)} fullWidth>
              Cancel
            </Button>
            <Button onClick={handleAddLog} fullWidth>
              Log Check-in
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Psychology;
