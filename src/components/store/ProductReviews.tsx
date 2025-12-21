import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, User, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductReviewsProps {
  productId: string;
}

interface Reply {
  id: string;
  reply_name: string;
  reply_text: string;
  created_at: string;
}

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ customer_name: '', rating: 5, comment: '' });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyData, setReplyData] = useState({ reply_name: '', reply_text: '' });
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('reviews').select('*').eq('product_id', productId).eq('is_approved', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    }
  });

  const { data: allReplies } = useQuery({
    queryKey: ['review-replies', productId],
    enabled: !!reviews && reviews.length > 0,
    queryFn: async () => {
      const client = await getSupabase();
      const reviewIds = reviews!.map(r => r.id);
      const { data, error } = await client.from('review_replies').select('*').in('review_id', reviewIds).order('created_at', { ascending: true });
      if (error) throw error;
      return data as (Reply & { review_id: string })[];
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const client = await getSupabase();
      const { error } = await client.from('reviews').insert({ 
        product_id: productId, 
        customer_name: formData.customer_name, 
        customer_phone: null,
        rating: formData.rating, 
        comment: formData.comment || null,
        is_approved: true
      });
      if (error) throw error;
    },
    onSuccess: () => { 
      toast.success(t.reviews.published); 
      setFormData({ customer_name: '', rating: 5, comment: '' }); 
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
    },
    onError: () => toast.error(t.reviews.error)
  });

  const replyMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const client = await getSupabase();
      const { error } = await client.from('review_replies').insert({
        review_id: reviewId,
        reply_name: replyData.reply_name,
        reply_text: replyData.reply_text
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t.reviews.replySuccess);
      setReplyData({ reply_name: '', reply_text: '' });
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ['review-replies', productId] });
    },
    onError: () => toast.error(t.reviews.error)
  });

  const averageRating = reviews?.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;
  
  const handleSubmit = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (!formData.customer_name.trim()) { 
      toast.error(t.reviews.yourName); 
      return; 
    } 
    submitMutation.mutate(); 
  };

  const handleReplySubmit = (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!replyData.reply_name.trim() || !replyData.reply_text.trim()) {
      toast.error(t.reviews.fillRequired);
      return;
    }
    replyMutation.mutate(reviewId);
  };

  const toggleReplies = (reviewId: string) => {
    const newSet = new Set(expandedReplies);
    if (newSet.has(reviewId)) {
      newSet.delete(reviewId);
    } else {
      newSet.add(reviewId);
    }
    setExpandedReplies(newSet);
  };

  const getRepliesForReview = (reviewId: string) => {
    return allReplies?.filter(r => r.review_id === reviewId) || [];
  };

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{t.reviews.title}</h2>
          {averageRating && (
            <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
              <Star className="w-5 h-5 fill-primary text-primary" />
              <span className="font-semibold">{averageRating}</span>
              <span className="text-muted-foreground text-sm">({reviews?.length})</span>
            </div>
          )}
        </div>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? t.common.cancel : t.reviews.writeReview}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 mb-6 border border-border space-y-4">
          <div>
            <label className="text-sm font-medium">{t.reviews.yourName}</label>
            <Input 
              value={formData.customer_name} 
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} 
              placeholder={t.reviews.namePlaceholder}
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t.reviews.rating}</label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button 
                  key={star} 
                  type="button" 
                  onClick={() => setFormData({ ...formData, rating: star })} 
                  className="focus:outline-none"
                >
                  <Star className={`w-8 h-8 transition-colors ${star <= formData.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">{t.reviews.comment}</label>
            <Textarea 
              value={formData.comment} 
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })} 
              rows={3} 
              placeholder={t.reviews.commentPlaceholder}
            />
          </div>
          <Button type="submit" disabled={submitMutation.isPending}>
            {submitMutation.isPending ? t.reviews.submitting : t.reviews.submit}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
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
            const isExpanded = expandedReplies.has(review.id);
            
            return (
              <div key={review.id} className="bg-card rounded-xl p-6 border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{review.customer_name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground mr-auto">
                    {new Date(review.created_at).toLocaleDateString('ar-DZ')}
                  </span>
                </div>
                
                {review.comment && <p className="text-muted-foreground mb-4">{review.comment}</p>}
                
                {/* Replies section */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    {replies.length > 0 && (
                      <button 
                        onClick={() => toggleReplies(review.id)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        {t.reviews.replies} ({replies.length})
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    <button 
                      onClick={() => setReplyingTo(replyingTo === review.id ? null : review.id)}
                      className="text-sm text-primary hover:underline mr-auto"
                    >
                      {t.reviews.replyButton}
                    </button>
                  </div>

                  {/* Show replies */}
                  {isExpanded && replies.length > 0 && (
                    <div className="space-y-3 mb-4">
                      {replies.map((reply) => (
                        <div key={reply.id} className="bg-muted/50 rounded-lg p-3 mr-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{reply.reply_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(reply.created_at).toLocaleDateString('ar-DZ')}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{reply.reply_text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reply form */}
                  {replyingTo === review.id && (
                    <form onSubmit={(e) => handleReplySubmit(e, review.id)} className="space-y-3 bg-muted/30 rounded-lg p-4">
                      <Input
                        placeholder={t.reviews.replyName}
                        value={replyData.reply_name}
                        onChange={(e) => setReplyData({ ...replyData, reply_name: e.target.value })}
                      />
                      <Textarea
                        placeholder={t.reviews.replyPlaceholder}
                        value={replyData.reply_text}
                        onChange={(e) => setReplyData({ ...replyData, reply_text: e.target.value })}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={replyMutation.isPending}>
                          {replyMutation.isPending ? t.reviews.submitting : t.reviews.submitReply}
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => setReplyingTo(null)}>
                          {t.common.cancel}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-card rounded-xl p-8 text-center">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">{t.reviews.noReviews}</p>
        </div>
      )}
    </div>
  );
}
