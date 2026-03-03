export interface TaskTemplate {
  name: string;
  description: string;
  criteria: string;
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    name: "Bug Fix",
    description:
      "Steps to reproduce:\n1. \n\nExpected behavior:\n\nActual behavior:",
    criteria: "- Bug is fixed\n- No regressions\n- Tests pass",
  },
  {
    name: "Feature",
    description:
      "Feature description:\n\nUser story:\nAs a [user], I want [goal] so that [benefit]",
    criteria:
      "- Feature works as described\n- Tests added\n- Documentation updated",
  },
  {
    name: "Refactor",
    description: "Current code:\n\nDesired changes:\n\nReason:",
    criteria:
      "- Code refactored\n- All tests pass\n- No behavior changes",
  },
  {
    name: "Test",
    description: "Test scope:\n\nTest cases:\n1. ",
    criteria: "- Tests written and passing\n- Good coverage",
  },
];
