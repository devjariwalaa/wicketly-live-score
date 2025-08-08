import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Match {
  id: string;
  team_1: string;
  team_2: string;
  overs: number;
  status: string;
  created_at: string;
}

export const Dashboard = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMatches(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch matches");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-destructive';
      case 'completed': return 'bg-muted';
      case 'scheduled': return 'bg-primary';
      default: return 'bg-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'live': return '🔴';
      case 'completed': return '✅';
      case 'scheduled': return '⏰';
      default: return '📅';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary">🏏 Wicketly</h1>
            <p className="text-muted-foreground mt-2">Live Cricket Scoring Dashboard</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => navigate('/create-match')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Match
            </Button>
            <Button variant="outline" onClick={() => navigate('/players')} className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{matches.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
              <Play className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {matches.filter(m => m.status === 'live').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {matches.filter(m => m.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {matches.filter(m => m.status === 'scheduled').length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matches Grid */}
        <div>
          <h2 className="text-2xl font-semibold mb-6">Recent Matches</h2>
          {matches.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No matches yet</h3>
                <p className="text-muted-foreground mb-4">Create your first cricket match to get started!</p>
                <Button onClick={() => navigate('/create-match')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Match
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => (
                <Card key={match.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {match.team_1} vs {match.team_2}
                      </CardTitle>
                      <Badge className={getStatusColor(match.status)}>
                        {getStatusIcon(match.status)} {match.status.toUpperCase()}
                      </Badge>
                    </div>
                    <CardDescription>
                      {match.overs} overs • {new Date(match.created_at).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Match ID: {match.id.slice(0, 8)}...
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/match/${match.id}`)}
                        variant={match.status === 'live' ? 'default' : 'outline'}
                      >
                        {match.status === 'live' ? 'Score Live' : 'View Match'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};