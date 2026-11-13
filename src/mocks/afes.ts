export interface AfeOption {
  id: string;
  /** "AFE-26-014" — what an invoice coding line stores. */
  number: string;
  description: string;
  wellLabel: string;
  /** The cost stages costs can be coded to under this AFE, in the order they happen. */
  stages: string[];
}

export const MOCK_AFES: AfeOption[] = [
  {
    id: "afe-26-014",
    number: "AFE-26-014",
    description: "Hayes Unit 2H completion",
    wellLabel: "W-0157 Hayes Unit 2H",
    stages: ["Drilling", "Completion", "Facilities", "Flowback"],
  },
  {
    id: "afe-26-009",
    number: "AFE-26-009",
    description: "Whitfield 1H workover",
    wellLabel: "W-0142 Whitfield 1H",
    stages: ["Workover", "Equipment", "Facilities"],
  },
  {
    id: "afe-26-021",
    number: "AFE-26-021",
    description: "Hayes Unit 3H drill & complete",
    wellLabel: "W-0163 Hayes Unit 3H",
    stages: ["Location", "Drilling", "Completion", "Facilities", "Flowback"],
  },
  {
    id: "afe-25-047",
    number: "AFE-25-047",
    description: "Reeves SWD gathering line",
    wellLabel: "",
    stages: ["Construction", "Tie-in"],
  },
];
