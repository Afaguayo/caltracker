import { render, screen } from '@testing-library/react';
import App from './App';

// Keep tests off the network: fake the Firebase layer.
let mockUser = null;
jest.mock('./firebase', () => ({
  onAuthReady: cb => { cb(mockUser); return () => {}; },
  signIn: jest.fn(),
  signUp: jest.fn(),
  signOutUser: jest.fn(),
  loadUserSettings: () => Promise.resolve(null),
  saveUserSettings: () => Promise.resolve(),
  addEntry: jest.fn(),
  deleteEntry: jest.fn(),
  updateEntry: jest.fn(),
  subscribeEntriesForDate: (uid, date, cb) => { cb([]); return () => {}; },
  addWeightLog: jest.fn(),
  subscribeWeightLogs: (uid, cb) => { cb([]); return () => {}; },
  updateWeightLog: jest.fn(),
  deleteWeightLog: jest.fn()
}));

jest.mock('recharts', () => ({}));

test('shows the login form when signed out', () => {
  mockUser = null;
  render(<App />);
  expect(screen.getByRole('heading', { name: /log in/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
});

test('shows the tracker when signed in', async () => {
  mockUser = { uid: 'test-user' };
  render(<App />);
  expect(screen.getByText(/calorie tracker/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /calculate tdee/i })).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/what did you eat/i)).toBeInTheDocument();
  expect(await screen.findByText(/no food logged/i)).toBeInTheDocument();
});
