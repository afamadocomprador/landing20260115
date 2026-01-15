export type PaymentFrequency = 'anual' | 'semestral' | 'trimestral' | 'mensual';

export interface PriceDetails {
  total: number;
  frequency: PaymentFrequency;
  perPerson: number;
  isAllowed: boolean;
  annualizedTotal: number;
  savingsVsAnnual: number;
}

export interface QuoteResult {
  price: Record<PaymentFrequency, PriceDetails>; 
  adultsCount: number;
  childrenCount: number;
  appliedDiscounts: string[];
}

// TARIFAS OFICIALES ÉLITE
const TARIFFS = {
  MENSUAL: 10.90,
  TRIMESTRAL: 31.80,
  SEMESTRAL: 62.36,
  ANUAL: 121.68
};

export function calculatePremiums(adults: number, children: number): QuoteResult {
  
  // 1. DETERMINAR QUIÉN PAGA
  // Si hay adultos, ellos pagan y los niños son gratis.
  // Si NO hay adultos, los niños pagan (se convierten en 'payingMembers').
  const payingMembers = adults > 0 ? adults : children;
  
  // 2. MOTOR DE DISPONIBILIDAD (Corregido)
  // Las reglas se aplican sobre 'payingMembers', no solo sobre 'adults'.
  const isFrequencyAvailable = (freq: PaymentFrequency): boolean => {
    
    // Si no hay nadie pagando (0 adultos, 0 niños), nada está disponible
    if (payingMembers === 0) return false;

    // REGLA 1: UN SOLO PAGADOR (Sea 1 Adulto o 1 Niño solo)
    // El recibo mensual (10,90€) no llega al mínimo bancario.
    // Solo permitimos Anual y Semestral.
    if (payingMembers === 1) {
       return freq === 'anual' || freq === 'semestral';
    }

    // REGLA 2: DOS O TRES PAGADORES
    // Ya superan el mínimo para trimestral, pero quizás no para mensual o política de riesgo.
    // Permitimos todo MENOS mensual.
    if (payingMembers >= 2 && payingMembers <= 3) {
       return freq !== 'mensual';
    }

    // REGLA 3: CUATRO O MÁS PAGADORES
    // Volumen suficiente para permitir pago mensual.
    return true;
  };

  const modes: PaymentFrequency[] = ['mensual', 'trimestral', 'semestral', 'anual'];
  const priceResult: any = {};
  
  const annualBaseTotal = TARIFFS.ANUAL * payingMembers;

  modes.forEach(freq => {
      let multiplier = 1;
      let tariff = 0;

      switch(freq) {
          case 'mensual':    tariff = TARIFFS.MENSUAL; multiplier = 12; break;
          case 'trimestral': tariff = TARIFFS.TRIMESTRAL; multiplier = 4; break;
          case 'semestral':  tariff = TARIFFS.SEMESTRAL; multiplier = 2; break;
          case 'anual':      tariff = TARIFFS.ANUAL; multiplier = 1; break;
      }

      const totalReceipt = tariff * payingMembers;
      const annualized = totalReceipt * multiplier;
      
      priceResult[freq] = {
          total: totalReceipt,
          frequency: freq,
          perPerson: totalReceipt / (adults + children || 1),
          isAllowed: isFrequencyAvailable(freq),
          annualizedTotal: annualized,
          savingsVsAnnual: annualized - annualBaseTotal
      };
  });

  return {
    price: priceResult as Record<PaymentFrequency, PriceDetails>,
    adultsCount: adults,
    childrenCount: children,
    // Solo mostramos descuento si hay cruce (Adultos + Niños)
    appliedDiscounts: (adults > 0 && children > 0) ? ['Pack Familiar'] : []
  };
}