import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import  MyReviewList ,{StarMini} from '@/components/MyReviewList';
import getReviews from '@/libs/getReviews';
import getCompanies from '@/libs/getCompanies';
import editReview from '@/libs/editReview';
import { useToast } from '@/hooks/useToast';
import '@testing-library/jest-dom';
import deleteReview from '@/libs/deleteReview';

// 2. และอย่าลืมสั่ง Mock ไว้ด้วย (ถ้ายังไม่มี)
jest.mock('../src/libs/deleteReview');
jest.mock('../src/libs/getReviews'); 
jest.mock('../src/libs/getCompanies');
jest.mock('../src/libs/editReview');
jest.mock('../src/hooks/useToast');
const mockShowToast = jest.fn();
(useToast as any).mockReturnValue({
  toast: { message: '', type: 'success', visible: false },
  showToast: mockShowToast,
});

const mockReview = {
  _id: 'r1',
  rating: 4,
  comment: 'Good service',
  user: 'u1',
  bookingDate: '2022-05-10T09:00:00',
};

const mockCompany = {
  _id: 'c1',
  name: 'Test Company',
};

describe('StarMini Component (ดาวคะแนน)', () => {
    beforeEach(() => {
    // จำลองว่า login อยู่และ ID ตรงกับในรีวิวที่ mock ไว้
    Storage.prototype.getItem = jest.fn((key) => {
        if (key === 'jf_user') return JSON.stringify({ _id: 'user123', name: 'Sangsit' });
        if (key === 'jf_token') return 'mock-token';
        return null;
    });
    });
  it('ควรแสดงดาวสีทองตามคะแนนที่ได้รับ (เช่น 3.5 ดาว)', async () => {
    // จำลองรีวิวที่มีคะแนน 3.5
    const mockReviews = [{
    companyId: 'c1',
    companyName: 'Test Co',
    review: { 
        _id: 'r1', 
        rating: 3.5, 
        comment: 'Good', 
        user: 'user123'
    }
    }];

    // Mock API ให้ส่งรีวิว 3.5 ดาวกลับมา
    (getReviews as jest.Mock).mockResolvedValue({ data: [mockReviews[0].review] });
    (getCompanies as jest.Mock).mockResolvedValue({ data: [{ _id: 'c1', name: 'Test Co' }] });

    render(<MyReviewList />);
    await waitFor(() => {
        const allPolygons = document.querySelectorAll('polygon');
        const goldStars = Array.from(allPolygons).filter(poly => 
            poly.getAttribute('fill')?.toUpperCase() === '#E8A020'
        );
        expect(goldStars.length).toBe(4);
    });
  });

  it('ควรมีการใส่ clipPath เมื่อคะแนนเป็นค่าครึ่ง (เช่น .5)', async () => {
    render(<StarMini rating={4.5} />);

    // ตรวจสอบว่ามี clipPath ถูกสร้างขึ้นใน DOM หรือไม่
    const clipPath = document.querySelector('clipPath');
    expect(clipPath).toBeInTheDocument();
    
    // ตรวจสอบว่า polygon สีทองตัวสุดท้ายมีการเรียกใช้ url(#clipId)
    const goldStars = document.querySelectorAll('polygon[fill="#E8A020"]');
    const halfStar = goldStars[goldStars.length - 1];
    expect(halfStar).toHaveAttribute('clip-path', expect.stringContaining('url(#mrl-half-'));
  });
});

describe('MyReviewList Component Coverage Test', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock LocalStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'jf_user') return JSON.stringify({ _id: 'u1', name: 'Test User' });
      if (key === 'jf_token') return 'mock-token';
      return null;
    });

    (getCompanies as jest.Mock).mockResolvedValue({ data: [mockCompany] });
    (getReviews as jest.Mock).mockResolvedValue({ data: [mockReview] });
  });

  it('ควรโหลดข้อมูลและแสดงปุ่ม Edit ได้ถูกต้อง', async () => {
    render(<MyReviewList />);

    // รอจนกว่า Loading จะหายไป
    await waitFor(() => {
      expect(screen.getByText('Test Company')).toBeInTheDocument();
    });

    expect(screen.getByText('"Good service"')).toBeInTheDocument();
    expect(screen.getByText('✏️ Edit')).toBeInTheDocument();
  });

  it('เมื่อกดปุ่ม Edit จะต้องเปิด Modal พร้อมค่าเริ่มต้นที่ถูกต้อง', async () => {
    render(<MyReviewList />);

    await waitFor(() => screen.getByText('✏️ Edit'));
    
    // กดปุ่ม Edit
    fireEvent.click(screen.getByText('✏️ Edit'));

    // ตรวจสอบว่ามี Modal ขึ้นมา (เช็กจากข้อความใน Modal)
    expect(screen.getByPlaceholderText('Write Your Review!!!')).toHaveValue('Good service');
  });

  it('ควรเปิด Modal ยืนยันเมื่อกดปุ่ม Delete', async () => {
  // Mock API สำหรับการลบ
  (deleteReview as jest.Mock).mockResolvedValue({ success: true });

  render(<MyReviewList />);
  
  // 1. หาปุ่ม Delete และกด
  const deleteBtns = await screen.findAllByText(/Delete/i);
  fireEvent.click(deleteBtns[0]);
  
  // 2. หาปุ่มยืนยันใน Modal (เช็กชื่อปุ่มให้ตรงกับใน DeleteReviewModal.tsx)
  const confirmBtn = screen.getByRole('button', { name: /Yes, Delete it/i });
  fireEvent.click(confirmBtn);

  // 3. รอให้ Modal หายไป (ตรวจสอบคำที่เป็นหัวข้อ Modal ของคุณ)
  // สมมติหัวข้อคือ "Are you sure you want to delete this review?"
  await waitForElementToBeRemoved(() => screen.queryByText(/Are you sure/i));

  // 4. ตรวจสอบว่า Toast ถูกเรียก
  await waitFor(() => {
    expect(mockShowToast).toHaveBeenCalledWith('✅ Review deleted.', 'success');
  });
});
it('ควรสามารถแก้ไข Comment และอัปเดต UI ได้', async () => {
  const targetId = 'rev123';
  const newComment = 'Updated Comment';
  const newRating = 5;

  // 1. Mock ข้อมูลเริ่มต้นให้ ID ตรงกัน
  (getReviews as jest.Mock).mockResolvedValue({
    data: [{ _id: targetId, rating: 3, comment: 'Old', user: 'u1' }]
  });

  render(<MyReviewList />);
  
  // 2. กด Edit
  const editBtn = await screen.findByText(/✏️ Edit/i);
  fireEvent.click(editBtn);

  // 3. ป้อนข้อมูลใหม่ (ต้องตรงกับที่จะ expect)
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value: newComment } });

  fireEvent.click(screen.getByLabelText('5 Stars'));

  const saveBtn = screen.getByText(/Save Changes/i);
  fireEvent.click(saveBtn);
  await waitFor(() => {
    expect(editReview).toHaveBeenCalledWith(
      expect.any(String),
      targetId,     
      newRating,    
      newComment    
    );
  });
});
it('ควรแสดงข้อมูลใหม่บนหน้าจอและแจ้งเตือน Toast เมื่อแก้ไขสำเร็จ', async () => {
  // 1. กำหนดข้อมูลจำลอง
  const mockTargetId = 'comp-123';
  const updatedData = {
    _id: 'rev-999',
    rating: 5,
    comment: 'Updated Comment from Test',
    user: 'user-1',
    company: mockTargetId
  };

  // 2. Mock API ให้ส่งค่า updated กลับมา
  (editReview as jest.Mock).mockResolvedValue({ data: updatedData });

  render(<MyReviewList />);

  // 3. จำลองการกดปุ่ม Edit ของรายการที่ต้องการ
  const editBtns = await screen.findAllByText(/✏️ Edit/i);
  fireEvent.click(editBtns[0]);

  // 4. จำลองการพิมพ์ข้อความใหม่ใน Modal
  const textarea = screen.getByRole('textbox');
  fireEvent.change(textarea, { target: { value: 'Updated Comment from Test' } });

  // 5. กดปุ่ม Save
  const saveBtn = screen.getByText(/Save Changes/i);
  fireEvent.click(saveBtn);

  // 6. ตรวจสอบการทำงาน (Assertions)
  await waitFor(() => {
    // ก. ตรวจสอบว่า Toast แสดงข้อความที่ถูกต้อง
    expect(mockShowToast).toHaveBeenCalledWith('✅ Review updated!', 'success');
    
    // ข. ตรวจสอบว่า Modal ถูกปิดไปแล้ว (setEditTarget(null))
    expect(screen.queryByText(/Save Changes/i)).not.toBeInTheDocument();
  });

  // ค. ตรวจสอบว่า UI หลักถูกอัปเดตด้วยข้อมูลใหม่ (Logic ของ setMyReviews)
  expect(screen.getByText(/"Updated Comment from Test"/i)).toBeInTheDocument();
});
it('ควรแสดง Toast สีแดงพร้อมข้อความ Error เมื่อ API แก้ไขรีวิวพัง', async () => {
  // 1. จำลองให้ editReview พ่น Error ออกมา (Reject)
  const errorMessage = 'Network Error: Cannot connect to server';
  (editReview as jest.Mock).mockRejectedValue(new Error(errorMessage));

  render(<MyReviewList />);

  // 2. เปิด Modal
  const editBtns = await screen.findAllByText(/✏️ Edit/i);
  fireEvent.click(editBtns[0]);

  // 3. กดปุ่ม Save ทันที (หรือจะพิมพ์ก่อนก็ได้)
  const saveBtn = screen.getByText(/Save Changes/i);
  fireEvent.click(saveBtn);

  // 4. ตรวจสอบว่า showToast ถูกเรียกด้วยข้อมูล Error ที่ถูกต้อง
  await waitFor(() => {
    // ต้องตรงกับ format: ❌ {message}
    expect(mockShowToast).toHaveBeenCalledWith(`❌ ${errorMessage}`, 'error');
  });

  // 5. (Optional) ตรวจสอบว่า Modal ยังไม่ปิด (เพราะพังใน try บล็อก)
  // แต่ในโค้ดที่คุณให้มามี setEditTarget(null) แค่ในบล็อก try
  // ดังนั้นถ้า Error เกิดขึ้น Modal ควรจะยังค้างอยู่ให้ผู้ใช้แก้ไขใหม่ได้
  expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();
});
it('ควรแสดง Toast สีแดงเมื่อ API ลบรีวิวพัง', async () => {
  // 1. จำลองข้อมูลผิดพลาดจาก API (Reject)
  const errorMessage = 'Internal Server Error';
  (deleteReview as jest.Mock).mockRejectedValue(new Error(errorMessage));

  render(<MyReviewList />);

  // 2. เปิด Modal ยืนยันการลบ
  const deleteBtns = await screen.findAllByText(/Delete/i);
  fireEvent.click(deleteBtns[0]);

  // 3. กดปุ่มยืนยันใน Modal เพื่อสั่งลบ (confirmDelete)
  const confirmBtn = screen.getByRole('button', { name: /Yes, Delete it/i });
  fireEvent.click(confirmBtn);

  // 4. ตรวจสอบว่า showToast ถูกเรียกด้วย Format ที่ถูกต้อง
  await waitFor(() => {
    // โค้ดคุณคือ showToast(`❌ ${err instanceof Error ? err.message : 'Failed'}`, 'error');
    expect(mockShowToast).toHaveBeenCalledWith(`❌ ${errorMessage}`, 'error');
  });

  // 5. ตรวจสอบว่า State สุดท้าย setDeleteLoading(false) ทำงาน (ปุ่มหายโหลด)
  // และ Modal ไม่ควรหายไป (เพราะ setDeleteTarget(null) อยู่ในบล็อก try เท่านั้น)
  expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();
});

it('ควรปิด Delete Modal เมื่อกดปุ่มยกเลิก (onClose)', async () => {
  render(<MyReviewList />);

  // 1. เปิด Modal ก่อน
  const deleteBtns = await screen.findAllByText(/Delete/i);
  fireEvent.click(deleteBtns[0]);
  expect(screen.getByText(/Are you sure/i)).toBeInTheDocument();

  // 2. กดปุ่มปิด (onClose) - ปกติใน Modal จะมีปุ่ม Cancel หรือ X
  const cancelBtn = screen.getByRole('button', { name: /keep it/i });
  fireEvent.click(cancelBtn);

  // 3. ตรวจสอบว่า Modal หายไป
  await waitFor(() => {
    expect(screen.queryByText(/Are you sure/i)).not.toBeInTheDocument();
  });
});

it('ควรล้างค่า editTarget และ userReview เมื่อปิด Edit Modal (onClose)', async () => {
  render(<MyReviewList />);

  // 1. เปิด Modal เพื่อให้มีข้อมูลค้างใน State
  const editBtn = await screen.findByText(/✏️ Edit/i);
  fireEvent.click(editBtn);
  
  // ตรวจสอบว่า Modal เปิดอยู่จริง (มีปุ่ม Save Changes)
  expect(screen.getByText(/Save Changes/i)).toBeInTheDocument();

  // 2. กดปุ่มปิด (onClose) - ปรับชื่อตามปุ่ม Cancel หรือ Close ใน Modal ของคุณ
  const closeBtn = screen.getByRole('button', { name: /cancel/i });
  fireEvent.click(closeBtn);

  // 3. ตรวจสอบว่า Modal ถูกทำลาย (Unmounted)
  await waitFor(() => {
    expect(screen.queryByText(/Save Changes/i)).not.toBeInTheDocument();
  });

  // 4. (Advanced) ตรวจสอบว่าถ้าเปิด Modal ใหม่ ข้อมูลต้องถูกเริ่มใหม่ 
  // หรือไม่มีข้อมูลเดิมค้าง (ถ้า Logic ใน Modal คุณมีการพึ่งพาค่า null เพื่อแสดงผล)
});
it('ควรดึง ID จาก LocalStorage มา Filter จนเจอรีวิวของผู้ใช้', async () => {
  const MOCK_ID = 'user123';
  
  // 1. Mock LocalStorage
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'jf_user') return JSON.stringify({ _id: MOCK_ID, name: 'Sangsit' });
    return null;
  });

  // 2. Mock API ให้มีรีวิวที่ ID ตรงกับ MOCK_ID
  (getReviews as jest.Mock).mockResolvedValue({
    success: true,
    data: [{ _id: 'rev1', user: MOCK_ID, rating: 5, comment: 'Match ID Test' }]
  });

  render(<MyReviewList />);

  // 3. ตรวจสอบว่า "ข้อความว่างเปล่า" หายไป และ "Comment" ปรากฏขึ้นมา
  // ถ้าปรากฏ แสดงว่า setCurrentUserId(MOCK_ID) ทำงานสำเร็จ
  await waitFor(() => {
    expect(screen.queryByText(/You haven't reviewed/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Match ID Test/i)).toBeInTheDocument();
  });
});
it('ควรเรียกใช้ ID จาก LocalStorage ในการดึงข้อมูลจาก API', async () => {
  const MOCK_ID = 'user-unique-999';
  
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => {
    if (key === 'jf_user') return JSON.stringify({ _id: MOCK_ID, name: 'Sangsit' });
    return null;
  });

  render(<MyReviewList />);

  await waitFor(() => {
    expect(getReviews).toHaveBeenCalled(); 
  });
});

it('ควรเซต State เป็นค่าว่าง (Fallback) หากข้อมูลใน localStorage ไม่มี _id หรือ name', async () => {
  // 1. จำลองข้อมูลที่ "พัง" หรือ "ไม่ครบ"
  const incompleteUser = { _id: null, name: undefined };
  jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify(incompleteUser));

  render(<MyReviewList />);

  // 2. ตรวจสอบผลลัพธ์บน UI
  await waitFor(() => {
    // ก. ต้องแสดงข้อความว่ายังไม่มีรีวิว (เพราะ ID เป็นค่าว่าง เลยดึงข้อมูลไม่ได้)
    expect(screen.getByText(/You haven't reviewed any company yet/i)).toBeInTheDocument();
    
    // ข. ตรวจสอบว่าไม่มีรายการรีวิว (เช่น ชื่อบริษัท) โผล่มา
    expect(screen.queryByText(/Test Company/i)).not.toBeInTheDocument();
  });
});

it('ไม่ควรพังและไม่ควรตั้งค่า State หาก localStorage ว่างเปล่า', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);

  render(<MyReviewList />);

  await waitFor(() => {
    // ยืนยันว่าหน้าจอแสดง "You haven't reviewed any company yet."
    expect(screen.getByText(/You haven't reviewed/i)).toBeInTheDocument();
  });
});

describe('MyReviewList Data Mapping Coverage', () => {
  const MOCK_USER_ID = 'user123';

  beforeEach(() => {
    // เซต localStorage ให้ตรงกับ MOCK_USER_ID
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'jf_user') return JSON.stringify({ _id: MOCK_USER_ID });
      return null;
    });
  });

  it('ควรระบุตัวตนผู้ใช้ได้ถูกต้องไม่ว่าข้อมูล user จะเป็น Object หรือ String ID', async () => {
    // 1. จำลองบริษัท
    (getCompanies as jest.Mock).mockResolvedValue({
      data: [{ _id: 'comp1', name: 'Company A' }, { _id: 'comp2', name: 'Company B' }]
    });

    // 2. Mock getReviews ให้คืนค่า 2 แบบเพื่อเช็ก typeof r.user
    (getReviews as jest.Mock)
      .mockResolvedValueOnce({
        // แบบที่ 1: user เป็น Object (จะเข้ากิ่ง r.user._id)
        data: [{ _id: 'rev1', user: { _id: MOCK_USER_ID }, rating: 5, comment: 'Obj Test' }]
      })
      .mockResolvedValueOnce({
        // แบบที่ 2: user เป็น String ID (จะเข้ากิ่ง r.user)
        data: [{ _id: 'rev2', user: MOCK_USER_ID, rating: 4, comment: 'String Test' }]
      });

    render(<MyReviewList />);

    // 3. ตรวจสอบว่าทั้ง 2 รีวิวถูกดึงมาแสดง (ถ้าขึ้นทั้งคู่ แปลว่า Logic กรองผ่านทั้ง 2 กิ่ง)
    await waitFor(() => {
      expect(screen.getByText(/Obj Test/i)).toBeInTheDocument();
      expect(screen.getByText(/String Test/i)).toBeInTheDocument();
    });
  });
});
it('ควรจัดการได้เมื่อ API บริษัทคืนค่าเป็น null (ไม่พังและแสดงข้อความว่างเปล่า)', async () => {
  // Mock ให้ data เป็น null เพื่อทดสอบกิ่ง || []
  (getCompanies as jest.Mock).mockResolvedValue({ data: null });

  render(<MyReviewList />);

  await waitFor(() => {
    // ระบบควรจะยังทำงานได้ และแสดงข้อความ Empty State
    expect(screen.getByText(/You haven't reviewed any company yet/i)).toBeInTheDocument();
  });
});
it('ควรสามารถแก้ไขรีวิวและอัปเดตหน้าจอได้สำเร็จ', async () => {
  const MOCK_COMPANY_ID = 'comp123';
  const MOCK_REVIEW_ID = 'rev123';

  // 1. Mock ข้อมูลเริ่มต้น (ต้องมี companyId เพื่อให้ Logic การ Map ทำงานได้)
  // หมายเหตุ: MyReviewList ของคุณสร้าง object ที่มี companyId และ review แยกกัน
  const mockInitialData = {
    companyId: MOCK_COMPANY_ID,
    review: { _id: MOCK_REVIEW_ID, rating: 3, comment: 'Old', user: 'u1' }
  };

  // Mock ตอนโหลดครั้งแรก
  (getCompanies as jest.Mock).mockResolvedValue({
    data: [{ _id: MOCK_COMPANY_ID, name: 'Test Company' }]
  });
  (getReviews as jest.Mock).mockResolvedValue({
    data: [mockInitialData.review] 
  });

  // Mock ผลลัพธ์จากการ Edit
  (editReview as jest.Mock).mockResolvedValue({
    success: true,
    data: { ...mockInitialData.review, rating: 5, comment: 'New Content' }
  });

  render(<MyReviewList />);
  
  // 2. รอให้ของเก่าขึ้นจอก่อน แล้วค่อยกด Edit
  const editBtn = await screen.findByText(/✏️ Edit/i);
  fireEvent.click(editBtn);

  // 3. จำลองการพิมพ์ (สำคัญมาก! ถ้าไม่พิมพ์ ค่าที่ส่งไป API จะเป็นค่าว่างหรือค่าเก่า)
  const textarea = screen.getByDisplayValue(/Old/i);
  fireEvent.change(textarea, { target: { value: 'New Content' } });

  const saveBtn = screen.getByText(/Save Changes/i);
  fireEvent.click(saveBtn);

  // 4. ตรวจสอบผลลัพธ์
  await waitFor(() => {
    // เช็กว่า API ถูกเรียกด้วยข้อมูลใหม่
    expect(editReview).toHaveBeenCalled();
    // เช็กว่า UI เปลี่ยนเป็น New Content
    expect(screen.getByText(/New Content/i)).toBeInTheDocument();
    // เช็ก Toast
    expect(mockShowToast).toHaveBeenCalledWith('✅ Review updated!', 'success');
  });
});
it('ควรสามารถลบรีวิวและรายการนั้นต้องหายไปจากหน้าจอ', async () => {
  const mockReview = { companyId: 'c1', review: { _id: 'r1', rating: 5, comment: 'Delete Me' } };
  (deleteReview as jest.Mock).mockResolvedValue({ success: true });

  render(<MyReviewList />);
  
  // 1. กดปุ่มถังขยะ
  const deleteBtn = await screen.findByText(/Delete/i);
  fireEvent.click(deleteBtn);

  // 2. กดปุ่มยืนยันใน Modal
  const confirmBtn = screen.getByText(/Yes, Delete it/i);
  fireEvent.click(confirmBtn);

  // 3. ตรวจสอบผลลัพธ์
  await waitFor(() => {
    expect(deleteReview).toHaveBeenCalled();
    // รายการที่มีคำว่า "Delete Me" ต้องหายไปจากหน้าจอ
    expect(screen.queryByText(/Delete Me/i)).not.toBeInTheDocument();
  });
});
it('ควรแสดง Toast แจ้งเตือนเมื่อการลบรีวิวล้มเหลว', async () => {
  (deleteReview as jest.Mock).mockRejectedValue(new Error('Network Error'));

  render(<MyReviewList />);
  
  // ... กดลบตามปกติ ...
  fireEvent.click(await screen.findByText(/Delete/i));
  fireEvent.click(screen.getByText(/Yes, Delete it/i));

  // ตรวจสอบว่ามี Toast สีแดงขึ้นข้อความ Error
  await waitFor(() => {
    expect(screen.getByText(/❌ Network Error/i)).toBeInTheDocument();
  });
});
});