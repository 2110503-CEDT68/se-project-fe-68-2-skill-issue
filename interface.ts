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