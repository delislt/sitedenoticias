import { dossiers } from '@/data/dossiers';
import type { Category } from '@/data/news';

type CoverageTeamMedia = {
  image: string;
  imageAlt: string;
  width: number;
  height: number;
};

export type CoverageTeam = CoverageTeamMedia & {
  category: Category;
  committee: string;
  members: string[];
};

const teamMedia: Record<Category, CoverageTeamMedia> = {
  juridico: {
    image: '/images/equipes/equipe-juridico-2026.png',
    imageAlt: 'Equipe responsável pela cobertura do Comitê Jurídico',
    width: 1268,
    height: 1240,
  },
  csnu: {
    image: '/images/equipes/equipe-csnu-2026.jpeg',
    imageAlt: 'Equipe responsável pela cobertura do CSNU',
    width: 4032,
    height: 3024,
  },
  historico: {
    image: '/images/equipes/equipe-historico-2026.jpeg',
    imageAlt: 'Equipe responsável pela cobertura do Comitê Histórico',
    width: 4032,
    height: 3024,
  },
};

function splitContributors(value: string): string[] {
  return value
    .split(/\s*(?:,|\be\b)\s*/i)
    .map((name) => name.trim())
    .filter(Boolean);
}

export const coverageTeams: CoverageTeam[] = dossiers.map((dossier) => ({
  category: dossier.slug,
  committee: dossier.committee,
  members: splitContributors(dossier.authors ?? ''),
  ...teamMedia[dossier.slug],
}));

export function getCoverageTeam(category: Category): CoverageTeam {
  return coverageTeams.find((team) => team.category === category)!;
}

export function getConsolidatedTeamMembers(): string[] {
  const uniqueNames = new Map<string, string>();

  coverageTeams.forEach((team) => {
    team.members.forEach((name) => {
      uniqueNames.set(name.toLocaleLowerCase('pt-BR'), name);
    });
  });

  return Array.from(uniqueNames.values());
}
