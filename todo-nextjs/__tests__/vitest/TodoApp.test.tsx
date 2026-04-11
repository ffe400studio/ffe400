import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoApp from '@/components/TodoApp';

beforeEach(() => {
  localStorage.clear();
});

// ── 헬퍼 ──────────────────────────────────────────────
function addTodo(text: string) {
  fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요...'), {
    target: { value: text },
  });
  fireEvent.click(screen.getByText('추가'));
}

// ─────────────────────────────────────────────────────
describe('TodoApp — 할 일 추가', () => {
  it('텍스트 입력 후 추가 버튼을 누르면 목록에 항목이 나타난다', () => {
    render(<TodoApp />);
    addTodo('Vitest 공부하기');
    expect(screen.getByText('Vitest 공부하기')).toBeInTheDocument();
  });

  it('공백만 입력하면 항목이 추가되지 않는다', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요...'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByText('추가'));
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('Enter 키를 누르면 항목이 추가된다', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText('할 일을 입력하세요...');
    fireEvent.change(input, { target: { value: 'Enter로 추가' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText('Enter로 추가')).toBeInTheDocument();
  });

  it('추가 후 텍스트 입력창이 초기화된다', () => {
    render(<TodoApp />);
    const input = screen.getByPlaceholderText('할 일을 입력하세요...');
    fireEvent.change(input, { target: { value: '초기화 확인' } });
    fireEvent.click(screen.getByText('추가'));
    expect(input).toHaveValue('');
  });

  it('여러 항목을 연속으로 추가할 수 있다', () => {
    render(<TodoApp />);
    addTodo('항목 A');
    addTodo('항목 B');
    addTodo('항목 C');
    expect(screen.getByText('항목 A')).toBeInTheDocument();
    expect(screen.getByText('항목 B')).toBeInTheDocument();
    expect(screen.getByText('항목 C')).toBeInTheDocument();
  });
});

describe('TodoApp — 완료 처리', () => {
  it('체크박스를 누르면 완료 상태가 된다', () => {
    render(<TodoApp />);
    addTodo('운동하기');
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('완료된 항목을 다시 누르면 미완료로 돌아온다', () => {
    render(<TodoApp />);
    addTodo('운동하기');
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it('완료된 항목의 텍스트에 취소선이 적용된다', () => {
    render(<TodoApp />);
    addTodo('취소선 확인');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('취소선 확인').closest('li')).toHaveClass('completed');
  });
});

describe('TodoApp — 삭제', () => {
  it('× 버튼을 누르면 해당 항목이 삭제된다', () => {
    render(<TodoApp />);
    addTodo('삭제될 항목');
    fireEvent.click(screen.getByText('×'));
    expect(screen.queryByText('삭제될 항목')).not.toBeInTheDocument();
  });

  it('여러 항목 중 특정 항목만 삭제된다', () => {
    render(<TodoApp />);
    addTodo('남을 항목');
    addTodo('삭제될 항목');
    fireEvent.click(screen.getAllByText('×')[1]);
    expect(screen.getByText('남을 항목')).toBeInTheDocument();
    expect(screen.queryByText('삭제될 항목')).not.toBeInTheDocument();
  });

  it('완료 항목 삭제 버튼은 완료된 것만 지운다', () => {
    render(<TodoApp />);
    addTodo('남을 항목');
    addTodo('지울 항목');
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
    fireEvent.click(screen.getByText('완료 항목 삭제'));
    expect(screen.getByText('남을 항목')).toBeInTheDocument();
    expect(screen.queryByText('지울 항목')).not.toBeInTheDocument();
  });

  it('모든 항목을 삭제하면 빈 메시지가 표시된다', () => {
    render(<TodoApp />);
    addTodo('마지막 항목');
    fireEvent.click(screen.getByText('×'));
    expect(screen.getByText('할 일이 없어요 🎉')).toBeInTheDocument();
  });
});

describe('TodoApp — 필터', () => {
  beforeEach(() => {
    render(<TodoApp />);
    addTodo('미완료 항목');
    addTodo('완료 항목');
    fireEvent.click(screen.getAllByRole('checkbox')[1]);
  });

  it('기본값은 전체 필터다', () => {
    expect(screen.getByText('미완료 항목')).toBeInTheDocument();
    expect(screen.getByText('완료 항목')).toBeInTheDocument();
  });

  it('진행 중 필터는 미완료 항목만 보여준다', () => {
    fireEvent.click(screen.getByText('진행 중'));
    expect(screen.getByText('미완료 항목')).toBeInTheDocument();
    expect(screen.queryByText('완료 항목')).not.toBeInTheDocument();
  });

  it('완료 필터는 완료된 항목만 보여준다', () => {
    fireEvent.click(screen.getByText('완료'));
    expect(screen.getByText('완료 항목')).toBeInTheDocument();
    expect(screen.queryByText('미완료 항목')).not.toBeInTheDocument();
  });

  it('전체 필터로 돌아오면 모든 항목이 보인다', () => {
    fireEvent.click(screen.getByText('진행 중'));
    fireEvent.click(screen.getByText('전체'));
    expect(screen.getByText('미완료 항목')).toBeInTheDocument();
    expect(screen.getByText('완료 항목')).toBeInTheDocument();
  });
});

describe('TodoApp — 남은 개수', () => {
  it('초기 상태에서는 0개 남음이다', () => {
    render(<TodoApp />);
    expect(screen.getByText('0개 남음')).toBeInTheDocument();
  });

  it('항목을 추가하면 개수가 늘어난다', () => {
    render(<TodoApp />);
    addTodo('항목 1');
    addTodo('항목 2');
    expect(screen.getByText('2개 남음')).toBeInTheDocument();
  });

  it('항목을 완료하면 개수가 줄어든다', () => {
    render(<TodoApp />);
    addTodo('항목 1');
    addTodo('항목 2');
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(screen.getByText('1개 남음')).toBeInTheDocument();
  });

  it('모든 항목을 완료하면 0개 남음이 된다', () => {
    render(<TodoApp />);
    addTodo('항목 1');
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText('0개 남음')).toBeInTheDocument();
  });
});

describe('TodoApp — 우선순위', () => {
  it('기본 우선순위는 보통(medium)이다', () => {
    render(<TodoApp />);
    addTodo('기본 항목');
    expect(document.querySelector('.priority-dot.priority-medium')).toBeInTheDocument();
  });

  it('높음을 선택하면 빨간 점이 표시된다', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'high' } });
    addTodo('긴급 업무');
    expect(document.querySelector('.priority-dot.priority-high')).toBeInTheDocument();
  });

  it('낮음을 선택하면 초록 점이 표시된다', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'low' } });
    addTodo('여유 업무');
    expect(document.querySelector('.priority-dot.priority-low')).toBeInTheDocument();
  });
});

describe('TodoApp — 태그', () => {
  it('쉼표로 구분한 태그가 각각 표시된다', () => {
    render(<TodoApp />);
    fireEvent.change(screen.getByPlaceholderText('태그 (쉼표로 구분)'), {
      target: { value: '업무,중요' },
    });
    addTodo('태그 테스트');
    expect(screen.getByText('#업무')).toBeInTheDocument();
    expect(screen.getByText('#중요')).toBeInTheDocument();
  });

  it('태그 없이 추가하면 태그 영역이 표시되지 않는다', () => {
    render(<TodoApp />);
    addTodo('태그 없는 항목');
    expect(screen.queryByText(/^#/)).not.toBeInTheDocument();
  });
});

describe('TodoApp — 마감일', () => {
  it('마감일을 설정하면 날짜가 항목에 표시된다', () => {
    render(<TodoApp />);
    fireEvent.change(document.querySelector('.date-input')!, {
      target: { value: '2026-12-31' },
    });
    addTodo('마감일 항목');
    expect(screen.getByText('📅 12/31')).toBeInTheDocument();
  });

  it('지난 마감일은 overdue 스타일이 적용된다', () => {
    render(<TodoApp />);
    fireEvent.change(document.querySelector('.date-input')!, {
      target: { value: '2020-01-01' },
    });
    addTodo('기한 초과 항목');
    expect(document.querySelector('.due-date.overdue')).toBeInTheDocument();
  });
});

describe('TodoApp — 더블클릭 수정', () => {
  it('텍스트를 더블클릭하면 편집창이 열린다', () => {
    render(<TodoApp />);
    addTodo('수정 전');
    fireEvent.doubleClick(screen.getByText('수정 전'));
    expect(screen.getByDisplayValue('수정 전')).toBeInTheDocument();
  });

  it('Enter를 누르면 수정 내용이 저장된다', () => {
    render(<TodoApp />);
    addTodo('원래 텍스트');
    fireEvent.doubleClick(screen.getByText('원래 텍스트'));
    const editInput = screen.getByDisplayValue('원래 텍스트');
    fireEvent.change(editInput, { target: { value: '수정된 텍스트' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });
    expect(screen.getByText('수정된 텍스트')).toBeInTheDocument();
  });

  it('Esc를 누르면 수정이 취소되고 원래 텍스트가 유지된다', () => {
    render(<TodoApp />);
    addTodo('취소 테스트');
    fireEvent.doubleClick(screen.getByText('취소 테스트'));
    const editInput = screen.getByDisplayValue('취소 테스트');
    fireEvent.change(editInput, { target: { value: '변경 중...' } });
    fireEvent.keyDown(editInput, { key: 'Escape' });
    expect(screen.getByText('취소 테스트')).toBeInTheDocument();
  });

  it('완료된 항목은 더블클릭해도 편집창이 열리지 않는다', () => {
    render(<TodoApp />);
    addTodo('완료된 항목');
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.doubleClick(screen.getByText('완료된 항목'));
    expect(screen.queryByDisplayValue('완료된 항목')).not.toBeInTheDocument();
  });

  it('빈 텍스트로 수정하면 원래 텍스트가 유지된다', () => {
    render(<TodoApp />);
    addTodo('빈값 테스트');
    fireEvent.doubleClick(screen.getByText('빈값 테스트'));
    const editInput = screen.getByDisplayValue('빈값 테스트');
    fireEvent.change(editInput, { target: { value: '' } });
    fireEvent.keyDown(editInput, { key: 'Enter' });
    expect(screen.getByText('빈값 테스트')).toBeInTheDocument();
  });
});

describe('TodoApp — localStorage 영속성', () => {
  it('저장된 데이터가 렌더링 시 복원된다', () => {
    const saved = [
      { id: 1, text: '복원 항목', completed: false, priority: 'medium', dueDate: '', tags: [] },
    ];
    localStorage.setItem('todos', JSON.stringify(saved));
    render(<TodoApp />);
    expect(screen.getByText('복원 항목')).toBeInTheDocument();
  });

  it('항목 추가 시 localStorage에 저장된다', () => {
    render(<TodoApp />);
    addTodo('저장 확인');
    const stored = JSON.parse(localStorage.getItem('todos') ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].text).toBe('저장 확인');
  });

  it('항목 삭제 시 localStorage에서도 제거된다', () => {
    render(<TodoApp />);
    addTodo('삭제 후 확인');
    fireEvent.click(screen.getByText('×'));
    const stored = JSON.parse(localStorage.getItem('todos') ?? '[]');
    expect(stored).toHaveLength(0);
  });
});
