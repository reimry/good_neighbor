/**
 * Mock Registry Service
 * Emulates EDR (Unified State Register) and DRRP (State Register of Real Property Rights)
 * For cybersecurity student project - no real API calls
 */

// Mock EDR Database (in production, this would be an external API)
const mockEDRDatabase = {
  '12345678': {
    edrpou: '12345678',
    full_name: 'ОБ\'ЄДНАННЯ СПІВВЛАСНИКІВ БАГАТОКВАРТИРНОГО БУДИНКУ "СОНЯЧНИЙ"',
    address: {
      city: 'Київ',
      street: 'вул. Хрещатик',
      building: '42'
    },
    authorized_person: 'Петренко Іван Олександрович',
    status: 'REGISTERED'
  },
  '87654321': {
    edrpou: '87654321',
    full_name: 'ОСББ "МІЙ ДІМ"',
    address: {
      city: 'Львів',
      street: 'просп. Свободи',
      building: '15'
    },
    authorized_person: 'Коваленко Марія Василівна',
    status: 'REGISTERED'
  },
  '11111111': {
    edrpou: '11111111',
    full_name: 'ОБ\'ЄДНАННЯ СПІВВЛАСНИКІВ "ЗЕЛЕНИЙ КВАРТАЛ"',
    address: {
      city: 'Одеса',
      street: 'вул. Дерибасівська',
      building: '7'
    },
    authorized_person: 'Сидоренко Олексій Петрович',
    status: 'REGISTERED'
  }
};

// Mock DRRP Database (Property Rights Register)
const mockDRRPDatabase = {
  // Properties for EDRPOU 12345678
  'PROP-001': {
    property_id: 'PROP-001',
    edrpou: '12345678',
    total_area: 1250.5,
    ownership_share: '1/1',
    owner_rnokpp: '1234567890',
    owner_name: 'Петренко Іван Олександрович'
  },
  'PROP-002': {
    property_id: 'PROP-002',
    edrpou: '12345678',
    total_area: 980.3,
    ownership_share: '1/1',
    owner_rnokpp: '1234567890',
    owner_name: 'Петренко Іван Олександрович'
  },
  // Properties for EDRPOU 87654321
  'PROP-003': {
    property_id: 'PROP-003',
    edrpou: '87654321',
    total_area: 750.0,
    ownership_share: '1/1',
    owner_rnokpp: '9876543210',
    owner_name: 'Коваленко Марія Василівна'
  }
};

/**
 * Mock EDR API - Verify OSBB by EDRPOU
 * @param {string} edrpou - 8-digit EDRPOU code
 * @returns {Object|null} OSBB data or null if not found
 */
function verifyEDRPOU(edrpou) {
  // Validate EDRPOU format (8 digits)
  if (!/^\d{8}$/.test(edrpou)) {
    return null;
  }

  const osbbData = mockEDRDatabase[edrpou];
  
  if (!osbbData) {
    return null;
  }

  // Return a copy to prevent client-side modification
  return {
    edrpou: osbbData.edrpou,
    full_name: osbbData.full_name,
    address: {
      city: osbbData.address.city,
      street: osbbData.address.street,
      building: osbbData.address.building
    },
    authorized_person: osbbData.authorized_person,
    status: osbbData.status
  };
}

/**
 * Mock DRRP API - Verify property ownership
 * @param {string} edrpou - OSBB EDRPOU
 * @param {string} rnokpp - Owner's tax ID
 * @returns {Array} Array of properties owned by the person
 */
function verifyPropertyOwnership(edrpou, rnokpp) {
  const properties = Object.values(mockDRRPDatabase).filter(
    prop => prop.edrpou === edrpou && prop.owner_rnokpp === rnokpp
  );

  return properties.map(prop => ({
    property_id: prop.property_id,
    total_area: prop.total_area,
    ownership_share: prop.ownership_share,
    owner_rnokpp: prop.owner_rnokpp,
    owner_name: prop.owner_name
  }));
}

/**
 * Verify Head identity against EDR authorized_person
 * @param {string} edrpou - OSBB EDRPOU
 * @param {string} rnokpp - Head's tax ID
 * @param {string} fullName - Head's full name
 * @returns {Object} Verification result
 */
function verifyHeadIdentity(edrpou, rnokpp, fullName) {
  const osbbData = verifyEDRPOU(edrpou);
  
  if (!osbbData) {
    return {
      valid: false,
      error: 'OSBB not found in EDR'
    };
  }

  // Check if the person matches authorized_person
  const nameMatch = osbbData.authorized_person.toLowerCase().trim() === fullName.toLowerCase().trim();
  
  // Verify property ownership (Head should own property in the OSBB)
  const properties = verifyPropertyOwnership(edrpou, rnokpp);
  
  if (properties.length === 0) {
    return {
      valid: false,
      error: 'No property ownership found for this RNOKPP in DRRP'
    };
  }

  // Calculate total voting weight (sum of all property areas)
  const totalVotingWeight = properties.reduce((sum, prop) => sum + prop.total_area, 0);

  return {
    valid: nameMatch,
    error: nameMatch ? null : 'Name does not match authorized person in EDR',
    osbbData: osbbData,
    properties: properties,
    totalVotingWeight: totalVotingWeight
  };
}

module.exports = {
  verifyEDRPOU,
  verifyPropertyOwnership,
  verifyHeadIdentity
};


