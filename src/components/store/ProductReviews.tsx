import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSupabase } from '@/hooks/useSupabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Star, User } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface ProductReviewsProps {
  productId: string;
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
  const [formData, setFormData] = useState({ customer_name: '', customer_phone: '', rating: 5, comment: '' });

  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const client = await getSupabase();
      const { data, error } = await client.from('reviews').select('*').eq('product_id', productId).eq('is_approved', true).order('created_at', { ascending: false });
      if (error) throw error;
      return data as Review[];
    }
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const client = await getSupabase();
      const { error } = await client.from('reviews').insert({ product_id: productId, customer_name: formData.customer_name, customer_phone: formData.customer_phone, rating: formData.rating, comment: formData.comment || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(t.reviews.thankYou); setFormData({ customer_name: '', customer_phone: '', rating: 5, comment: '' }); setShowForm(false); },
    onError: () => toast.error(t.reviews.error)
  });

  const averageRating = reviews?.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null;
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!formData.customer_name || !formData.customer_phone) { toast.error(t.reviews.yourName + ' & ' + t.reviews.yourPhone); return; } submitMutation.mutate(); };

  return (
    <div className="mt-12 border-t border-border pt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">{t.reviews.title}</h2>
          {averageRating && <div className="flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full"><Star className="w-5 h-5 fill-primary text-primary" /><span className="font-semibold">{averageRating}</span><span className="text-muted-foreground text-sm">({reviews?.length})</span></div>}
        </div>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>{showForm ? t.common.cancel : t.reviews.writeReview}</Button>
      </div>
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-card rounded-xl p-6 mb-6 border border-border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="text-sm font-medium">{t.reviews.yourName}</label><Input value={formData.customer_name} onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })} /></div>
            <div><label className="text-sm font-medium">{t.reviews.yourPhone}</label><Input type="tel" value={formData.customer_phone} onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })} dir="ltr" /></div>
          </div>
          <div><label className="text-sm font-medium">{t.reviews.rating}</label><div className="flex gap-2 mt-2">{[1, 2, 3, 4, 5].map((star) => <button key={star} type="button" onClick={() => setFormData({ ...formData, rating: star })} className="focus:outline-none"><Star className={`w-8 h-8 transition-colors ${star <= formData.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} /></button>)}</div></div>
          <div><label className="text-sm font-medium">{t.reviews.comment}</label><Textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} rows={3} /></div>
          <Button type="submit" disabled={submitMutation.isPending}>{submitMutation.isPending ? t.reviews.submitting : t.reviews.submit}</Button>
        </form>
      )}
      {isLoading ? <div className="space-y-4">{[1, 2].map(i => <div key={i} className="bg-card rounded-xl p-6 animate-pulse"><div className="h-4 bg-muted rounded w-1/4 mb-2" /><div className="h-3 bg-muted rounded w-3/4" /></div>)}</div> : reviews && reviews.length > 0 ? (
        <div className="space-y-4">{reviews.map((review) => <div key={review.id} className="bg-card rounded-xl p-6 border border-border"><div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center"><User className="w-5 h-5 text-primary" /></div><div><p className="font-semibold">{review.customer_name}</p><div className="flex items-center gap-1">{[1, 2, 3, 4, 5].map((star) => <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />)}</div></div><span className="text-sm text-muted-foreground mr-auto">{new Date(review.created_at).toLocaleDateString('ar-DZ')}</span></div>{review.comment && <p className="text-muted-foreground">{review.comment}</p>}</div>)}</div>
      ) : <div className="bg-card rounded-xl p-8 text-center"><Star className="w-12 h-12 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">{t.reviews.noReviews}</p></div>}
    </div>
  );
}
