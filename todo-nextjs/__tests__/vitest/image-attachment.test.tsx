import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TodoApp from '@/components/TodoApp';

// ── Supabase 모의 ──────────────────────────────────────────────────────────────
// vi.hoisted를 사용해 mock 팩토리 내부에서 참조할 상수를 먼저 정의한다.
const { MOCK_PUBLIC_URL } = vi.hoisted(() => ({
  MOCK_PUBLIC_URL:
    'https://example.supabase.co/storage/v1/object/public/todo-images/test.jpg',
}));

vi.mock('@/lib/supabase', () => {
  const storageBucket = {
    upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: MOCK_PUBLIC_URL } }),
    remove: vi.fn().mockResolvedValue({ error: null }),
  };

  const dbTable = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    in: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    supabase: {
      from: vi.fn().mockReturnValue(dbTable),
      storage: { from: vi.fn().mockReturnValue(storageBucket) },
    },
  };
});

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────
function makePngFile(name = 'photo.png', sizeBytes = 1024) {
  return new File([new ArrayBuffer(sizeBytes)], name, { type: 'image/png' });
}

function getFileInput() {
  return document.querySelector('.hidden-file-input') as HTMLInputElement;
}

// ── 테스트 ────────────────────────────────────────────────────────────────────

describe('이미지 첨부 — 파일 선택', () => {
  it('📎 버튼이 입력 폼에 렌더링된다', () => {
    render(<TodoApp />);
    expect(screen.getByTitle(/이미지 첨부/)).toBeInTheDocument();
  });

  it('유효한 이미지 파일을 선택하면 미리보기가 나타난다', async () => {
    render(<TodoApp />);
    fireEvent.change(getFileInput(), { target: { files: [makePngFile()] } });
    await waitFor(() => expect(screen.getByTestId('image-preview')).toBeInTheDocument());
  });

  it('미리보기에 파일 이름이 표시된다', async () => {
    render(<TodoApp />);
    fireEvent.change(getFileInput(), { target: { files: [makePngFile('my-image.png')] } });
    await waitFor(() => expect(screen.getByText('my-image.png')).toBeInTheDocument());
  });

  it('× 버튼을 누르면 미리보기가 사라진다', async () => {
    render(<TodoApp />);
    fireEvent.change(getFileInput(), { target: { files: [makePngFile()] } });
    await waitFor(() => screen.getByTestId('image-preview'));

    fireEvent.click(screen.getByRole('button', { name: '이미지 제거' }));

    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
  });
});

describe('이미지 첨부 — 파일 유효성 검사', () => {
  it('5MB 초과 파일은 거부되고 미리보기가 나타나지 않는다', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<TodoApp />);
    const bigFile = makePngFile('big.png', 6 * 1024 * 1024);

    fireEvent.change(getFileInput(), { target: { files: [bigFile] } });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('5MB'));
    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it('허용되지 않는 형식(PDF)은 거부되고 경고가 표시된다', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<TodoApp />);
    const pdfFile = new File([new ArrayBuffer(100)], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(getFileInput(), { target: { files: [pdfFile] } });

    expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('JPG'));
    expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    alertSpy.mockRestore();
  });

  it('WebP 형식은 허용된다', async () => {
    render(<TodoApp />);
    const webpFile = new File([new ArrayBuffer(512)], 'anim.webp', { type: 'image/webp' });

    fireEvent.change(getFileInput(), { target: { files: [webpFile] } });

    await waitFor(() => expect(screen.getByTestId('image-preview')).toBeInTheDocument());
  });

  it('GIF 형식은 허용된다', async () => {
    render(<TodoApp />);
    const gifFile = new File([new ArrayBuffer(512)], 'anim.gif', { type: 'image/gif' });

    fireEvent.change(getFileInput(), { target: { files: [gifFile] } });

    await waitFor(() => expect(screen.getByTestId('image-preview')).toBeInTheDocument());
  });
});

describe('이미지 첨부 — 드래그 앤 드롭', () => {
  it('파일을 드래그하면 드롭 안내 문구가 표시된다', () => {
    render(<TodoApp />);
    const inputSection = document.querySelector('.input-section')!;

    fireEvent.dragEnter(inputSection, { dataTransfer: { types: ['Files'] } });

    expect(screen.getByTestId('drop-indicator')).toBeInTheDocument();
  });

  it('영역을 벗어나면 안내 문구가 사라진다', () => {
    render(<TodoApp />);
    const inputSection = document.querySelector('.input-section')!;

    fireEvent.dragEnter(inputSection, { dataTransfer: { types: ['Files'] } });
    // relatedTarget이 section 외부이므로 dragLeave 처리됨
    fireEvent.dragLeave(inputSection, { relatedTarget: document.body });

    expect(screen.queryByTestId('drop-indicator')).not.toBeInTheDocument();
  });

  it('이미지 파일을 드롭하면 미리보기가 나타난다', async () => {
    render(<TodoApp />);
    const inputSection = document.querySelector('.input-section')!;
    const file = makePngFile('dropped.png');

    fireEvent.dragEnter(inputSection, { dataTransfer: { types: ['Files'] } });
    fireEvent.drop(inputSection, {
      dataTransfer: { types: ['Files'], files: [file] },
    });

    await waitFor(() => expect(screen.getByTestId('image-preview')).toBeInTheDocument());
  });

  it('Todo 항목 드래그(text/plain)는 이미지 드롭존에 영향을 주지 않는다', () => {
    render(<TodoApp />);
    const inputSection = document.querySelector('.input-section')!;

    fireEvent.dragEnter(inputSection, { dataTransfer: { types: ['text/plain'] } });

    // Files 타입이 아니므로 드롭 안내 문구가 나타나지 않아야 한다
    expect(screen.queryByTestId('drop-indicator')).not.toBeInTheDocument();
  });
});

describe('이미지 첨부 — 라이트박스', () => {
  it('초기 상태에서 라이트박스는 보이지 않는다', () => {
    render(<TodoApp />);
    expect(screen.queryByTestId('lightbox')).not.toBeInTheDocument();
  });
});

describe('이미지 첨부 — Todo 추가 후 초기화', () => {
  it('Todo 추가 후 이미지 선택이 초기화된다', async () => {
    render(<TodoApp />);
    fireEvent.change(getFileInput(), { target: { files: [makePngFile()] } });
    await waitFor(() => screen.getByTestId('image-preview'));

    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요...'), {
      target: { value: '이미지 첨부 할 일' },
    });
    fireEvent.click(screen.getByText('추가'));

    await waitFor(() => {
      expect(screen.queryByTestId('image-preview')).not.toBeInTheDocument();
    });
  });
});
