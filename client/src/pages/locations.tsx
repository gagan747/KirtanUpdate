import { useQuery } from "@tanstack/react-query";
import { Location } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, MapPin, Plus } from "lucide-react";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

function LocationForm() {
  // TODO: Implement location form similar to RecordedSamagamForm
  return <div>Location Form Coming Soon</div>;
}

function LocationMap({ coordinates }: { coordinates: { lat: number; lng: number } }) {
  return (
    <div className="aspect-[4/3] rounded-lg overflow-hidden">
      <iframe
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${coordinates.lat},${coordinates.lng}`}
      />
    </div>
  );
}

export default function LocationsPage() {
  const { user } = useAuth();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const { data: locations, isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Samagam Locations
        </h1>
        {user?.isAdmin && (
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4">
                <Plus className="mr-1 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <LocationForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        {locations?.map((location) => (
          <Card key={location.id}>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                {location.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <LocationMap coordinates={location.coordinates} />
              <div className="space-y-1 sm:space-y-2">
                <p className="text-sm sm:text-base font-medium">Address</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{location.address}</p>
              </div>
              {location.description && (
                <div className="space-y-1 sm:space-y-2">
                  <p className="text-sm sm:text-base font-medium">Description</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{location.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </Layout>
  );
}
