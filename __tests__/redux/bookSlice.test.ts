import bookReducer, { setBookings, removeBooking, updateBookingDate } from '@/redux/features/bookSlice';
import { BookState } from '../../../interface';

describe('bookSlice', () => {
  const initialState: BookState = { bookItems: [] };

  const sampleBookings = [
    { _id: 'b1', bookingDate: '2022-05-10T09:00:00', company: { _id: 'c1', name: 'Company A' } },
    { _id: 'b2', bookingDate: '2022-05-11T10:00:00', company: { _id: 'c2', name: 'Company B' } },
  ] as any;

  describe('setBookings', () => {
    it('sets the bookings array', () => {
      const state = bookReducer(initialState, setBookings(sampleBookings));
      expect(state.bookItems).toEqual(sampleBookings);
      expect(state.bookItems.length).toBe(2);
    });

    it('replaces existing bookings', () => {
      const prevState: BookState = { bookItems: sampleBookings };
      const newBookings = [{ _id: 'b3', bookingDate: '2022-05-12', company: { _id: 'c3', name: 'C' } }] as any;
      const state = bookReducer(prevState, setBookings(newBookings));
      expect(state.bookItems.length).toBe(1);
      expect(state.bookItems[0]._id).toBe('b3');
    });
  });

  describe('removeBooking', () => {
    it('removes a booking by id', () => {
      const prevState: BookState = { bookItems: sampleBookings };
      const state = bookReducer(prevState, removeBooking('b1'));
      expect(state.bookItems.length).toBe(1);
      expect(state.bookItems[0]._id).toBe('b2');
    });

    it('does nothing if id not found', () => {
      const prevState: BookState = { bookItems: sampleBookings };
      const state = bookReducer(prevState, removeBooking('nonexistent'));
      expect(state.bookItems.length).toBe(2);
    });
  });

  describe('updateBookingDate', () => {
    it('updates booking date for matching id', () => {
      const prevState: BookState = { bookItems: [...sampleBookings] };
      const state = bookReducer(prevState, updateBookingDate({ id: 'b1', bookingDate: '2022-05-13T14:00:00' }));
      expect(state.bookItems.find(b => b._id === 'b1')?.bookingDate).toBe('2022-05-13T14:00:00');
    });

    it('does nothing if id not found', () => {
      const prevState: BookState = { bookItems: [...sampleBookings] };
      const state = bookReducer(prevState, updateBookingDate({ id: 'nope', bookingDate: '2022-05-13' }));
      expect(state.bookItems).toEqual(sampleBookings);
    });
  });
});
