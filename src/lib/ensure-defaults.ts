import { prisma } from "./db";

let initialized = false;

const BUILT_IN_SKILLS = [
  {
    name: "Bug Fix",
    description: "Fix a bug with clear reproduction steps",
    prompt: "Steps to reproduce:\n1. \n\nExpected behavior:\n\nActual behavior:",
    criteria: "- Bug is fixed\n- No regressions\n- Tests pass",
    model: "",
    tags: "bug, fix",
  },
  {
    name: "Feature",
    description: "Implement a new feature from a user story",
    prompt: "Feature description:\n\nUser story:\nAs a [user], I want [goal] so that [benefit]",
    criteria: "- Feature works as described\n- Tests added\n- Documentation updated",
    model: "",
    tags: "feature",
  },
  {
    name: "Refactor",
    description: "Refactor existing code for improved quality",
    prompt: "Current code:\n\nDesired changes:\n\nReason:",
    criteria: "- Code refactored\n- All tests pass\n- No behavior changes",
    model: "",
    tags: "refactor",
  },
  {
    name: "Test Writing",
    description: "Write tests for existing or new functionality",
    prompt: "Test scope:\n\nTest cases:\n1. ",
    criteria: "- Tests written and passing\n- Good coverage",
    model: "",
    tags: "test",
  },
  {
    name: "Code Review",
    description: "Review code for bugs, security issues, and best practices",
    prompt: "Review scope:\n\nFiles/areas to review:\n\nFocus areas (bugs, security, performance, style):",
    criteria: "- All files reviewed\n- Issues documented with severity\n- Suggestions provided for improvements",
    model: "",
    tags: "review",
  },
  {
    name: "Dependency Audit",
    description: "Audit project dependencies for vulnerabilities and updates",
    prompt: "Project path:\n\nAudit scope:\n- [ ] Check for known vulnerabilities\n- [ ] Identify outdated packages\n- [ ] Review license compatibility",
    criteria: "- All dependencies audited\n- Vulnerabilities listed with severity\n- Update recommendations provided",
    model: "",
    tags: "audit, dependencies",
  },
];

export async function ensureDefaults() {
  if (initialized) return;
  initialized = true;

  // Ensure default board exists
  await prisma.board.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Default Board",
      description: "Default task board",
    },
  });

  // Seed built-in skills
  for (const skill of BUILT_IN_SKILLS) {
    const existing = await prisma.skill.findFirst({
      where: { name: skill.name, isBuiltIn: true },
    });
    if (!existing) {
      await prisma.skill.create({
        data: { ...skill, isBuiltIn: true },
      });
    }
  }
}
