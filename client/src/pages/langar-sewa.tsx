import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Layout from "@/components/layout";
import { QrCode } from "lucide-react";

export default function LangarSewaPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col items-center mb-6 sm:mb-8">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mb-4">
            <img src="/icons/langar-sewa.svg" alt="Langar Sewa" className="w-full h-full" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Langar Sewa
          </h1>
        </div>

        <div className="grid gap-4 sm:gap-6 md:gap-8 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">Support Langar Sewa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Langar is a tradition of serving free meals to all visitors, regardless of their background. 
                Your contribution helps us maintain this sacred tradition and serve the community.
              </p>
              <div className="flex justify-center p-4 sm:p-6 md:p-8 bg-muted rounded-lg">
                <QrCode className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 text-primary" />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Scan the QR code to contribute
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg">About Langar Sewa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm text-muted-foreground">
                Langar, the community kitchen found at every Gurudwara, is a place where free meals are served to all visitors, 
                regardless of their faith, religion, caste, gender, economic status, or ethnicity.
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                The tradition of Langar expresses the ethics of sharing, community, inclusiveness, and oneness of all humankind.
                Your contribution helps us continue this sacred tradition.
              </p>
              <div className="bg-primary/5 p-3 sm:p-4 rounded-lg">
                <h3 className="text-sm sm:text-base font-semibold mb-1 sm:mb-2">Ways to Contribute:</h3>
                <ul className="list-disc list-inside space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <li>Monetary donations through QR code</li>
                  <li>Volunteer your time in the kitchen</li>
                  <li>Donate raw materials for food preparation</li>
                  <li>Sponsor a complete day's Langar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
