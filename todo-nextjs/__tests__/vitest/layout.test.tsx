import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RootLayout, { metadata } from '@/app/layout';

describe('RootLayout', () => {
  it('children을 body 안에 렌더링한다', () => {
    render(
      <RootLayout>
        <p>자식 콘텐츠</p>
      </RootLayout>
    );
    expect(screen.getByText('자식 콘텐츠')).toBeInTheDocument();
  });

  it('html 태그의 lang 속성이 "ko"다', () => {
    render(
      <RootLayout>
        <span />
      </RootLayout>
    );
    // jsdom에서 <html>은 document.documentElement로 접근
    expect(document.documentElement).toHaveAttribute('lang', 'ko');
  });
});

describe('metadata', () => {
  it('title이 "오늘 할 일"이다', () => {
    expect(metadata.title).toBe('오늘 할 일');
  });

  it('description이 "Todo App"이다', () => {
    expect(metadata.description).toBe('Todo App');
  });
});
