import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Esto permite que la conexión ocurra incluso si hay problemas de certificados locales.
// SOLO debe usarse en entornos de desarrollo local.
if (process.env.NODE_ENV === 'development') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}
// -----------------------

// Inicializamos el cliente con permisos de ADMIN (Service Role)
// Solo se usa en el servidor, nunca expongas esto al cliente.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function GET() {
  // 1. SEGURIDAD: Solo permitir en desarrollo o con un header secreto
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Endpoint solo disponible en desarrollo' }, { status: 403 });
  }

  try {
    // 2. Leer el fichero JSON
    const filePath = path.join(process.cwd(), 'nopublic/data_dentistas.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileContents);

    if (!jsonData.results) {
      throw new Error('El JSON no tiene la estructura esperada (falta "results")');
    }

    const records = jsonData.results.map((item: any) => {
      const doc = item.document;
      
      // Lógica GIS: Convertir lat/long a formato WKT para PostGIS
      let locationGis = null;
      if (doc.Latitude && doc.Longitude) {
        // Formato: SRID=4326;POINT(LONGITUD LATITUD)
        locationGis = `SRID=4326;POINT(${doc.Longitude} ${doc.Latitude})`;
      }

      // 3. Mapeo EXHAUSTIVO (Todos los campos)
      return {
        // Identificadores
        medical_directory_id: String(doc.MedicalDirectoryId),
        speciality_cod: doc.SpecialityCod,
        speciality: doc.Speciality,

        // Booleanos/Enteros
        online_appointment: doc.OnlineAppointment,
        electronic_prescription: doc.ElectronicPrescription,
        virtual_consultation: doc.VirtualConsultation,
        attention_type_id: doc.AttentionTypeId,

        // Admin
        biller: doc.Biller,
        company_cod: doc.CompanyCod,
        networks: doc.Networks, // Supabase-js maneja arrays automáticamente

        // Profesional
        professional_id: doc.ProfessionalId,
        professional_nif: doc.ProfessionalNif,
        professional_name: doc.ProfessionalName,
        professional_last_name_1: doc.ProfessionalLastName1,
        professional_last_name_2: doc.ProfessionalLastName2,
        professional_nick_name: doc.ProfessionalNickName,
        professional_membership_number: String(doc.ProfessionalMembershipNumber),
        professional_province: doc.ProfessionalProvince,
        professional_expert_in: doc.ProfessionalExpertIn,
        professional_curriculum_vitae: doc.ProfessionalCurriculumVitae,
        professional_average_rating: String(doc.ProfessionalAverageRating),

        // Service Point (Centro)
        sp_id: doc.SpId,
        sp_preferential: doc.SpPreferential,
        sp_name: doc.SpName,
        sp_last_name_1: doc.SpLastName1,
        sp_last_name_2: doc.SpLastName2,
        sp_customer_telephone_1: doc.SpCustomerTelephone1,
        sp_customer_telephone_2: doc.SpCustomerTelephone2,
        sp_email_1: doc.SpEmail1,
        sp_email_2: doc.SpEmail2,
        sp_schedule_1: doc.SpSchedule1,
        sp_schedule_2: doc.SpSchedule2,
        sp_web_site: doc.SpWebSite,
        sp_point_contact_id: doc.SpPointContactId ? String(doc.SpPointContactId) : null,
        sp_is_health_space: doc.SpIsHealthSpace,
        sp_average_rating: String(doc.SpAverageRating),
        sp_is_colaborator: doc.SpIsColaborator,

        // Dirección y Naturaleza
        nature_cod: doc.NatureCod,
        nature: doc.Nature,
        road_type: doc.RoadType,
        road: doc.Road,
        address_id: doc.AddressId,
        address_cod: doc.AddressCod,
        address: doc.Address,
        town: doc.Town,
        province: doc.Province,
        postal_code: doc.PostalCode,

        // Coordenadas
        latitude: doc.Latitude,
        longitude: doc.Longitude,
        location_gis: locationGis, // Campo GIS calculado

        // Meta y Orden
        merge_order: String(doc.MergeOrder),
        weight_sorting: doc.WeightSorting,
        combined_name: doc.CombinedName,
        prescription_without_authorization: doc.PrescriptionWithoutAuthorization,
        is_center: doc.isCenter,
        last_modified: doc.lastModified,

        // SEO
        specialists_01: doc.Specialists01,
        specialists_02: doc.Specialists02,
        specialists_03: doc.Specialists03,
        specialists_04: doc.Specialists04,
        canonical: doc.canonical,
        ofuscate_document_id: doc.ofuscateDocumentId
      };
    });

    // 4. Inserción en Lotes (Batch)
    const BATCH_SIZE = 50;
    let insertedCount = 0;
    let errors = [];

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabaseAdmin
        .from('medical_directory_raw')
        .upsert(batch, { onConflict: 'medical_directory_id' }); // Upsert para no duplicar

      if (error) {
        console.error('Error insertando lote:', error);
        errors.push(error);
      } else {
        insertedCount += batch.length;
      }
    }

    return NextResponse.json({
      success: true,
      total_processed: records.length,
      inserted: insertedCount,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error: any) {
    console.error('Error en proceso de carga:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}