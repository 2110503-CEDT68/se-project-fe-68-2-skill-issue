export async function deleteComment(token: string, commentId: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/comments/${commentId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete comment');
}

export async function updateComment(token: string, commentId: string, text: string): Promise<void> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/comments/${commentId}`, {
    method: 'PUT',
    headers: { 
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Failed to update comment');
}