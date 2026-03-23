import {setDefaultOptions} from "date-fns";
import {pt} from "date-fns/locale";

export const DEFAULT_LOCALE = pt

// Ensure date-fns helpers default to Portuguese when no locale is explicitly provided.
setDefaultOptions({ locale: DEFAULT_LOCALE });

