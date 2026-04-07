import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BookingItem, BookState } from '../../../interface';

const initialState: BookState = {
  bookItems: [],
};

const bookSlice = createSlice({
  name: 'book',
  initialState,
  reducers: {
    setBookings(state, action: PayloadAction<BookingItem[]>) {
      state.bookItems = action.payload;
    },
    removeBooking(state, action: PayloadAction<string>) {
      state.bookItems = state.bookItems.filter((b) => b._id !== action.payload);
    },
    updateBookingDate(
      state,
      action: PayloadAction<{ id: string; bookingDate: string }>
    ) {
      const booking = state.bookItems.find((b) => b._id === action.payload.id);
      if (booking) booking.bookingDate = action.payload.bookingDate;
    },
  },
});

export const { setBookings, removeBooking, updateBookingDate } = bookSlice.actions;
export default bookSlice.reducer;