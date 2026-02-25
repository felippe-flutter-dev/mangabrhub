import { useProfileViewModel } from "../../presentation/viewmodels/ProfileViewModel";
import { MangaCard } from "../components/MangaCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Plus, Trash2, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Separator } from "../components/ui/separator";

export default function Profile() {
  const {
    user,
    lists,
    loading,
    newListName,
    setNewListName,
    listMangas,
    handleCreateList,
    handleDeleteList,
    handleLogout
  } = useProfileViewModel();

  if (loading) {
    return (
      <div className="container flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-6 rounded-lg shadow-sm border">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback><UserIcon className="h-8 w-8" /></AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{user?.user_metadata?.full_name || user?.email}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="w-full md:w-auto text-destructive hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>

      <Separator />

      {/* Lists */}
      <div className="space-y-6 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Minhas Listas de Leitura</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Nova Lista
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Lista</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Nome da Lista</label>
                  <Input 
                    placeholder="Ex: Lendo Agora, Planejo Ler..." 
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateList} disabled={!newListName.trim()} className="w-full">
                  Criar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Você ainda não criou nenhuma lista.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full space-y-4">
            {lists.map((list) => (
              <AccordionItem key={list.id} value={list.id} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <span className="text-lg font-medium">
                    {list.name}
                    <span className="text-muted-foreground text-sm ml-2">({list.items?.length || 0} mangás)</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-6 space-y-4">
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta lista?")) {
                            handleDeleteList(list.id);
                          }
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir Lista
                      </Button>
                    </div>

                    {!list.items || list.items.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Esta lista está vazia.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {(listMangas[list.id] || []).map((manga) => (
                          <MangaCard key={manga.id} manga={manga} />
                        ))}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
