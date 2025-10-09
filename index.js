import { useState, useMemo } from "react";
import { useKV } from '@github/spark/hooks';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaCard } from "@/components/MediaCard";
import { MediaForm } from "@/components/MediaForm";
import { StatsPanel } from "@/components/StatsPanel";
import { MediaItem, MediaType, MediaStats } from "@/types";
import { Plus, MagnifyingGlass, FilmStrip, Book, Headphones, ChartBar } from "@phosphor-icons/react";
import { toast, Toaster } from "sonner";

function App() {
  const [mediaItems, setMediaItems] = useKV<MediaItem[]>("media-reviews", []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<MediaType | "all">("all");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "title">("recent");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);

  // Calculate stats
  const stats: MediaStats = useMemo(() => {
    const items = mediaItems || [];
    const total = items.length;
    const totalRating = items.reduce((sum, item) => sum + item.rating, 0);
    const avgRating = total > 0 ? totalRating / total : 0;

    const byType = {
      movie: {
        count: items.filter(item => item.type === 'movie').length,
        averageRating: 0,
      },
      book: {
        count: items.filter(item => item.type === 'book').length,
        averageRating: 0,
      },
      podcast: {
        count: items.filter(item => item.type === 'podcast').length,
        averageRating: 0,
      },
    };

    // Calculate average ratings by type
    (['movie', 'book', 'podcast'] as const).forEach(type => {
      const typeItems = items.filter(item => item.type === type);
      if (typeItems.length > 0) {
        const sum = typeItems.reduce((acc, item) => acc + item.rating, 0);
        byType[type].averageRating = sum / typeItems.length;
      }
    });

    const recentActivity = [...items]
      .sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

    return {
      totalReviews: total,
      averageRating: avgRating,
      byType,
      recentActivity,
    };
  }, [mediaItems]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    const items = mediaItems || [];
    let filtered = items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.creator?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || item.type === selectedType;
      return matchesSearch && matchesType;
    });

    // Sort items
    switch (sortBy) {
      case "recent":
        filtered.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
        break;
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "title":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return filtered;
  }, [mediaItems, searchQuery, selectedType, sortBy]);

  const handleAddItem = (itemData: Omit<MediaItem, 'id' | 'dateAdded'>) => {
    const newItem: MediaItem = {
      ...itemData,
      id: crypto.randomUUID(),
      dateAdded: new Date().toISOString(),
    };

    setMediaItems(current => [...(current || []), newItem]);
    toast.success("Review added successfully!");
  };

  const handleEditItem = (itemData: Omit<MediaItem, 'id' | 'dateAdded'>) => {
    if (!editItem) return;
    
    setMediaItems(current => 
      (current || []).map(item => 
        item.id === editItem.id 
          ? { ...itemData, id: editItem.id, dateAdded: editItem.dateAdded }
          : item
      )
    );
    setEditItem(null);
    toast.success("Review updated successfully!");
  };

  const handleDeleteItem = (id: string) => {
    setMediaItems(current => (current || []).filter(item => item.id !== id));
    toast.success("Review deleted successfully!");
  };

  const openEditForm = (item: MediaItem) => {
    setEditItem(item);
    setIsFormOpen(true);
  };

  const openAddForm = () => {
    setEditItem(null);
    setIsFormOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">My Media</h1>
              <p className="text-muted-foreground">
                Rate and review your favorite movies, books, and podcasts
              </p>
            </div>
            <Button onClick={openAddForm} className="w-fit bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
              <Plus size={16} />
              Add Review
            </Button>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="library" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
              <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">My Library</TabsTrigger>
              <TabsTrigger value="stats" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Statistics</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    placeholder="Search by title or creator..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedType} onValueChange={(value: MediaType | "all") => setSelectedType(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="movie">Movies</SelectItem>
                    <SelectItem value="book">Books</SelectItem>
                    <SelectItem value="podcast">Podcasts</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: "recent" | "rating" | "title") => setSortBy(value)}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="title">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Content Grid */}
              {filteredItems.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item) => (
                    <MediaCard
                      key={item.id}
                      item={item}
                      onEdit={openEditForm}
                      onDelete={handleDeleteItem}
                      onClick={setSelectedItem}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    {selectedType === "movie" && <FilmStrip size={48} className="text-muted-foreground" />}
                    {selectedType === "book" && <Book size={48} className="text-muted-foreground" />}
                    {selectedType === "podcast" && <Headphones size={48} className="text-muted-foreground" />}
                    {selectedType === "all" && <MagnifyingGlass size={48} className="text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg font-medium mb-2">
                    {searchQuery 
                      ? "No results found" 
                      : (mediaItems || []).length === 0 
                        ? "No reviews yet" 
                        : `No ${selectedType} reviews`
                    }
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Try adjusting your search or filters"
                      : "Start by adding your first review"
                    }
                  </p>
                  {!searchQuery && (
                    <Button onClick={openAddForm} className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
                      <Plus size={16} />
                      Add Your First Review
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats">
              <StatsPanel stats={stats} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Forms */}
      <MediaForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={editItem ? handleEditItem : handleAddItem}
        editItem={editItem}
      />
    </div>
  );
}

export default App;
