export type ToolDefinitionType = {
  type?: "function"
  name: string
  description: string
  parameters: { [key: string]: any }
}

export const getPatientIdTool: ToolDefinitionType = {
  type: "function",
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
        description: "Patient's Medicare number (optional)",
        optional: true
      }
    },
    required: ["firstName", "lastName", "dateOfBirth"]
  }
}

// Collection of all available tools
export const availableTools: ToolDefinitionType[] = [
  getPatientIdTool
]
