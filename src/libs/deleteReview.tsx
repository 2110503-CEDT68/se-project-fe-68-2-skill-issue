export default async function deleteReview(token: string, reviewId: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/reviews/${reviewId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete review');
  }
  return response.json();
}