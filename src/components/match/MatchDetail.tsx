import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Match {
  id: string;
  team_1: string;
  team_2: string;
  overs: number;
  status: string;
  created_at: string;
}

interface Player {
  id: string;
  name: string;
  team: string;
  is_batsman: boolean;
  is_bowler: boolean;
}

interface Ball {
  id: string;
  runs: number;
  extra_type: string | null;
  is_wicket: boolean;
  batsman_id: string | null;
  bowler_id: string | null;
  created_at: string;
}

export const MatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [balls, setBalls] = useState<Ball[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchMatchData();
    }
  }, [id]);

  const fetchMatchData = async () => {
    try {
      // Fetch match details
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();
      
      if (matchError) throw matchError;
      setMatch(matchData);

      // Fetch players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('match_id', id);
      
      if (playersError) throw playersError;
      setPlayers(playersData || []);

      // Fetch balls
      const { data: ballsData, error: ballsError } = await supabase
        .from('balls')
        .select('*')
        .eq('match_id', id)
        .order('created_at', { ascending: true });
      
      if (ballsError) throw ballsError;
      setBalls(ballsData || []);

    } catch (error: any) {
      toast.error("Failed to fetch match data");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const updateMatchStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setMatch(prev => prev ? { ...prev, status: newStatus } : null);
      toast.success(`Match ${newStatus}`);
    } catch (error: any) {
      toast.error("Failed to update match status");
    }
  };

  const calculateScore = (team: string) => {
    const teamBalls = balls.filter(ball => {
      const player = players.find(p => p.id === ball.batsman_id);
      return player?.team === team;
    });
    
    const runs = teamBalls.reduce((total, ball) => total + ball.runs, 0);
    const wickets = teamBalls.filter(ball => ball.is_wicket).length;
    const ballsPlayed = teamBalls.length;
    
    return { runs, wickets, balls: ballsPlayed };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading match data...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Match not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const team1Score = calculateScore(match.team_1);
  const team2Score = calculateScore(match.team_2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-primary">
              {match.team_1} vs {match.team_2}
            </h1>
            <p className="text-muted-foreground">
              {match.overs} Overs • {new Date(match.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge className={match.status === 'live' ? 'bg-destructive' : 'bg-muted'}>
            {match.status === 'live' ? '🔴 LIVE' : match.status.toUpperCase()}
          </Badge>
        </div>

        {/* Match Controls */}
        <div className="flex gap-4 mb-8">
          {match.status === 'scheduled' && (
            <Button onClick={() => updateMatchStatus('live')} className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Start Match
            </Button>
          )}
          {match.status === 'live' && (
            <>
              <Button onClick={() => navigate(`/score/${id}`)} className="flex items-center gap-2">
                🏏 Live Scoring
              </Button>
              <Button 
                variant="outline" 
                onClick={() => updateMatchStatus('completed')}
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
                End Match
              </Button>
            </>
          )}
          <Button 
            variant="outline" 
            onClick={() => navigate(`/match/${id}/players`)}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Manage Players ({players.length})
          </Button>
        </div>

        {/* Scoreboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {match.team_1}
                <Badge variant="outline">Team 1</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {team1Score.runs}/{team1Score.wickets}
                </div>
                <div className="text-muted-foreground">
                  {Math.floor(team1Score.balls / 6)}.{team1Score.balls % 6} overs
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {match.team_2}
                <Badge variant="outline">Team 2</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {team2Score.runs}/{team2Score.wickets}
                </div>
                <div className="text-muted-foreground">
                  {Math.floor(team2Score.balls / 6)}.{team2Score.balls % 6} overs
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Players
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate(`/match/${id}/players`)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Players
              </Button>
            </CardTitle>
            <CardDescription>
              {players.length} players registered for this match
            </CardDescription>
          </CardHeader>
          <CardContent>
            {players.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No players added yet</p>
                <Button 
                  onClick={() => navigate(`/match/${id}/players`)}
                  className="mt-4"
                >
                  Add Players
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-3">{match.team_1}</h4>
                  <div className="space-y-2">
                    {players.filter(p => p.team === match.team_1).map(player => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{player.name}</span>
                        <div className="flex gap-1">
                          {player.is_batsman && <Badge variant="outline" className="text-xs">BAT</Badge>}
                          {player.is_bowler && <Badge variant="outline" className="text-xs">BOWL</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">{match.team_2}</h4>
                  <div className="space-y-2">
                    {players.filter(p => p.team === match.team_2).map(player => (
                      <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <span>{player.name}</span>
                        <div className="flex gap-1">
                          {player.is_batsman && <Badge variant="outline" className="text-xs">BAT</Badge>}
                          {player.is_bowler && <Badge variant="outline" className="text-xs">BOWL</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};