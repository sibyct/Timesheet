import type { Project } from '../../core/models/project.models';
import type { PaginationMeta } from '../../core/models/api.models';

export interface ProjectState {
  list:    Project[];
  meta:    PaginationMeta | null;
  active:  Project | null;
  loading: boolean;
  saving:  boolean;
  error:   string | null;
}

export const initialProjectState: ProjectState = {
  list:    [],
  meta:    null,
  active:  null,
  loading: false,
  saving:  false,
  error:   null,
};
