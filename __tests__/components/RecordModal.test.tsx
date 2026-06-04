import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RecordModal from '../../app/components/temp/RecordModal'

vi.mock('@vis.gl/react-google-maps', () => ({
  useMap: vi.fn(() => null),
}))

const baseModal = {
  id: 1,
  latitude: 35.6812,
  longitude: 139.7671,
  name: '東京駅',
  comment: 'テストコメント',
}

const defaultProps = {
  tempOpenedModal: baseModal,
  setTempOpenedModal: vi.fn(),
  onClose: vi.fn(),
  onSave: vi.fn(),
  isExisting: false,
  initialModalPos: { x: 100, y: 200 },
  onFetchLogs: vi.fn(),
  logs: [],
}

describe('RecordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
    global.confirm = vi.fn(() => true)
  })

  it('新規訪問先のヘッダーが表示される', () => {
    render(<RecordModal {...defaultProps} />)
    expect(screen.getByText(/初めての訪問先/)).toBeDefined()
  })

  it('既存訪問先の場合は既存ヘッダーが表示される', () => {
    render(<RecordModal {...defaultProps} isExisting={true} />)
    expect(screen.getAllByText(/既存訪問先/).length).toBeGreaterThan(0)
  })

  it('緯度・経度が正しく表示される', () => {
    render(<RecordModal {...defaultProps} />)
    expect(screen.getByText(/35.68120/)).toBeDefined()
    expect(screen.getByText(/139.76710/)).toBeDefined()
  })

  it('name フィールドに初期値が入っている', () => {
    render(<RecordModal {...defaultProps} />)
    const input = screen.getByPlaceholderText('名称を入力') as HTMLInputElement
    expect(input.value).toBe('東京駅')
  })

  it('comment フィールドに初期値が入っている', () => {
    render(<RecordModal {...defaultProps} />)
    const textarea = screen.getByPlaceholderText('コメントを残す') as HTMLTextAreaElement
    expect(textarea.value).toBe('テストコメント')
  })

  it('保存ボタンをクリックすると fetch が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as any)

    render(<RecordModal {...defaultProps} />)
    await user.click(screen.getByText('保存する'))
    expect(global.fetch).toHaveBeenCalledWith('/api/wandering_where', expect.objectContaining({ method: 'POST' }))
  })

  it('保存成功後に onSave と onClose が呼ばれる', async () => {
    const user = userEvent.setup()
    vi.mocked(global.fetch).mockResolvedValueOnce({ ok: true } as any)

    render(<RecordModal {...defaultProps} />)
    await user.click(screen.getByText('保存する'))
    expect(defaultProps.onSave).toHaveBeenCalled()
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('閉じるボタンをクリックすると onClose が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<RecordModal {...defaultProps} />)
    await user.click(screen.getByText('閉じる'))
    expect(defaultProps.onClose).toHaveBeenCalled()
  })

  it('isExisting=true の場合、履歴を削除ボタンが表示される', () => {
    render(<RecordModal {...defaultProps} isExisting={true} />)
    expect(screen.getByText('履歴を削除')).toBeDefined()
  })

  it('isExisting=false の場合、履歴を削除ボタンが表示されない', () => {
    render(<RecordModal {...defaultProps} isExisting={false} />)
    expect(screen.queryByText('履歴を削除')).toBeNull()
  })

  it('訪問記録ボタンをクリックすると onFetchLogs が呼ばれる', async () => {
    const user = userEvent.setup()
    render(<RecordModal {...defaultProps} />)
    await user.click(screen.getByText('訪問記録'))
    expect(defaultProps.onFetchLogs).toHaveBeenCalled()
  })
})
