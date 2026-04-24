import { ReviewJson } from '../../interface';

export default async function editReview(
  token: string, 
  reviewId: string, 
  rating: number, 
  comment: string
): Promise<ReviewJson> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE}/reviews/${reviewId}`,
    {
      method: 'PUT', // หรือ 'PATCH' ตามที่ API ของคุณกำหนด
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // ต้องมี Token เพื่อยืนยันสิทธิ์ความเป็นเจ้าของ
      },
      body: JSON.stringify({
        rating: rating,
        comment: comment,
      }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to edit review');
  }

  return response.json();
}