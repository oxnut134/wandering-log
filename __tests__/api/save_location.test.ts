import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../../app/api/save_location/route'

const mockTx = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  limit: vi.fn().mockResolvedValue([]),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockResolvedValue([{ id: 42 }]),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
}

vi.mock('../../lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    transaction: vi.fn(async (fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

const makeRequest = (body: object) =>
  new Request('http://localhost/api/save_location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/save_location', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.select.mockReturnThis()
    mockTx.from.mockReturnThis()
    mockTx.where.mockReturnThis()
    mockTx.limit.mockResolvedValue([])
    mockTx.insert.mockReturnThis()
    mockTx.values.mockReturnThis()
    mockTx.returning.mockResolvedValue([{ id: 42 }])
    mockTx.update.mockReturnThis()
    mockTx.set.mockReturnThis()
  })

  it('未認証の場合は 401 を返す', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValueOnce(null)

    const res = await POST(makeRequest({ latitude: 35.68, longitude: 139.76, name: 'テスト', comment: '' }))
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe('Unauthorized')
  })

  it('既存レコードが 0 件の場合は新規インサートして id を返す', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any)

    const { db } = await import('../../lib/db')
    vi.mocked(db.from).mockReturnValueOnce({ value: 0 } as any)
    // count query: select({value:count()}).from() returns array
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockResolvedValue([{ value: 0 }]),
    } as any)

    const res = await POST(makeRequest({ id: null, latitude: 35.68, longitude: 139.76, name: '新規', comment: '' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveProperty('id')
  })

  it('DB エラーの場合は 500 を返す', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any)

    const { db } = await import('../../lib/db')
    vi.mocked(db.select).mockImplementationOnce(() => {
      throw new Error('DB error')
    })

    const res = await POST(makeRequest({ id: null, latitude: 35.68, longitude: 139.76, name: 'テスト', comment: '' }))
    expect(res.status).toBe(500)
    const json = await res.json()
    expect(json).toHaveProperty('error')
  })
})
