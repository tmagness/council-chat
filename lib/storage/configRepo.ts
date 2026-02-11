import { prisma } from './db';

const PROJECT_CONTEXT_KEY = 'project_context';

export async function getProjectContext(): Promise<string | null> {
  const config = await prisma.config.findUnique({
    where: { key: PROJECT_CONTEXT_KEY },
  });
  return config?.value ?? null;
}

export async function setProjectContext(content: string): Promise<void> {
  await prisma.config.upsert({
    where: { key: PROJECT_CONTEXT_KEY },
    update: { value: content },
    create: { key: PROJECT_CONTEXT_KEY, value: content },
  });
}
