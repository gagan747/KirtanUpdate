import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Radio } from "lucide-react";
import { useSocket } from "@/hooks/use-socket";

export function LiveBroadcastIndicator() {
  const { isBroadcasting } = useSocket();
  const [, navigate] = useLocation();

  if (!isBroadcasting) return null;

  return (
    <Badge
      variant="default"
      className="bg-red-600 hover:bg-red-700 cursor-pointer animate-pulse flex items-center gap-1.5"
      onClick={() => navigate("/broadcast")}
    >
      <Radio className="h-3 w-3" />
      <span>LIVE</span>
    </Badge>
  );
}
