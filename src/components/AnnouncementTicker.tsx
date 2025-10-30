import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp } from "lucide-react";

interface Announcement {
  id: string;
  message: string;
  type: string;
}

export const AnnouncementTicker = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    fetchAnnouncements();

    const channel = supabase
      .channel("announcements-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "announcements",
        },
        () => {
          fetchAnnouncements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAnnouncements = async () => {
    const { data } = await (supabase as any)
      .from("announcements")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) setAnnouncements(data);
  };

  if (announcements.length === 0) return null;

  return (
    <div className="bg-gradient-primary text-primary-foreground py-2 px-4 overflow-hidden">
      <div className="flex items-center gap-4">
        <TrendingUp className="h-5 w-5 flex-shrink-0" />
        <div className="flex-1 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap inline-block">
            {announcements.map((announcement, i) => (
              <span key={announcement.id} className="mx-8">
                {announcement.message}
                {i < announcements.length - 1 && " • "}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
