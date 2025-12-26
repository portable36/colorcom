import React from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
jest.mock('../components/Layout', () => ({ __esModule: true, default: () => React.createElement('div', null, React.createElement('h1', null, 'Colorcom')) }));

jest.mock('../lib/cart', () => ({ useCart: () => ({ items: [] }) }));
jest.mock('next/link', () => ({ __esModule: true, default: ({ children, href }: any) => React.createElement('a', { href }, children) }));

const Layout = require('../components/Layout').default;

describe('Layout', () => {
  it('renders header and children', () => {
    render(React.createElement(Layout, null, React.createElement('div', null, 'child')));
    expect(screen.getByText('Colorcom')).toBeInTheDocument();
  });
});
