export interface LevelRequirement {
  level: number;
  nextLevel: number;
  xp: number;
  source: "confirmed" | "estimated";
}

const CONFIRMED_LEVEL_REQUIREMENTS: Record<number, number> = {
  36: 720000,
};

function sanitizeLevel(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function estimateLevelXP(level: number) {
  const normalizedLevel = sanitizeLevel(level);
  const baseLevel = 36;
  const baseXP = CONFIRMED_LEVEL_REQUIREMENTS[36];
  const curve = Math.pow(normalizedLevel / baseLevel, 2.35);

  return Math.max(1000, Math.round((baseXP * curve) / 1000) * 1000);
}

export function getLevelRequirement(level: number): LevelRequirement {
  const sanitizedLevel = sanitizeLevel(level);
  const confirmedXP = CONFIRMED_LEVEL_REQUIREMENTS[sanitizedLevel];

  return {
    level: sanitizedLevel,
    nextLevel: sanitizedLevel + 1,
    xp: confirmedXP ?? estimateLevelXP(sanitizedLevel),
    source: confirmedXP ? "confirmed" : "estimated",
  };
}

export function getXpForLevelRange(currentLevel: number, targetLevel: number) {
  const startLevel = sanitizeLevel(currentLevel);
  const endLevel = Math.max(startLevel + 1, sanitizeLevel(targetLevel));
  const requirements: LevelRequirement[] = [];

  for (let level = startLevel; level < endLevel; level += 1) {
    requirements.push(getLevelRequirement(level));
  }

  const totalXP = requirements.reduce(
    (sum, requirement) => sum + requirement.xp,
    0
  );
  const hasEstimatedValues = requirements.some(
    (requirement) => requirement.source === "estimated"
  );

  return {
    currentLevel: startLevel,
    targetLevel: endLevel,
    totalXP,
    requirements,
    hasEstimatedValues,
  };
}

export function getNearbyLevelRequirements(level: number) {
  const sanitizedLevel = sanitizeLevel(level);
  const firstLevel = Math.max(1, sanitizedLevel - 2);

  return Array.from({ length: 6 }, (_, index) =>
    getLevelRequirement(firstLevel + index)
  );
}

export function formatXP(value: number) {
  return value.toLocaleString("pt-BR");
}
