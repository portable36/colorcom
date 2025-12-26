import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from '../components/Layout';

jest.mock('../lib/cart', () => ({ useCart: () => ({ items: [] }) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => React.createElement('a', { href }, children) }));

describe('Layout', () => {
  it('renders header and children', () => {
    render(<Layout><div>child</div></Layout>);
    expect(screen.getByText('Colorcom')).toBeInTheDocument();
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});
