import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { results, sessionData } = body; 
    // results viene de calculatePremiums (Fase 2)
    // sessionData incluye fechas de nacimiento anónimas

    // 1. Guardar Proyecto (Cotización)
    const { data: project, error: projError } = await supabase
      .from('calculation_projects')
      .insert([{
        total_monthly_classic: results.classic.mensual.total,
        total_monthly_elite: results.elite.mensual.total,
        selected_frequency: 'mensual' // Default
      }])
      .select()
      .single();

    if (projError || !project) throw new Error('Error guardando proyecto');

    // 2. Guardar Miembros (Desglose de riesgo)
    // Asumimos que el frontend envía un array simple de fechas
    const membersToInsert = sessionData.birthDates.map((date: string) => ({
      project_id: project.id,
      birth_date: date,
      // Lógica simple de rol basada en fecha (duplicada de calculator.ts para DB)
      is_adult: new Date(date) < new Date(new Date().setFullYear(new Date().getFullYear() - 15)) 
    }));

    const { error: membersError } = await supabase
      .from('insured_members')
      .insert(membersToInsert);

    if (membersError) throw new Error('Error guardando miembros');

    return NextResponse.json({ success: true, projectId: project.id });

  } catch (error) {
    return NextResponse.json({ error: 'Error guardando cotización' }, { status: 500 });
  }
}