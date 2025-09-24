import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { withAuth } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

type SortField = 'company' | 'position' | 'applied_date' | 'status'
type SortDirection = 'asc' | 'desc'
type JobStatus = 'applied' | 'shortlisted' | 'interview_scheduled' | 'interviewed' | 'rejected' | 'withdrawn' | 'offer_letter' | 'offer_accepted'

const validJobStatuses: JobStatus[] = ['applied', 'shortlisted', 'interview_scheduled', 'interviewed', 'rejected', 'withdrawn', 'offer_letter', 'offer_accepted']

function isValidJobStatus(status: string): status is JobStatus {
  return validJobStatuses.includes(status as JobStatus)
}

// GET /api/jobTracker
// Query params: page, pageSize, q, status, sortField, sortDirection
export async function GET(req: NextRequest) {
  return withAuth(req, async (_req, { userId }) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)

    const page = Number(searchParams.get('page') || '1')
    const pageSize = Math.min(Number(searchParams.get('pageSize') || '20'), 100)
    const q = (searchParams.get('q') || '').trim()
    const status = (searchParams.get('status') || '').trim()
    const sortField = (searchParams.get('sortField') as SortField) || 'applied_date'
    const sortDirection = (searchParams.get('sortDirection') as SortDirection) || 'desc'

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('job_applications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)

    if (q) {
      query = query.or(
        `company.ilike.%${q}%,position.ilike.%${q}%,location.ilike.%${q}%`
      )
    }
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    query = query.order(sortField, { ascending: sortDirection === 'asc' })
    query = query.range(from, to)

    const { data, error, count } = await query
    if (error) {
      console.error('GET /api/jobTracker error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data, page, pageSize, total: count ?? 0 })
  })
}

// POST /api/jobTracker
export async function POST(req: NextRequest) {
  return withAuth(req, async (_req, { userId }) => {
    const supabase = await createClient()
    const body = await req.json()

    const payload = {
      user_id: userId,
      company: String(body.company || '').trim(),
      position: String(body.position || '').trim(),
      location: (body.location ?? '').toString().trim() || null,
      applied_date: body.appliedDate || new Date().toISOString().slice(0, 10),
      status: (body.status as JobStatus) || 'applied',
      notes: (body.notes ?? '').toString(),
      next_action: (body.nextAction ?? '').toString() || null,
      next_action_date: body.nextActionDate || null,
    }

    if (!payload.company || !payload.position) {
      return NextResponse.json({ error: 'company and position are required' }, { status: 400 })
    }

    if (body.status && !isValidJobStatus(body.status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${validJobStatuses.join(', ')}` }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('job_applications')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      console.error('POST /api/jobTracker error:', error)
      return NextResponse.json({ error }, { status: 400 })
    }
    return NextResponse.json({ data })
  })
}

// PATCH /api/jobTracker?id=uuid
export async function PATCH(req: NextRequest) {
  return withAuth(req, async (_req, { userId }) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const body = await req.json()
    const updates: Record<string, string | JobStatus | null> = {}
    if (body.company !== undefined) updates.company = String(body.company).trim()
    if (body.position !== undefined) updates.position = String(body.position).trim()
    if (body.location !== undefined) updates.location = (body.location ?? '').toString().trim() || null
    if (body.appliedDate !== undefined) updates.applied_date = body.appliedDate
    if (body.status !== undefined) {
      if (!isValidJobStatus(body.status)) {
        return NextResponse.json({ error: `Invalid status. Must be one of: ${validJobStatuses.join(', ')}` }, { status: 400 })
      }
      updates.status = body.status as JobStatus
    }
    if (body.notes !== undefined) updates.notes = body.notes
    if (body.nextAction !== undefined) updates.next_action = body.nextAction || null
    if (body.nextActionDate !== undefined) updates.next_action_date = body.nextActionDate || null

    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error) {
      console.error('PATCH /api/jobTracker error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ data })
  })
}

// DELETE /api/jobTracker?id=uuid
export async function DELETE(req: NextRequest) {
  return withAuth(req, async (_req, { userId }) => {
    const supabase = await createClient()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) {
      console.error('DELETE /api/jobTracker error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  })
}

