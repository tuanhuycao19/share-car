import { redirect } from 'next/navigation';

export default function PassengerIndex() {
  redirect('/passenger/bookings');
}
