import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { TagLabels } from "../../domain/models/Enums";

interface Tag {
  id: string;
  name: string;
  group?: string;
}

interface TagSelectorProps {
  tags: Tag[];
  selection: Record<string, 'include' | 'exclude' | 'neutral'>;
  onToggle: (tagId: string) => void;
}

export function TagSelector({ tags, selection, onToggle }: TagSelectorProps) {
  // Group tags
  const groups = tags.reduce((acc, tag) => {
    const group = tag.group || 'Geral';
    if (!acc[group]) acc[group] = [];
    acc[group].push(tag);
    return acc;
  }, {} as Record<string, Tag[]>);

  const groupOrder = Object.keys(groups).sort();

  return (
    <div className="space-y-4">
      {groupOrder.map((group) => (
        <CollapsibleGroup
          key={group}
          title={group === 'genre' ? 'Gêneros' : group === 'theme' ? 'Temas' : group === 'format' ? 'Formato' : group}
          tags={groups[group]}
          selection={selection}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function CollapsibleGroup({ title, tags, selection, onToggle }: { 
  title: string, 
  tags: Tag[], 
  selection: Record<string, 'include' | 'exclude' | 'neutral'>, 
  onToggle: (id: string) => void 
}) {
  const [isOpen, setIsOpen] = useState(true);

  const sortedTags = [...tags].sort((a, b) => {
    const labelA = TagLabels[a.name] || a.name;
    const labelB = TagLabels[b.name] || b.name;
    return labelA.localeCompare(labelB);
  });

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md p-2 bg-card/50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm">{title}</h3>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
            <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen ? "" : "-rotate-90")} />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="flex flex-wrap gap-2">
          {sortedTags.map((tag) => {
            const state = selection[tag.id] || 'neutral';
            const label = TagLabels[tag.name] || tag.name;
            return (
              <Badge
                key={tag.id}
                variant={state === 'neutral' ? 'outline' : 'default'}
                className={cn(
                  "cursor-pointer select-none transition-colors text-[10px] py-0 h-5",
                  state === 'include' && "bg-green-600 hover:bg-green-700 border-green-600 text-white",
                  state === 'exclude' && "bg-red-600 hover:bg-red-700 border-red-600 text-white",
                  state === 'neutral' && "hover:bg-accent"
                )}
                onClick={() => onToggle(tag.id)}
              >
                {label}
              </Badge>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
