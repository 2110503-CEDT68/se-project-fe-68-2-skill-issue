// ─────────────────────────────────────────
//  Data models (จาก API)
// ─────────────────────────────────────────

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  telephone_number?: string;
  createdAt?: string;
}

export interface CompanyItem {
  _id: string;
  name: string;
  address?: string;
  website?: string;
  description?: string;
  telephone_number?: string;
  imgSrc?:string;
  averageRating?: number;
  numReviews?: number;
}

export interface ReviewItem {
  _id: string;
  rating: number;
  comment: string;
  company: string | CompanyItem;
  user: { _id: string; name: string } | string;
  createdAt: string;
  edited: boolean;
  editedAt: string;
  effectiveDate: string;
}

export interface ReviewJson {
  success: boolean;
  count?: number;
  data: ReviewItem[];
}

export interface BookingItem {
  _id: string;
  bookingDate: string;
  company: CompanyItem;
  user?: Pick<UserItem, '_id' | 'name' | 'email'>;
  createdAt?: string;
}

export interface BookingJson {
  success: boolean;
  count?: number;
  data: BookingItem[];
}

export interface CompanyJson {
  success: boolean;
  count?: number;
  data: CompanyItem[];
}

// ─────────────────────────────────────────
//  Redux state
// ─────────────────────────────────────────

export interface BookState {
  bookItems: BookingItem[];
}

// ─────────────────────────────────────────
//  Component Props
// ─────────────────────────────────────────

export interface CardProps {
  booking: BookingItem;
  index: number;
  onEdit:   (booking: BookingItem) => void;
  onCancel: (booking: BookingItem) => void;
  onDetail: (booking: BookingItem) => void;
  userReview?: ReviewItem | null;
  onDeleteReview?: (booking: BookingItem, review: ReviewItem) => void;
  onEditReview?: (booking: BookingItem, review: ReviewItem) => void;
  onReviewCompany?: (booking: BookingItem) => void;
}

export interface DateReserveProps {
  date: string;
  time: string;
  onDateChange: (val: string) => void;
  onTimeChange: (val: string) => void;
}

export interface TopMenuProps {
  userName?: string;
  isFull?: boolean;
  backToDashboard?: boolean;
}

export interface TopMenuItemProps {
  title: string;
  pageRef: string;
}

export interface CompanyCardProps {
  company:  CompanyItem;
  booked?:  BookingItem;
  isFull:   boolean;
  index:    number;
  onBook:   (company: CompanyItem) => void;
  onEdit:   (company: CompanyItem) => void;
  onCancel: (booking: BookingItem) => void;
}

export interface SearchBarProps {
  value:        string;
  onChange:     (val: string) => void;
  placeholder?: string;
}

// ─────────────────────────────────────────
//  Blog
// ─────────────────────────────────────────

export interface BlogPost {
  _id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface BlogPostJson {
  success: boolean;
  count?: number;
  data: BlogPost[];
}

export interface BlogComment {
  _id: string;
  text: string;
  author: string;
  blog: string;
  createdAt: string;
}

export interface BlogCommentJson {
  success: boolean;
  count?: number;
  data: BlogComment[];
}

export interface BookModalProps {
  company:      CompanyItem;
  editMode:     boolean;
  date:         string;
  time:         string;
  submitting:   boolean;
  onDateChange: (v: string) => void;
  onTimeChange: (v: string) => void;
  onConfirm:    () => void;
  onClose:      () => void;
}

// ─────────────────────────────────────────
//  Admin Component Props
// ─────────────────────────────────────────

export interface CompanyFormData {
  name: string;
  address: string;
  website: string;
  description: string;
  telephone_number: string;
  imgSrc:string;
}

export interface AdminCompanyModalProps {
  mode: 'create' | 'edit';
  company?: CompanyItem;
  onConfirm: (data: CompanyFormData) => void;
  onClose: () => void;
  submitting: boolean;
}

export interface AdminDeleteModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onClose: () => void;
  submitting: boolean;
}