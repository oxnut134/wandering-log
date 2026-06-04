import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../../app/api/register/route'

vi.mock('../../lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  },
}))

const makeRequest = (body: object) =>
  new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

describe('POST /api/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('必須フィールドが欠けている場合は 400 を返す', async () => {
    const res = await POST(makeRequest({ name: 'Alice', email: 'a@example.com' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('足りません')
  })

  it('既存メールアドレスの場合は 400 を返す', async () => {
    const { db } = await import('../../lib/db')
    vi.mocked(db.limit).mockResolvedValueOnce([{ id: 1 }] as any)

    const res = await POST(makeRequest({ name: 'Alice', email: 'a@example.com', password: 'pass' }))
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.message).toContain('既に登録')
  })

  it('正常登録の場合は 201 を返す', async () => {
    const res = await POST(makeRequest({ name: 'Alice', email: 'new@example.com', password: 'pass' }))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.message).toContain('successfully')
  })
})
