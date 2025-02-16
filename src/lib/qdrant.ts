// Remove the QdrantClient import and initialization

const COLLECTION_NAME = 'patient_demographics';

// Initialize collection if it doesn't exist
export const initializeCollection = async () => {
  try {
    console.log('Attempting to initialize Qdrant collection...');
    const response = await fetch('/api/qdrant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'initializeCollection' }),
    });

    if (!response.ok) {
      console.error('Failed to initialize Qdrant collection:', response.statusText);
      throw new Error('Failed to initialize collection');
    }

    const result = await response.json();
    console.log('Qdrant initialization result:', result);
    return result;
  } catch (error) {
    console.error('Error initializing Qdrant collection:', error);
    throw error;
  }
};

// Function to search for a patient
export const searchPatient = async (
  firstName: string,
  lastName: string,
  birthdate: string,
  medicare_no?: string
) => {
  try {
    const response = await fetch('/api/qdrant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'searchPatient',
        firstName,
        lastName,
        birthdate,
        medicare_no,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to search patient');
    }

    const result = await response.json();
    return result as Patient | null;
  } catch (error) {
    console.error('Error searching for patient:', error);
    throw error;
  }
};

// Patient interface
export interface Patient {
  id: string;
  birthdate: string;
  deathdate: string | null;
  medicare_no: string;
  drivers: string;
  passport: string;
  prefix: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  suffix: string | null;
  maiden_name: string | null;
  marital: string;
  race: string;
  ethnicity: string;
  gender: string;
  birthplace: string;
  address: string;
  city: string;
  state: string;
  county: string | null;
  fips: string | null;
  postcode: string;
  lat: number;
  lon: number;
  healthcare_expenses: number;
  healthcare_coverage: number;
  income: number;
}

// Function to get a patient by ID
export const getPatientById = async (patientId: string): Promise<Patient | null> => {
  try {
    const response = await fetch('/api/qdrant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'getPatientById',
        patientId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get patient');
    }

    const result = await response.json();
    return result as Patient | null;
  } catch (error) {
    console.error('Error getting patient by ID:', error);
    throw error;
  }
}; 