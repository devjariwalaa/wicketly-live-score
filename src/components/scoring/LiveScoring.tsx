import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Player {
  id: string;
  name: string;
  team: string;
  is_batsman: boolean;
  is_bowler: boolean;
}

interface Match {
  id: string;
  team_1: string;
  team_2: string;
  overs: number;
  status: string;
}

export const LiveScoring = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedBatsman, setSelectedBatsman] = useState("");
  const [selectedBowler, setSelectedBowler] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single();
      
      if (matchError) throw matchError;
      setMatch(matchData);

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('match_id', id);
      
      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error: any) {
      toast.error("Failed to fetch match data");
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const recordBall = async (runs: number, isWicket: boolean = false, extraType: string | null = null) => {
    if (!selectedBatsman || !selectedBowler) {
      toast.error("Please select batsman and bowler");
      return;
    }

    try {
      const { error } = await supabase
        .from('balls')
        .insert({
          match_id: id,
          batsman_id: selectedBatsman,
          bowler_id: selectedBowler,
          runs: runs,
          is_wicket: isWicket,
          extra_type: extraType
        });
      
      if (error) throw error;
      
      toast.success(`${runs} run${runs !== 1 ? 's' : ''} recorded${isWicket ? ' - Wicket!' : ''}`);
    } catch (error: any) {
      toast.error("Failed to record ball");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading scoring interface...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Match not found</h2>
          <Button onClick={() => navigate('/')} className="mt-4">Go Home</Button>
        </div>
      </div>
    );
  }

  const batsmen = players.filter(p => p.is_batsman);
  const bowlers = players.filter(p => p.is_bowler);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={() => navigate(`/match/${id}`)}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">🔴 Live Scoring</h1>
            <p className="text-muted-foreground">
              {match.team_1} vs {match.team_2}
            </p>
          </div>
        </div>

        {/* Player Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Current Batsman</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBatsman} onValueChange={setSelectedBatsman}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batsman" />
                </SelectTrigger>
                <SelectContent>
                  {batsmen.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.team})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Bowler</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBowler} onValueChange={setSelectedBowler}>
                <SelectTrigger>
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {bowlers.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.team})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Buttons */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Score Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 mb-6">
              {[0, 1, 2, 3, 4, 6].map(runs => (
                <Button
                  key={runs}
                  onClick={() => recordBall(runs)}
                  className={`h-16 text-xl font-bold ${
                    runs === 4 ? 'bg-blue-600 hover:bg-blue-700' : 
                    runs === 6 ? 'bg-green-600 hover:bg-green-700' : ''
                  }`}
                  disabled={!selectedBatsman || !selectedBowler}
                >
                  {runs}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="destructive"
                onClick={() => recordBall(0, true)}
                className="h-12 text-lg font-semibold"
                disabled={!selectedBatsman || !selectedBowler}
              >
                🏏 Wicket
              </Button>
              <Button
                variant="outline"
                onClick={() => recordBall(1, false, 'wide')}
                className="h-12 text-lg"
                disabled={!selectedBatsman || !selectedBowler}
              >
                Wide Ball
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" onClick={() => navigate(`/match/${id}`)}>
                View Full Scorecard
              </Button>
              <Button variant="outline" onClick={() => recordBall(0, false, 'no_ball')}>
                No Ball
              </Button>
              <Button variant="outline" onClick={() => recordBall(0, false, 'bye')}>
                Bye
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>🏏 <strong>Instructions:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Select the current batsman and bowler before scoring</li>
                <li>Click the run buttons to record runs scored</li>
                <li>Use the "Wicket" button when a player gets out</li>
                <li>Wide balls and no balls automatically add extra runs</li>
                <li>All scoring is recorded in real-time</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};