import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Pin, Send } from "lucide-react";
import { useStoreComments, useAddComment } from "@/hooks/useHQCommunication";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useSelectedStore } from "@/hooks/useSelectedStore";

export function CommentThread() {
  const [newComment, setNewComment] = useState("");
  const { selectedStore } = useSelectedStore();
  const { data: comments, isLoading } = useStoreComments(selectedStore?.id);
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      return;
    }

    await addComment.mutateAsync({
      store_id: selectedStore?.id,
      comment: newComment.trim(),
    });

    setNewComment("");
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">새 코멘트 작성</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="코멘트를 입력하세요..."
            rows={3}
          />
          <Button
            type="submit"
            disabled={!newComment.trim() || addComment.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            {addComment.isPending ? "등록 중..." : "코멘트 등록"}
          </Button>
        </form>
      </Card>

      <div className="space-y-3">
        {!comments || comments.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">코멘트가 없습니다</p>
          </Card>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{comment.author_name}</span>
                    <Badge variant="outline">{comment.author_role}</Badge>
                    {comment.is_pinned && (
                      <Badge variant="secondary" className="gap-1">
                        <Pin className="w-3 h-3" />
                        고정됨
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(comment.created_at), 'PPp', { locale: ko })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
