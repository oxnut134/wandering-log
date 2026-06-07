import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../../app/api/get_locations_and_places/route'

vi.mock('../../lib/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue([]),
  },
}))

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

describe('GET /api/get_locations_and_places', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未認証の場合は 401 を返す', async () => {
    const { auth } = await import('@/auth')
    // @ts-ignore
    vi.mocked(auth).mockResolvedValueOnce(null)

    const res = await GET()
    expect(res.status).toBe(401)
    const json = await res.json()
    expect(json.message).toBe('Unauthorized')
  })

  it('認証済みの場合は位置情報の配列を返す', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any)

    const { db } = await import('../../lib/db')
    const mockLocations = [
      { id: 1, latitude: '35.6812', longitude: '139.7671', name: '東京駅', comment: null, google_place_id: null, address: null, category: null, place_id: null },
    ]
    // @ts-ignore
    vi.mocked(db.where).mockResolvedValueOnce(mockLocations as any)

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0].name).toBe('東京駅')
  })

  it('DB エラーの場合は空配列を返す', async () => {
    const { auth } = await import('@/auth')
    vi.mocked(auth).mockResolvedValueOnce({ user: { id: '1' } } as any)

    const { db } = await import('../../lib/db')
    // @ts-ignore
    vi.mocked(db.where).mockRejectedValueOnce(new Error('DB error'))

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toEqual([])
  })
})
