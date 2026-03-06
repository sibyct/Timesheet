import type { User } from '../../core/models/user.models';
import type { PaginationMeta } from '../../core/models/api.models';

export interface UserState {
  list:    User[];
  meta:    PaginationMeta | null;
  active:  User | null;
  loading: boolean;
  saving:  boolean;
  error:   string | null;
}

export const initialUserState: UserState = {
  list:    [],
  meta:    null,
  active:  null,
  loading: false,
  saving:  false,
  error:   null,
};
