import type { NextApiRequest, NextApiResponse } from 'next';
import { createServiceRoleSupabaseClient } from '../../lib/supabaseClient';
import { Aluno } from '../../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase
