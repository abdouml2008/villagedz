import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { Button } from '@/components/ui/button';
import { Star, Trash2, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Review {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  rating: number;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  product_id: string;
  products?: { name: string } | null;
}

interface Reply {
  id: string;
  review_id: string;
  reply_name: string;
  reply_text: string;
  created_at: string;
}

export default function AdminReviews() {
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'review' | 'reply'; id: string } | null>(null);
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('reviews')
        .select('*, products(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    }
  });

  const { data: allReplies } = useQuery({
    queryKey: ['admin-review-replies'],
    enabled: !!reviews && reviews.length > 0,
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client
        .from('review_replies')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Reply[];
    }
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client.from('reviews').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف التقييم بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف')
  });

  const deleteReplyMutation = useMutation({
    mutationFn: async (id: string) => {
      const client = await getSupabase();
      const { error } = await client.from('review_replies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف الرد بنجاح');
      queryClient.invalidateQueries({ queryKey: ['admin-review-replies'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('حدث خطأ أثناء الحذف')
  });

  const toggleReplies = (reviewId: string) => {
    const newSet = new Set(expandedReviews);
    if (newSet.has(reviewId)) {
      newSet.delete(reviewId);
    } else {
      newSet.add(reviewId);
    }
    setExpandedReviews(newSet);
  };

  const getRepliesForReview = (reviewId: string) => {
    return allReplies?.filter(r => r.review_id === reviewId) || [];
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'review') {
      deleteReviewMutation.mutate(deleteTarget.id);
    } else {
      deleteReplyMutation.mutate(deleteTarget.id);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminHeader title="إدارة التقييمات" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">التقييمات</h1>
          <span className="text-muted-foreground">{reviews?.length || 0} تقييم</span>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : reviews && reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => {
              const replies = getRepliesForReview(review.id);
              const isExpanded = expandedReviews.has(review.id);

              return (
                <div key={review.id} className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Star className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{review.customer_name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('ar-DZ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget({ type: 'review', id: review.id })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mb-3">
                    <span className="text-xs bg-muted px-2 py-1 rounded">{review.products?.name || 'منتج محذوف'}</span>
                  </div>

                  {review.comment && (
                    <p className="text-muted-foreground mb-4">{review.comment}</p>
                  )}

                  {/* Replies section */}
                  {replies.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <button 
                        onClick={() => toggleReplies(review.id)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
                      >
                        <MessageCircle className="w-4 h-4" />
                        الردود ({replies.length})
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>

                      {isExpanded && (
                        <div className="space-y-3">
                          {replies.map((reply) => (
                            <div key={reply.id} className="bg-muted/50 rounded-lg p-3 mr-4 flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{reply.reply_name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(reply.created_at).toLocaleDateString('ar-DZ')}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{reply.reply_text}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive h-8 w-8"
                                onClick={() => setDeleteTarget({ type: 'reply', id: reply.id })}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card rounded-xl p-8 text-center">
            <Star className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">لا توجد تقييمات</p>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'review' 
                ? 'هل أنت متأكد من حذف هذا التقييم؟ سيتم حذف جميع الردود المرتبطة به.'
                : 'هل أنت متأكد من حذف هذا الرد؟'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
