export type ToolDefinitionType = {
  type: "function"
  function: {
    name: string
    description: string
    parameters: {
      type: "object"
      properties: { [key: string]: any }
      required: string[]
    }
  }
}

export const getPatientIdTool: ToolDefinitionType = {
  type: "function",
  function: {
    name: "get_patient_id",
    description: "Retrieve a patient's ID using their name components and date of birth",
    parameters: {
      type: "object",
      properties: {
        firstName: {
          type: "string",
          description: "Patient's first name"
        },
        lastName: {
          type: "string",
          description: "Patient's last name"
        },
        dateOfBirth: {
          type: "string",
          description: "Patient's date of birth in YYYY-MM-DD format"
        },
        medicareNo: {
          type: "string",
          description: "Patient's Medicare number (optional)"
        }
      },
      required: ["firstName", "lastName", "dateOfBirth"]
    }
  }
}

export const getPatientDetailsTool: ToolDefinitionType = {
  type: "function",
  function: {
    name: "get_patient_details",
    description: "Retrieve detailed information about a patient using their ID",
    parameters: {
      type: "object",
      properties: {
        patientId: {
          type: "string",
          description: "The unique identifier of the patient"
        }
      },
      required: ["patientId"]
    }
  }
}

// Collection of all available tools
export const availableTools: ToolDefinitionType[] = [
  getPatientIdTool,
  getPatientDetailsTool
]
