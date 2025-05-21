import { useSocket } from "@/hooks/use-socket";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Radio, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BroadcastPage() {
  const {
    isBroadcasting,
    connectedUsers,
    startBroadcast,
    stopBroadcast,
    joinBroadcast,
    isConnected,
    broadcastError,
  } = useSocket();
  const { user } = useAuth();

  const isAdmin = user?.isAdmin;

  return (
    <Layout>
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Live Broadcast
          </h1>
          <p className="text-muted-foreground">
            {isConnected
              ? "Connected to the broadcast server"
              : "Connecting to broadcast server..."}
          </p>
        </div>

        {broadcastError && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{broadcastError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Radio className="mr-2 h-5 w-5" />
                    Broadcast Status
                  </CardTitle>
                  <CardDescription>
                    Current live broadcast status
                  </CardDescription>
                </div>
                <Badge
                  variant={isBroadcasting ? "default" : "outline"}
                  className={
                    isBroadcasting ? "bg-green-600 hover:bg-green-600" : ""
                  }
                >
                  {isBroadcasting ? "LIVE" : "OFFLINE"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isAdmin ? (
                <div className="space-y-4">
                  <p>
                    As an administrator, you can control the broadcast status.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      onClick={startBroadcast}
                      disabled={isBroadcasting}
                      variant={isBroadcasting ? "outline" : "default"}
                    >
                      Start Broadcast
                    </Button>
                    <Button
                      onClick={stopBroadcast}
                      disabled={!isBroadcasting}
                      variant={!isBroadcasting ? "outline" : "destructive"}
                    >
                      Stop Broadcast
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6">
                  {isBroadcasting ? (
                    <div className="space-y-4">
                      <div className="animate-pulse flex justify-center">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                      </div>
                      <p>Broadcast is currently live!</p>
                      <Button onClick={joinBroadcast} className="mt-2">
                        Join Broadcast
                      </Button>
                    </div>
                  ) : (
                    <p>
                      No broadcast is currently active. Please check back later.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Connected Users
              </CardTitle>
              <CardDescription>
                Currently {connectedUsers.length} users connected
              </CardDescription>
            </CardHeader>
            <CardContent>
              {connectedUsers.length > 0 ? (
                <div className="space-y-3">
                  {connectedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-2 rounded-md border"
                    >
                      <div className="flex items-center">
                        <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">
                          {user.id.substring(0, 8)}...
                        </span>
                      </div>
                      <Badge
                        variant={
                          user.role === "ADMIN"
                            ? "default"
                            : user.role === "USER"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {user.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6">
                  <p>No users are currently connected.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
