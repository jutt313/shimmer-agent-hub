import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { seedExampleNotifications } from "@/utils/seedNotifications";
const SeedNotificationsButton = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const handleSeed = async () => {
    if (!user?.id || isSeeding) return;
    setIsSeeding(true);
    try {
      const success = await seedExampleNotifications(user.id);
      if (success) {
        toast({
          title: "Notifications Seeded",
          description: "Example notifications have been created successfully!"
        });
      } else {
        throw new Error("Failed to seed notifications");
      }
    } catch (error) {
      console.error('Error seeding notifications:', error);
      toast({
        title: "Error",
        description: "Failed to seed notifications",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };
  return;
};
export default SeedNotificationsButton;