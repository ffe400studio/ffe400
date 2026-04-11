import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

describe('Home(page.tsx)', () => {
  it('TodoApp 컴포넌트가 렌더링된다', () => {
    render(<Home />);
    expect(screen.getByText('오늘 할 일')).toBeInTheDocument();
  });

  it('할 일 입력창이 존재한다', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText('할 일을 입력하세요...')).toBeInTheDocument();
  });

  it('추가 버튼이 존재한다', () => {
    render(<Home />);
    expect(screen.getByText('추가')).toBeInTheDocument();
  });
});
