import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const CreateMatch = () => {
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [overs, setOvers] = useState("20");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!team1 || !team2) {
      toast.error("Please enter both team names");
      return;
    }
    
    if (team1.toLowerCase() === team2.toLowerCase()) {
      toast.error("Team names must be different");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert({
          team_1: team1.trim(),
          team_2: team2.trim(),
          overs: parseInt(overs),
          status: 'scheduled'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success("Match created successfully!");
      navigate(`/match/${data.id}`);
    } catch (error: any) {
      toast.error("Failed to create match: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-primary">Create New Match</h1>
            <p className="text-muted-foreground">Set up a new cricket match</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Match Details</CardTitle>
            <CardDescription>
              Enter the team names and match format to create a new cricket match
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team 1</label>
                  <Input
                    placeholder="e.g., Mumbai Indians"
                    value={team1}
                    onChange={(e) => setTeam1(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Team 2</label>
                  <Input
                    placeholder="e.g., Chennai Super Kings"
                    value={team2}
                    onChange={(e) => setTeam2(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Match Format</label>
                <Select value={overs} onValueChange={setOvers}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 Overs (Quick Match)</SelectItem>
                    <SelectItem value="10">10 Overs</SelectItem>
                    <SelectItem value="20">20 Overs (T20)</SelectItem>
                    <SelectItem value="50">50 Overs (ODI)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Match"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Preview */}
        {team1 && team2 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Match Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6">
                <div className="text-2xl font-bold text-primary mb-2">
                  {team1} vs {team2}
                </div>
                <div className="text-muted-foreground">
                  {overs} Overs Match
                </div>
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">
                    🏏 This will be a {overs}-over cricket match between {team1} and {team2}.
                    You can add players and start live scoring once the match is created.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};