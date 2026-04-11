import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoApp from '@/components/TodoApp';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

// ── 헬퍼 ──────────────────────────────────────────────
function addTodo(text: string) {
  fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요...'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByText('추가'));
}

// ── 테스트 ────────────────────────────────────────────

describe('할 일 추가', () => {
  test('텍스트를 입력하고 추가 버튼을 누르면 항목이 생긴다', () => {
    render(<TodoApp />);
    addTodo('Jest 공부하기');
    expect(screen.getByText('Jest 공부하기')).toBeInTheDocument();
  });

  test('빈 텍스트는 추가되지 않는다', () => {
    render(<TodoApp />);
    fireEvent.click(screen.getByText('추가'));
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  test('Enter 키로 추가할 수 있다', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText('할 일을 입력하세요...');
    fireEvent.change(input, { target: { value: 'Enter로 추가' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Enter로 추가')).toBeInTheDocument();
  });

  test('추가 후 입력창이 비워진다', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText('할 일을 입력하세요...');
    fireEvent.change(input, { target: { value: '입력 후 초기화' } });
    fireEvent.click(screen.getByText('추가'));
    expect(input).toHaveValue('');
  });
});

describe('완료 처리', () => {
  test('체크박스를 누르면 완료 상태로 바뀐다', () => {
    render(<TodoApp />);
    addTodo('운동하기');
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  test('완료된 항목을 다시 누르면 미완료로 바뀐다', () => {
    render(<TodoApp />);
    addTodo('운동하기');
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

describe('삭제', () => {
  test('× 버튼을 누르면 항목이 삭제된다', () => {
    render(<TodoApp />);
    addTodo('삭제할 항목');
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('삭제할 항목')).not.toBeInTheDocument();
  });

  test('완료 항목 삭제 버튼은 완료된 것만 지운다', () => {
    render(<TodoApp />);
    addTodo('남을 항목');
    addTodo('지울 항목');
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]); // 두 번째 항목 완료
    fireEvent.click(screen.getByText('완료 항목 삭제'));
    expect(screen.getByText('남을 항목')).toBeInTheDocument();
    expect(screen.queryByText('지울 항목')).not.toBeInTheDocument();
  });
});

describe('필터', () => {
  beforeEach(() => {
    render(<TodoApp />);
    addTodo('미완료 항목');
    addTodo('완료 항목');
    fireEvent.click(screen.getAllByRole('checkbox')[1]); // 두 번째 완료
  });

  test('진행 중 필터는 미완료 항목만 보여준다', () => {
    fireEvent.click(screen.getByText('진행 중'));
    expect(screen.getByText('미완료 항목')).toBeInTheDocument();
    expect(screen.queryByText('완료 항목')).not.toBeInTheDocument();
  });

  test('완료 필터는 완료 항목만 보여준다', () => {
    fireEvent.click(screen.getByText('완료'));
    expect(screen.getByText('완료 항목')).toBeInTheDocument();
    expect(screen.queryByText('미완료 항목')).not.toBeInTheDocument();
  });

  test('전체 필터는 모든 항목을 보여준다', () => {
    fireEvent.click(screen.getByText('진행 중'));
    fireEvent.click(screen.getByText('전체'));
    expect(screen.getByText('미완료 항목')).toBeInTheDocument();
    expect(screen.getByText('완료 항목')).toBeInTheDocument();
  });
});

describe('남은 개수', () => {
  test('추가하면 개수가 늘어난다', () => {
    render(<TodoApp />);
    addTodo('항목 1');
    addTodo('항목 2');
    expect(screen.getByText('2개 남음')).toBeInTheDocument();
  });

  test('완료하면 개수가 줄어든다', () => {
    render(<TodoApp />);
    addTodo('항목 1');
    addTodo('항목 2');
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText('1개 남음')).toBeInTheDocument();
  });
});

describe('우선순위', () => {
  test('우선순위를 선택하면 해당 색 점이 표시된다', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'high' } });
    addTodo('긴급 업무');
    expect(document.querySelector('.priority-dot.priority-high')).toBeInTheDocument();
  });
});

describe('더블클릭 수정', () => {
  test('텍스트를 더블클릭하면 편집창이 열린다', async () => {
    render(<TodoApp />);
    addTodo('수정 전 텍스트');
    fireEvent.doubleClick(screen.getByText('수정 전 텍스트'));
    expect(screen.getByDisplayValue('수정 전 텍스트')).toBeInTheDocument();
  });

  test('편집 후 Enter를 누르면 내용이 저장된다', () => {
    render(<TodoApp />);
    addTodo('원래 텍스트');
    fireEvent.doubleClick(screen.getByText('원래 텍스트'));
    const editInput = screen.getByDisplayValue('원래 텍스트');
    fireEvent.change(editInput, { target: { value: '바뀐 텍스트' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });
    expect(screen.getByText('바뀐 텍스트')).toBeInTheDocument();
  });

  test('Esc를 누르면 수정이 취소된다', () => {
    render(<TodoApp />);
    addTodo('취소 테스트');
    fireEvent.doubleClick(screen.getByText('취소 테스트'));
    const editInput = screen.getByDisplayValue('취소 테스트');
    fireEvent.change(editInput, { target: { value: '변경 중...' } });
    fireEvent.keyDown(editInput, { key: 'Escape' });
    expect(screen.getByText('취소 테스트')).toBeInTheDocument();
  });
});

describe('localStorage 유지', () => {
  test('저장된 할 일이 렌더링 시 복원된다', () => {
    const todos = [{ id: 1, text: '복원될 항목', completed: false, priority: 'medium', dueDate: '', tags: [] }];
    localStorageMock.setItem('todos', JSON.stringify(todos));
    render(<TodoApp />);
    expect(screen.getByText('복원될 항목')).toBeInTheDocument();
  });
});
