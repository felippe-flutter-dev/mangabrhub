import { Link } from "react-router";
import { Manga } from "../../domain/models/Manga";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Star } from "lucide-react";
import { ImageWithFallback } from "./ui/ImageWithFallback";
import { MangaStatus, MangaStatusLabels } from "../../domain/models/Enums";

interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  const { id, title, status, contentRating, coverUrl, rating } = manga;

  return (
    <Link to={`/manga/${id}`} className="block h-full transition-transform hover:scale-[1.02]">
      <Card className="h-full overflow-hidden flex flex-col border-none shadow-md bg-card relative">
        <div className="relative aspect-[2/3] w-full bg-muted">
          <ImageWithFallback
            src={coverUrl || ""}
            alt={title}
            className="h-full w-full object-cover"
            loading="lazy"
          />

          {/* Status Badge */}
          <Badge
            variant={status === 'completed' ? 'secondary' : 'default'}
            className="absolute top-2 right-2 shadow-sm uppercase text-[10px]"
          >
            {MangaStatusLabels[status as MangaStatus] || status}
          </Badge>

          {(contentRating === 'erotica' || contentRating === 'pornographic') && (
            <Badge variant="destructive" className="absolute top-2 left-2 shadow-sm">
              18+
            </Badge>
          )}
        </div>
        <CardContent className="p-3 flex-1 flex flex-col gap-2">
          <h3 className="font-semibold text-sm line-clamp-2 leading-tight" title={title}>
            {title}
          </h3>
          {rating !== undefined && (
            <div className="flex items-center text-xs text-yellow-500 mt-auto">
              <Star className="h-3 w-3 fill-current mr-1" />
              <span>
                {rating != null ? rating.toFixed(1) : "—"}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
